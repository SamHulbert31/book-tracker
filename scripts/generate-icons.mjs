// Generates every app icon from assets/icon.svg.
// Run with: npm run icons
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const svg = await readFile(path.join(root, 'assets/icon.svg'));
const out = (name) => path.join(root, 'public', name);

// The mark already sits inside the centre 60%, so the same artwork serves the
// regular, maskable and Apple icons. All are full bleed with no transparency,
// because Android and iOS apply their own masks and rounded corners.
const png = [
  ['icon-192.png', 192],
  ['icon-512.png', 512],
  ['icon-maskable-512.png', 512],
  ['apple-touch-icon.png', 180],
  ['favicon-32.png', 32],
];

for (const [name, size] of png) {
  // Render at high density so small sizes stay crisp.
  await sharp(svg, { density: 384 })
    .resize(size, size)
    .flatten({ background: '#26432F' })
    .png({ compressionLevel: 9 })
    .toFile(out(name));
  console.log(`public/${name} (${size}x${size})`);
}

// Same mark as the favicon.
await writeFile(out('favicon.svg'), svg);
console.log('public/favicon.svg');
