/**
 * 제품 데이터 단일 소스.
 *
 * 규칙: 사이트의 모든 페이지·컴포넌트는 제품 수치를 이 파일에서만 읽는다.
 * 마크다운 본문을 포함해 어디에서도 용량·비율 등을 하드코딩하지 않는다.
 *
 * **값 자체는 `src/content/pages/../data/products.json` 에 있다.**
 * 2026-08-08에 사장님이 편집 화면(/admin/ → "제품 정보")에서 직접 고칠 수 있도록 옮겼다.
 * 이 파일은 그 값을 검사하고, 파생값(최대 충전량·매질 표기 등)을 계산해서 내보낸다.
 *
 * ⚠️ 옮기기 전 이 파일에는 값마다 "무엇을 보고 확인했는지"가 주석으로 붙어 있었다.
 *    그 근거는 지운 것이 아니라 두 곳으로 갈라 두었다 —
 *      · 사장님이 볼 것 → `public/admin/config.yml` 의 각 입력칸 안내문
 *      · 기계가 막을 것 → `scripts/verify-build.mjs` 의 검사 규칙
 *    새 값을 넣을 때는 반드시 공식 상세페이지 원문을 직접 확인한다.
 */
import { z } from 'zod';

import { resolveImage, ASSET_PREFIX } from '../lib/assets';
import { substitute } from '../lib/tokens';
import { OFFICIAL_STORE_PRODUCT_URL } from './site';
import raw from '../content/data/products.json';

const WHERE = '제품 정보';

/* ------------------------------------------------------------------ *
 * 검사 규칙
 * ------------------------------------------------------------------ */

const text = z.string().trim().min(1, '빈칸으로 둘 수 없습니다.');

/**
 * 선택 항목 — 값이 없을 때를 "없음"으로 통일한다.
 *
 * 편집 화면은 채웠다 지운 칸을 **빈 문자열로 남겨 둔다.** 그냥 `.optional()` 만 붙이면
 * 빈 문자열이 값으로 들어와 검사에 걸리고, 사장님은 "지웠는데 왜 오류가 나지" 하게 된다.
 * (사진을 넣었다 뺀 부품에서 실제로 재현됨 — 2026-08-08)
 */
const optional = <T extends z.ZodType>(schema: T) =>
  z.preprocess((v) => (v === '' || v === null ? undefined : v), schema.optional());

const imagePath = z
  .string()
  .trim()
  .startsWith(ASSET_PREFIX, `사진 경로는 ${ASSET_PREFIX} 로 시작해야 합니다.`);

const imageAltText = z
  .string()
  .trim()
  .min(1)
  .refine((v) => v.includes(' — '), {
    message: '사진 설명은 "{무엇} — {어떤 장면}" 형식으로 적어 주세요 (가운데 줄표 앞뒤에 빈칸).',
  });

const schema = z.object({
  common: z.object({
    productType: text,
    heatSource: text,
    sprayModes: text,
    efficacy: text,
    storage: text,
    /**
     * 탱크 충전 한도(%). 가열 시 매질이 팽창하므로 가득 채우면 넘침·역류 위험이 있다.
     * 안전 수치라 100 을 넣을 수 없게 막는다.
     */
    fillRatioPercent: z
      .number()
      .int()
      .min(50, '충전 한도를 50% 미만으로 내릴 이유가 없습니다.')
      .max(95, '충전 한도는 95%를 넘길 수 없습니다 — 가열 시 팽창분이 넘칠 위험이 있습니다.'),
    domesticPartsPercent: z.number().int().min(0).max(100),
    meshThicknessMm: z.number().positive(),
    coilTempC: z.number().int().positive(),
  }),

  useVenue: z.object({ label: text, condition: text }),

  workReference: z.object({
    chargeMl: z.number().int().positive(),
    minutes: z.number().int().positive(),
    pyeong: z.number().int().positive(),
    note: text,
  }),

  shipping: z.object({ label: text, note: text }),

  designFeatures: z.array(z.object({ title: text, detail: text })).min(1),

  buildQuality: z
    .array(
      z
        .object({
          id: z.string().regex(/^[a-z][a-z-]*$/, 'id 는 영문 소문자와 붙임표(-)만 씁니다.'),
          part: text,
          claim: text,
          detail: text,
          howToCheck: text,
          image: optional(imagePath),
          imageAlt: optional(imageAltText),
        })
        // 사진만 넣고 설명을 비우면 화면에 설명 없는 사진이 나간다.
        // 눈이 안 보이는 분에게는 그 칸이 통째로 사라지는 것과 같다.
        .refine((part) => !part.image || !!part.imageAlt, {
          message: '사진을 넣었으면 사진 설명도 채워 주세요.',
          path: ['imageAlt'],
        }),
    )
    .min(1),

  mediaSpecs: z
    .array(
      z.object({
        id: z.string().regex(/^[a-z][a-z-]*$/),
        name: text,
        mode: text,
        /** 이 매질을 썼을 때 실내에서 쓸 수 있는지. 환기 조건은 별개 축이라 그대로 적용된다 */
        indoor: z.boolean(),
        venueLabel: text,
        detail: text,
      }),
    )
    .min(1),

  models: z
    .array(
      z.object({
        /** 주소에 그대로 쓰인다 — 바꾸면 그 제품 페이지의 주소가 바뀌고 기존 링크가 끊긴다 */
        id: z.string().regex(/^[a-z0-9][a-z0-9-]*$/, 'id 는 영문 소문자·숫자·붙임표(-)만 씁니다.'),
        officialLabel: text,
        name: text,
        /**
         * 제품 상세 페이지의 검색결과 제목.
         *
         * 2026-08-10 확인: 세 구성의 제목이 전부 `휴대용 연막소독기 {옵션명} 사양` 이었다.
         * 같은 말로 시작하면 검색엔진이 셋 중 하나만 올리고 나머지는 버린다 — 세 페이지가
         * 서로의 순위를 나눠 갖고, 「소형 연막기」·「대용량 연막소독기」처럼 구성마다 다른
         * 검색어는 아무도 받지 못했다. 그래서 **구성마다 다른 말로 시작**하게 값을 연다.
         *
         * 상한 35자는 `SeoHead` 의 TITLE_MAX 와 같은 값이다 — 넘기면 빌드가 선다.
         */
        seoTitle: text.max(35, '검색결과 제목은 35자 이내여야 합니다.'),
        tagline: text,
        tankLiters: z.number().positive(),
        dimensionsMm: z.string().regex(/^\d+×\d+×\d+$/, '"465×265×180" 형식으로 적어 주세요.'),
        nozzle: text,
        sprayMode: text,
        shoulderStrap: z.boolean(),
        longNozzle: z.boolean(),
        includes: z.array(text).min(1),
        bestFor: z.array(text).min(1),
        /** null 이면 화면·구조화데이터 어디에도 가격을 표시하지 않는다 */
        priceKrw: z.preprocess((v) => (v === '' ? null : v), z.number().int().positive().nullable().default(null)),
        basedOn: optional(z.string()),
        image: imagePath,
        imageAlt: imageAltText,
      }),
    )
    .min(1),
});

const parsed = (() => {
  const result = schema.safeParse(raw);
  if (!result.success) {
    const detail = result.error.issues
      .map((issue) => `  · ${issue.path.join(' → ') || '(전체)'}: ${issue.message}`)
      .join('\n');
    throw new Error(
      `[${WHERE}] 편집 화면에서 저장한 값이 규칙에 맞지 않습니다.\n${detail}\n` +
        `(파일: src/content/data/products.json)`,
    );
  }
  return result.data;
})();

/* ------------------------------------------------------------------ *
 * 전 모델 공통 사양
 * ------------------------------------------------------------------ */

const { common } = parsed;

/** 제품 형식 (공식 상세페이지 표기) */
export const PRODUCT_TYPE = common.productType;

/** 가열원 */
export const HEAT_SOURCE = common.heatSource;

/**
 * 분사 모드.
 * 공식 상세페이지 표기: "연막·연무 한 대로 겸용".
 * 한 기기로 두 모드를 내며, 무엇을 넣느냐로 모드가 갈린다.
 */
export const SPRAY_MODES = common.sprayModes;

/** 효능 (공식 상세페이지 표기) */
export const EFFICACY = common.efficacy;

/** 보관 방법 (공식 상세페이지 표기) */
export const STORAGE = common.storage;

/** 부품 국산 비율 — "국내 조립"과 "부품 100% 국산"은 전혀 다른 주장이다 */
export const DOMESTIC_PARTS_PERCENT = common.domesticPartsPercent;

/** 철망 두께(mm) */
export const MESH_THICKNESS_MM = common.meshThicknessMm;

/** 가열부 도달 온도(℃) — 철망 두께와 노즐 재질이 중요한 이유 */
export const COIL_TEMP_C = common.coilTempC;

/** 탱크 충전 한도 (탱크 용량 대비 비율) */
export const FILL_RATIO = common.fillRatioPercent / 100;

/** 충전 한도 표기용 문자열 — "90%" */
export const FILL_RATIO_LABEL = `${common.fillRatioPercent}%`;

/**
 * 사용 장소는 하나의 값이 아니라 세 축이 겹쳐서 정해진다.
 *
 *   1) 실내에서 쓸 수 있는가 → **매질**이 정한다 (mediaSpecs 의 indoor)
 *   2) 어떤 환기 상태여야 하는가 → **가열원**이 정한다 (아래 condition)
 *   3) 무엇을 뿌려도 되는가 → **약제 표시사항**이 정한다
 *
 * 화면 문구는 이 세 축 중 하나라도 빠뜨리지 않는다.
 * "실내 사용 가능"만 단독으로 쓰면 2번과 3번이 사라져 위험한 문장이 된다.
 */
export const USE_VENUE = parsed.useVenue;

/**
 * 공식 상세페이지 상단 표기 — "1,500ml로 약 30분 · 300평 작업".
 *
 * 탱크 용량이 아니라 **작업 기준량**이다. 이 값을 사양(탱크 용량)으로 오독한 사례가 있어
 * (생성형 검색 답변이 "용량 1.5L"로 표시) 화면에서는 조건을 반드시 함께 노출한다.
 */
export const WORK_REFERENCE = parsed.workReference;

/**
 * 배송 정책.
 * `label`만 단독으로 쓰지 말고 조건이 들어갈 자리에는 반드시 `note`를 함께 노출한다.
 * (검증기가 "무료배송"이 나온 페이지에 조건 문구가 있는지 검사한다)
 */
export const SHIPPING = { free: true, ...parsed.shipping } as const;

/** 제품 설계 특징 (공식 상세페이지 표기) */
export const DESIGN_FEATURES = parsed.designFeatures;

/* ------------------------------------------------------------------ *
 * 자리표시자 — 제품 데이터 안에서 쓸 수 있는 이름
 * ------------------------------------------------------------------ */

/** 매질명만 필요한 자리 */
export const MEDIA = parsed.mediaSpecs.map((m) => m.name);

/** 매질 표기용 문자열 — "경유 또는 글리세린 50% 이상 확산제" */
export const MEDIA_LABEL = MEDIA.join(' 또는 ');

/**
 * 제품 데이터 문구 안에서 쓸 수 있는 자리표시자.
 * 화면 문구 쪽 표(`src/lib/page-content.ts` 의 TOKENS)가 이것을 그대로 물려받는다.
 */
export const PRODUCT_TOKENS: Record<string, string> = {
  가열원: HEAT_SOURCE,
  분사모드: SPRAY_MODES,
  매질: MEDIA_LABEL,
  충전한도: FILL_RATIO_LABEL,
  국산비율: String(DOMESTIC_PARTS_PERCENT),
  철망두께: String(MESH_THICKNESS_MM),
  가열온도: String(COIL_TEMP_C),
  사용장소: USE_VENUE.label,
  환기조건: USE_VENUE.condition,
  배송: SHIPPING.label,
  배송조건: SHIPPING.note,
};

const fill = (value: string) => substitute(value, PRODUCT_TOKENS, WHERE);

/* ------------------------------------------------------------------ *
 * 부품 사양
 * ------------------------------------------------------------------ */

/**
 * 눈으로 확인할 수 있는 부품 사양.
 *
 * 문구는 편집 화면(/admin/ → "제품 정보 → 부품 사양")에서 사장님이 직접 쓴다.
 * 2026-08-10 이전에는 타사 언급·화재·성능 우위·후기 인용을 `verify-build.mjs` 가
 * 막고 있었으나 **사장님 지시로 그 검사를 삭제했다.** 무엇을 쓸지는 사장님이 정한다 —
 * 되살리지 말 것.
 */
export const BUILD_QUALITY = parsed.buildQuality.map((part) => ({
  ...part,
  claim: fill(part.claim),
  detail: fill(part.detail),
  howToCheck: fill(part.howToCheck),
  image: part.image ? resolveImage(part.image, WHERE) : undefined,
  imagePath: part.image,
}));

/* ------------------------------------------------------------------ *
 * 매질
 * ------------------------------------------------------------------ */

export const MEDIA_SPECS = parsed.mediaSpecs.map((medium) => ({
  ...medium,
  detail: fill(medium.detail),
}));

/** 실내 작업에 쓸 수 있는 매질 (없으면 실내 안내를 렌더링하지 않는다) */
export const INDOOR_MEDIA = MEDIA_SPECS.filter((m) => m.indoor);

/* ------------------------------------------------------------------ *
 * 모델
 * ------------------------------------------------------------------ */

export type ProductId = string;

/**
 * 탱크 용량 확인 완료 (2026-08-06).
 *
 * 근거: 공식 상세페이지 사양표("기본형 연료통 최대 1800ml / 대용량 최대 2500ml"),
 *       모델별 비교표("용량 1.8L / 2.5L"), 사용설명서 책자 파일명(BF-100S_102_사용설명서).
 */
export const TANK_SPEC_CONFIRMED = true;

export interface Product {
  id: ProductId;
  /**
   * 공식 옵션명 — 화면·구조화데이터·분석 이벤트에 쓰는 **유일한** 제품 표기다.
   *
   * 공식몰 옵션 드롭다운 표기(기본형 / 대용량 / 대용량+롱노즐)와 글자 단위로 일치시킨다.
   * 내부 도면상의 모델 번호(BF-…)는 화면 어디에도 쓰지 않는다 — 고객이 주문할 때
   * 보는 이름과 사이트가 부르는 이름이 다르면 같은 제품인지 확인이 안 된다.
   */
  officialLabel: string;
  /** 검색결과·구조화데이터에 쓰는 긴 이름 */
  name: string;
  /**
   * 제품 상세 페이지 title.
   * 세 구성이 **서로 다른 말로 시작**해야 한다 — 같으면 셋이 서로 순위를 잠식한다.
   */
  seoTitle: string;
  tagline: string;
  tankLiters: number;
  dimensionsMm: string;
  nozzle: string;
  sprayMode: string;
  shoulderStrap: boolean;
  longNozzle: boolean;
  includes: string[];
  bestFor: string[];
  priceKrw: number | null;
  basedOn?: string;
  buyUrl: string;
  image: import('astro').ImageMetadata;
  imageAlt: string;
  imagePath: string;
}

/** 탱크 용량으로부터 최대 충전량(L)을 계산 — 소수 둘째 자리 반올림 */
export function maxFillLiters(tankLiters: number): number {
  return Math.round(tankLiters * FILL_RATIO * 100) / 100;
}

export const PRODUCTS: Product[] = parsed.models.map((model) => ({
  ...model,
  tagline: fill(model.tagline),
  includes: model.includes.map(fill),
  bestFor: model.bestFor.map(fill),
  image: resolveImage(model.image, WHERE),
  imageAlt: model.imageAlt,
  imagePath: model.image,
  /**
   * 공식몰 구매 URL.
   * 세 모델 모두 같은 상품 페이지의 옵션으로 팔리므로 동일 URL을 가리킨다.
   * 이 주소는 편집 화면에 열지 않았다 — 검증기가 상품번호를 대조해서 막고 있다.
   */
  buyUrl: OFFICIAL_STORE_PRODUCT_URL,
}));

/* ------------------------------------------------------------------ *
 * 조회 헬퍼
 * ------------------------------------------------------------------ */

export function getProduct(id: ProductId): Product {
  const product = PRODUCTS.find((p) => p.id === id);
  if (!product) throw new Error(`알 수 없는 제품 id: ${id}`);
  return product;
}

/**
 * 전 모델 정가가 채워졌는지.
 * 일부만 채워진 상태로 노출하면 "이 모델만 비싸다"처럼 읽히므로 전부 있을 때만 연다.
 */
export const PRICES_CONFIRMED = PRODUCTS.every((p) => p.priceKrw !== null);

/** 가격 표기용 문자열 — "92,000원". 값이 없으면 null */
export function priceLabel(product: Product): string | null {
  if (product.priceKrw === null) return null;
  return `${product.priceKrw.toLocaleString('ko-KR')}원`;
}

/** 비교표 행 정의 — 모델비교 페이지와 제품 페이지 FactTable이 공유 */
export interface SpecRow {
  label: string;
  value: (p: Product) => string;
  /** 전 모델 동일 값이면 true (공통 사양 표에 사용) */
  shared?: boolean;
}

export const SPEC_ROWS: SpecRow[] = [
  { label: '구성', value: (p) => p.officialLabel },
  { label: '탱크 용량', value: (p) => `${p.tankLiters}L` },
  { label: '최대 충전량', value: (p) => `${maxFillLiters(p.tankLiters)}L` },
  { label: '충전 한도', value: () => `탱크 용량의 ${FILL_RATIO_LABEL}`, shared: true },
  { label: '크기(mm)', value: (p) => p.dimensionsMm },
  { label: '노즐', value: (p) => p.nozzle },
  { label: '분사 방식', value: (p) => p.sprayMode },
  { label: '어깨끈', value: (p) => (p.shoulderStrap ? '포함' : '미포함') },
  { label: '주요 사용처', value: (p) => p.bestFor.join(', ') },
  { label: '가열원', value: () => HEAT_SOURCE, shared: true },
  { label: '사용 매질', value: () => MEDIA_LABEL, shared: true },
  { label: '사용 장소', value: () => USE_VENUE.label, shared: true },
  { label: '보조주입구', value: () => '작동 중 사용 금지', shared: true },
  { label: '배송', value: () => SHIPPING.label, shared: true },
];
