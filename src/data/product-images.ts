/**
 * 제품 id → 이미지 매핑.
 * astro:assets는 정적 import가 필요하므로 데이터와 분리해 둔다.
 * 실사 촬영본이 나오면 같은 파일명으로 덮어쓰면 된다.
 */
import type { ImageMetadata } from 'astro';
import bf100s from '../assets/product-bf-100s.png';
import bf102 from '../assets/product-bf-102.png';
import bf102Long from '../assets/product-bf-102-long-nozzle.png';
import type { ProductId } from './products';

export const PRODUCT_IMAGES: Record<ProductId, ImageMetadata> = {
  'bf-100s': bf100s,
  'bf-102': bf102,
  'bf-102-long-nozzle': bf102Long,
};

/** alt = "{주제} — {구체 장면}" */
export const PRODUCT_IMAGE_ALT: Record<ProductId, string> = {
  'bf-100s': '연막소독기 BF-100S — 본체와 기본 노즐을 정면에서 보여주는 제품 이미지',
  'bf-102': '연막소독기 BF-102 — 어깨끈을 건 본체를 비스듬히 보여주는 제품 이미지',
  'bf-102-long-nozzle':
    '연막소독기 BF-102 롱노즐 구성 — 본체에 롱노즐을 체결한 상태를 보여주는 제품 이미지',
};
