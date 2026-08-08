/**
 * 빌드 산출물 검증기.
 *
 *   npm run build && node scripts/verify-build.mjs
 *
 * 검사 항목
 *   1. 내부 깨진 링크 0
 *   2. 페이지 전송량 1.2MB 이하
 *   3. published:false 문서가 사이트맵·RSS·내부링크에 없음
 *   4. title 30자 이내 & 페이지별 고유
 *   5. canonical 자기참조
 *   6. 구조화데이터: 전 페이지 BreadcrumbList / 홈에만 Organization·WebSite /
 *      문서에만 Article / 금지 타입 미출력
 *   7. 화면 브레드크럼과 BreadcrumbList 항목 일치
 *   8. og:image 파일 실재
 *   9. 이미지 width·height 필수, 히어로 외 lazy, alt "{주제} — {구체 장면}"
 *  10. 웹폰트는 자체 호스팅만 (외부 글꼴 서버 금지) & 조각 파일 용량 한도
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { readdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const CONTENT = join(ROOT, 'src', 'content');
const SITE = 'https://fogger.blueguard.kr';
const PAGE_BUDGET = 1.2 * 1024 * 1024;
/* 글꼴을 남의 서버에서 불러오는 것을 막는다 — 그 서버가 죽으면 글자가 안 나온다 */
const EXTERNAL_FONT_HOST =
  /fonts\.googleapis\.com|fonts\.gstatic\.com|use\.typekit\.net|cdn\.jsdelivr\.net|unpkg\.com|webfontworld|fastly\.jsdelivr\.net/i;

/**
 * 구조화데이터 금지 목록.
 *
 * Product / FAQPage / HowTo 는 허용으로 바뀌었다 — 화면에 같은 내용이 실제로 있고
 * 검색·생성형 답변이 제품과 절차를 엔티티로 인식하는 데 필요하다.
 *
 * 남겨 둔 것들은 성격이 다르다.
 *  - Offer / offers / price : 이 사이트는 결제·주문 기능이 없다. 구매할 수 없는 URL에
 *    Offer를 붙이면 검색엔진이 여기를 판매 페이지로 잘못 인식한다. 가격 구조화데이터는
 *    실제 거래가 일어나는 공식몰 상품 페이지 쪽에 넣는다.
 *  - AggregateRating / Review : 확보된 후기 데이터가 없다. 없는 별점을 만들지 않는다.
 */
const FORBIDDEN_SCHEMA = [
  'Offer',
  'offers',
  'price',
  'AggregateRating',
  'aggregateRating',
  'Review',
  'review',
];

/**
 * 산출물에 남으면 배포를 막아야 하는 자리표시자·잘못된 목적지.
 * 문자열이 하나라도 dist 안에 있으면 검증 실패.
 */
const BLOCKERS = [
  { needle: 'TODO_', why: '사업자 정보 등 자리표시자가 채워지지 않았습니다' },
  { needle: 'G-XXXXXXXXXX', why: 'GA4 측정 ID가 자리표시자입니다' },
  { needle: 'example.com', why: '예시 도메인이 남아 있습니다' },
  // 고객이 주문할 때 보는 이름(기본형/대용량/대용량+롱노즐)과 사이트 표기를 일치시킨다.
  // 내부 모델 번호가 화면에 나가면 같은 제품인지 확인이 안 된다.
  { needle: 'BF-100S', why: '내부 모델 번호가 노출됐습니다 — 공식 옵션명을 쓰세요' },
  { needle: 'BF-102', why: '내부 모델 번호가 노출됐습니다 — 공식 옵션명을 쓰세요' },
  {
    needle: 'smartstore.naver.com/blueguard?',
    why: '구매 CTA가 스마트스토어로 연결됩니다 (공식몰 상품 URL이어야 함)',
  },
];

/**
 * 구매 CTA가 반드시 향해야 하는 목적지.
 * 호스트·경로 접두사만 보면 다른 상품 URL도 통과하므로 상품번호까지 고정한다.
 * 상품이 바뀌면 site.ts의 OFFICIAL_STORE_PRODUCT_URL과 이 값을 함께 갱신한다.
 */
const EXPECTED_BUY_HOST = 'blueguard.kr';
const EXPECTED_BUY_PRODUCT_NO = '3054';

/** 구매 CTA가 최소 1개는 있어야 하는 전환 페이지 */
const CONVERSION_PATHS = [/^\/$/, /^\/products\//, /^\/compare\/$/];

/**
 * 산출물에는 있지만 "사이트 페이지"가 아닌 경로.
 *
 * /admin/ 은 사장님이 문서를 고치는 편집 도구 화면이다. 방문자에게 보여줄 페이지가 아니므로
 * canonical·og:image·구조화데이터·브레드크럼 같은 페이지 규칙과 사이트맵 등재 의무를
 * 적용하지 않는다. 대신 이 화면에만 해당하는 조건은 아래 "편집 화면" 블록에서 따로 검사한다.
 */
const NON_PAGE_PATHS = [/^\/admin\//];

/**
 * GA4 측정 ID 유효성 — Analytics.astro와 동일한 판정을 써야
 * "계측은 꺼졌는데 빌드는 통과"하는 상태가 생기지 않는다.
 */
const isRealGa4Id = (id) => /^G-[A-Z0-9]{6,}$/.test(id) && !/^G-X+$/.test(id);

/** 생성 이미지 매니페스트 — og 카드 외의 생성물이 남아 있는지 확인용 */
const STRICT_IMAGES = process.env.STRICT_IMAGES === '1';
const IMAGE_MANIFEST = join(ROOT, 'src', 'assets', 'generated-manifest.json');

const errors = [];
const warnings = [];
const fail = (msg) => errors.push(msg);
const warn = (msg) => warnings.push(msg);

/* ---------- 유틸 ---------- */

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full)));
    else out.push(full);
  }
  return out;
}

const size = (path) => {
  try {
    return statSync(path).size;
  } catch {
    return null;
  }
};

/** URL 경로 → dist 파일 경로 */
function distPathFor(urlPath) {
  const clean = decodeURIComponent(urlPath.split('#')[0].split('?')[0]);
  if (clean === '/') return join(DIST, 'index.html');
  if (/\.[a-z0-9]+$/i.test(clean)) return join(DIST, clean);
  return join(DIST, clean.replace(/\/$/, ''), 'index.html');
}

/** 페이지 파일 경로 → URL 경로 */
function urlPathFor(file) {
  const rel = file.slice(DIST.length).replace(/\\/g, '/');
  if (rel === '/index.html') return '/';
  if (rel === '/404.html') return '/404/';
  return rel.replace(/\/index\.html$/, '/');
}

const attr = (tag, name) => {
  const m = tag.match(new RegExp(`${name}="([^"]*)"`, 'i'));
  return m ? m[1] : null;
};

const all = (html, re) => [...html.matchAll(re)];

/** HTML 속성값의 엔티티를 되돌린다 (&amp; 때문에 쿼리 파싱이 깨지는 것 방지) */
const unescapeAttr = (value) =>
  value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

/**
 * 콘텐츠 컬렉션에서 published:false 문서 id를 직접 읽는다.
 * 목록을 손으로 관리하지 않아야 새 비공개 문서가 검증에서 누락되지 않는다.
 */
async function collectUnpublishedIds() {
  const ids = [];
  for (const dir of await readdir(CONTENT, { withFileTypes: true })) {
    if (!dir.isDirectory()) continue;
    for (const file of await readdir(join(CONTENT, dir.name))) {
      if (!file.endsWith('.md')) continue;
      const raw = readFileSync(join(CONTENT, dir.name, file), 'utf8');
      const frontmatter = raw.split('---')[1] ?? '';
      if (/^published:\s*false\s*$/m.test(frontmatter)) ids.push(file.replace(/\.md$/, ''));
    }
  }
  return ids;
}

/* ---------- 로드 ---------- */

const files = await walk(DIST);
const pages = files
  .filter((f) => f.endsWith('.html'))
  .filter((f) => !NON_PAGE_PATHS.some((re) => re.test(urlPathFor(f))))
  .sort();
const assetSizes = new Map(files.map((f) => [f, size(f)]));
const UNPUBLISHED = await collectUnpublishedIds();

console.log(
  `검사 대상: HTML ${pages.length}개 / 전체 파일 ${files.length}개 / 비공개 문서 ${UNPUBLISHED.length}건 (${UNPUBLISHED.join(', ') || '없음'})\n`,
);

const titles = new Map();

/* ---------- 페이지별 검사 ---------- */

const report = [];
/** noindex가 붙은 페이지의 URL 경로 — 사이트맵과의 모순 검사에 재사용 */
const noindexPaths = [];

for (const file of pages) {
  const html = readFileSync(file, 'utf8');
  const urlPath = urlPathFor(file);
  const where = `[${urlPath}]`;
  const isHome = urlPath === '/';
  const is404 = urlPath === '/404/';
  const isDoc = /^\/(guides|uses|troubleshooting)\/[^/]+\/$/.test(urlPath);

  /* --- 1. 내부 링크 --- */
  const linkTargets = new Set();
  for (const [, href] of all(html, /<a\b[^>]*\shref="([^"]+)"/gi)) {
    if (/^(https?:|mailto:|tel:|#|data:)/i.test(href)) continue;
    linkTargets.add(href);
  }
  for (const href of linkTargets) {
    if (!href.startsWith('/')) {
      warn(`${where} 상대경로 링크: ${href}`);
      continue;
    }
    if (size(distPathFor(href)) === null) fail(`${where} 깨진 링크 → ${href}`);
  }

  /* --- 2. 정적 리소스 존재 + 전송량 --- */
  let weight = Buffer.byteLength(html);
  const counted = new Set();

  const addAsset = (url, label) => {
    if (!url || !url.startsWith('/')) return 0;
    const path = distPathFor(url);
    const bytes = assetSizes.get(path) ?? size(path);
    if (bytes === null) {
      fail(`${where} 없는 ${label} 경로 → ${url}`);
      return 0;
    }
    if (counted.has(path)) return 0;
    counted.add(path);
    return bytes;
  };

  for (const [, href] of all(html, /<link\b[^>]*\srel="stylesheet"[^>]*\shref="([^"]+)"/gi)) {
    weight += addAsset(href, 'CSS');
  }
  for (const [, src] of all(html, /<script\b[^>]*\ssrc="([^"]+)"/gi)) {
    weight += addAsset(src, 'JS');
  }

  /* --- 9. 이미지 규칙 --- */
  const pictures = all(html, /<picture\b[\s\S]*?<\/picture>/gi).map((m) => m[0]);
  const imgTags = all(html, /<img\b[^>]*>/gi).map((m) => m[0]);

  for (const img of imgTags) {
    const src = attr(img, 'src');
    const alt = attr(img, 'alt');
    const w = attr(img, 'width');
    const h = attr(img, 'height');
    const loading = attr(img, 'loading');
    // 로고는 "{주제} — {구체 장면}" 형식이 적용되지 않는 예외 — 콘텐츠 사진이 아니라 브랜드 마크다
    const isLogo = /logo/i.test(attr(img, 'class') ?? '');

    if (!w || !h) fail(`${where} img에 width/height 없음 → ${src}`);
    if (alt === null) fail(`${where} img에 alt 없음 → ${src}`);
    else if (!isLogo && !alt.includes(' — ')) {
      fail(`${where} alt 형식 위반("{주제} — {구체 장면}") → "${alt}"`);
    }
    if (loading !== 'lazy' && loading !== 'eager') fail(`${where} img loading 속성 없음 → ${src}`);
    if (src) addAsset(src, '이미지');
  }

  // <picture> 안의 첫 srcset(AVIF)에서 가장 큰 후보 하나를 실제 전송량으로 계산
  for (const pic of pictures) {
    const sources = all(pic, /<source\b[^>]*>/gi).map((m) => m[0]);
    const avif = sources.find((s) => (attr(s, 'type') ?? '').includes('avif')) ?? sources[0];
    if (!avif) continue;
    const candidates = (attr(avif, 'srcset') ?? '')
      .split(',')
      .map((c) => c.trim().split(/\s+/)[0])
      .filter(Boolean);
    let biggest = 0;
    for (const candidate of candidates) {
      const bytes = size(distPathFor(candidate));
      if (bytes === null) fail(`${where} 없는 이미지 후보 → ${candidate}`);
      else biggest = Math.max(biggest, bytes);
    }
    weight += biggest;
  }

  // <picture> 밖의 단독 img (히어로 외 lazy 확인용)
  const heroish = imgTags.filter((t) => attr(t, 'fetchpriority') === 'high');
  if (heroish.length > 1) warn(`${where} fetchpriority=high 이미지가 ${heroish.length}개`);
  for (const img of imgTags) {
    if (attr(img, 'fetchpriority') === 'high') {
      if (attr(img, 'loading') !== 'eager') fail(`${where} 히어로 이미지가 lazy → ${attr(img, 'src')}`);
    } else if (attr(img, 'loading') !== 'lazy') {
      fail(`${where} 비히어로 이미지가 lazy 아님 → ${attr(img, 'src')}`);
    }
  }

  if (weight > PAGE_BUDGET) {
    fail(`${where} 페이지 전송량 초과: ${(weight / 1024).toFixed(0)}KB > 1.2MB`);
  }
  report.push({ urlPath, weight });

  /* --- 4. title --- */
  const title = (html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] ?? '').trim();
  if (!title) fail(`${where} title 없음`);
  if ([...title].length > 30) fail(`${where} title ${[...title].length}자 (30자 초과): "${title}"`);
  if (titles.has(title)) fail(`${where} title 중복 (${titles.get(title)}와 동일): "${title}"`);
  else titles.set(title, urlPath);

  /* --- 5. canonical --- */
  const canonical = html.match(/<link\s+rel="canonical"\s+href="([^"]+)"/i)?.[1];
  if (!canonical) fail(`${where} canonical 없음`);
  else if (canonical !== `${SITE}${urlPath}`) {
    fail(`${where} canonical 자기참조 아님: ${canonical}`);
  }

  /* --- description / og:image --- */
  const description = html.match(/<meta\s+name="description"\s+content="([^"]*)"/i)?.[1];
  if (!description) fail(`${where} meta description 없음`);

  const ogImage = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i)?.[1];
  if (!ogImage) fail(`${where} og:image 없음`);
  else {
    const path = distPathFor(ogImage.replace(SITE, ''));
    if (size(path) === null) fail(`${where} og:image 파일 없음 → ${ogImage}`);
  }

  /* --- 6·7. 구조화데이터 --- */
  const ldBlocks = all(html, /<script\s+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi).map(
    (m) => m[1],
  );
  if (ldBlocks.length !== 1) fail(`${where} JSON-LD 블록이 ${ldBlocks.length}개 (1개여야 함)`);

  const raw = ldBlocks.join('\n');
  let graph = null;
  try {
    graph = JSON.parse(raw);
  } catch {
    fail(`${where} JSON-LD 파싱 실패`);
  }

  if (graph) {
    // 금지 타입/속성이 그래프 어디에도 없어야 한다
    const scan = (node) => {
      if (Array.isArray(node)) return node.forEach(scan);
      if (!node || typeof node !== 'object') return;
      for (const [key, value] of Object.entries(node)) {
        if (key === '@type' && FORBIDDEN_SCHEMA.includes(value)) {
          fail(`${where} 금지된 구조화데이터 타입: ${value}`);
        }
        if (FORBIDDEN_SCHEMA.includes(key)) {
          fail(`${where} 금지된 구조화데이터 속성: ${key}`);
        }
        scan(value);
      }
    };
    scan(graph);

    // 그래프가 참조하는 이미지 URL이 실제 파일인지
    const imageUrls = [];
    const collectImages = (node) => {
      if (Array.isArray(node)) return node.forEach(collectImages);
      if (!node || typeof node !== 'object') return;
      for (const [key, value] of Object.entries(node)) {
        if (key === 'image' && typeof value === 'string') imageUrls.push(value);
        collectImages(value);
      }
    };
    collectImages(graph);
    for (const url of imageUrls) {
      if (!url.startsWith(SITE)) continue;
      if (size(distPathFor(url.slice(SITE.length))) === null) {
        fail(`${where} JSON-LD image 파일 없음 → ${url}`);
      }
    }

    const nodes = graph['@graph'] ?? [graph];
    const types = nodes.map((n) => n['@type']);

    const breadcrumb = nodes.find((n) => n['@type'] === 'BreadcrumbList');
    if (!breadcrumb) fail(`${where} BreadcrumbList 없음`);

    if (isHome) {
      if (!types.includes('Organization')) fail(`${where} 홈에 Organization 없음`);
      if (!types.includes('WebSite')) fail(`${where} 홈에 WebSite 없음`);
    } else {
      if (types.includes('Organization')) fail(`${where} 홈이 아닌데 Organization 출력됨`);
      if (types.includes('WebSite')) fail(`${where} 홈이 아닌데 WebSite 출력됨`);
    }

    if (isDoc && !types.includes('Article')) fail(`${where} 문서인데 Article 없음`);
    if (!isDoc && types.includes('Article')) fail(`${where} 문서가 아닌데 Article 출력됨`);

    // 화면 브레드크럼과 대조
    // 홈은 크럼이 "홈" 하나뿐이라 화면에서 의도적으로 숨기므로(스키마는 유지) 비교 대상에서 뺀다
    if (breadcrumb && !isHome) {
      const navBlock = html.match(/<nav[^>]*aria-label="현재 위치"[\s\S]*?<\/nav>/i)?.[0] ?? '';
      const visible = all(navBlock, /<(?:a|span)\b[^>]*>([^<]+)<\/(?:a|span)>/gi).map((m) =>
        m[1].trim(),
      );
      const schemaNames = breadcrumb.itemListElement.map((i) => i.name);
      if (visible.join('>') !== schemaNames.join('>')) {
        fail(`${where} 화면 브레드크럼 [${visible}] ≠ 스키마 [${schemaNames}]`);
      }
    }
  }

  /* --- 3. 비공개 문서 노출 --- */
  for (const id of UNPUBLISHED) {
    if (html.includes(`/${id}/`)) fail(`${where} 비공개 문서 링크 노출: ${id}`);
  }

  /* --- 자리표시자·잘못된 목적지 (배포 차단) --- */
  for (const blocker of BLOCKERS) {
    if (html.includes(blocker.needle)) {
      fail(`${where} "${blocker.needle}" 가 산출물에 남아 있습니다 — ${blocker.why}`);
    }
  }

  /* --- 구매 CTA 목적지 --- */
  const ctaTags = all(html, /(<a\b[^>]*data-ga-event="purchase_cta_click"[^>]*>)/gi).map((m) => m[1]);

  // data-ga-event가 빠져 검사망을 벗어난 구매 링크가 없는지 역방향으로도 확인
  for (const [, tag] of all(html, /(<a\b[^>]*href="[^"]*blueguard\.kr\/product[^"]*"[^>]*>)/gi)) {
    if (!tag.includes('data-ga-event="purchase_cta_click"')) {
      fail(`${where} 공식몰 상품 링크에 data-ga-event="purchase_cta_click" 가 없어 계측·검증에서 빠집니다`);
    }
  }

  for (const tag of ctaTags) {
    const href = attr(tag, 'href');
    if (!href) {
      fail(`${where} 구매 CTA에 href 없음`);
      continue;
    }
    let url;
    try {
      url = new URL(unescapeAttr(href));
    } catch {
      fail(`${where} 구매 CTA href 파싱 실패 → ${href}`);
      continue;
    }
    const productNo = decodeURIComponent(url.pathname).match(/\/(\d+)\/?$/)?.[1];
    if (url.hostname !== EXPECTED_BUY_HOST || productNo !== EXPECTED_BUY_PRODUCT_NO) {
      fail(
        `${where} 구매 CTA가 지정 상품(${EXPECTED_BUY_HOST} 상품번호 ${EXPECTED_BUY_PRODUCT_NO})이 아님 → ${href}`,
      );
    }
    if (!url.searchParams.get('utm_content')) {
      fail(`${where} 구매 CTA에 utm_content 없음 → ${href}`);
    }
  }

  if (CONVERSION_PATHS.some((re) => re.test(urlPath)) && ctaTags.length === 0) {
    fail(`${where} 전환 페이지인데 구매 CTA가 하나도 없습니다`);
  }

  /* --- "무료배송" 표기에는 조건 고지가 같은 페이지에 있어야 한다 --- */
  if (html.includes('무료배송') && !html.includes('반품 시 왕복 배송비')) {
    fail(`${where} "무료배송" 표기가 있는데 배송 조건 고지가 없습니다`);
  }

  /* --- 10. 웹폰트는 자체 호스팅만 --- */
  /*
   * 브랜드 글꼴(Pretendard)을 쓰기로 하면서 "웹폰트 0" 규칙을 바꿨다.
   * 막아야 할 것은 글꼴 자체가 아니라 두 가지다.
   *   (1) 남의 서버에 의존하는 것 — 그 서버가 죽으면 글자가 안 나오고, 방문자 IP가 넘어간다.
   *   (2) 페이지가 받아야 하는 글꼴 양이 통제 없이 늘어나는 것.
   * (2)는 아래 FONT_FILE_BUDGET 에서 파일 단위로 막는다.
   */
  if (EXTERNAL_FONT_HOST.test(html)) {
    fail(`${where} 외부 글꼴 서버 참조 — 글꼴은 public/fonts/ 에 두고 자체 호스팅한다`);
  }
  for (const [, ref] of html.matchAll(/(?:href|src)="([^"]*\.woff2?)"/gi)) {
    if (!ref.startsWith('/fonts/')) {
      fail(`${where} 자체 호스팅 밖의 글꼴 참조 → ${ref}`);
    }
  }

  /* --- noindex 는 404 와 "공개 문서 0건인 컬렉션 인덱스"에만 --- */
  const hasNoindex = /name="robots"\s+content="noindex/i.test(html);
  // 스코프 CSS에도 클래스명이 들어가므로 실제로 렌더링된 요소로 판정한다
  const isEmptyIndex = /<p class="doc-index__empty"/.test(html);
  if (hasNoindex && !is404 && !isEmptyIndex) {
    fail(`${where} 색인 대상 페이지에 noindex가 붙어 있습니다`);
  }
  if (!hasNoindex && is404) fail(`${where} 404에 noindex가 없습니다`);
  if (!hasNoindex && isEmptyIndex) {
    fail(`${where} 공개 문서가 0건인 인덱스인데 noindex가 없습니다 (얇은 페이지)`);
  }
  if (hasNoindex) noindexPaths.push(urlPath);
}

/* ---------- 제품 실사 존재 확인 ---------- */
{
  // 제품 컷은 코드로 만들 수 없다. 없으면 실패시켜 임시 그래픽으로 대체되는 일을 막는다.
  for (const name of ['photo-bf-100s.jpg', 'photo-bf-102.jpg', 'photo-bf-102-long-nozzle.jpg']) {
    if (size(join(ROOT, 'src', 'assets', name)) === null) {
      fail(`[photos] 제품 실사가 없습니다: src/assets/${name} — \`npm run photos\` 로 가져오세요`);
    }
  }

  // og:image는 브랜드 카드이므로 생성물이어도 된다. 그 밖의 생성 이미지가 남아 있으면 알린다.
  try {
    const manifest = JSON.parse(readFileSync(IMAGE_MANIFEST, 'utf8'));
    const nonOg = Object.keys(manifest.files ?? {}).filter((f) => !f.startsWith('public/og/'));
    if (nonOg.length > 0) {
      const msg = `og 카드가 아닌 생성 이미지가 남아 있습니다: ${nonOg.join(', ')}`;
      if (STRICT_IMAGES) fail(`[images] ${msg}`);
      else warn(`[images] ${msg}`);
    }
  } catch {
    warn('[images] generated-manifest.json 이 없습니다 — `npm run images` 를 실행하세요');
  }
}

/* ---------- 편집 화면 (/admin/) ---------- */
{
  const adminHtmlPath = join(DIST, 'admin', 'index.html');
  if (size(adminHtmlPath) === null) {
    fail('[admin] dist/admin/index.html 이 없습니다 — public/admin/ 이 빌드에 포함됐는지 확인하세요');
  } else {
    const html = readFileSync(adminHtmlPath, 'utf8');

    // 편집 화면이 검색결과에 뜨면 안 된다.
    // robots.txt로 크롤링 자체를 막으면 크롤러가 이 noindex를 읽지 못해 오히려 색인될 수 있으므로,
    // 크롤링은 열어 두고 noindex로 막는다. 즉 이 태그가 유일한 방어선이다.
    if (!/name="robots"\s+content="noindex/i.test(html)) {
      fail('[admin] 편집 화면에 noindex가 없습니다 — 검색결과에 노출될 수 있습니다');
    }

    // config.yml 이 없으면 화면은 뜨지만 편집할 항목이 하나도 안 나온다.
    if (size(join(DIST, 'admin', 'config.yml')) === null) {
      fail('[admin] dist/admin/config.yml 이 없습니다 — 편집 항목이 표시되지 않습니다');
    }
  }

  // 편집 화면으로 가는 링크가 공개 페이지에 있으면 방문자에게도 노출된다.
  for (const file of pages) {
    const html = readFileSync(file, 'utf8');
    if (/<a\b[^>]*\shref="\/admin\//i.test(html)) {
      fail(`[${urlPathFor(file)}] 공개 페이지에서 편집 화면(/admin/)으로 링크하고 있습니다`);
    }
  }
}

/* ---------- 편집 화면 입력 규칙 ↔ 실제 문서 대조 ---------- */
/**
 * admin/config.yml 의 입력 규칙은 src/content.config.ts 의 zod 스키마를 손으로 옮긴 것이라
 * 한쪽만 고치면 조용히 어긋난다. 어긋나는 방향은 둘 다 나쁘다.
 *
 *   규칙이 느슨해지면 → 화면에서는 저장되는데 빌드가 깨진다
 *   규칙이 빡빡해지면 → 멀쩡한 기존 문서를 편집 화면이 거부해서 손을 못 댄다
 *
 * 그래서 "지금 저장소에 있는 모든 문서가 편집 화면을 통과하는가"를 직접 확인한다.
 */
{
  const configPath = join(DIST, 'admin', 'config.yml');
  if (size(configPath) !== null) {
    let config = null;
    try {
      config = parseYaml(readFileSync(configPath, 'utf8'));
    } catch (error) {
      fail(`[admin] config.yml 파싱 실패 — 편집 화면이 뜨지 않습니다: ${error.message}`);
    }

    const collections = config?.collections ?? [];
    for (const collection of collections) {
      // 화면 문구(files 컬렉션)는 폴더 문서와 구조가 달라 아래 "화면 문구" 검사에서 따로 본다
      if (collection.files) continue;

      const fields = collection.fields ?? [];
      const byName = new Map(fields.map((f) => [f.name, f]));

      // 규칙이 통째로 사라지는 것(가장 흔한 드리프트)을 먼저 잡는다
      for (const name of ['title', 'description', 'faq', 'sources', 'body']) {
        if (!byName.has(name)) fail(`[admin] "${collection.label}" 에 "${name}" 입력칸이 없습니다`);
      }

      const dir = join(CONTENT, collection.name);
      let entries = [];
      try {
        entries = readdirSync(dir).filter((f) => f.endsWith('.md'));
      } catch {
        fail(`[admin] "${collection.label}" 의 폴더를 찾을 수 없습니다: ${collection.folder}`);
        continue;
      }

      const test = (name, value) => {
        const pattern = byName.get(name)?.pattern;
        if (!pattern || value === undefined || value === null) return true;
        return new RegExp(pattern[0]).test(String(value));
      };
      const relatedOptions = new Set(
        (byName.get('related')?.options ?? []).map((o) => o.value ?? o),
      );

      for (const file of entries) {
        const where = `${collection.name}/${file}`;
        const raw = readFileSync(join(dir, file), 'utf8');
        let fm;
        try {
          fm = parseYaml(raw.split('---')[1] ?? '');
        } catch {
          fail(`[admin] ${where} 의 frontmatter 파싱 실패`);
          continue;
        }

        if (!test('title', fm.title)) {
          fail(`[admin] ${where} 의 제목을 편집 화면이 거부합니다 (${[...fm.title].length}자)`);
        }
        if (!test('description', fm.description)) {
          fail(
            `[admin] ${where} 의 요약 설명을 편집 화면이 거부합니다 (${[...(fm.description ?? '')].length}자)`,
          );
        }

        const faqField = byName.get('faq');
        const faqCount = fm.faq?.length ?? 0;
        if (faqField && (faqCount < faqField.min || faqCount > faqField.max)) {
          fail(`[admin] ${where} 의 FAQ ${faqCount}개가 편집 화면 허용범위를 벗어납니다`);
        }

        const sourceFields = new Map(
          (byName.get('sources')?.fields ?? []).map((f) => [f.name, f]),
        );
        for (const source of fm.sources ?? []) {
          for (const [name, field] of sourceFields) {
            if (!field.pattern || source[name] === undefined) continue;
            if (!new RegExp(field.pattern[0]).test(String(source[name]))) {
              fail(`[admin] ${where} 의 출처 "${name}" 값을 편집 화면이 거부합니다: ${source[name]}`);
            }
          }
        }

        // 선택지에 없는 문서는 편집 화면에서 고르지도, 유지하지도 못한다.
        // 문서를 새로 추가했으면 config.yml 의 related options 에도 추가해야 한다.
        for (const ref of fm.related ?? []) {
          if (relatedOptions.size > 0 && !relatedOptions.has(ref)) {
            fail(`[admin] ${where} 가 참조한 "${ref}" 가 편집 화면의 관련문서 선택지에 없습니다`);
          }
        }

        const key = `${collection.name}/${file.replace(/\.md$/, '')}`;
        if (relatedOptions.size > 0 && !relatedOptions.has(key)) {
          fail(
            `[admin] "${key}" 가 편집 화면의 관련문서 선택지에 없습니다 — public/admin/config.yml 의 related options 에 추가하세요`,
          );
        }
      }
    }
  }
}

/* ---------- 편집 화면 입력칸 ↔ 화면 문구 파일 대조 ----------
 *
 * **이 검사가 없으면 조용히 글이 사라진다.**
 *
 * Sveltia CMS 는 저장할 때 "설정에 적힌 입력칸"만 파일에 다시 쓴다. 그래서 화면 문구
 * JSON 에 있는 항목을 config.yml 에 안 적어 두면, 사장님이 그 화면을 한 번 저장하는
 * 순간 그 항목이 파일에서 지워진다 — 화면에서 문구가 통째로 사라지고, 사장님은
 * 자기가 건드린 적 없는 곳이라 원인을 알 수 없다.
 *
 * 반대 방향(설정에만 있고 파일에 없는 입력칸)은 저장 전까지 화면이 빈칸으로 보이거나
 * 필수 항목이라며 저장을 막는다.
 *
 * 그래서 양쪽 항목 이름을 통째로 맞춰 본다.
 */
{
  const configPath = join(DIST, 'admin', 'config.yml');
  if (size(configPath) !== null) {
    let config = null;
    try {
      config = parseYaml(readFileSync(configPath, 'utf8'));
    } catch {
      // 위 블록에서 이미 보고했다
    }

    /** 설정의 입력칸 정의에서 "이 자리에 올 항목 이름" 집합을 뽑는다 */
    const fieldNames = (fields) => new Set((fields ?? []).map((f) => f.name));

    /**
     * 설정(fields)과 실제 값(value)을 같은 깊이에서 나란히 훑는다.
     * 객체는 항목 이름을 맞춰 보고, 목록은 첫 번째 값의 모양으로 대표해서 본다.
     */
    const compare = (fields, value, where, label) => {
      if (value === null || typeof value !== 'object' || Array.isArray(value)) return;

      const declared = fieldNames(fields);
      const actual = new Set(Object.keys(value));

      for (const name of actual) {
        if (!declared.has(name)) {
          fail(
            `[admin] ${where} 의 "${label}${name}" 이(가) 편집 화면 설정에 없습니다 — ` +
              `사장님이 이 화면을 저장하면 그 내용이 파일에서 사라집니다. ` +
              `public/admin/config.yml 에 입력칸을 추가하세요`,
          );
        }
      }
      for (const name of declared) {
        const field = (fields ?? []).find((f) => f.name === name);
        if (!actual.has(name)) {
          // 선택 항목은 값이 없어도 정상이다
          if (field?.required === false) continue;
          fail(
            `[admin] ${where} 에 편집 화면이 요구하는 "${label}${name}" 값이 없습니다 — ` +
              `편집 화면에서 이 화면을 열면 빈칸이거나 저장이 막힙니다`,
          );
          continue;
        }

        const child = value[name];
        if (field?.widget === 'object') {
          compare(field.fields, child, where, `${label}${name} → `);
        } else if (field?.widget === 'list' && Array.isArray(child) && field.fields) {
          // 목록 안 항목들의 모양은 서로 같아야 하므로 전부 확인한다
          child.forEach((item, i) => {
            compare(field.fields, item, where, `${label}${name}[${i + 1}] → `);
          });
        }
      }
    };

    for (const collection of config?.collections ?? []) {
      for (const entry of collection.files ?? []) {
        // 목록 사이에 넣은 구분선 — 편집 항목이 아니다
        if ('divider' in entry) continue;

        const filePath = join(ROOT, entry.file);
        if (size(filePath) === null) {
          fail(`[admin] "${entry.label}" 이 가리키는 ${entry.file} 파일이 없습니다`);
          continue;
        }

        let value = null;
        try {
          value = JSON.parse(readFileSync(filePath, 'utf8'));
        } catch (error) {
          fail(`[admin] ${entry.file} 을(를) 읽을 수 없습니다: ${error.message}`);
          continue;
        }

        compare(entry.fields, value, `"${entry.label}"`, '');
      }
    }
  }
}

/* ---------- 부품 문구 광고 규칙 ----------
 *
 * 부품 사양 문구는 원래 코드 주석에 "타사·화재·성능우위를 쓰지 말 것"이라고만 적혀
 * 있었다. 개발자가 읽고 지키는 전제였는데, 2026-08-08에 이 문구를 편집 화면으로 열면서
 * 그 전제가 사라졌다 — 사장님은 코드 주석을 보지 않는다.
 *
 * 그래서 규칙을 기계가 막게 옮겼다. 근거: 2026-08-07 사장님 지시
 * (타사 화재사례 사용 금지, 고객 글·영상 인용 금지, 시험 자료 없는 성능 우위 주장 금지).
 *
 * 여기서 막는 것은 **부품 사양 문구 안에서만**이다. 안전수칙에서 화재·사고를 말하는 것은
 * 당연히 정상이므로 검사 대상이 아니다.
 */
{
  const productsPath = join(CONTENT, 'data', 'products.json');
  if (size(productsPath) !== null) {
    let products = null;
    try {
      products = JSON.parse(readFileSync(productsPath, 'utf8'));
    } catch (error) {
      fail(`[제품 정보] products.json 을 읽을 수 없습니다: ${error.message}`);
    }

    /** 부품 문구에 나오면 안 되는 말 — 왜 안 되는지까지 함께 적는다 */
    const FORBIDDEN_PART_WORDS = [
      { pattern: /타사|경쟁사|다른 ?제품|중국산|저가 ?제품|짝퉁|싸구려/, why: '다른 회사 제품을 비교 대상으로 말하면 비교광고가 되어 근거 자료를 요구받습니다' },
      { pattern: /화재|불이 ?나|폭발|사고|터[졌지]|녹아내/, why: '사고·화재를 암시하면 근거 없는 위해성 주장이 됩니다 (안전수칙 화면에서는 정상입니다)' },
      { pattern: /몇 ?배|[0-9]+ ?배 (더|이상)|최고|최강|1위|국내 ?유일|world ?best/i, why: '시험 자료 없이 성능 우위를 주장할 수 없습니다' },
      { pattern: /후기|리뷰|고객[이님]? ?(말|글|올린)|별점/, why: '고객 글·영상 인용은 2026-08-07 지시로 금지돼 있습니다' },
    ];

    for (const part of products?.buildQuality ?? []) {
      for (const field of ['claim', 'detail', 'howToCheck']) {
        const value = part[field];
        if (typeof value !== 'string') continue;
        for (const { pattern, why } of FORBIDDEN_PART_WORDS) {
          const hit = value.match(pattern);
          if (!hit) continue;
          fail(
            `[제품 정보] 부품 "${part.part}" 문구에 "${hit[0]}" 이(가) 들어 있습니다 — ${why}. ` +
              `편집 화면 → 제품 정보 → 부품 사양 에서 고쳐 주세요`,
          );
        }
      }
    }

    // "무료배송"을 조건 없이 단독으로 쓰면 표시광고법상 문제가 된다.
    // 배송 문구를 편집 화면에 열었으므로 조건 문구가 비지 않았는지 확인한다.
    const shipping = products?.shipping;
    if (shipping && (!shipping.note || shipping.note.trim().length < 10)) {
      fail(
        '[제품 정보] 배송 조건 문구가 비어 있거나 너무 짧습니다 — ' +
          '"무료배송"만 단독으로 쓰면 도서·산간 추가비와 반품비를 고지하지 않은 것이 됩니다',
      );
    }
  }
}

/* ---------- 화면 문구 안의 숫자 자리표시자 ----------
 *
 * `{{충전한도}}` 처럼 적은 것은 빌드할 때 실제 값으로 바뀐다. 바뀌지 않고 산출물까지
 * 흘러갔다면 이름을 잘못 적은 것이고, 방문자 화면에 중괄호가 그대로 찍힌다.
 * (src/lib/page-content.ts 가 빌드를 세우므로 여기까지 올 일은 없지만, 검사 비용이
 *  거의 없고 잡히면 화면이 망가진 상태라 마지막 그물로 둔다)
 */
{
  for (const file of pages) {
    const html = readFileSync(file, 'utf8');
    const leftover = html.match(/\{\{\s*[^}\s]+\s*\}\}/);
    if (leftover) {
      fail(
        `[${urlPathFor(file)}] 자리표시자 "${leftover[0]}" 가 그대로 화면에 나왔습니다 — ` +
          `이름을 잘못 적었습니다`,
      );
    }
  }
}

/* ---------- 설정 파일의 자리표시자 (산출물에는 안 나오지만 배포를 막아야 하는 것) ---------- */
{
  const siteConfig = readFileSync(join(ROOT, 'src', 'data', 'site.ts'), 'utf8');

  const gaId = siteConfig.match(/GA4_MEASUREMENT_ID\s*=\s*'([^']*)'/)?.[1] ?? '';
  if (!isRealGa4Id(gaId)) {
    fail(
      `[site.ts] GA4_MEASUREMENT_ID "${gaId}" 가 유효한 측정 ID가 아닙니다 — 이 상태에서는 계측이 전혀 되지 않습니다`,
    );
  }

  if (siteConfig.includes('TODO_')) {
    fail('[site.ts] 채우지 않은 TODO_ 값이 남아 있습니다');
  }

  // 검증기가 보는 상품번호와 실제 구매 URL이 어긋나면 검사가 무의미해진다
  const storeUrl = siteConfig.match(/OFFICIAL_STORE_PRODUCT_URL\s*=\s*\n?\s*'([^']*)'/)?.[1] ?? '';
  if (!decodeURIComponent(storeUrl).includes(`/${EXPECTED_BUY_PRODUCT_NO}`)) {
    fail(
      `[site.ts] OFFICIAL_STORE_PRODUCT_URL 이 검증 기준 상품번호(${EXPECTED_BUY_PRODUCT_NO})와 다릅니다 — verify-build.mjs의 EXPECTED_BUY_PRODUCT_NO 도 함께 갱신하세요`,
    );
  }

  // 사업자 주소 행정구역 표기 오류 (광주광역시는 전라남도와 별개 광역자치단체)
  if (/전남\s*광주|전라남도\s*광주/.test(siteConfig)) {
    fail('[site.ts] 주소 행정구역 표기 오류 — 광주광역시는 전라남도 소속이 아닙니다');
  }

  // 탱크 용량이 공식 상세페이지와 대조 확인되지 않으면 배포를 막는다 (충전 한도는 안전 수치)
  const productsConfig = readFileSync(join(ROOT, 'src', 'data', 'products.ts'), 'utf8');
  if (/TANK_SPEC_CONFIRMED\s*=\s*false/.test(productsConfig)) {
    fail(
      '[products.ts] 탱크 용량이 공식 상세페이지 표기와 다릅니다 (1.7L/2.8L vs 1.8L/2.5L). 확인 후 TANK_SPEC_CONFIRMED를 true로 바꾸세요',
    );
  }
}

/* ---------- 미디어 지도가 현실과 어긋나지 않는가 ----------
 *
 * /admin/media/ 는 사장님이 "어느 사진이 어디 있고 어디가 비었는지" 보는 유일한 화면이다.
 * 지도에서 빠진 사진이 생기면 그 사진은 사장님 눈에 영영 안 보이게 되므로,
 * 자산 폴더와 지도를 대조해 누락을 막는다.
 */
{
  const mapPath = join(ROOT, 'src', 'data', 'media-map.ts');
  const map = readFileSync(mapPath, 'utf8');

  /**
   * 편집 화면에서 고른 사진은 지도에 파일명이 적혀 있지 않다.
   * 지도가 화면 문구 파일에서 파일명을 읽어가기 때문이다 (media-map.ts 의 assetFileName 참조).
   * 그래서 "어딘가에서 쓰이고 있는가"를 볼 때 화면 문구 파일도 함께 본다.
   */
  let pageContentText = '';
  const collectJson = (dir) => {
    for (const item of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, item.name);
      if (item.isDirectory()) collectJson(path);
      else if (item.name.endsWith('.json')) pageContentText += readFileSync(path, 'utf8');
    }
  };
  try {
    collectJson(CONTENT);
  } catch {
    fail('[편집 내용] src/content 폴더를 읽을 수 없습니다');
  }

  const referenced = (name) => map.includes(name) || pageContentText.includes(name);

  const assetsDir = join(ROOT, 'src', 'assets');
  const photos = readdirSync(assetsDir).filter((f) => /^photo-.*\.(jpg|png)$/.test(f));
  for (const photo of photos) {
    if (!referenced(photo)) {
      // 실패가 아니라 경고다.
      //
      // 편집 화면에서 사진을 바꾸면 예전 사진 파일은 src/assets 에 그대로 남는다.
      // 이것을 실패로 잡으면 "사진을 바꿨더니 사이트가 배포되지 않는" 상황이 되고,
      // 사장님은 원인을 알 수 없다. 안 쓰는 파일이 남는 것은 화면을 망가뜨리지 않으므로
      // 알려만 주고 배포는 막지 않는다.
      warn(
        `src/assets/${photo} 를 아무 화면도 쓰고 있지 않습니다 — ` +
          `사진을 바꾸면서 남은 예전 파일이면 지워도 됩니다`,
      );
    }
  }

  // 반대 방향 — 지도가 가리키는 파일이 실제로 있는가.
  // 이쪽은 실패다. 없는 파일을 가리키면 /admin/media/ 화면이 현실과 어긋난다.
  for (const [, name] of map.matchAll(/file:\s*'(photo-[^']+)'/g)) {
    if (!photos.includes(name)) {
      fail(`[media-map.ts] 지도에 적힌 src/assets/${name} 파일이 없습니다`);
    }
  }

  // 영상도 같은 방식으로 — media.ts 에 등록되지 않은 영상 파일은 화면에 붙을 수 없다
  const mediaTs = readFileSync(join(ROOT, 'src', 'data', 'media.ts'), 'utf8');
  const videoDir = join(DIST, 'video');
  for (const file of readdirSync(videoDir).filter((f) => f.endsWith('.mp4'))) {
    if (!mediaTs.includes(file)) {
      fail(`[media.ts] public/video/${file} 이 영상 목록에 없습니다 — 어느 화면에도 안 붙습니다`);
    }
  }
}

/* ---------- 그 외 산출물(텍스트 파일)의 자리표시자 ---------- */
// .yml 은 편집 화면 설정(admin/config.yml) 때문에 포함한다 — 설정에 적은 문구도 산출물이다.
for (const file of files.filter((f) => /\.(txt|xml|json|ya?ml)$/.test(f))) {
  const text = readFileSync(file, 'utf8');
  for (const blocker of BLOCKERS) {
    if (text.includes(blocker.needle)) {
      fail(`[${file.slice(DIST.length)}] "${blocker.needle}" 남아 있음 — ${blocker.why}`);
    }
  }
}

/* ---------- CSS 안 웹폰트도 자체 호스팅만 ---------- */
for (const file of files.filter((f) => f.endsWith('.css'))) {
  const css = readFileSync(file, 'utf8');
  if (EXTERNAL_FONT_HOST.test(css)) {
    fail(`[CSS] 외부 글꼴 서버 참조 → ${file.slice(DIST.length)}`);
  }
  for (const [, ref] of css.matchAll(/url\(["']?([^"')]*\.woff2?)["']?\)/gi)) {
    if (!ref.startsWith('/fonts/')) {
      fail(`[CSS] 자체 호스팅 밖의 글꼴 참조 → ${file.slice(DIST.length)} 안의 ${ref}`);
    }
  }
}

/* ---------- 글꼴 파일 용량 ----------
 * 조각 하나가 커지면 그 조각에 든 글자를 쓴 페이지 전부가 그만큼 더 받는다.
 * Pretendard 변수 폰트의 unicode-range 조각은 가장 큰 것이 42KB다.
 * 누군가 전체 글꼴(2MB)을 통째로 넣는 것을 막는 것이 이 검사의 목적이다.
 */
const FONT_FILE_BUDGET = 80 * 1024;
const fontFiles = files.filter((f) => /\.woff2?$/i.test(f));
if (fontFiles.length === 0) fail('[글꼴] dist 에 글꼴 파일이 하나도 없습니다');
for (const file of fontFiles) {
  const size = statSync(file).size;
  if (size > FONT_FILE_BUDGET) {
    fail(
      `[글꼴] ${file.slice(DIST.length)} 가 ${Math.round(size / 1024)}KB — ` +
        `조각 하나는 ${FONT_FILE_BUDGET / 1024}KB 이하여야 합니다`,
    );
  }
}

/* ---------- 사이트맵 ---------- */
const sitemapFiles = files.filter((f) => /sitemap-\d+\.xml$/.test(f));
if (sitemapFiles.length === 0) fail('[sitemap] sitemap-0.xml 없음');

const sitemapXml = sitemapFiles.map((f) => readFileSync(f, 'utf8')).join('\n');
const sitemapUrls = all(sitemapXml, /<loc>([^<]+)<\/loc>/g).map((m) => m[1]);

for (const id of UNPUBLISHED) {
  if (sitemapUrls.some((u) => u.includes(`/${id}/`))) {
    fail(`[sitemap] published:false 문서가 사이트맵에 있음: ${id}`);
  }
}
if (sitemapUrls.some((u) => u.includes('/404'))) fail('[sitemap] 404가 사이트맵에 포함됨');

// noindex 페이지가 사이트맵에 있으면 "색인하지 마라"와 "여기 있다"가 서로 모순된다
for (const path of noindexPaths) {
  if (sitemapUrls.includes(`${SITE}${path}`)) {
    fail(`[sitemap] noindex 페이지가 사이트맵에 포함됨: ${path}`);
  }
}

const expected = pages.map(urlPathFor).filter((p) => p !== '/404/' && !noindexPaths.includes(p));
for (const path of expected) {
  if (!sitemapUrls.includes(`${SITE}${path}`)) fail(`[sitemap] 누락: ${path}`);
}

/* ---------- RSS ---------- */
const rssPath = join(DIST, 'rss.xml');
if (size(rssPath) === null) fail('[rss] rss.xml 없음');
else {
  const rss = readFileSync(rssPath, 'utf8');
  for (const id of UNPUBLISHED) {
    if (rss.includes(`/${id}/`)) fail(`[rss] published:false 문서가 RSS에 있음: ${id}`);
  }
}

/* ---------- robots.txt / llms.txt ---------- */
const robotsPath = join(DIST, 'robots.txt');
if (size(robotsPath) === null) fail('[robots] robots.txt 없음');
else {
  const robots = readFileSync(robotsPath, 'utf8');
  const mustAllow = [
    'Googlebot',
    'Yeti',
    'Daumoa',
    'bingbot',
    'OAI-SearchBot',
    'PerplexityBot',
    'ClaudeBot',
    'GPTBot',
    'Google-Extended',
    'CCBot',
  ];
  const mustBlock = ['AhrefsBot', 'SemrushBot', 'DotBot', 'MJ12bot', 'BLEXBot'];
  for (const ua of mustAllow) {
    const block = robots.match(new RegExp(`User-agent:\\s*${ua}\\s*\\n(.*)`, 'i'));
    if (!block) fail(`[robots] ${ua} 규칙 없음`);
    else if (!/Allow:\s*\//i.test(block[1])) fail(`[robots] ${ua} 가 Allow 아님`);
  }
  for (const ua of mustBlock) {
    const block = robots.match(new RegExp(`User-agent:\\s*${ua}\\s*\\n(.*)`, 'i'));
    if (!block) fail(`[robots] ${ua} 규칙 없음`);
    else if (!/Disallow:\s*\//i.test(block[1])) fail(`[robots] ${ua} 가 Disallow 아님`);
  }
  if (!/^Sitemap:\s*https?:\/\/\S+/m.test(robots)) fail('[robots] Sitemap 경로 없음');
}

const llmsPath = join(DIST, 'llms.txt');
if (size(llmsPath) === null) fail('[llms] llms.txt 없음');
else {
  const llms = readFileSync(llmsPath, 'utf8');
  for (const id of UNPUBLISHED) {
    if (llms.includes(`/${id}/`)) fail(`[llms] published:false 문서가 llms.txt에 있음: ${id}`);
  }
  // 제품 표기는 공식 옵션명으로만 한다 — 내부 모델 번호는 산출물에 나가면 안 된다
  for (const needle of ['인용', '충전 한도', '기본형', '대용량', '대용량+롱노즐']) {
    if (!llms.includes(needle)) fail(`[llms] "${needle}" 항목 없음`);
  }
}

/* ---------- 출력 ---------- */
report.sort((a, b) => b.weight - a.weight);
console.log('페이지 전송량 (상위 6개)');
for (const { urlPath, weight } of report.slice(0, 6)) {
  console.log(`  ${(weight / 1024).toFixed(0).padStart(5)}KB  ${urlPath}`);
}
console.log(`  최대 ${(report[0].weight / 1024).toFixed(0)}KB / 예산 1229KB\n`);

if (warnings.length) {
  console.log(`경고 ${warnings.length}건`);
  for (const w of warnings) console.log(`  · ${w}`);
  console.log('');
}

if (errors.length) {
  console.log(`실패 ${errors.length}건`);
  for (const e of errors) console.log(`  ✗ ${e}`);
  process.exit(1);
}

console.log('통과: 깨진 링크 0 · 페이지 예산 이내 · 비공개 문서 미노출 · 구조화데이터 정책 준수');
