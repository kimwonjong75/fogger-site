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

/**
 * 부품 클로즈업 (홈 ③④⑤⑥, TODO.md F-1).
 *
 * 원본은 넓은 화면(약 16:9)으로 찍힌 매크로 컷이라, 흰 배경을 까는 게 아니라
 * 중앙을 정사각으로 잘라 쓴다(fit: 'cover'). 네 장 다 피사체가 프레임 중앙에 있어
 * 중앙 크롭만으로 맞았다 — 나중에 다시 찍어 피사체 위치가 달라지면 이 크롭이
 * 어긋날 수 있으니, 결과물을 반드시 눈으로 확인한다.
 */
const PART_SOURCE_ROOT = resolve(SOURCE_ROOT, '100S');
const PART_PHOTOS = [
  { src: '블루가드 연막기 연료통.jpg', out: 'src/assets/photo-part-tank.jpg', size: 900 },
  { src: '블루가드 연막기 철망.jpg', out: 'src/assets/photo-part-mesh.jpg', size: 900 },
  { src: '블루가드 연막기 노즐.png', out: 'src/assets/photo-part-nozzle.jpg', size: 900 },
  { src: '블루가드 연막기 피스톤.jpg', out: 'src/assets/photo-part-piston.jpg', size: 900 },
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

for (const photo of PART_PHOTOS) {
  const from = resolve(PART_SOURCE_ROOT, photo.src);
  if (!existsSync(from)) {
    console.log(`  건너뜀 (원본 없음): 100S/${photo.src}`);
    continue;
  }
  const to = resolve(ROOT, photo.out);
  await mkdir(dirname(to), { recursive: true });

  const buf = await sharp(from)
    .resize(photo.size, photo.size, { fit: 'cover', position: 'centre' })
    .jpeg({ quality: 88, mozjpeg: true })
    .toBuffer();

  await writeFile(to, buf);
  console.log(`  ${photo.out}  ${(buf.length / 1024).toFixed(0)}KB`);
}

console.log('done');
