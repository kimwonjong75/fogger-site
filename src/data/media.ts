/**
 * 공식 영상 자산.
 *
 * 전부 자체 호스팅이라 외부 요청이 발생하지 않는다.
 * VideoEmbed는 클릭 전까지 <video>를 만들지 않으므로 초기 페이지 전송량에 영향이 없다
 * (포스터 이미지만 lazy 로드).
 */
import type { ImageMetadata } from 'astro';
import posterHowto from '../assets/video-poster-howto.jpg';
import posterQc1 from '../assets/video-poster-qc1.jpg';
import posterQc2 from '../assets/video-poster-qc2.jpg';
import posterSpray from '../assets/video-poster-spray.jpg';
import posterLongNozzle from '../assets/video-poster-longnozzle.jpg';
import posterCustomer1 from '../assets/video-poster-customer1.jpg';
import posterCustomer2 from '../assets/video-poster-customer2.jpg';

export interface VideoAsset {
  src: string;
  poster: ImageMetadata;
  title: string;
  /** 재생 시간(초) */
  durationSec: number;
  width: number;
  height: number;
  /** 재생 버튼 아래 안내 문구 */
  caption: string;
}

/** 공식 사용법 영상 — 원본 1920×1080 113MB를 웹용 1280×720으로 재인코딩 */
export const HOWTO_VIDEO: VideoAsset = {
  src: '/video/blueguard-fogger-howto.mp4',
  poster: posterHowto,
  title: '블루가드 연막기 사용방법',
  durationSec: 109,
  width: 1280,
  height: 720,
  caption: '작업 전 준비부터 점화, 펌핑, 사용 후 세척까지 공식 사용 순서를 담은 안내 영상입니다.',
};

/** 실제 분사 테스트 — 배럴 안쪽 발열 코일과 연막 분사량을 확인할 수 있는 촬영본 */
export const SPRAY_TEST_VIDEO: VideoAsset = {
  src: '/video/spray-test.mp4',
  poster: posterSpray,
  title: '실제 분사 테스트',
  durationSec: 75,
  width: 540,
  height: 960,
  caption: '실제 분사량과 연막 형태를 확인할 수 있는 테스트 촬영본입니다.',
};

/** 롱노즐 구성 분사 촬영 — 50cm 롱노즐 체결 상태와 하부침투분사 확인 */
export const LONG_NOZZLE_VIDEO: VideoAsset = {
  src: '/video/long-nozzle-spray.mp4',
  poster: posterLongNozzle,
  title: '롱노즐 구성 분사 촬영',
  durationSec: 161,
  width: 540,
  height: 960,
  caption: '50cm 롱노즐을 체결한 상태에서 분사구 도달 거리를 확인할 수 있는 촬영본입니다.',
};

/** 실제 사용 현장 영상 (자체 촬영본, 평가·별점 포함하지 않음) */
export const CUSTOMER_USE_VIDEOS: VideoAsset[] = [
  {
    src: '/video/customer-use-1.mp4',
    poster: posterCustomer1,
    title: '실제 사용 현장 1',
    durationSec: 13,
    width: 540,
    height: 960,
    caption: '실외에서 실제로 사용하는 모습을 촬영한 영상입니다.',
  },
  {
    src: '/video/customer-use-2.mp4',
    poster: posterCustomer2,
    title: '실제 사용 현장 2',
    durationSec: 13,
    width: 540,
    height: 960,
    caption: '실외에서 실제로 사용하는 모습을 다른 각도에서 촬영한 영상입니다.',
  },
];

/** 콘텐츠 문서(frontmatter의 videoKey)에서 참조하는 영상 조회 테이블 */
export const VIDEO_BY_KEY = {
  sprayTest: SPRAY_TEST_VIDEO,
  longNozzle: LONG_NOZZLE_VIDEO,
} as const;

/** 제조·품질검수 현장 영상 (조립 라인 촬영본) */
export const QC_VIDEOS: VideoAsset[] = [
  {
    src: '/video/qc-assembly-1.mp4',
    poster: posterQc1,
    title: '제조 조립 현장 1',
    durationSec: 7,
    width: 540,
    height: 960,
    caption: '본체 조립 라인에서 부품을 결합하는 공정을 촬영한 영상입니다.',
  },
  {
    src: '/video/qc-assembly-2.mp4',
    poster: posterQc2,
    title: '제조 조립 현장 2',
    durationSec: 15,
    width: 540,
    height: 960,
    caption: '조립이 끝난 본체를 검수대에서 하나씩 확인하는 공정을 촬영한 영상입니다.',
  },
];

/**
 * 공식 사용법 영상의 10단계 전체.
 * 문구는 영상 자막을 그대로 옮긴 것이며 임의로 늘리거나 줄이지 않는다.
 * 사이트 전역 사용법 문서가 이 순서·문구와 어긋나지 않아야 한다.
 */
export const HOWTO_STEPS = [
  {
    no: 1,
    title: '작업 전 준비',
    body: '작업 전 미리 깨끗한 물을 준비해 주세요. 확산제와 살충제 비율은 50:1입니다. 확산제 1L당 살충제 20ml만 사용하세요.',
  },
  {
    no: 2,
    title: '작동 전 확인',
    body: '약제통 결합 후 2~3회 펌핑을 하여 약제가 잘 나오는지 미리 확인합니다.',
  },
  {
    no: 3,
    title: '부탄가스 장착',
    body: '위쪽에 부탄가스가 걸리는 부분을 확인하시고 위치를 잘 맞춰서 장착해 주세요.',
  },
  {
    no: 4,
    title: '가스밸브 열기',
    body: '가스밸브를 반정도만 연 뒤, 칙~ 하는 소리를 확인하세요.',
  },
  {
    no: 5,
    title: '점화',
    body: '점화스위치를 누른 뒤 연기가 나올 때까지 4~10초 정도 손대지 말고 가만히 기다려 주세요.',
  },
  {
    no: 6,
    title: '계속 펌핑',
    body: '펌핑을 멈추면 코일 속의 약제가 탄화되어 코일이 막히게 됩니다.',
  },
  {
    no: 7,
    title: '작업이 끝나면',
    body: '작업이 끝나면 가스밸브를 돌려서 잠궈주세요.',
  },
  {
    no: 8,
    title: '부탄가스 분리',
    body: '부탄가스를 분리해서 보관해 주세요.',
  },
  {
    no: 9,
    title: '연기 제거',
    body: '코일 속 연기가 완전히 빠지고 약제만 나올 때까지 계속 펌핑해 주세요.',
  },
  {
    no: 10,
    title: '물로 청소',
    body: '미리 준비해둔 깨끗한 물로 코일 속을 청소해 주세요.',
  },
] as const;
