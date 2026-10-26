#!/usr/bin/env node
// Importerar ett videoklipp till galleriet med ffmpeg.
//
//   npm run import-video -- material/gallery/graphic-design/klipp.mp4
//   npm run import-video -- ~/Desktop/klipp.mov --category photography
//
// Kategorin tas från mappen klippet ligger i (material/gallery/<kategori>/)
// om den inte anges med --category. Resultatet hamnar i
// src/assets/gallery/<kategori>/:
//
//   <namn>.mp4         gridversionen: H.264, utan ljud, max 1080 px hög,
//                      mål under 5 MB (andra pass med räknad bitrate vid behov)
//   <namn>.audio.mp4   bara om originalet har ljud: samma bild + AAC-ljud,
//                      används i lightboxen
//   <namn>.poster.jpg  stillbild från första bildrutan
//
// Lägg sedan till posten i src/content/galleri.yaml:
//   - video: <namn>.mp4
//     category: <kategori>
//     alt: Kort beskrivning av klippet
import { execFileSync, spawnSync } from 'node:child_process';
import { statSync, mkdirSync, rmSync } from 'node:fs';
import { basename, dirname, extname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';

const CATEGORIES = ['graphic-design', 'photography', 'illustration', 'other'];
const MAX_HEIGHT = 1080;
const MAX_BYTES = 5 * 1024 * 1024;
const MB = (n) => (n / 1024 / 1024).toFixed(2) + ' MB';

const args = process.argv.slice(2);
const source = args.find((a) => !a.startsWith('--') && args[args.indexOf(a) - 1] !== '--category');
const catIndex = args.indexOf('--category');
if (!source) {
  console.error('Användning: npm run import-video -- <klipp.mp4> [--category graphic-design]');
  process.exit(1);
}
const input = resolve(source);
const category = catIndex >= 0 ? args[catIndex + 1] : basename(dirname(input));
if (!CATEGORIES.includes(category)) {
  console.error(`Okänd kategori "${category}". Ange --category ${CATEGORIES.join(' | ')}`);
  process.exit(1);
}

// Samma regel som för bilder: inget inledande bindestreck i filnamnet
const name = basename(input, extname(input)).replace(/^-+/, '');
const outDir = resolve('src/assets/gallery', category);
mkdirSync(outDir, { recursive: true });
const gridOut = join(outDir, `${name}.mp4`);
const audioOut = join(outDir, `${name}.audio.mp4`);
const posterOut = join(outDir, `${name}.poster.jpg`);

// Läs längd, storlek och om det finns ljud ur ffmpegs egen utskrift
// (ffprobe behövs inte)
const probe = spawnSync('ffmpeg', ['-hide_banner', '-i', input], { encoding: 'utf8' }).stderr;
const duration = (() => {
  const m = probe.match(/Duration: (\d+):(\d+):([\d.]+)/);
  return m ? Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]) : null;
})();
const size = probe.match(/Stream #[^\n]*Video:[^\n]*?(\d{2,5})x(\d{2,5})/);
const hasAudio = /Stream #[^\n]*Audio:/.test(probe);
if (!duration || !size) {
  console.error(`Kunde inte läsa ${input} som video:\n${probe}`);
  process.exit(1);
}
console.log(`${basename(input)}: ${size[1]}×${size[2]}, ${duration.toFixed(1)} s, ${hasAudio ? 'med ljud' : 'utan ljud'}`);

// Skala ner till max 1080 px höjd (aldrig upp), jämna mått för H.264
const scale = `scale=-2:'min(${MAX_HEIGHT},ih)'`;
const common = ['-c:v', 'libx264', '-profile:v', 'high', '-level', '4.1', '-pix_fmt', 'yuv420p', '-vf', scale, '-movflags', '+faststart'];

function ffmpeg(list) {
  execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...list], { stdio: 'inherit' });
}

// 1. Gridversionen utan ljud: först kvalitetsstyrt (CRF 23). Blir den för
//    stor görs två pass med en bitrate räknad så att filen hamnar under 5 MB.
ffmpeg(['-i', input, ...common, '-preset', 'slow', '-crf', '23', '-an', gridOut]);
let gridSize = statSync(gridOut).size;
// Svårt material (brus, snabba rörelser) kan landa över målet även med två
// pass. Då sänks bitraten med överskottet och ett tak (maxrate/bufsize)
// läggs till, högst tre försök.
let kbps = Math.floor((MAX_BYTES * 8 * 0.95) / duration / 1000);
for (let attempt = 1; gridSize > MAX_BYTES && attempt <= 3; attempt++) {
  if (attempt > 1) kbps = Math.floor(kbps * (MAX_BYTES / gridSize) * 0.9);
  console.log(`${MB(gridSize)} är över 5 MB, kodar om med två pass på ${kbps} kbit/s (försök ${attempt})`);
  const preset = attempt === 1 ? 'slow' : 'medium';
  const rate = ['-b:v', `${kbps}k`, '-maxrate', `${Math.floor(kbps * 1.2)}k`, '-bufsize', `${kbps * 2}k`];
  const passlog = join(tmpdir(), `import-video-${process.pid}`);
  ffmpeg(['-i', input, ...common, '-preset', preset, ...rate, '-pass', '1', '-passlogfile', passlog, '-an', '-f', 'mp4', '/dev/null']);
  ffmpeg(['-i', input, ...common, '-preset', preset, ...rate, '-pass', '2', '-passlogfile', passlog, '-an', gridOut]);
  for (const ext of ['-0.log', '-0.log.mbtree']) rmSync(passlog + ext, { force: true });
  gridSize = statSync(gridOut).size;
}
if (gridSize > MAX_BYTES) {
  console.warn(`Varning: gridversionen blev ${MB(gridSize)}, över målet 5 MB. Korta klippet eller minska upplösningen.`);
}
console.log(`grid:   ${gridOut} (${MB(gridSize)})`);

// 2. Lightboxversion med ljud, bara om originalet har ljud. Bilden kopieras
//    från gridversionen (ingen omkodning), ljudet kodas som AAC.
if (hasAudio) {
  ffmpeg(['-i', gridOut, '-i', input, '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', '-shortest', audioOut]);
  console.log(`ljud:   ${audioOut} (${MB(statSync(audioOut).size)})`);
} else {
  rmSync(audioOut, { force: true });
}

// 3. Stillbild från första bildrutan, samma storlek som videon
ffmpeg(['-i', input, '-vf', scale, '-frames:v', '1', '-q:v', '2', posterOut]);
console.log(`poster: ${posterOut} (${MB(statSync(posterOut).size)})`);

console.log(`\nLägg till i src/content/galleri.yaml:\n- video: ${name}.mp4\n  category: ${category}\n  alt: Kort beskrivning av klippet`);
