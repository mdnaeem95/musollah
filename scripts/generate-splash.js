/**
 * Generates assets/splash.png — 1284 × 2778
 * Deep navy gradient + star field + rihlah logo centred
 * Matches the first frame of ModernSplash exactly.
 */

const { Jimp } = require('jimp');
const path = require('path');

const W = 1284;
const H = 2778;

// Pack RGBA into Jimp's 32-bit colour int
function rgba(r, g, b, a) {
  return (((r & 0xff) * 0x1000000) + ((g & 0xff) * 0x10000) + ((b & 0xff) * 0x100) + (a & 0xff)) >>> 0;
}

// Unpack Jimp int to [r, g, b, a]
function unpack(i) {
  return [(i >>> 24) & 0xff, (i >>> 16) & 0xff, (i >>> 8) & 0xff, i & 0xff];
}

// Gradient: #010409 → #040C1E (top half) → #060B18 (bottom half)
function gradientPixel(y) {
  const t = y / H;
  let r, g, b;
  if (t < 0.5) {
    const u = t / 0.5;
    r = Math.round(0x01 + (0x04 - 0x01) * u);
    g = Math.round(0x04 + (0x0C - 0x04) * u);
    b = Math.round(0x09 + (0x1E - 0x09) * u);
  } else {
    const u = (t - 0.5) / 0.5;
    r = Math.round(0x04 + (0x06 - 0x04) * u);
    g = Math.round(0x0C + (0x0B - 0x0C) * u);
    b = Math.round(0x1E + (0x18 - 0x1E) * u);
  }
  return rgba(r, g, b, 255);
}

// Star positions (same ratios as ModernSplash)
const STARS = [
  { cx: 0.08, cy: 0.06, r: 3.5, a: 0.70 },
  { cx: 0.22, cy: 0.04, r: 5.0, a: 0.80 },
  { cx: 0.45, cy: 0.07, r: 2.5, a: 0.60 },
  { cx: 0.65, cy: 0.03, r: 6.0, a: 0.90 },
  { cx: 0.82, cy: 0.09, r: 3.5, a: 0.70 },
  { cx: 0.93, cy: 0.05, r: 2.5, a: 0.55 },
  { cx: 0.14, cy: 0.16, r: 4.0, a: 0.75 },
  { cx: 0.57, cy: 0.13, r: 3.0, a: 0.65 },
  { cx: 0.77, cy: 0.19, r: 5.0, a: 0.80 },
  { cx: 0.96, cy: 0.22, r: 2.5, a: 0.55 },
  { cx: 0.03, cy: 0.24, r: 3.5, a: 0.70 },
  { cx: 0.32, cy: 0.27, r: 6.5, a: 0.90 },
  { cx: 0.72, cy: 0.30, r: 2.5, a: 0.60 },
  { cx: 0.89, cy: 0.36, r: 4.0, a: 0.75 },
  { cx: 0.11, cy: 0.38, r: 3.0, a: 0.65 },
  { cx: 0.52, cy: 0.76, r: 3.5, a: 0.70 },
  { cx: 0.26, cy: 0.82, r: 2.5, a: 0.60 },
  { cx: 0.69, cy: 0.84, r: 5.0, a: 0.80 },
  { cx: 0.91, cy: 0.79, r: 3.0, a: 0.60 },
  { cx: 0.38, cy: 0.89, r: 4.0, a: 0.75 },
  { cx: 0.83, cy: 0.93, r: 2.5, a: 0.55 },
  { cx: 0.06, cy: 0.87, r: 5.5, a: 0.85 },
  { cx: 0.59, cy: 0.91, r: 3.5, a: 0.70 },
  { cx: 0.18, cy: 0.72, r: 3.0, a: 0.65 },
  { cx: 0.94, cy: 0.67, r: 4.0, a: 0.75 },
];

function paintStar(img, cx, cy, r, alpha) {
  const ri = Math.ceil(r);
  for (let dy = -ri; dy <= ri; dy++) {
    for (let dx = -ri; dx <= ri; dx++) {
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d <= r) {
        const px = Math.round(cx + dx);
        const py = Math.round(cy + dy);
        if (px < 0 || px >= W || py < 0 || py >= H) continue;
        const falloff = 1 - (d / r) * 0.6;
        const a = Math.round(alpha * falloff * 255);
        // Blend white star over existing pixel
        const [br, bg, bb] = unpack(img.getPixelColor(px, py));
        const t = a / 255;
        img.setPixelColor(
          rgba(
            Math.min(255, Math.round(br + (255 - br) * t)),
            Math.min(255, Math.round(bg + (255 - bg) * t)),
            Math.min(255, Math.round(bb + (255 - bb) * t)),
            255
          ),
          px, py
        );
      }
    }
  }
}

function paintGlow(img, cx, cy, radius) {
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d > radius) continue;
      const px = Math.round(cx + dx);
      const py = Math.round(cy + dy);
      if (px < 0 || px >= W || py < 0 || py >= H) continue;
      const t = (1 - d / radius);
      const [br, bg, bb] = unpack(img.getPixelColor(px, py));
      img.setPixelColor(
        rgba(
          Math.min(255, br + Math.round(20 * t * t)),
          Math.min(255, bg + Math.round(30 * t * t)),
          Math.min(255, bb + Math.round(55 * t * t)),
          255
        ),
        px, py
      );
    }
  }
}

async function main() {
  console.log('Building gradient (' + W + '×' + H + ')…');
  const img = new Jimp({ width: W, height: H, color: 0x010409ff });

  for (let y = 0; y < H; y++) {
    const col = gradientPixel(y);
    for (let x = 0; x < W; x++) img.setPixelColor(col, x, y);
    if (y % 500 === 0) process.stdout.write('.');
  }
  console.log(' done');

  console.log('Painting stars…');
  for (const s of STARS) {
    paintStar(img, Math.round(s.cx * W), Math.round(s.cy * H), s.r, s.a);
  }

  console.log('Adding glow behind logo…');
  paintGlow(img, Math.round(W / 2), Math.round(H * 0.42), 280);

  console.log('Compositing logo…');
  const logo = await Jimp.read(path.join(__dirname, '../assets/rihlahLogo.png'));
  const logoW = 460;
  const logoH = Math.round(logoW * (logo.height / logo.width));
  logo.resize({ w: logoW, h: logoH });
  const logoX = Math.round((W - logoW) / 2);
  const logoY = Math.round(H * 0.42 - logoH / 2);
  img.composite(logo, logoX, logoY);

  const out = path.join(__dirname, '../assets/splash.png');
  console.log('Writing', out, '…');
  await img.write(out);
  console.log('Done ✓');
}

main().catch(err => { console.error(err); process.exit(1); });
