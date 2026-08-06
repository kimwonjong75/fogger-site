/**
 * og:image 카드 생성기.
 *
 * 여기서 만드는 것은 SNS·검색 카드용 브랜드 그래픽이며 제품 사진이 아니다.
 * 제품 실사는 scripts/import-photos.mjs 가 공식 자산 폴더에서 가져온다.
 *
 *   node scripts/generate-images.mjs
 *
 * 산출물
 *   public/og/*.png      1200x630
 */
import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/**
 * 생성한 파일의 해시 기록.
 * verify-build.mjs가 이 값과 대조해 "아직 임시 이미지인지"를 판별한다.
 * 같은 파일명으로 실사를 덮어쓰면 해시가 달라져 자동으로 해제된다.
 */
const manifest = { note: 'og:image 카드 해시. 브랜드 카드이며 제품 사진이 아니다.', files: {} };
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
  manifest.files[outPath] = createHash('sha256').update(png).digest('hex');
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
  ['og-uses', 'uses', '활용사례', ['현장별 작업 순서', '동선과 주의점']],
  ['og-troubleshooting', 'troubleshooting', '문제해결', ['점화·연막·노즐', '증상별 점검 순서']],
  ['og-safety', 'safety', '안전수칙', ['사고를 막는', '기본 안전 수칙']],
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

await writeFile(
  resolve(ROOT, 'src/assets/generated-manifest.json'),
  JSON.stringify(manifest, null, 2) + '\n',
);
console.log(`\nmanifest: src/assets/generated-manifest.json (${Object.keys(manifest.files).length}개)`);
console.log('done');
