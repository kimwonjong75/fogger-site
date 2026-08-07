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
 * 분사 모드.
 * 공식 상세페이지 표기: "연막·연무 한 대로 겸용".
 * 한 기기로 두 모드를 내며, 무엇을 넣느냐로 모드가 갈린다.
 */
export const SPRAY_MODES = '연막·연무 겸용' as const;

/**
 * 사용 장소는 하나의 값이 아니라 세 축이 겹쳐서 정해진다.
 *
 *   1) 실내에서 쓸 수 있는가 → **매질**이 정한다
 *        경유   : 연막 모드. 기름 성분과 연소 잔류물이 남으므로 실외 전용
 *        확산제 : 연무 모드. 글리세린계 수용성 매질이므로 실내에서도 사용
 *
 *   2) 어떤 환기 상태여야 하는가 → **가열원**이 정한다
 *        매질을 무엇으로 바꾸든 부탄가스를 연소시키는 기기다.
 *        본체 라벨의 "USE IN WELL VENTILATED SPACES"는 매질이 아니라 이 연소에 대한 조건이다.
 *        따라서 확산제를 써도 밀폐공간에서는 사용하지 않는다.
 *
 *   3) 무엇을 뿌려도 되는가 → **약제 표시사항**이 정한다
 *        위 두 축을 통과해도 최종 허용 장소·대상은 살충제 라벨이 정한다.
 *
 * 화면 문구는 이 세 축 중 하나라도 빠뜨리지 않는다.
 * "실내 사용 가능"만 단독으로 쓰면 2번과 3번이 사라져 위험한 문장이 된다.
 *
 * ⚠️ 이 파일에 한때 `USE_LOCATION = '실외'` 상수가 "공식 상세페이지 사양표 표기"라는
 *    근거와 함께 있었으나, 2026-08-07 상세페이지를 직접 확인한 결과 본문 텍스트에는
 *    '실외'도 '실내'도 없었다(사양표가 이미지 안에 있음). 근거가 확인되지 않은 주석이었다.
 *    사양 값을 적을 때는 반드시 원문을 직접 확인하고 무엇을 봤는지 함께 남긴다.
 */
export const USE_VENUE = {
  /** 사양표 한 줄 표기 */
  label: '실내·실외 (매질에 따라 구분)',
  /** 매질과 무관하게 항상 함께 붙는 조건 */
  condition: '가열원이 부탄가스 연소이므로 공기가 통하는 상태에서만 사용합니다.',
} as const;

/**
 * 공식 상세페이지 상단 표기 — "1,500ml로 약 30분 · 300평 작업".
 *
 * 탱크 용량이 아니라 **작업 기준량**이다. 이 값을 사양(탱크 용량)으로 오독한 사례가 있어
 * (생성형 검색 답변이 "용량 1.5L"로 표시) 화면에서는 조건을 반드시 함께 노출한다.
 */
export const WORK_REFERENCE = {
  chargeMl: 1500,
  minutes: 30,
  pyeong: 300,
  note: '충전량 1,500mL 기준의 대략적인 값이며 매질·분사량·현장 조건에 따라 달라집니다.',
} as const;

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

/* ------------------------------------------------------------------ *
 * 부품 사양 — 2026-08-07 사장님 확인
 * ------------------------------------------------------------------ */

/**
 * 부품 국산 비율.
 *
 * "국내 조립"과 "부품 100% 국산"은 전혀 다른 주장이다. 저가 부품을 들여와 국내에서
 * 조립만 하고 '국내산'으로 파는 사례가 있어, 이 값이 100 미만으로 바뀌면 화면 문구도
 * 함께 낮춰야 한다. 근거: 2026-08-07 사장님 확인.
 */
export const DOMESTIC_PARTS_PERCENT = 100;

/** 철망 두께(mm) — 2026-08-07 사장님 확인 */
export const MESH_THICKNESS_MM = 2;

/**
 * 가열부 도달 온도(℃).
 * 이 온도가 철망 두께와 노즐 재질이 중요한 이유다. 근거: 2026-08-07 사장님 확인.
 */
export const COIL_TEMP_C = 400;

/**
 * 눈으로 확인할 수 있는 부품 사양.
 *
 * 고객이 올린 비교 글(부위 4곳)이 계기가 됐지만 **그 글은 근거가 아니다.**
 * 아래 값은 전부 사장님이 실물로 확인해 답한 내용이며(2026-08-07), 확인되지 않은 항목은
 * 넣지 않는다.
 *
 * ⚠️ 문구 규칙 — 어기면 광고 리스크가 코드에서 화면으로 그대로 흘러간다.
 *   1) `claim`·`detail`은 **자사 사양만** 말한다. 타사·중국산·화재·사고를 언급하지 않는다.
 *   2) `howToCheck`는 우리 제품이 아니어도 쓸 수 있는 **일반적인 육안 확인법**으로 쓴다.
 *      "우리 것이 낫다"가 아니라 "이렇게 확인하세요"라서 비교 주장이 되지 않는다.
 *   3) 성능 우위("연막이 몇 배 풍성하다" 등)는 시험 자료 없이 쓰지 않는다.
 *
 * (2026-08-07 사장님 지시: 타사 화재사례 사용 금지, 고객 글·영상 인용 금지)
 */
export const BUILD_QUALITY = [
  {
    id: 'tank',
    part: '연료통',
    claim: '속이 비치는 신재 원료',
    detail: '남은 양이 밖에서 그대로 보입니다.',
    howToCheck: '통 너머가 비치는지 보세요. 뿌옇게 탁하면 재생 원료가 섞인 것일 수 있습니다.',
  },
  {
    id: 'mesh',
    part: '철망',
    claim: `${MESH_THICKNESS_MM}mm 두께`,
    detail: `가열부는 ${COIL_TEMP_C}℃가 넘는 자리라 눌러도 주저앉지 않는 두께를 씁니다.`,
    howToCheck: '엄지로 눌러 보세요. 쑥 들어가면 얇은 것입니다.',
  },
  {
    id: 'nozzle',
    part: '노즐',
    claim: '황동 조립 부품',
    detail: '열전도가 빠른 금속이라 가열식 분사구에 씁니다.',
    howToCheck: '노란빛 금속 부품이 조립돼 있으면 황동, 은색 파이프 하나뿐이면 아닙니다.',
  },
  {
    id: 'piston',
    part: '피스톤',
    claim: '스테인리스 + 쇠구슬',
    detail: '연료를 끌어올리는 부위를 플라스틱으로 만들지 않았습니다.',
    howToCheck: '분해해야 보이는 자리입니다. 그래서 저희가 열어서 찍어 두었습니다.',
  },
  {
    id: 'gas-joint',
    part: '가스 연결부',
    claim: '금속 체결',
    detail: '가스통이 걸리는 자리를 금속으로 만들었습니다.',
    howToCheck: '가스통을 끼우는 부분이 금속인지 플라스틱인지 만져 보세요.',
  },
] as const;

/**
 * 사용 가능 매질.
 *
 * `indoor`는 그 매질을 썼을 때 실내 사용이 가능한지만 뜻한다.
 * indoor: true 여도 USE_VENUE.condition(환기)은 그대로 적용된다 — 둘은 별개 축이다.
 */
export const MEDIA_SPECS = [
  {
    id: 'diesel',
    name: '경유',
    mode: '연막',
    indoor: false,
    venueLabel: '실외 전용',
    detail:
      '기름계 매질이라 흰 연막이 짙게 형성됩니다. 연소 잔류물과 기름 성분이 남으므로 실외에서만 사용하세요.',
  },
  {
    id: 'diffuser',
    name: '글리세린 50% 이상 확산제',
    mode: '연무',
    indoor: true,
    venueLabel: '실내·실외',
    detail:
      '수용성 매질이라 잔류물이 적고 냄새가 덜합니다. 실내에서도 사용하되, 가열원은 그대로 부탄가스 연소이므로 환기 조건은 실외와 동일하게 지킵니다.',
  },
] as const;

/** 매질명만 필요한 자리 */
export const MEDIA = MEDIA_SPECS.map((m) => m.name);

/** 매질 표기용 문자열 — "경유 또는 글리세린 50% 이상 확산제" */
export const MEDIA_LABEL = MEDIA.join(' 또는 ');

/** 실내 작업에 쓸 수 있는 매질 (없으면 실내 안내를 렌더링하지 않는다) */
export const INDOOR_MEDIA = MEDIA_SPECS.filter((m) => m.indoor);

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
    title: '실내 작업은 확산제로만 — 경유는 실외 전용',
    body: '경유는 기름 성분과 연소 잔류물이 남으므로 실외에서만 사용합니다. 실내에서 작업할 때는 글리세린 50% 이상 확산제로 바꿔서 쓰세요. 매질은 그대로 두고 장소만 바꾸지 않습니다.',
  },
  {
    id: 'combustion',
    level: 'critical',
    title: '밀폐공간 금지 — 확산제를 써도 가열원은 연소다',
    body: '매질을 확산제로 바꿔도 가열원은 그대로 부탄가스 연소입니다. 창문·출입구·환기설비로 공기가 통하는 상태에서만 작동시키고, 창이 없는 방이나 환기가 막힌 지하공간에서는 사용하지 마세요.',
  },
  {
    id: 'chemical-label',
    level: 'critical',
    title: '무엇을 뿌릴 수 있는지는 약제 표시사항이 정한다',
    body: '기기와 매질 조건을 통과해도, 실제 허용 장소와 대상 해충은 함께 쓰는 살충제의 표시사항이 정합니다. 약제 라벨의 사용 범위를 먼저 확인하세요.',
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
 * 탱크 용량 확인 완료 (2026-08-06).
 *
 *   BF-100S 기본형  탱크 1.8L  → 90% 미만 권장이므로 최대 1.62L
 *   BF-102  대용량  탱크 2.5L  → 90% 미만 권장이므로 최대 2.25L
 *
 * 근거: 공식 상세페이지 사양표("기본형 연료통 최대 1800ml / 대용량 최대 2500ml"),
 *       모델별 비교표("용량 1.8L / 2.5L"), 사용설명서 책자 파일명(BF-100S_102_사용설명서).
 * 값을 바꿀 때는 근거 문서를 함께 갱신한다.
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
   * 이 규칙 때문에 `model` 필드는 의도적으로 두지 않았다.
   */
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
   * 주요 사용처.
   *
   * 공식 상세페이지의 "주요 사용처" 표기를 기준으로 하되, 실내·실외를 단정하는 표현은 쓰지 않는다.
   * 장소를 쓰는 자리에는 USE_VENUE.condition(환기)과 매질 조건이 항상 함께 노출되어야 한다.
   */
  bestFor: string[];
  /**
   * 공식몰 정가(원).
   *
   * null이면 화면·구조화데이터 어디에도 가격을 표시하지 않는다.
   * 검색 AI가 잘못된 가격을 인용하는 것을 막으려면 여기를 채워야 한다.
   * 값을 넣을 때는 공식몰 상품 페이지의 옵션별 판매가와 글자 단위로 일치시킬 것.
   */
  priceKrw: number | null;
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
    officialLabel: '기본형',
    name: '블루가드 연막소독기 기본형',
    tagline: '탱크가 가장 작은 기본형. 세척용 받침대가 함께 들어 있습니다.',
    tankLiters: 1.8,
    dimensionsMm: '465×265×180',
    nozzle: '기본 노즐',
    sprayMode: '일반 분사',
    shoulderStrap: false,
    longNozzle: false,
    includes: ['본체', '세척용 받침대'],
    bestFor: ['가정용 — 마당·베란다 등 좁은 공간'],
    priceKrw: 92000,
    buyUrl: OFFICIAL_STORE_PRODUCT_URL,
  },
  {
    id: 'bf-102',
    officialLabel: '대용량',
    name: '블루가드 연막소독기 대용량',
    tagline: '탱크가 크고 전용 어깨스트랩이 들어 있어 오래 들고 작업합니다.',
    tankLiters: 2.5,
    dimensionsMm: '465×360×170',
    nozzle: '기본 노즐',
    sprayMode: '일반 분사',
    shoulderStrap: true,
    longNozzle: false,
    includes: ['본체', '전용 어깨스트랩'],
    bestFor: ['정원·창고·축사 등 넓은 공간'],
    priceKrw: 103000,
    buyUrl: OFFICIAL_STORE_PRODUCT_URL,
  },
  {
    id: 'bf-102-long-nozzle',
    officialLabel: '대용량+롱노즐',
    name: '블루가드 연막소독기 대용량+롱노즐',
    tagline: '대용량 본체에 50cm 롱노즐을 더해 아래에서 위로 침투 분사합니다.',
    tankLiters: 2.5,
    dimensionsMm: '465×360×170',
    nozzle: '기본 노즐 + 롱노즐 50cm',
    sprayMode: '하부침투분사 (아래에서 위로 확산)',
    shoulderStrap: true,
    longNozzle: true,
    includes: ['본체', '전용 어깨스트랩', '50cm 롱노즐', '스패너 2개', '코팅장갑', '설명서'],
    bestFor: ['하수구·풀숲 등 깊거나 손이 닿지 않는 곳'],
    priceKrw: 113000,
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
 * 전 모델 정가가 채워졌는지.
 * 일부만 채워진 상태로 노출하면 "이 모델만 비싸다"처럼 읽히므로 전부 있을 때만 연다.
 */
export const PRICES_CONFIRMED = PRODUCTS.every((p) => p.priceKrw !== null);

/** 가격 표기용 문자열 — "92,000원". 값이 없으면 null */
export function priceLabel(product: Product): string | null {
  if (product.priceKrw === null) return null;
  return `${product.priceKrw.toLocaleString('ko-KR')}원`;
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
