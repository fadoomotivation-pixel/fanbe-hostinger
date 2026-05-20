// Generate Android launcher icons from public/favicon.svg.
// Writes to android/app/src/main/res/mipmap-*/ with the standard Android
// density buckets. Also overwrites the legacy round + square icons that
// the Capacitor scaffold ships with default placeholder graphics.
//
// Re-run after `cap sync` if the source SVG changes.
//   node scripts/generate-android-icons.mjs

import sharp from 'sharp';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, join } from 'path';

const SVG_PATH = resolve('public/favicon.svg');
if (!existsSync(SVG_PATH)) { console.error('public/favicon.svg not found'); process.exit(1); }
const SVG = readFileSync(SVG_PATH);

const RES = resolve('android/app/src/main/res');
if (!existsSync(RES)) { console.warn('android/ scaffold not present yet — run `npx cap add android` first. Skipping.'); process.exit(0); }

// Android adaptive icon sizes (foreground layer) per density bucket
const FOREGROUND_SIZES = {
  'mipmap-mdpi':    108,
  'mipmap-hdpi':    162,
  'mipmap-xhdpi':   216,
  'mipmap-xxhdpi':  324,
  'mipmap-xxxhdpi': 432,
};
// Legacy launcher (pre-adaptive Android <8) sizes
const LEGACY_SIZES = {
  'mipmap-mdpi':    48,
  'mipmap-hdpi':    72,
  'mipmap-xhdpi':   96,
  'mipmap-xxhdpi':  144,
  'mipmap-xxxhdpi': 192,
};

const NAVY = { r: 0x0F, g: 0x3A, b: 0x5F, alpha: 1 };

const renderFlat = async (size) =>
  sharp(SVG, { density: 384 })
    .resize(size, size, { fit: 'contain', background: NAVY })
    .png({ compressionLevel: 9 })
    .toBuffer();

// For adaptive icon foreground, render only the artwork onto a transparent
// background — the system supplies the navy backdrop via mipmap.../ic_launcher_background.xml.
const renderForeground = async (size) => {
  const inner = Math.round(size * 0.7);
  const innerPng = await sharp(SVG, { density: 384 })
    .resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  return sharp({
    create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([{ input: innerPng, top: Math.round((size - inner) / 2), left: Math.round((size - inner) / 2) }])
    .png({ compressionLevel: 9 })
    .toBuffer();
};

for (const [bucket, size] of Object.entries(LEGACY_SIZES)) {
  const dir = join(RES, bucket);
  mkdirSync(dir, { recursive: true });
  const png = await renderFlat(size);
  writeFileSync(join(dir, 'ic_launcher.png'), png);
  writeFileSync(join(dir, 'ic_launcher_round.png'), png);
  console.log(`✓ ${bucket}/ic_launcher{,_round}.png (${size}×${size})`);
}

for (const [bucket, size] of Object.entries(FOREGROUND_SIZES)) {
  const dir = join(RES, bucket);
  mkdirSync(dir, { recursive: true });
  const png = await renderForeground(size);
  writeFileSync(join(dir, 'ic_launcher_foreground.png'), png);
  console.log(`✓ ${bucket}/ic_launcher_foreground.png (${size}×${size})`);
}

// Adaptive icon background — just a solid navy color drawable
const bgXml = `<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android" android:shape="rectangle">
  <solid android:color="#0F3A5F" />
</shape>
`;
mkdirSync(join(RES, 'drawable'), { recursive: true });
writeFileSync(join(RES, 'drawable/ic_launcher_background.xml'), bgXml);
console.log('✓ drawable/ic_launcher_background.xml');

console.log('✅ Android launcher icons generated.');
