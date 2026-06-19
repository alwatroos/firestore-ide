#!/usr/bin/env node
/**
 * Generates icon.png (512x512), icon.icns (macOS) and icon.ico (Windows)
 * from build/icon.svg using macOS built-in sips + iconutil tools.
 *
 * Run with: node scripts/generate-icons.mjs
 */
import { execSync } from 'node:child_process';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const src = join(root, 'build/icon.svg');
const iconset = join(root, 'build/icon.iconset');

/** @param {string} cmd */
function run(cmd) {
  execSync(cmd, { stdio: 'inherit' });
}

/** Resize the SVG to a PNG at the given pixel size via sips. */
function sipsResize(size, dest) {
  run(`sips -s format png "${src}" --out "${dest}" --resampleWidth ${size}`);
}

// ── 1. Main 512x512 PNG (Linux AppImage + source) ──────────────────────────
console.log('Generating icon.png …');
sipsResize(512, join(root, 'build/icon.png'));

// ── 2. ICNS (macOS) ─────────────────────────────────────────────────────────
console.log('Generating icon.icns …');
mkdirSync(iconset, { recursive: true });

const icnsSizes = [
  [16, '16x16'],
  [32, '16x16@2x'],
  [32, '32x32'],
  [64, '32x32@2x'],
  [128, '128x128'],
  [256, '128x128@2x'],
  [256, '256x256'],
  [512, '256x256@2x'],
  [512, '512x512'],
  [1024, '512x512@2x'],
];

for (const [size, name] of icnsSizes) {
  sipsResize(size, join(iconset, `icon_${name}.png`));
}

run(`iconutil -c icns "${iconset}" --output "${join(root, 'build/icon.icns')}"`);
rmSync(iconset, { recursive: true });

// ── 3. ICO (Windows) — embed 16, 32, 48, 64, 128, 256 as PNG chunks ────────
console.log('Generating icon.ico …');

const icoSizes = [16, 32, 48, 64, 128, 256];
const tmpDir = join(root, 'build/.ico-tmp');
mkdirSync(tmpDir, { recursive: true });

for (const size of icoSizes) {
  sipsResize(size, join(tmpDir, `${size}.png`));
}

const pngs = icoSizes.map((s) => readFileSync(join(tmpDir, `${s}.png`)));
rmSync(tmpDir, { recursive: true });

// ICO header
const count = pngs.length;
const headerSize = 6 + count * 16;
const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0); // reserved
header.writeUInt16LE(1, 2); // type: ICO
header.writeUInt16LE(count, 4);

const dirEntries = [];
let offset = headerSize;
for (let i = 0; i < count; i++) {
  const size = icoSizes[i];
  const entry = Buffer.alloc(16);
  entry.writeUInt8(size >= 256 ? 0 : size, 0); // width  (0 = 256+)
  entry.writeUInt8(size >= 256 ? 0 : size, 1); // height (0 = 256+)
  entry.writeUInt8(0, 2); // colour count
  entry.writeUInt8(0, 3); // reserved
  entry.writeUInt16LE(1, 4); // colour planes
  entry.writeUInt16LE(32, 6); // bits per pixel
  entry.writeUInt32LE(pngs[i].length, 8);
  entry.writeUInt32LE(offset, 12);
  dirEntries.push(entry);
  offset += pngs[i].length;
}

writeFileSync(join(root, 'build/icon.ico'), Buffer.concat([header, ...dirEntries, ...pngs]));

console.log('Done! Generated:');
console.log('  build/icon.png  (512×512, Linux)');
console.log('  build/icon.icns (macOS)');
console.log('  build/icon.ico  (Windows)');
