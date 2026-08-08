/**
 * 편집 화면(/admin/)에서 고치는 **페이지 문구**를 읽어들이는 곳.
 *
 * **왜 이 파일이 있는가**
 * 홈·모델비교·안전수칙 같은 화면의 문구는 원래 각 .astro 안에 그대로 박혀 있었다.
 * 그래서 편집 화면에 들어가도 "내가 화면에서 본 그 문구"가 목록에 없었고, 사장님이
 * 문구 하나를 바꾸려면 개발자를 거쳐야 했다. 문구를 `src/content/pages/*.json` 으로
 * 빼서 편집 화면이 직접 열 수 있게 한 것이 이 파일이다.
 *
 * **세 가지를 여기서 책임진다**
 *   1) 숫자 자리표시자 치환 — 아래 TOKENS 참조
 *   2) 사진 경로 → 실제 이미지 해석 — 아래 resolveImage 참조
 *   3) 저장된 값이 화면 규칙을 지키는지 빌드 시점 검사 (zod)
 *
 * 셋 다 **빌드 때** 돈다. 잘못된 값이 저장되면 빌드가 실패하고, 빌드가 실패하면
 * 배포가 안 되므로 사이트는 직전 버전 그대로 남는다 (vercel.json 참조).
 */
import type { ImageMetadata } from 'astro';
import { z } from 'zod';

import { BUSINESS } from '../data/site';
import {
  COIL_TEMP_C,
  DOMESTIC_PARTS_PERCENT,
  FILL_RATIO_LABEL,
  HEAT_SOURCE,
  MEDIA_LABEL,
  MEDIA_SPECS,
  MESH_THICKNESS_MM,
  PRODUCTS,
  SHIPPING,
  SPRAY_MODES,
  USE_VENUE,
  WORK_REFERENCE,
  maxFillLiters,
} from '../data/products';

/* ------------------------------------------------------------------ *
 * 1. 숫자 자리표시자
 * ------------------------------------------------------------------ */

/**
 * 문구 안에 `{{충전한도}}` 처럼 적으면 빌드할 때 실제 값으로 바뀐다.
 *
 * **왜 숫자를 직접 못 쓰게 하는가**
 * 탱크 용량·충전 한도 같은 값은 `src/data/products.ts` 한 곳에만 있고, 그 옆에
 * "무엇을 보고 확인했는지"가 주석으로 붙어 있다. 화면 문구에 숫자를 손으로 적으면
 * 나중에 사양이 바뀌었을 때 한쪽만 고쳐지고 다른 쪽은 옛날 숫자로 남는다.
 * 자리표시자를 쓰면 사양을 한 번만 고쳐도 모든 화면이 같이 바뀐다.
 *
 * 여기 없는 이름을 쓰면 빌드가 실패하면서 어떤 이름이 있는지 알려 준다.
 * 새 자리표시자가 필요하면 여기 한 줄을 더하고 config.yml 의 안내문도 같이 고친다.
 */
export const TOKENS: Record<string, string> = {
  /* 제품 구성 이름 (공식 옵션명) */
  기본형: PRODUCTS[0]!.officialLabel,
  대용량: PRODUCTS[1]!.officialLabel,
  롱노즐구성: PRODUCTS[2]!.officialLabel,

  /* 용량 */
  기본형탱크: `${PRODUCTS[0]!.tankLiters}L`,
  대용량탱크: `${PRODUCTS[1]!.tankLiters}L`,
  기본형최대충전: `${maxFillLiters(PRODUCTS[0]!.tankLiters)}L`,
  대용량최대충전: `${maxFillLiters(PRODUCTS[1]!.tankLiters)}L`,
  충전한도: FILL_RATIO_LABEL,

  /* 크기 — "465×265×180" 의 가장 긴 변 */
  기본형최장변: PRODUCTS[0]!.dimensionsMm.split('×')[0]!,

  /* 공통 사양 */
  분사모드: SPRAY_MODES,
  가열원: HEAT_SOURCE,
  매질: MEDIA_LABEL,
  매질별장소: MEDIA_SPECS.map((m) => `${m.name} ${m.venueLabel}`).join(', '),
  사용장소: USE_VENUE.label,
  환기조건: USE_VENUE.condition,

  /* 부품 */
  국산비율: String(DOMESTIC_PARTS_PERCENT),
  철망두께: String(MESH_THICKNESS_MM),
  가열온도: String(COIL_TEMP_C),

  /* 작업 기준량 — 탱크 용량이 아니라 "1,500mL로 약 30분·300평" 쪽 값이다 */
  작업기준량: WORK_REFERENCE.chargeMl.toLocaleString('ko-KR'),
  작업시간: String(WORK_REFERENCE.minutes),
  작업면적: String(WORK_REFERENCE.pyeong),
  작업기준주석: WORK_REFERENCE.note,

  /* 배송·연락처 */
  배송: SHIPPING.label,
  배송조건: SHIPPING.note,
  이메일: BUSINESS.email,
};

/** 편집 화면 안내문에 그대로 붙이는 목록 — 쓸 수 있는 이름을 사장님이 볼 수 있어야 한다 */
export const TOKEN_NAMES = Object.keys(TOKENS);

const TOKEN_PATTERN = /\{\{\s*([^}\s]+)\s*\}\}/g;

/**
 * `{{이름}}` 을 실제 값으로 바꾼다.
 * 모르는 이름이면 조용히 남기지 않고 빌드를 세운다 — 화면에 `{{오타}}` 가 그대로
 * 찍히는 것보다 배포가 막히는 편이 낫다.
 */
export function fillTokens(text: string, where: string): string {
  return text.replace(TOKEN_PATTERN, (whole, name: string) => {
    const value = TOKENS[name];
    if (value === undefined) {
      throw new Error(
        `[${where}] 쓸 수 없는 자리표시자 "${whole}" 입니다.\n` +
          `쓸 수 있는 이름: ${TOKEN_NAMES.join(', ')}`,
      );
    }
    return value;
  });
}

/* ------------------------------------------------------------------ *
 * 2. 사진 경로 해석
 * ------------------------------------------------------------------ */

/**
 * `src/assets` 안의 모든 사진을 미리 읽어 둔다.
 *
 * astro:assets 는 원래 파일마다 `import` 문을 적어야 하는데, 그러면 편집 화면에서
 * 올린 사진은 import 문이 없으니 화면에 붙지 않는다. glob 으로 폴더 전체를 미리
 * 잡아 두면 **경로 문자열만으로** 사진을 찾을 수 있어 편집 화면에서 올린 사진이
 * 바로 반영된다. 크기 최적화(AVIF/WebP 변환)는 그대로 적용된다.
 */
const ASSETS = import.meta.glob<{ default: ImageMetadata }>(
  '/src/assets/**/*.{jpg,jpeg,png,webp,JPG,JPEG,PNG,WEBP}',
  { eager: true },
);

/** 편집 화면이 저장하는 경로 형태 — public_folder 설정과 짝을 이룬다 */
const ASSET_PREFIX = '/src/assets/';

/**
 * 저장된 경로("/src/assets/photo-bf-102.jpg")를 실제 이미지로 바꾼다.
 * 파일이 없으면 빌드를 세운다 — 깨진 사진이 사이트에 나가지 않게 한다.
 */
export function resolveImage(path: string, where: string): ImageMetadata {
  const found = ASSETS[path];
  if (!found) {
    const available = Object.keys(ASSETS)
      .map((p) => p.replace(ASSET_PREFIX, ''))
      .join(', ');
    throw new Error(
      `[${where}] 사진 "${path}" 을(를) 찾을 수 없습니다.\n` +
        `편집 화면에서 사진을 다시 고르거나 올려 주세요.\n` +
        `지금 있는 사진: ${available}`,
    );
  }
  return found.default;
}

/** 페이지 JSON 이 참조하는 사진 경로 전부 — 미디어 지도가 이 목록을 쓴다 */
export function assetFileName(path: string): string {
  return path.replace(ASSET_PREFIX, '');
}

/* ------------------------------------------------------------------ *
 * 3. 공통 검사 규칙
 * ------------------------------------------------------------------ */

/**
 * 화면에 그대로 나가는 한 줄.
 * 빈 값이면 그 자리가 통째로 비어 보이므로 막고, 자리표시자를 치환한다.
 */
const line = (where: string) =>
  z
    .string()
    .trim()
    .min(1, '빈칸으로 둘 수 없습니다.')
    .transform((value) => fillTokens(value, where));

/** 여러 줄 — 화면에서는 줄바꿈으로 이어 붙인다 */
const lines = (where: string) => z.array(line(where)).min(1);

/**
 * 굵게·링크 표기를 쓸 수 있는 한 줄.
 * 자리표시자를 먼저 치환한 뒤 링크 주소를 검사한다 — 주소 안에 자리표시자를 쓸 수도 있다.
 */
const rich = (where: string) =>
  z
    .string()
    .trim()
    .min(1, '빈칸으로 둘 수 없습니다.')
    .transform((value) => checkInlineLinks(fillTokens(value, where), where));

/**
 * 사진 대체텍스트.
 *
 * `"{주제} — {구체 장면}"` 형식을 강제한다. 눈이 안 보이는 분과 검색엔진이 읽는
 * 유일한 설명이라 "제품 사진" 같은 값은 없는 것과 같다. Pic 컴포넌트도 같은 검사를
 * 하지만, 여기서 먼저 걸러야 어느 페이지 어느 자리인지 알려 줄 수 있다.
 */
const imageAlt = (where: string) =>
  z
    .string()
    .trim()
    .min(1, '빈칸으로 둘 수 없습니다.')
    .refine((value) => value.includes(' — '), {
      message:
        '사진 설명은 "{무엇} — {어떤 장면}" 형식으로 적어 주세요 (가운데 줄표 앞뒤에 빈칸). ' +
        '예: "블루가드 연막소독기 대용량 — 흰 연료통과 스테인리스 배럴이 보이는 본체 사진"',
    })
    .transform((value) => fillTokens(value, where));

/**
 * 사진 한 장.
 *
 * 실제 이미지(`meta`)와 저장된 경로(`path`)를 함께 내보낸다 — 화면은 `meta` 를 쓰고,
 * 미디어 지도(/admin/media/)는 `path` 로 파일명을 표시한다. 경로를 버리면 지도가
 * "지금 어떤 파일이 들어 있는지"를 다시 손으로 적어야 한다.
 */
const image = (where: string) =>
  z
    .string()
    .trim()
    .startsWith(ASSET_PREFIX, `사진 경로는 ${ASSET_PREFIX} 로 시작해야 합니다.`)
    .transform((value) => ({ path: value, meta: resolveImage(value, where) }));

/** 제목 + 본문 한 쌍 (혜택 목록, 안전 규칙 등이 공유) */
const titledText = (where: string) =>
  z.object({
    title: line(where),
    body: line(where),
  });

/**
 * 사이트 안의 다른 화면으로 가는 주소.
 *
 * `/` 로 시작하고 `/` 로 끝나야 한다 — 이 사이트는 주소 끝에 슬래시를 항상 붙이는
 * 규칙(astro.config.mjs 의 trailingSlash)이라, 빠뜨리면 한 번 더 돌아가는 주소가 된다.
 * 바깥 사이트 주소는 여기 넣지 않는다.
 */
const internalPath = z
  .string()
  .trim()
  .regex(
    /^\/([\w가-힣-]+\/)*$/,
    '사이트 안의 주소만 넣을 수 있고, 슬래시로 시작해서 슬래시로 끝나야 합니다. 예: /guides/',
  );

/** 화면 아래쪽 "더 보기" 줄에 나가는 링크 하나 */
const navLink = (where: string) =>
  z.object({
    label: line(where),
    href: internalPath,
  });

/** 표 한 줄 — 항목 이름 / 값 / 부연설명 */
const factRow = (where: string) =>
  z.object({
    label: line(where),
    value: line(where),
    note: z
      .string()
      .trim()
      .transform((value) => fillTokens(value, where))
      .optional(),
  });

export const field = {
  line,
  lines,
  rich,
  image,
  imageAlt,
  titledText,
  internalPath,
  navLink,
  factRow,
};

/* ------------------------------------------------------------------ *
 * 4. 숫자에 글꼴 적용
 * ------------------------------------------------------------------ */

/**
 * 문구 안의 숫자를 `<span class="num">` 으로 감싼 조각 목록으로 쪼갠다.
 *
 * 원래는 .astro 안에서 숫자마다 손으로 span 을 둘렀는데, 문구를 편집 화면으로 빼면
 * 사장님이 span 을 적을 수는 없다. 그래서 숫자를 자동으로 찾아 감싼다 —
 * 표시만 바뀌고 글자는 그대로다.
 */
export function numeralParts(text: string): { text: string; isNum: boolean }[] {
  const parts: { text: string; isNum: boolean }[] = [];
  let last = 0;
  for (const match of text.matchAll(/[\d][\d,.]*/g)) {
    const start = match.index;
    if (start > last) parts.push({ text: text.slice(last, start), isNum: false });
    parts.push({ text: match[0], isNum: true });
    last = start + match[0].length;
  }
  if (last < text.length) parts.push({ text: text.slice(last), isNum: false });
  return parts;
}

/** 한 줄 안에서 굵게·링크로 갈라진 조각 */
export type InlinePart =
  | { kind: 'text'; text: string }
  | { kind: 'bold'; text: string }
  | { kind: 'link'; text: string; href: string };

/**
 * 문구 한 줄 안의 **굵게** 와 [링크](/주소/) 를 조각으로 쪼갠다.
 *
 * **왜 표기를 따로 두는가**
 * 편집 화면 입력칸에 `<strong>` 이나 `<a>` 를 적으면 태그가 글자 그대로 화면에 찍힌다
 * (그렇게 안 하면 편집 화면을 통해 아무 HTML이나 사이트에 넣을 수 있게 된다).
 * 그래서 사장님이 이미 문서 편집기에서 쓰고 있는 마크다운 표기를 한 줄짜리 문구에서도
 * 쓸 수 있게 했다.
 */
export function inlineParts(text: string): InlinePart[] {
  const parts: InlinePart[] = [];
  let last = 0;
  // 굵게(**...**) 와 링크([...](...)) 를 한 번에 훑는다 — 순서가 섞여 있어도 위치대로 나온다
  for (const match of text.matchAll(/\*\*(.+?)\*\*|\[([^\]]+)\]\(([^)\s]+)\)/g)) {
    const start = match.index;
    if (start > last) parts.push({ kind: 'text', text: text.slice(last, start) });
    if (match[1] !== undefined) {
      parts.push({ kind: 'bold', text: match[1] });
    } else {
      parts.push({ kind: 'link', text: match[2]!, href: match[3]! });
    }
    last = start + match[0].length;
  }
  if (last < text.length) parts.push({ kind: 'text', text: text.slice(last) });
  return parts;
}

/**
 * 문구 안의 [링크](/주소/) 가 이 사이트 안을 가리키는지 검사한다.
 *
 * 편집 화면에서 바깥 주소를 붙이면 방문자가 사이트를 떠나고, 그 주소가 죽어도
 * 아무도 모른다. 내부 주소만 허용하고, 슬래시 규칙도 여기서 함께 잡는다.
 */
function checkInlineLinks(text: string, where: string): string {
  for (const part of inlineParts(text)) {
    if (part.kind !== 'link') continue;
    if (!internalPath.safeParse(part.href).success) {
      throw new Error(
        `[${where}] 링크 "[${part.text}](${part.href})" 의 주소를 쓸 수 없습니다. ` +
          `사이트 안의 주소만, 슬래시로 시작해서 슬래시로 끝나게 적어 주세요. 예: [사용법](/guides/)`,
      );
    }
  }
  return text;
}

/* ------------------------------------------------------------------ *
 * 5. JSON 읽기
 * ------------------------------------------------------------------ */

/**
 * 페이지 JSON 을 검사해서 내보낸다.
 * 검사에 걸리면 어느 파일 어느 칸이 문제인지 짚어서 빌드를 세운다.
 */
export function parsePage<T extends z.ZodType>(name: string, schema: T, raw: unknown): z.infer<T> {
  const result = schema.safeParse(raw);
  if (!result.success) {
    const detail = result.error.issues
      .map((issue) => `  · ${issue.path.join(' → ') || '(전체)'}: ${issue.message}`)
      .join('\n');
    throw new Error(
      `[${name}] 편집 화면에서 저장한 값이 화면 규칙에 맞지 않습니다.\n${detail}\n` +
        `(파일: src/content/pages/${name}.json)`,
    );
  }
  return result.data;
}
