/**
 * 소모품(약제) 데이터.
 *
 * ⚠️ 현재 전 품목이 `published: false`, `approvalNumber: null` 상태다.
 *    승인/신고 번호가 확정되기 전에는 어떤 페이지·사이트맵·RSS·내부링크에도
 *    노출하지 않는다. 노출 로직은 반드시 `publishedChemicals()` 를 거칠 것.
 */

export type ChemicalId = 'bugs-delta' | 'diffuser';

export interface Chemical {
  id: ChemicalId;
  /** 표기명 */
  name: string;
  /** 분류 */
  category: '살충제' | '확산제';
  /** 내부 메모용 한 줄 설명 (미공개 상태에서는 화면에 쓰지 않는다) */
  description: string;
  /**
   * 안전확인/신고·승인 번호.
   * null = 미확보. null인 동안에는 published가 true가 될 수 없다.
   */
  approvalNumber: string | null;
  /** 공개 여부 — false면 라우트·사이트맵·RSS·내부링크에서 모두 제외 */
  published: boolean;
}

export const CHEMICALS: Chemical[] = [
  {
    id: 'bugs-delta',
    name: '벅스델타 유제',
    category: '살충제',
    description: '연막용 살충 약제 (BUGS DELTA EMULSION, 1L). 라벨 표기: 잔류성 감염병 예방용 살충제.',
    approvalNumber: null,
    published: false,
  },
  {
    id: 'diffuser',
    name: '그린미스트에스',
    category: '확산제',
    description: '전문방역용 글리세린계 분사제 (1L).',
    approvalNumber: null,
    published: false,
  },
];

/* ------------------------------------------------------------------ *
 * 권장 희석비율
 * ------------------------------------------------------------------ */

/**
 * 공식 상세페이지 "권장 희석비율" 표를 그대로 옮긴 값.
 * 자사 연막기 · 확산제 · 벅스델타 기준.
 *
 * ⚠️ 살충제(벅스델타)가 아직 published:false 이므로 화면에는 노출하지 않는다.
 *    `DILUTION_PUBLISHED`가 false인 동안 이 데이터를 렌더링하는 컴포넌트를 만들지 말 것.
 *    승인번호가 확보되면 chemicals의 published와 함께 열면 된다.
 */
export interface DilutionSpec {
  /** 공식 표기 옵션명 */
  officialLabel: string;
  /** 경유 또는 확산제 투입량 (mL) */
  carrierMl: number;
  /** 살충제 투입량 (mL) */
  pesticideMl: number;
}

export const DILUTION: DilutionSpec[] = [
  { officialLabel: '기본형', carrierMl: 1000, pesticideMl: 20 },
  { officialLabel: '대용량', carrierMl: 2000, pesticideMl: 40 },
];

/** 희석비 (매질 : 살충제) — 두 구성 모두 50:1 */
export const DILUTION_RATIO = '50 : 1';

/** 공식 표기 주의사항 */
export const DILUTION_CAUTIONS = [
  '흘러넘침 방지를 위해 연료통에 최대 90% 이하로만 채워주세요.',
  '살충제를 과도하게 주입 시 코일막힘의 원인이 될 수 있습니다.',
] as const;


/**
 * 공개 가능한 약제만 반환한다.
 * 승인번호가 없으면 published 값과 무관하게 제외한다(이중 안전장치).
 */
export function publishedChemicals(): Chemical[] {
  return CHEMICALS.filter((c) => c.published && c.approvalNumber !== null);
}

/** 공개 가능한 약제가 하나라도 있는지 — 소모품 CTA/섹션 렌더링 조건 */
export const HAS_PUBLISHED_CHEMICALS = publishedChemicals().length > 0;

/**
 * 희석표 공개 여부.
 * 살충제가 비공개인 동안에는 희석 안내도 공개하지 않는다
 * (미승인 약제의 사용법을 안내하는 셈이 되므로).
 */
export const DILUTION_PUBLISHED = HAS_PUBLISHED_CHEMICALS;
