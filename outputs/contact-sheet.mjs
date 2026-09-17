// Build a contact sheet from survey screenshots for fast triage.
// Usage: node outputs/contact-sheet.mjs <device-theme-prefix> <outName> <cols>
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const prefix = process.argv[2] || 'desktop-light';
const outName = process.argv[3] || `sheet-${prefix}.png`;
const cols = Number(process.argv[4] || 4);
const DIR = 'outputs/survey';
const TILE_W = 720;
const LABEL_H = 34;

const files = fs
	.readdirSync(DIR)
	.filter((f) => f.startsWith(prefix) && f.endsWith('.png'))
	.sort();

if (!files.length) throw new Error(`no files for prefix ${prefix}`);

const tiles = [];
for (const f of files) {
	const label = f.slice(prefix.length + 1).replace(/\.png$/, '');
	const img = sharp(path.join(DIR, f));
	const meta = await img.metadata();
	const scale = TILE_W / meta.width;
	const h = Math.round(meta.height * scale);
	const buf = await img.resize(TILE_W, h).png().toBuffer();
	tiles.push({ label, buf, h });
}

const rows = Math.ceil(tiles.length / cols);
const cellH = Math.max(...tiles.map((t) => t.h)) + LABEL_H;
const W = cols * TILE_W;
const H = rows * cellH;

const composites = [];
tiles.forEach((t, i) => {
	const x = (i % cols) * TILE_W;
	const y = Math.floor(i / cols) * cellH;
	composites.push({ input: t.buf, left: x, top: y + LABEL_H });
	const svg = Buffer.from(
		`<svg width="${TILE_W}" height="${LABEL_H}"><rect width="${TILE_W}" height="${LABEL_H}" fill="#111"/><text x="10" y="23" font-family="monospace" font-size="20" fill="#7df">${t.label}</text></svg>`,
	);
	composites.push({ input: svg, left: x, top: y });
});

await sharp({ create: { width: W, height: H, channels: 3, background: '#000' } })
	.composite(composites)
	.png()
	.toFile(path.join(DIR, outName));

console.log(`${outName}: ${W}x${H} tiles=${tiles.length} rows=${rows}`);
console.log(files.join('\n'));
