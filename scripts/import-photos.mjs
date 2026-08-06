/**
 * 공식 제품 실사를 프로젝트로 가져온다.
 *
 *   node scripts/import-photos.mjs
 *
 * 원본은 사내 제품 자산 폴더에 있고 저장소에는 최적화본만 커밋한다.
 * SOURCE_ROOT 경로가 없으면 아무것도 하지 않고 종료한다(다른 PC에서 빌드해도 깨지지 않게).
 */
import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE_ROOT =
  process.env.FOGGER_PHOTO_SOURCE ??
  'C:/Users/beari/Desktop/소재/상품별 이미지 및 영상소스/연막기';

/**
 * 원본 → 산출물 매핑.
 * 제품 컷은 정사각 1000px 원본이라 정사각 그대로 쓴다(억지로 와이드로 자르면 기기가 잘린다).
 */
const PHOTOS = [
  { src: '연막기-기본형.jpg', out: 'src/assets/photo-bf-100s.jpg', size: 1000 },
  { src: '연막기-대용량.jpg', out: 'src/assets/photo-bf-102.jpg', size: 1000 },
  { src: '연막기-롱노즐.jpg', out: 'src/assets/photo-bf-102-long-nozzle.jpg', size: 1000 },
  { src: '세척통.png', out: 'src/assets/photo-cleaning-base.jpg', size: 800 },
];

if (!existsSync(SOURCE_ROOT)) {
  console.log(`원본 폴더를 찾을 수 없어 건너뜁니다: ${SOURCE_ROOT}`);
  console.log('FOGGER_PHOTO_SOURCE 환경변수로 경로를 지정할 수 있습니다.');
  process.exit(0);
}

for (const photo of PHOTOS) {
  const from = resolve(SOURCE_ROOT, photo.src);
  if (!existsSync(from)) {
    console.log(`  건너뜀 (원본 없음): ${photo.src}`);
    continue;
  }
  const to = resolve(ROOT, photo.out);
  await mkdir(dirname(to), { recursive: true });

  const buf = await sharp(from)
    .resize(photo.size, photo.size, { fit: 'contain', background: '#ffffff' })
    .flatten({ background: '#ffffff' })
    .jpeg({ quality: 88, mozjpeg: true })
    .toBuffer();

  await writeFile(to, buf);
  console.log(`  ${photo.out}  ${(buf.length / 1024).toFixed(0)}KB`);
}

console.log('done');
