// One-off script: render public/favicon.svg into PNG icons at the sizes
// PWABuilder + Capacitor + Android adaptive icons expect.
//
// Run once locally (or in CI):  node scripts/generate-icons.mjs
//
// The generated PNGs are committed to public/ — sharp is NOT a runtime
// dep, only used for this scripted regeneration. Re-run only if the
// source SVG changes.

import sharp from 'sharp';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { resolve } from 'path';

const SVG = readFileSync(resolve('public/favicon.svg'));
const OUT = resolve('public');

const SIZES = [
  // PWA + Web manifest
  { file: 'icon-192.png',           size: 192 },
  { file: 'icon-512.png',           size: 512 },
  // Maskable variant — Android adaptive icons crop into a circle/squircle.
  // 80% inset so the navy/gold mountain isn't clipped by the mask.
  { file: 'icon-512-maskable.png',  size: 512, maskable: true },
  // Apple touch icon
  { file: 'apple-touch-icon.png',   size: 180 },
];

const renderOne = async ({ file, size, maskable }) => {
  let pipeline = sharp(SVG, { density: 384 }).resize(size, size, {
    fit: 'contain',
    background: { r: 0x0F, g: 0x3A, b: 0x5F, alpha: 1 }, // brand navy
  });
  if (maskable) {
    // Inset the visible artwork into the safe zone (~80%) by re-compositing
    // a smaller render onto a full-size navy background.
    const inner = Math.round(size * 0.8);
    const innerPng = await sharp(SVG, { density: 384 })
      .resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();
    pipeline = sharp({
      create: { width: size, height: size, channels: 4, background: { r: 0x0F, g: 0x3A, b: 0x5F, alpha: 1 } },
    }).composite([{ input: innerPng, top: Math.round((size - inner) / 2), left: Math.round((size - inner) / 2) }]);
  }
  const buf = await pipeline.png({ compressionLevel: 9 }).toBuffer();
  writeFileSync(resolve(OUT, file), buf);
  console.log(`✓ ${file} (${size}×${size})`);
};

mkdirSync(OUT, { recursive: true });
for (const s of SIZES) await renderOne(s);
console.log('✅ Icons generated.');
