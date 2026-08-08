/**
 * 사이트에 들어가는 사진·영상의 지도.
 *
 * **왜 이 파일이 있는가**
 * 사진 자리표시자(PhotoSlot)는 개발 서버에서만 보이는데, 사장님은 개발 서버를 켜지 않는다.
 * 그래서 "어느 자리가 비어 있는지", "지금 이 사진이 어느 화면 어디에 쓰이는지"를 알 방법이
 * 없었다. 이 파일과 /admin/media/ 화면이 그 답이다.
 *
 * **채워진 사진은 실제 자산을 import 한다.** 파일을 지우면 빌드가 깨지므로 목록이
 * 현실과 어긋날 수 없다. 빈 자리는 촬영 계획이라 글로만 적는다(TODO.md F-1과 같은 성격).
 *
 * 사진을 새로 넣거나 바꿀 때 이 파일도 함께 고친다.
 * `verify-build.mjs`가 "src/assets 의 photo-*.jpg 가 전부 여기에 등록됐는가"를 검사한다.
 */
import type { ImageMetadata } from 'astro';

import photoBf100s from '../assets/photo-bf-100s.jpg';
import photoBf102 from '../assets/photo-bf-102.jpg';
import photoBf102Long from '../assets/photo-bf-102-long-nozzle.jpg';
import photoPartTank from '../assets/photo-part-tank.jpg';
import photoPartMesh from '../assets/photo-part-mesh.jpg';
import photoPartNozzle from '../assets/photo-part-nozzle.jpg';
import photoPartPiston from '../assets/photo-part-piston.jpg';
import photoWorkLivestockBarn from '../assets/photo-work-livestock-barn.jpg';
import photoCleaningBase from '../assets/photo-cleaning-base.jpg';

import {
  CUSTOMER_USE_VIDEOS,
  HOWTO_VIDEO,
  INTRO_VIDEO,
  LONG_NOZZLE_VIDEO,
  QC_VIDEOS,
  SPRAY_TEST_VIDEO,
  type VideoAsset,
} from './media';

/**
 * 사진 한 자리의 상태.
 *
 * - `final`      최종 사진이 들어가 있다. 손댈 필요 없다.
 * - `temporary`  임시 사진이 들어가 있다. 더 나은 컷으로 바꿀 예정이다.
 * - `empty`      아직 사진이 없다. 화면에는 아무것도 안 나온다.
 */
export type SlotStatus = 'final' | 'temporary' | 'empty';

export interface PhotoSlotEntry {
  /** TODO.md F-1 의 촬영 번호. 계획에 없던 자리는 null */
  no: string | null;
  /** 어느 화면인가 */
  page: string;
  /** 그 화면 안 어디인가 */
  where: string;
  /** 무엇을 담는 자리인가 */
  what: string;
  /** 가로:세로 */
  ratio: string;
  status: SlotStatus;
  /** 채워진 자리만. src/assets 기준 파일명 */
  file?: string;
  image?: ImageMetadata;
  /** 비었거나 임시일 때, 무엇을 어떻게 찍어야 하는가 */
  note?: string;
}

export const PHOTO_SLOTS: PhotoSlotEntry[] = [
  {
    no: '①',
    page: '/',
    where: '첫 화면 오른쪽',
    what: '성인이 한 손으로 들고 선 컷',
    ratio: '세로 3:4',
    status: 'temporary',
    file: 'photo-bf-102.jpg',
    image: photoBf102,
    note: '지금은 흰 배경 제품 컷이 임시로 들어가 있습니다. 어두운 배경에 사람이 들고 선 컷으로 바꾸면 크기가 몸으로 증명됩니다. 얼굴은 안 나와도 됩니다.',
  },
  {
    no: '⑫',
    page: '/',
    where: '"차량까지 동원할 필요 없는 현장을 위해" 섹션 왼쪽',
    what: '사람이 들고 이동하며 분사하는 전신',
    ratio: '가로 4:3',
    status: 'final',
    file: 'photo-work-livestock-barn.jpg',
    image: photoWorkLivestockBarn,
  },
  {
    no: '③',
    page: '/',
    where: '"겉은 비슷해도, 안쪽은 다릅니다" 네 칸 중 1번째',
    what: '연료통 클로즈업',
    ratio: '1:1',
    status: 'final',
    file: 'photo-part-tank.jpg',
    image: photoPartTank,
  },
  {
    no: '④',
    page: '/',
    where: '"겉은 비슷해도, 안쪽은 다릅니다" 네 칸 중 2번째',
    what: '철망 클로즈업',
    ratio: '1:1',
    status: 'final',
    file: 'photo-part-mesh.jpg',
    image: photoPartMesh,
  },
  {
    no: '⑤',
    page: '/',
    where: '"겉은 비슷해도, 안쪽은 다릅니다" 네 칸 중 3번째',
    what: '노즐 클로즈업',
    ratio: '1:1',
    status: 'final',
    file: 'photo-part-nozzle.jpg',
    image: photoPartNozzle,
  },
  {
    no: '⑥',
    page: '/',
    where: '"겉은 비슷해도, 안쪽은 다릅니다" 네 칸 중 4번째',
    what: '피스톤 분해 컷',
    ratio: '1:1',
    status: 'final',
    file: 'photo-part-piston.jpg',
    image: photoPartPiston,
  },
  {
    no: '⑨',
    page: '/, /products/, /compare/',
    where: '모델 카드 — 기본형',
    what: '기본형 제품 컷',
    ratio: '1:1',
    status: 'temporary',
    file: 'photo-bf-100s.jpg',
    image: photoBf100s,
    note: '⑨⑩⑪ 세 컷을 같은 배경·조명·거리로 다시 찍으면 나란히 놓았을 때 어긋나지 않습니다.',
  },
  {
    no: '⑩',
    page: '/, /products/, /compare/',
    where: '모델 카드 — 대용량',
    what: '대용량 제품 컷',
    ratio: '1:1',
    status: 'temporary',
    file: 'photo-bf-102.jpg',
    image: photoBf102,
    note: '⑨⑩⑪ 세 컷을 한 번에 찍어 주세요.',
  },
  {
    no: '⑪',
    page: '/, /products/, /compare/',
    where: '모델 카드 — 대용량+롱노즐',
    what: '대용량+롱노즐 제품 컷',
    ratio: '1:1',
    status: 'temporary',
    file: 'photo-bf-102-long-nozzle.jpg',
    image: photoBf102Long,
    note: '⑨⑩⑪ 세 컷을 한 번에 찍어 주세요.',
  },
  {
    no: '②',
    page: '/products/기본형/, /products/대용량/, /products/대용량+롱노즐/',
    where: '제품 상세 맨 위 큰 사진',
    what: '줄자·A4와 나란히 둔 크기 컷',
    ratio: '1:1',
    status: 'temporary',
    note: '지금은 모델 카드와 같은 제품 컷이 들어가 있습니다. 줄자나 A4 용지를 옆에 두고 찍으면 크기가 바로 전달됩니다.',
  },
  {
    no: '⑦',
    page: '/guides/choose-media/',
    where: '본문 맨 위',
    what: '실외 연막 장면',
    ratio: '가로 4:3',
    status: 'empty',
    note: '⑧과 대비되게 한 쌍으로 찍어 주세요.',
  },
  {
    no: '⑧',
    page: '/guides/choose-media/',
    where: '본문 중간',
    what: '실내 연무 장면',
    ratio: '가로 4:3',
    status: 'empty',
    note: '⑦과 대비되게 한 쌍으로 찍어 주세요.',
  },
  {
    no: '⑬',
    page: '/',
    where: '맨 아래 마무리',
    what: '저녁 마당 분위기 컷',
    ratio: '가로 16:9',
    status: 'empty',
    note: '급하지 않습니다. 분위기용이라 없어도 사이트는 완결됩니다.',
  },
  {
    no: null,
    page: '(아직 어디에도 안 쓰임)',
    where: '—',
    what: '세척용 받침대',
    ratio: '1:1',
    status: 'temporary',
    file: 'photo-cleaning-base.jpg',
    image: photoCleaningBase,
    note: '파일은 있는데 화면 어디에도 안 붙어 있습니다. 쓸 자리를 정하거나, 안 쓸 거면 지워도 됩니다.',
  },
];

export interface VideoSlotEntry {
  video: VideoAsset;
  /** 어느 화면에 나오는가 */
  pages: string[];
  /** 그 화면 안 어디인가 */
  where: string;
  /** 검색용 구조화데이터(VideoObject)가 붙은 화면. 없으면 null */
  schemaOn: string | null;
}

export const VIDEO_SLOTS: VideoSlotEntry[] = [
  {
    video: INTRO_VIDEO,
    pages: ['/'],
    where: '"차량까지 동원할 필요 없는 현장을 위해" 섹션 아래',
    schemaOn: '/',
  },
  {
    video: HOWTO_VIDEO,
    pages: ['/guides/', '/products/기본형/', '/products/대용량/', '/products/대용량+롱노즐/'],
    where: '사용법 10단계 바로 위 / 제품 상세 중간',
    schemaOn: '/guides/',
  },
  {
    video: SPRAY_TEST_VIDEO,
    pages: ['/products/'],
    where: '"조립과 분사 촬영본" 줄',
    schemaOn: null,
  },
  {
    video: LONG_NOZZLE_VIDEO,
    pages: ['/products/대용량+롱노즐/'],
    where: '롱노즐 설명 아래',
    schemaOn: null,
  },
  ...QC_VIDEOS.map((video) => ({
    video,
    pages: ['/products/'],
    where: '"조립과 분사 촬영본" 줄',
    schemaOn: null,
  })),
  ...CUSTOMER_USE_VIDEOS.map((video) => ({
    video,
    pages: ['/products/'],
    where: '"조립과 분사 촬영본" 줄',
    schemaOn: null,
  })),
];

/** 사진 원본을 두는 폴더 — 사장님이 파일을 넣으실 곳 */
export const PHOTO_SOURCE_FOLDER =
  'C:\\Users\\beari\\Desktop\\소재\\상품별 이미지 및 영상소스\\연막기';

export const STATUS_LABEL: Record<SlotStatus, string> = {
  final: '완료',
  temporary: '임시 사진',
  empty: '비어 있음',
};
