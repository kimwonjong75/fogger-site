/**
 * 제품 데이터 단일 소스.
 *
 * 규칙: 사이트의 모든 페이지·컴포넌트는 제품 수치를 이 파일에서만 읽는다.
 * 마크다운 본문을 포함해 어디에서도 용량·비율 등을 하드코딩하지 않는다.
 */
import { OFFICIAL_STORE_PRODUCT_URL } from './site';

/* ------------------------------------------------------------------ *
 * 전 모델 공통 사양
 * ------------------------------------------------------------------ */

/** 제품 형식 (공식 상세페이지 표기) */
export const PRODUCT_TYPE = '미니 연막기' as const;

/** 가열원 */
export const HEAT_SOURCE = '부탄가스' as const;

/**
 * 사용 장소.
 * 공식 상세페이지 사양표에 "사용 장소 : 실외"로 명시되어 있고,
 * 기기 본체 라벨에도 "USE IN WELL VENTILATED SPACES"가 인쇄되어 있다.
 * 이 값이 '실외'인 동안에는 실내·밀폐공간 작업을 다루는 문서를 공개하지 않는다.
 */
export const USE_LOCATION = '실외' as const;

/** 효능 (공식 상세페이지 표기) */
export const EFFICACY = '각종 보행·비행해충의 구제' as const;

/** 보관 방법 (공식 상세페이지 표기) */
export const STORAGE = '서늘한 곳 보관' as const;

/**
 * 제품 설계 특징 (공식 상세페이지 표기).
 * 마케팅 수식어가 아니라 표기된 문구 그대로 옮긴다.
 */
export const DESIGN_FEATURES = [
  { title: '전도 방지', detail: '저중심 설계' },
  { title: '통증 방지', detail: '소프트 트리거' },
  { title: '코일 막힘 최소화', detail: '구조 개선' },
  { title: '보조주입구', detail: '장착' },
] as const;

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

/**
 * 배송 정책.
 * `label`만 단독으로 쓰지 말고 조건이 들어갈 자리에는 반드시 `note`를 함께 노출한다.
 */
export const SHIPPING = {
  free: true,
  label: '무료배송',
  note: '주문 옵션과 도서·산간 지역에 따라 배송비가 차등 부과될 수 있으며, 반품 시 왕복 배송비 10,000원이 청구됩니다.',
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
    id: 'venue',
    level: 'critical',
    title: '사용 가능한 장소는 약제 표시사항을 따른다',
    body: '어디에서 쓸 수 있는지는 기기가 아니라 함께 쓰는 약제가 정합니다. 약제 라벨의 허용 장소와 사용 조건을 먼저 확인하고, 확인되지 않은 공간에서는 사용하지 마세요.',
  },
  {
    id: 'ventilation',
    level: 'warning',
    title: '분사 후 즉시 퇴장하고 환기 후 재진입',
    body: '연막 분사 중에는 시야가 급격히 나빠집니다. 공기 흐름이 막힌 공간일수록 분사 후 바로 벗어나고, 충분히 환기해 시야가 회복된 뒤에 다시 들어가세요.',
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

/**
 * ⚠️ 탱크 용량 확인 필요 — 배포 차단 사항
 *
 * 사이트가 쓰는 값(아래 tankLiters)과 공식 상세페이지 표기가 서로 다르다.
 *
 *   구분      | 이 파일 | 공식 상세페이지
 *   기본형    | 1.7L    | 1.8L (연료통 최대 1800ml)
 *   대용량    | 2.8L    | 2.5L (연료통 최대 2500ml)
 *
 * 충전 한도는 넘침·역류에 직결되는 안전 수치이므로 임의로 고르지 않는다.
 * 확인 후 값을 확정하고 이 플래그를 true로 바꾸면 배포 차단이 풀린다.
 * (verify-build.mjs가 이 플래그를 검사한다)
 *
 * 확인해야 할 것
 *   1. 1800ml / 2500ml 이 탱크 총용량인가, 이미 90%를 적용한 최대 충전량인가
 *   2. BF-100S / BF-102 라는 모델명과 기본형 / 대용량 표기의 대응 관계
 */
export const TANK_SPEC_CONFIRMED = false;

export interface Product {
  id: ProductId;
  /** 모델명 (BF-100S 등) */
  model: string;
  /** 공식 상세페이지의 옵션 표기 (기본형 / 대용량 / 대용량+롱노즐) */
  officialLabel: string;
  /** 화면 표기용 전체 이름 */
  name: string;
  /** 모델 간 차이를 사양으로만 설명한 한 줄 요약 (사용 장소를 권하지 않는다) */
  tagline: string;
  /** 탱크 총 용량(L) — TANK_SPEC_CONFIRMED 참조 */
  tankLiters: number;
  /** 외형 치수 (가로×세로×높이, mm) — 공식 상세페이지 표기 */
  dimensionsMm: string;
  /** 노즐 구성 — 공식 상세페이지 표기 */
  nozzle: string;
  /** 분사 방식 — 공식 상세페이지 표기 */
  sprayMode: string;
  /** 어깨끈 포함 여부 */
  shoulderStrap: boolean;
  /** 롱노즐 포함 여부 */
  longNozzle: boolean;
  /** 구성품 — 공식 상세페이지 "구성품" 표기 그대로 */
  includes: string[];
  /**
   * 공식 상세페이지의 "주요 사용처" 표기.
   * 임의로 늘리지 않는다. 전 모델 공통으로 USE_LOCATION(실외)이 함께 노출되어야 한다.
   */
  bestFor: string[];
  /** 번들 구성이면 기준 모델 id */
  basedOn?: ProductId;
  /**
   * 공식몰 구매 URL.
   * 현재 세 모델 모두 같은 상품 페이지의 옵션으로 판매되므로 동일 URL을 가리킨다.
   */
  buyUrl: string;
}

/** 탱크 용량으로부터 최대 충전량(L)을 계산 — 소수 둘째 자리 반올림 */
export function maxFillLiters(tankLiters: number): number {
  return Math.round(tankLiters * FILL_RATIO * 100) / 100;
}

/**
 * 모델 데이터.
 * tagline을 제외한 모든 값은 공식 상세페이지 표기를 그대로 옮긴 것이다.
 * 확인되지 않은 값은 추가하지 않는다.
 */
export const PRODUCTS: Product[] = [
  {
    id: 'bf-100s',
    model: 'BF-100S',
    officialLabel: '기본형',
    name: '블루가드 연막소독기 BF-100S 기본형',
    tagline: '탱크가 가장 작은 기본형. 세척용 받침대가 함께 들어 있습니다.',
    tankLiters: 1.7,
    dimensionsMm: '465×265×180',
    nozzle: '기본 노즐',
    sprayMode: '일반 분사',
    shoulderStrap: false,
    longNozzle: false,
    includes: ['본체', '세척용 받침대'],
    bestFor: ['마당, 주택 등 일반적인 공간'],
    buyUrl: OFFICIAL_STORE_PRODUCT_URL,
  },
  {
    id: 'bf-102',
    model: 'BF-102',
    officialLabel: '대용량',
    name: '블루가드 연막소독기 BF-102 대용량',
    tagline: '탱크가 크고 전용 어깨스트랩이 들어 있어 오래 들고 작업합니다.',
    tankLiters: 2.8,
    dimensionsMm: '465×360×170',
    nozzle: '기본 노즐',
    sprayMode: '일반 분사',
    shoulderStrap: true,
    longNozzle: false,
    includes: ['본체', '전용 어깨스트랩'],
    bestFor: ['정원, 야외 등 넓은 공간'],
    buyUrl: OFFICIAL_STORE_PRODUCT_URL,
  },
  {
    id: 'bf-102-long-nozzle',
    model: 'BF-102 + 롱노즐',
    officialLabel: '대용량+롱노즐',
    name: '블루가드 연막소독기 BF-102 롱노즐 구성',
    tagline: '대용량 본체에 50cm 롱노즐을 더해 아래에서 위로 침투 분사합니다.',
    tankLiters: 2.8,
    dimensionsMm: '465×360×170',
    nozzle: '기본 노즐 + 롱노즐 50cm',
    sprayMode: '하부침투분사 (아래에서 위로 확산)',
    shoulderStrap: true,
    longNozzle: true,
    includes: ['본체', '전용 어깨스트랩', '50cm 롱노즐', '스패너 2개', '코팅장갑', '설명서'],
    bestFor: ['하수구, 풀숲 등 깊거나 손이 닿지 않는 곳'],
    basedOn: 'bf-102',
    buyUrl: OFFICIAL_STORE_PRODUCT_URL,
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

/**
 * 기본 추천 모델은 두지 않는다.
 * 공식몰이 단일 상품 + 옵션 선택 구조이고, 어떤 모델을 권할 근거도 확정되지 않았다.
 * 모델이 특정되지 않은 CTA는 모델명 없이 옵션 선택 페이지로 보낸다.
 */

/** 비교표 행 정의 — 모델비교 페이지와 제품 페이지 FactTable이 공유 */
export interface SpecRow {
  label: string;
  value: (p: Product) => string;
  /** 전 모델 동일 값이면 true (공통 사양 표에 사용) */
  shared?: boolean;
}

export const SPEC_ROWS: SpecRow[] = [
  { label: '공식 옵션명', value: (p) => p.officialLabel },
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
  { label: '사용 장소', value: () => USE_LOCATION, shared: true },
  { label: '보조주입구', value: () => '작동 중 사용 금지', shared: true },
  { label: '배송', value: () => SHIPPING.label, shared: true },
];
