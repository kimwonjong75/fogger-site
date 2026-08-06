/**
 * 공식 미디어 자산 (영상·문서).
 *
 * 모두 자체 호스팅이라 외부 요청이 발생하지 않는다.
 * 영상은 클릭 전까지 내려받지 않고, 문서는 다운로드 시 GA4 manual_download 이벤트를 보낸다.
 */

/** 공식 사용법 영상 — 원본 1920×1080 113MB를 웹용 1280×720으로 재인코딩 */
export const HOWTO_VIDEO = {
  src: '/video/blueguard-fogger-howto.mp4',
  title: '블루가드 연막기 사용방법',
  /** 초 단위 재생 시간 */
  durationSec: 109,
  width: 1280,
  height: 720,
  description:
    '작업 전 준비부터 약제 충전, 점화, 펌핑, 사용 후 세척까지 공식 사용 순서를 단계별로 보여주는 안내 영상입니다.',
} as const;

/** 공식 사용설명서 (BF-100S / BF-102 공용 책자) */
export const MANUAL = {
  href: '/docs/블루가드-연막소독기-BF-100S-BF-102-사용설명서.pdf',
  label: '사용설명서 내려받기',
  fileType: 'pdf',
  /** 표기용 파일 크기 */
  sizeLabel: '5.1MB',
  pages: 12,
  name: 'bf-100s-102-manual',
} as const;

/**
 * 영상에서 확인된 공식 작업 단계.
 * 문구는 영상 자막을 그대로 옮긴 것이며, 임의로 늘리지 않는다.
 */
export const HOWTO_STEPS = [
  { no: 1, title: '작업 전 준비', body: '작업 전 미리 깨끗한 물을 준비해 주세요.' },
  { no: 5, title: '점화', body: '점화스위치를 누른 뒤 연기가 나올 때까지 4~10초 정도 손대지 말고 가만히 기다려 주세요.' },
  { no: 6, title: '계속 펌핑', body: '연막기가 가열되는 동안 펌핑을 이어갑니다.' },
] as const;
