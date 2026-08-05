/**
 * 사이트 전역 상수 (단일 소스).
 * 페이지/컴포넌트는 이 파일만 참조하고 값을 하드코딩하지 않는다.
 */

/* ------------------------------------------------------------------ *
 * ⚠️ 사업자 정보 — 실제 값으로 반드시 교체할 것
 *   아래 `TODO_` 로 시작하는 값은 자리표시자이며 그대로 화면에 노출된다.
 *   법적 표기 의무 항목이므로 배포 전 실제 등록 정보로 채워야 한다.
 * ------------------------------------------------------------------ */
export const BUSINESS = {
  /** 상호 */
  name: 'TODO_상호를_입력하세요',
  /** 대표자 */
  ceo: 'TODO_대표자명',
  /** 사업자등록번호 (예: 000-00-00000) */
  businessNumber: 'TODO_사업자등록번호',
  /** 통신판매업신고번호 (예: 제0000-지역0000호) */
  mailOrderNumber: 'TODO_통신판매업신고번호',
  /** 사업장 주소 */
  address: 'TODO_사업장_주소',
  /** 대표 이메일 */
  email: 'TODO_이메일@example.com',
  /** 고객문의 전화 (없으면 빈 문자열로 두면 렌더링에서 생략된다) */
  tel: '',
} as const;

export const SITE = {
  url: 'https://fogger.blueguard.kr',
  /** 사이트 이름 — <title> 접미사와 WebSite 스키마에 사용 */
  name: '블루가드 연막소독기',
  shortName: '블루가드 포거',
  locale: 'ko_KR',
  lang: 'ko',
  description:
    '휴대용 부탄가스 연막소독기 BF-100S·BF-102의 사양, 사용법, 안전수칙, 문제해결을 정리한 공식 정보 사이트입니다.',
  /** 기본 OG 이미지 (public/ 기준 절대경로) */
  defaultOgImage: '/og/og-default.png',
} as const;

/** Organization 스키마 sameAs 및 외부 링크 */
export const EXTERNAL = {
  corporate: 'https://blueguard.kr',
  smartstore: 'https://smartstore.naver.com/blueguard',
} as const;

/** Organization @id — 사이트 전역에서 동일한 노드를 참조 */
export const ORG_ID = `${SITE.url}/#organization`;
export const WEBSITE_ID = `${SITE.url}/#website`;

/** GA4 측정 ID. 빈 문자열이면 계측 스크립트를 아예 출력하지 않는다. */
export const GA4_MEASUREMENT_ID = 'G-XXXXXXXXXX';

/** 헤더 내비게이션 (구매하기 CTA는 별도) */
export const NAV = [
  { label: '제품', href: '/products/' },
  { label: '모델비교', href: '/compare/' },
  { label: '사용법', href: '/guides/' },
  { label: '문제해결', href: '/troubleshooting/' },
  { label: '안전수칙', href: '/safety/' },
] as const;

/** 푸터 정책 페이지 (실제 라우트가 존재해야 한다) */
export const POLICY_NAV = [
  { label: '개인정보처리방침', href: '/privacy/' },
  { label: '이용약관', href: '/terms/' },
] as const;

/** 푸터 콘텐츠 링크 */
export const FOOTER_NAV = [
  { label: '제품', href: '/products/' },
  { label: '모델비교', href: '/compare/' },
  { label: '사용법', href: '/guides/' },
  { label: '활용사례', href: '/uses/' },
  { label: '문제해결', href: '/troubleshooting/' },
  { label: '안전수칙', href: '/safety/' },
] as const;

/** 기본 UTM 값 — BuyCTA가 자동 부착한다. */
export const UTM_DEFAULTS = {
  source: 'fogger_site',
  medium: 'referral',
  campaign: 'buy_cta',
} as const;
