/**
 * 편집 화면에서 고른 사진 경로를 실제 이미지로 바꾸는 곳.
 *
 * **왜 따로 떼어 놨는가**
 * 제품 데이터(`src/data/products.ts`)와 화면 문구(`src/lib/page-content.ts`) 둘 다 사진을
 * 다루는데, page-content 는 제품 데이터를 읽는다(숫자 자리표시자 때문). 사진 해석까지
 * page-content 에 두면 제품 데이터가 page-content 를 다시 읽어야 해서 서로 물린다.
 * 아무것도 읽지 않는 이 파일에 두면 양쪽이 각자 가져다 쓸 수 있다.
 */
import type { ImageMetadata } from 'astro';

/**
 * `src/assets` 안의 모든 사진을 미리 읽어 둔다.
 *
 * astro:assets 는 원래 파일마다 `import` 문을 적어야 하는데, 그러면 편집 화면에서 올린
 * 사진은 import 문이 없으니 화면에 붙지 않는다. glob 으로 폴더 전체를 미리 잡아 두면
 * **경로 문자열만으로** 사진을 찾을 수 있어 편집 화면에서 올린 사진이 바로 반영된다.
 * 크기 최적화(AVIF/WebP 변환)는 그대로 적용된다.
 */
const ASSETS = import.meta.glob<{ default: ImageMetadata }>(
  '/src/assets/**/*.{jpg,jpeg,png,webp,JPG,JPEG,PNG,WEBP}',
  { eager: true },
);

/** 편집 화면이 저장하는 경로 형태 — config.yml 의 public_folder 와 짝을 이룬다 */
export const ASSET_PREFIX = '/src/assets/';

/**
 * 저장된 경로("/src/assets/photo-bf-102.jpg")를 실제 이미지로 바꾼다.
 * 파일이 없으면 빌드를 세운다 — 깨진 사진이 사이트에 나가지 않게 한다.
 */
export function resolveImage(path: string, where: string): ImageMetadata {
  const found = ASSETS[path];
  if (!found) {
    const available = Object.keys(ASSETS)
      .map((p) => p.replace(ASSET_PREFIX, ''))
      .join(', ');
    throw new Error(
      `[${where}] 사진 "${path}" 을(를) 찾을 수 없습니다.\n` +
        `편집 화면에서 사진을 다시 고르거나 올려 주세요.\n` +
        `지금 있는 사진: ${available}`,
    );
  }
  return found.default;
}

/** "/src/assets/photo-x.jpg" → "photo-x.jpg" — 미디어 지도가 파일명만 필요할 때 */
export function assetFileName(path: string): string {
  return path.replace(ASSET_PREFIX, '');
}
