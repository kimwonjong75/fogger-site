/**
 * 플레이스홀더 이미지 생성기.
 *
 * ⚠️ 여기서 만드는 이미지는 실제 제품 사진이 준비되기 전까지 쓰는 임시 그래픽이다.
 *    실사 촬영본이 나오면 같은 파일명·같은 해상도로 덮어쓰면 코드 수정 없이 교체된다.
 *
 *   node scripts/generate-images.mjs
 *
 * 산출물
 *   public/og/*.png      1200x630  (og:image)
 *   src/assets/*.png     문서 히어로 / 제품 이미지
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const FONT = "'Malgun Gothic','Apple SD Gothic Neo',system-ui,sans-serif";

const THEMES = {
  brand: { from: '#0b2545', to: '#134074', chip: '#93c5fd', plume: '#dbeafe' },
  guides: { from: '#0f2f3d', to: '#155e75', chip: '#a5f3fc', plume: '#cffafe' },
  uses: { from: '#12321f', to: '#166534', chip: '#bbf7d0', plume: '#dcfce7' },
  troubleshooting: { from: '#3b1f0b', to: '#9a3412', chip: '#fed7aa', plume: '#ffedd5' },
  safety: { from: '#3b0d0d', to: '#991b1b', chip: '#fecaca', plume: '#fee2e2' },
  product: { from: '#101a2c', to: '#1d63b8', chip: '#bfdbfe', plume: '#e0ecfd' },
};

const esc = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** 연막 느낌의 반투명 타원 무리 */
function plumes(w, h, color) {
  const blobs = [
    [0.78, 0.28, 0.34, 0.3, 0.16],
    [0.62, 0.52, 0.26, 0.24, 0.12],
    [0.88, 0.68, 0.3, 0.26, 0.1],
    [0.46, 0.18, 0.16, 0.15, 0.08],
    [0.72, 0.86, 0.22, 0.18, 0.07],
  ];
  return blobs
    .map(
      ([cx, cy, rx, ry, o]) =>
        `<ellipse cx="${(w * cx).toFixed(0)}" cy="${(h * cy).toFixed(0)}" rx="${(w * rx).toFixed(0)}" ry="${(h * ry).toFixed(0)}" fill="${color}" opacity="${o}" filter="url(#soft)"/>`,
    )
    .join('');
}

/** 노즐에서 뻗어나가는 사선 그리드 */
function rays(w, h, color) {
  let out = '';
  for (let i = 0; i < 7; i++) {
    const y = h * 0.34 + i * h * 0.052;
    out += `<line x1="${w * 0.08}" y1="${h * 0.62}" x2="${w * 1.02}" y2="${y}" stroke="${color}" stroke-width="2" opacity="0.14"/>`;
  }
  return out;
}

function card({ width, height, theme, chip, lines, footer, titleSize, chipSize = 26 }) {
  const t = THEMES[theme];
  const size = titleSize ?? Math.round(width * 0.062);
  const lineHeight = Math.round(size * 1.32);
  const blockHeight = lines.length * lineHeight;
  const startY = Math.round(height * 0.52 - blockHeight / 2 + size * 0.8);
  const padX = Math.round(width * 0.065);

  const chipW = Math.round(chip.length * chipSize * 1.02 + chipSize * 1.6);
  const chipY = startY - blockHeight * 0 - lineHeight - Math.round(chipSize * 2.1);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${t.from}"/>
      <stop offset="1" stop-color="${t.to}"/>
    </linearGradient>
    <filter id="soft" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="${Math.round(width * 0.03)}"/>
    </filter>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#bg)"/>
  ${plumes(width, height, t.plume)}
  ${rays(width, height, t.plume)}
  <rect x="${padX}" y="${chipY}" width="${chipW}" height="${Math.round(chipSize * 1.9)}" rx="${Math.round(chipSize)}" fill="${t.chip}" opacity="0.22"/>
  <text x="${padX + Math.round(chipSize * 0.8)}" y="${chipY + Math.round(chipSize * 1.32)}" font-family="${FONT}" font-size="${chipSize}" font-weight="700" fill="${t.chip}">${esc(chip)}</text>
  ${lines
    .map(
      (line, i) =>
        `<text x="${padX}" y="${startY + i * lineHeight}" font-family="${FONT}" font-size="${size}" font-weight="700" fill="#ffffff">${esc(line)}</text>`,
    )
    .join('\n  ')}
  <text x="${padX}" y="${height - Math.round(height * 0.075)}" font-family="${FONT}" font-size="${Math.round(size * 0.42)}" fill="#ffffff" opacity="0.72">${esc(footer)}</text>
</svg>`;
}

async function render(svg, outPath) {
  const abs = resolve(ROOT, outPath);
  await mkdir(dirname(abs), { recursive: true });
  const png = await sharp(Buffer.from(svg)).png({ compressionLevel: 9, palette: true }).toBuffer();
  await writeFile(abs, png);
  console.log(`  ${outPath}  ${(png.length / 1024).toFixed(0)}KB`);
}

/* ------------------------------------------------------------------ *
 * og:image  1200x630
 * ------------------------------------------------------------------ */
const OG = [
  ['og-default', 'brand', '블루가드', ['휴대용 연막소독기', '공식 정보 사이트']],
  ['og-products', 'product', '제품', ['BF-100S · BF-102', '모델별 사양 정리']],
  ['og-compare', 'product', '모델비교', ['BF-100S와 BF-102', '무엇이 다른가']],
  ['og-guides', 'guides', '사용법', ['충전부터 세척까지', '단계별 사용 순서']],
  ['og-uses', 'uses', '활용사례', ['축사·창고·주차장', '현장별 운용 방법']],
  ['og-troubleshooting', 'troubleshooting', '문제해결', ['점화·연막·노즐', '증상별 점검 순서']],
  ['og-safety', 'safety', '안전수칙', ['사고를 막는', '기본 안전 수칙']],
];

/* ------------------------------------------------------------------ *
 * 히어로 / 제품 이미지 (표시 크기의 2배 해상도)
 * ------------------------------------------------------------------ */
const HERO_W = 1520;
const HERO_H = 856;

const HEROES = [
  ['hero-home', 'brand', '블루가드 연막소독기', ['현장에 맞는 모델을', '숫자로 고르세요']],
  ['product-bf-100s', 'product', 'BF-100S', ['가정·소규모 매장용', '기본형 연막소독기']],
  ['product-bf-102', 'product', 'BF-102', ['넓은 면적을 위한', '어깨끈 현장형']],
  ['product-bf-102-long-nozzle', 'product', 'BF-102 + 롱노즐', ['천장·배관 뒤까지', '닿는 롱노즐 구성']],
  ['guide-fill', 'guides', '사용법', ['약제 충전과', '사용 전 점검']],
  ['guide-ignite', 'guides', '사용법', ['예열·점화·분사', '순서대로 하기']],
  ['guide-clean', 'guides', '사용법', ['사용 후 세척과', '보관 방법']],
  ['guide-media', 'guides', '사용법', ['경유와 확산제', '무엇을 쓸까']],
  ['use-livestock', 'uses', '활용사례', ['축사 방역', '동선과 시간 잡기']],
  ['use-warehouse', 'uses', '활용사례', ['창고·물류센터', '적재물 사이 방역']],
  ['use-parking', 'uses', '활용사례', ['지하주차장', '환기 확보가 먼저']],
  ['ts-ignition', 'troubleshooting', '문제해결', ['점화가 안 될 때', '점검 순서']],
  ['ts-smoke', 'troubleshooting', '문제해결', ['연막이 약할 때', '원인 찾기']],
  ['ts-nozzle', 'troubleshooting', '문제해결', ['노즐 막힘', '뚫고 예방하기']],
];

console.log('og:image');
for (const [name, theme, chip, lines] of OG) {
  await render(
    card({
      width: 1200,
      height: 630,
      theme,
      chip,
      lines,
      footer: 'fogger.blueguard.kr',
      titleSize: 74,
      chipSize: 26,
    }),
    `public/og/${name}.png`,
  );
}

console.log('hero / product');
for (const [name, theme, chip, lines] of HEROES) {
  await render(
    card({
      width: HERO_W,
      height: HERO_H,
      theme,
      chip,
      lines,
      footer: '실제 제품 사진으로 교체 예정',
      titleSize: 88,
      chipSize: 30,
    }),
    `src/assets/${name}.png`,
  );
}

console.log('done');
