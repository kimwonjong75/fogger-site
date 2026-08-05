/**
 * 제품 데이터 단일 소스.
 *
 * 규칙: 사이트의 모든 페이지·컴포넌트는 제품 수치를 이 파일에서만 읽는다.
 * 마크다운 본문을 포함해 어디에서도 용량·비율 등을 하드코딩하지 않는다.
 */
import { EXTERNAL } from './site';

/* ------------------------------------------------------------------ *
 * 전 모델 공통 사양
 * ------------------------------------------------------------------ */

/** 가열원 */
export const HEAT_SOURCE = '부탄가스' as const;

/** 사용 가능 매질 */
export const MEDIA = [
  '경유',
  '글리세린 50% 이상 확산제',
] as const;

/** 매질 표기용 문자열 — "경유 또는 글리세린 50% 이상 확산제" */
export const MEDIA_LABEL = MEDIA.join(' 또는 ');

/** 탱크 충전 한도 (탱크 용량 대비 비율) */
export const FILL_RATIO = 0.9;

/** 충전 한도 표기용 문자열 — "90%" */
export const FILL_RATIO_LABEL = `${Math.round(FILL_RATIO * 100)}%`;

/** 배송 정책 */
export const SHIPPING = {
  free: true,
  label: '무료배송',
} as const;

/**
 * 전 모델 공통 안전 규칙.
 * SafetyBox / 안전수칙 페이지 / 제품 페이지가 모두 이 배열을 참조한다.
 */
export const SAFETY_RULES = [
  {
    id: 'fill-limit',
    level: 'critical',
    title: `약제는 탱크 용량의 ${FILL_RATIO_LABEL}까지만 충전`,
    body: `가열 시 매질이 팽창하므로 탱크 용량의 ${FILL_RATIO_LABEL}를 넘겨 채우면 넘침·역류 위험이 있습니다. 모델별 최대 충전량을 넘기지 마세요.`,
  },
  {
    id: 'aux-inlet',
    level: 'critical',
    title: '보조주입구는 작동 중 사용 금지',
    body: '보조주입구는 기기가 완전히 꺼지고 식은 뒤에만 사용합니다. 작동 중이거나 가열된 상태에서 열면 고온 매질이 분출될 수 있습니다.',
  },
  {
    id: 'media',
    level: 'warning',
    title: `지정 매질만 사용 (${MEDIA_LABEL})`,
    body: `가솔린·알코올·시너 등 인화점이 낮은 용제는 절대 사용하지 않습니다. 확산제를 쓸 경우 글리세린 함량 50% 이상 제품을 사용하세요.`,
  },
  {
    id: 'ventilation',
    level: 'warning',
    title: '실내 사용 시 환기 확보 후 퇴장',
    body: '연막 분사 중에는 시야가 급격히 나빠집니다. 밀폐 공간에서는 분사 후 즉시 퇴장하고, 재입실 전 충분히 환기하세요.',
  },
  {
    id: 'heat',
    level: 'warning',
    title: '노즐·배럴 고온 주의',
    body: `가열원은 ${HEAT_SOURCE}입니다. 작동 직후 노즐과 배럴은 매우 뜨거우므로 맨손 접촉과 가연물 근처 보관을 피하세요.`,
  },
] as const;

/* ------------------------------------------------------------------ *
 * 모델
 * ------------------------------------------------------------------ */

export type ProductId = 'bf-100s' | 'bf-102' | 'bf-102-long-nozzle';

export interface Product {
  id: ProductId;
  /** 모델명 (BF-100S 등) */
  model: string;
  /** 화면 표기용 전체 이름 */
  name: string;
  /** 한 줄 요약 */
  tagline: string;
  /** 탱크 총 용량(L) */
  tankLiters: number;
  /** 어깨끈 포함 여부 */
  shoulderStrap: boolean;
  /** 롱노즐 포함 여부 */
  longNozzle: boolean;
  /** 구성품 */
  includes: string[];
  /** 이 모델을 고르면 좋은 상황 */
  bestFor: string[];
  /** 번들 구성이면 기준 모델 id */
  basedOn?: ProductId;
  /**
   * 공식몰 구매 URL.
   * ⚠️ 현재는 공식 스마트스토어 메인으로 연결된다.
   *    모델별 상품 상세 URL이 확정되면 이 값만 교체하면 사이트 전체에 반영된다.
   */
  buyUrl: string;
}

/** 탱크 용량으로부터 최대 충전량(L)을 계산 — 소수 둘째 자리 반올림 */
export function maxFillLiters(tankLiters: number): number {
  return Math.round(tankLiters * FILL_RATIO * 100) / 100;
}

export const PRODUCTS: Product[] = [
  {
    id: 'bf-100s',
    model: 'BF-100S',
    name: '블루가드 연막소독기 BF-100S',
    tagline: '가정·소규모 매장용 기본형. 가볍고 다루기 쉬운 1.7L 탱크.',
    tankLiters: 1.7,
    shoulderStrap: false,
    longNozzle: false,
    includes: ['본체', '기본 노즐', '주입 깔때기', '사용설명서'],
    bestFor: ['가정 실내·베란다', '소규모 매장', '창고 한 칸 규모', '처음 연막소독기를 쓰는 경우'],
    buyUrl: EXTERNAL.smartstore,
  },
  {
    id: 'bf-102',
    model: 'BF-102',
    name: '블루가드 연막소독기 BF-102',
    tagline: '넓은 면적을 한 번에. 2.8L 탱크에 어깨끈을 더한 현장형.',
    tankLiters: 2.8,
    shoulderStrap: true,
    longNozzle: false,
    includes: ['본체', '기본 노즐', '어깨끈', '주입 깔때기', '사용설명서'],
    bestFor: ['축사·비닐하우스', '지하주차장·공용부', '중대형 창고', '장시간 연속 작업'],
    buyUrl: EXTERNAL.smartstore,
  },
  {
    id: 'bf-102-long-nozzle',
    model: 'BF-102 + 롱노즐',
    name: '블루가드 연막소독기 BF-102 롱노즐 구성',
    tagline: '손이 닿지 않는 천장·배관 뒤까지. BF-102에 롱노즐을 더한 구성.',
    tankLiters: 2.8,
    shoulderStrap: true,
    longNozzle: true,
    includes: ['본체', '기본 노즐', '롱노즐', '어깨끈', '주입 깔때기', '사용설명서'],
    bestFor: ['천장 배관·덕트 주변', '맨홀·정화조 등 깊은 공간', '적재물 사이 좁은 통로', '작업자와 분사구 거리를 두어야 하는 현장'],
    basedOn: 'bf-102',
    buyUrl: EXTERNAL.smartstore,
  },
];

/* ------------------------------------------------------------------ *
 * 조회 헬퍼
 * ------------------------------------------------------------------ */

export function getProduct(id: ProductId): Product {
  const product = PRODUCTS.find((p) => p.id === id);
  if (!product) throw new Error(`알 수 없는 제품 id: ${id}`);
  return product;
}

/** 기본 추천 모델 — 헤더 "구매하기" 등 모델이 특정되지 않은 CTA에 사용 */
export const DEFAULT_PRODUCT_ID: ProductId = 'bf-102';

/** 비교표 행 정의 — 모델비교 페이지와 제품 페이지 FactTable이 공유 */
export interface SpecRow {
  label: string;
  value: (p: Product) => string;
  /** 전 모델 동일 값이면 true (공통 사양 표에 사용) */
  shared?: boolean;
}

export const SPEC_ROWS: SpecRow[] = [
  { label: '탱크 용량', value: (p) => `${p.tankLiters}L` },
  { label: '최대 충전량', value: (p) => `${maxFillLiters(p.tankLiters)}L` },
  { label: '충전 한도', value: () => `탱크 용량의 ${FILL_RATIO_LABEL}`, shared: true },
  { label: '가열원', value: () => HEAT_SOURCE, shared: true },
  { label: '사용 매질', value: () => MEDIA_LABEL, shared: true },
  { label: '어깨끈', value: (p) => (p.shoulderStrap ? '포함' : '미포함') },
  { label: '롱노즐', value: (p) => (p.longNozzle ? '포함' : '미포함') },
  { label: '보조주입구', value: () => '작동 중 사용 금지', shared: true },
  { label: '배송', value: () => SHIPPING.label, shared: true },
];
