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
 *  10. 웹폰트 0
 */
import { readFileSync, statSync } from 'node:fs';
import { readdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const SITE = 'https://fogger.blueguard.kr';
const PAGE_BUDGET = 1.2 * 1024 * 1024;

const FORBIDDEN_SCHEMA = ['Offer', 'Product', 'AggregateRating', 'aggregateRating', 'FAQPage', 'HowTo'];
/** published:false 문서 id — 어디에도 나타나면 안 된다 */
const UNPUBLISHED = ['winter-operation', 'greenhouse'];

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

/* ---------- 로드 ---------- */

const files = await walk(DIST);
const pages = files.filter((f) => f.endsWith('.html')).sort();
const assetSizes = new Map(files.map((f) => [f, size(f)]));

console.log(`검사 대상: HTML ${pages.length}개 / 전체 파일 ${files.length}개\n`);

const titles = new Map();

/* ---------- 페이지별 검사 ---------- */

const report = [];

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

    if (!w || !h) fail(`${where} img에 width/height 없음 → ${src}`);
    if (alt === null) fail(`${where} img에 alt 없음 → ${src}`);
    else if (!alt.includes(' — ')) fail(`${where} alt 형식 위반("{주제} — {구체 장면}") → "${alt}"`);
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
    if (breadcrumb) {
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

  /* --- 10. 웹폰트 --- */
  if (/@font-face|fonts\.googleapis\.com|fonts\.gstatic\.com|\.woff2?/i.test(html)) {
    fail(`${where} 웹폰트 참조 발견`);
  }

  /* --- noindex 는 404 에만 --- */
  const hasNoindex = /name="robots"\s+content="noindex/i.test(html);
  if (hasNoindex !== is404) {
    fail(`${where} noindex 설정이 잘못됨 (404만 noindex여야 함)`);
  }
}

/* ---------- CSS 안 웹폰트 ---------- */
for (const file of files.filter((f) => f.endsWith('.css'))) {
  const css = readFileSync(file, 'utf8');
  if (/@font-face|fonts\.googleapis\.com|\.woff2?/i.test(css)) {
    fail(`[CSS] 웹폰트 참조 발견 → ${file.slice(DIST.length)}`);
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

const expected = pages.map(urlPathFor).filter((p) => p !== '/404/');
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
  for (const needle of ['인용', '충전 한도', 'BF-100S', 'BF-102']) {
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
