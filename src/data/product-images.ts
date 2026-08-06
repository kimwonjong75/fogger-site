/**
 * 제품 id → 실사 이미지 매핑.
 *
 * 원본은 공식 제품 자산 폴더의 1000×1000 제품 컷이며
 * `npm run photos`(scripts/import-photos.mjs)로 가져온다.
 * astro:assets는 정적 import가 필요하므로 데이터와 분리해 둔다.
 */
import type { ImageMetadata } from 'astro';
import bf100s from '../assets/photo-bf-100s.jpg';
import bf102 from '../assets/photo-bf-102.jpg';
import bf102Long from '../assets/photo-bf-102-long-nozzle.jpg';
import type { ProductId } from './products';

export const PRODUCT_IMAGES: Record<ProductId, ImageMetadata> = {
  'bf-100s': bf100s,
  'bf-102': bf102,
  'bf-102-long-nozzle': bf102Long,
};

/** alt = "{주제} — {구체 장면}" */
export const PRODUCT_IMAGE_ALT: Record<ProductId, string> = {
  'bf-100s':
    '블루가드 연막소독기 기본형 — 검은 세척용 받침대를 끼운 본체를 비스듬히 촬영한 제품 사진',
  'bf-102':
    '블루가드 연막소독기 대용량 — 흰색 대용량 연료통을 단 본체를 비스듬히 촬영한 제품 사진',
  'bf-102-long-nozzle':
    '블루가드 연막소독기 대용량 롱노즐 구성 — 50cm 롱노즐을 체결한 본체를 옆에서 촬영한 제품 사진',
};
