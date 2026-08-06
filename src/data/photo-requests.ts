/**
 * 아직 확보하지 못한 실사 촬영 목록.
 *
 * PhotoRequest 컴포넌트가 이 배열로 자리표시 타일을 렌더링한다.
 * 촬영본이 나오면 해당 자리에 실사를 넣고 이 배열에서 항목을 지운다 —
 * 목록이 비면 해당 섹션 자체가 화면에서 사라진다(PhotoRequest는 빈 배열이면 null 반환).
 */
export interface PhotoRequest {
  label: string;
  note: string;
}

/** 홈 — 현재 누끼 사진만 있고 실물 크기·현장감을 보여줄 사진이 없다 */
export const HOME_PHOTO_REQUESTS: PhotoRequest[] = [
  {
    label: '사람이 들고 있는 크기 비교',
    note: '성인이 기기를 들고 선 정면·측면 사진. 실제 크기를 가늠할 기준이 됩니다.',
  },
  {
    label: '3모델 동일 구도 비교',
    note: 'BF-100S·BF-102·롱노즐 구성을 같은 배경·같은 거리·같은 각도로 나란히.',
  },
  {
    label: '실제 작업 현장 전경',
    note: '분사 중인 모습을 사람·배경과 함께. 지금 있는 클립은 근접 촬영뿐입니다.',
  },
];

/** 제품 상세 — 모델별 부위 상세컷 */
export const PRODUCT_PHOTO_REQUESTS: PhotoRequest[] = [
  {
    label: '점화스위치·가스밸브 클로즈업',
    note: '조작부 위치를 명확히 보여주는 근접 사진.',
  },
  {
    label: '부탄가스 장착부',
    note: '가스가 걸리는 위치와 체결 상태를 보여주는 사진.',
  },
  {
    label: '연료통 주입구·보조주입구',
    note: '충전 한도 눈금이나 주입구 구조가 보이는 사진.',
  },
];
