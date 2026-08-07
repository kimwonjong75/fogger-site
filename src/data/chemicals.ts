/**
 * 소모품(약제) 데이터.
 *
 * 공개 규칙
 *  - 살충제처럼 신고·승인 대상 품목은 `approvalNumber`가 있어야만 공개한다.
 *  - 확산제처럼 승인 대상이 아닌 품목은 `approvalRequired: false`로 두고 번호 없이 공개한다.
 *  - 노출 로직은 반드시 `publishedChemicals()` 를 거칠 것. 두 조건을 한곳에서만 판단한다.
 */

export type ChemicalId = 'bugs-delta' | 'diffuser';

export interface Chemical {
  id: ChemicalId;
  /** 표기명 */
  name: string;
  /** 분류 */
  category: '살충제' | '확산제';
  /** 한 줄 설명 */
  description: string;
  /** 신고·승인 대상 품목인지. false면 번호 없이도 공개할 수 있다. */
  approvalRequired: boolean;
  /**
   * 안전확인/신고·승인 번호.
   * approvalRequired가 true인데 null이면 공개되지 않는다.
   */
  approvalNumber: string | null;
  /** 실내 작업에 쓸 수 있는 매질인지 (확산제만 해당) */
  indoorCapable: boolean;
  /** 공개 여부 — false면 라우트·사이트맵·RSS·내부링크에서 모두 제외 */
  published: boolean;
}

export const CHEMICALS: Chemical[] = [
  {
    id: 'bugs-delta',
    name: '벅스델타 유제',
    category: '살충제',
    description:
      '연막·연무용 살충 약제 (BUGS DELTA EMULSION, 1L). 매질에 섞어 쓰는 살충 성분으로, 단독으로 기기에 넣지 않습니다.',
    approvalRequired: true,
    approvalNumber: '2419-0109',
    indoorCapable: false,
    published: true,
  },
  {
    id: 'diffuser',
    name: '그린미스트에스',
    category: '확산제',
    description:
      '전문방역용 글리세린계 분사제 (1L). 경유 대신 쓰는 수용성 매질이라 실내 작업에 사용합니다.',
    approvalRequired: false,
    approvalNumber: null,
    indoorCapable: true,
    published: true,
  },
];

/* ------------------------------------------------------------------ *
 * 권장 희석비율
 * ------------------------------------------------------------------ */

/**
 * 공식 상세페이지 "권장 희석비율" 표를 그대로 옮긴 값.
 * 자사 연막기 · 확산제 · 벅스델타 기준.
 *
 * 살충제가 공개 상태여야만 희석 안내도 공개한다(`DILUTION_PUBLISHED`).
 * 미승인 약제의 사용법을 안내하는 셈이 되는 것을 막기 위한 조건이다.
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
 * 승인 대상 품목인데 번호가 없으면 published 값과 무관하게 제외한다(이중 안전장치).
 */
export function publishedChemicals(): Chemical[] {
  return CHEMICALS.filter(
    (c) => c.published && (!c.approvalRequired || c.approvalNumber !== null),
  );
}

/** 공개 가능한 약제가 하나라도 있는지 — 소모품 CTA/섹션 렌더링 조건 */
export const HAS_PUBLISHED_CHEMICALS = publishedChemicals().length > 0;

/**
 * 희석표 공개 여부.
 * 살충제가 비공개인 동안에는 희석 안내도 공개하지 않는다
 * (미승인 약제의 사용법을 안내하는 셈이 되므로).
 */
export const DILUTION_PUBLISHED = HAS_PUBLISHED_CHEMICALS;
