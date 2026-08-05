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
    name: '벅스델타',
    category: '살충제',
    description: '연막용 살충 약제.',
    approvalNumber: null,
    published: false,
  },
  {
    id: 'diffuser',
    name: '확산제',
    category: '확산제',
    description: '연막 확산용 글리세린계 매질.',
    approvalNumber: null,
    published: false,
  },
];

/**
 * 공개 가능한 약제만 반환한다.
 * 승인번호가 없으면 published 값과 무관하게 제외한다(이중 안전장치).
 */
export function publishedChemicals(): Chemical[] {
  return CHEMICALS.filter((c) => c.published && c.approvalNumber !== null);
}

/** 공개 가능한 약제가 하나라도 있는지 — 소모품 CTA/섹션 렌더링 조건 */
export const HAS_PUBLISHED_CHEMICALS = publishedChemicals().length > 0;
