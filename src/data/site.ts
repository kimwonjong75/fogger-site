/**
 * 사이트 전역 상수 (단일 소스).
 * 페이지/컴포넌트는 이 파일만 참조하고 값을 하드코딩하지 않는다.
 */

/* ------------------------------------------------------------------ *
 * 사업자 정보 — 푸터·개인정보처리방침·이용약관과 Organization 스키마에 노출된다.
 *   법적 표기 의무 항목이므로 등록 정보가 바뀌면 여기만 고치면 된다.
 * ------------------------------------------------------------------ */
export const BUSINESS = {
  /** 상호 */
  name: '(주)제네시스코리아',
  /** 대표자 */
  ceo: '김원종',
  /** 사업자등록번호 (예: 000-00-00000) */
  businessNumber: '536-88-00185',
  /** 통신판매업신고번호 (예: 제0000-지역0000호) */
  mailOrderNumber: '제2015-광주광산-0395호',
  /**
   * 사업장 주소.
   * 공식몰 회사소개(blueguard.kr/about.html) 표기와 글자 단위로 일치시킨다.
   * 검색엔진은 여러 사이트에 흩어진 상호·주소·전화(NAP)의 일치 여부를 신뢰 신호로 쓴다.
   */
  address: '광주광역시 광산구 송도로 257-10 2층 202호',
  /** 대표 이메일 */
  email: 'bearis@naver.com',
  /** 고객문의 전화 (빈 문자열이면 렌더링에서 생략된다) */
  tel: '070-4147-1894',
} as const;

/** 콘텐츠 검수자 — 문서 frontmatter의 reviewer 값과 일치시킨다 */
export const REVIEWER_NAME = '김원종';

export const SITE = {
  url: 'https://fogger.blueguard.kr',
  /** 사이트 이름 — <title> 접미사와 WebSite 스키마에 사용 */
  name: '블루가드 연막소독기',
  shortName: '블루가드 포거',
  locale: 'ko_KR',
  lang: 'ko',
  description:
    '가정용 휴대용 부탄가스 연막소독기의 사양, 실내외 사용법, 안전수칙, 문제해결을 정리한 공식 정보 사이트입니다. 연막·연무 겸용.',
  /** 기본 OG 이미지 (public/ 기준 절대경로) */
  defaultOgImage: '/og/og-default.png',
} as const;

/** Organization 스키마 sameAs 및 외부 링크 */
export const EXTERNAL = {
  corporate: 'https://blueguard.kr',
  smartstore: 'https://smartstore.naver.com/blueguard',
} as const;

/**
 * 공식몰 구매 URL.
 *
 * 모델(BF-100S / BF-102 / 롱노즐)은 이 한 페이지의 옵션 드롭다운에서 고른다.
 * 모델별 상세 URL이 따로 없으므로 전 모델이 같은 URL을 쓰고 utm_content로만 구분한다.
 * 모델별 딥링크가 생기면 products.ts의 buyUrl만 개별 값으로 바꾸면 된다.
 */
export const OFFICIAL_STORE_PRODUCT_URL =
  'https://blueguard.kr/product/%EB%B8%94%EB%A3%A8%EA%B0%80%EB%93%9C-%EB%B0%A9%EC%97%AD%EC%9A%A9-%EC%97%B0%EB%A7%89%EC%86%8C%EB%8F%85%EA%B8%B0/3054';

/** 구매 CTA 기본 문구 — 옵션 선택이 필요한 단일 상품 페이지이므로 모델명을 붙이지 않는다. */
export const BUY_CTA_LABEL = '옵션 선택하고 구매하기';

/** 카드·고정바처럼 폭이 좁은 자리용. 모델명 옆에 '구매하기'만 쓰면 해당 모델이 바로 담기는 것처럼 읽힌다. */
export const BUY_CTA_LABEL_SHORT = '옵션 선택하고 구매';

/** Organization @id — 사이트 전역에서 동일한 노드를 참조 */
export const ORG_ID = `${SITE.url}/#organization`;
export const WEBSITE_ID = `${SITE.url}/#website`;

/** GA4 측정 ID. 빈 문자열이면 계측 스크립트를 아예 출력하지 않는다. */
export const GA4_MEASUREMENT_ID = 'G-0MQD99WG0W';

/** 검색엔진 소유확인 메타. 값이 빈 문자열이면 출력하지 않는다. */
export const SITE_VERIFICATION = {
  naver: '763dbf1be51c6b0b2f8fb7feb4f4879dd54a6f47',
  google: '',
  bing: 'CECFCC488E32F238626180CFBECCDE2B',
} as const;

/** 헤더 내비게이션 (구매하기 CTA는 별도) */
export const NAV = [
  { label: '제품', href: '/products/' },
  { label: '모델비교', href: '/compare/' },
  { label: '사용법', href: '/guides/' },
  { label: '활용사례', href: '/uses/' },
  { label: '문제해결', href: '/troubleshooting/' },
  { label: '안전수칙', href: '/safety/' },
] as const;

/** 정책 문서 시행일 — 개인정보처리방침·이용약관 개정 시 함께 갱신 */
export const POLICY_EFFECTIVE_DATE = '2026-08-05';

/** 기본 UTM 값 — BuyCTA가 자동 부착한다. */
export const UTM_DEFAULTS = {
  source: 'fogger_site',
  medium: 'referral',
  campaign: 'buy_cta',
} as const;
