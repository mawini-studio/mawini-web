#!/usr/bin/env node
// Importerar ett videoklipp till galleriet med ffmpeg.
//
//   npm run import-video -- material/gallery/graphic-design/klipp.mp4
//   npm run import-video -- ~/Desktop/klipp.mov --category photography
//   npm run import-video -- klipp.mp4 --poster 2.0 --poster-only
//
// Kategorin tas från mappen klippet ligger i (material/gallery/<kategori>/)
// om den inte anges med --category. Resultatet hamnar i
// src/assets/gallery/<kategori>/:
//
//   <namn>.mp4         gridversionen: H.264, utan ljud, max 1080 px hög,
//                      mål under 5 MB (andra pass med räknad bitrate vid behov)
//   <namn>.audio.mp4   bara om originalet har ljud: samma bild + AAC-ljud,
//                      används i lightboxen
//   <namn>.poster.jpg  stillbild, från första bildrutan eller från tidpunkten
//                      i fältet poster: i galleri.yaml (eller --poster <sekunder>)
//   <namn>.poster.json bara när tidpunkten inte är 0: { "time": 2 }. Bygget
//                      jämför den med poster: i galleri.yaml och stoppar om
//                      stillbilden inte är tagen vid rätt tidpunkt
//
// --poster-only gör bara om stillbilden (ingen omkodning av klippet).
//
// Lägg sedan till posten i src/content/galleri.yaml:
//   - video: <namn>.mp4
//     category: <kategori>
//     alt: Kort beskrivning av klippet
//     poster: 2.0   (valfritt)
import { execFileSync, spawnSync } from 'node:child_process';
import { statSync, mkdirSync, rmSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, extname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { parse } from 'yaml';

const CATEGORIES = ['graphic-design', 'photography', 'illustration', 'other'];
const MAX_HEIGHT = 1080;
const MAX_BYTES = 5 * 1024 * 1024;
const MB = (n) => (n / 1024 / 1024).toFixed(2) + ' MB';

const args = process.argv.slice(2);
const valueFlags = ['--category', '--poster'];
const source = args.find((a, i) => !a.startsWith('--') && !valueFlags.includes(args[i - 1]));
const catIndex = args.indexOf('--category');
const posterIndex = args.indexOf('--poster');
const posterOnly = args.includes('--poster-only');
if (!source) {
  console.error('Användning: npm run import-video -- <klipp.mp4> [--category graphic-design] [--poster <sekunder>] [--poster-only]');
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
const posterInfo = join(outDir, `${name}.poster.json`);

// Stillbildens tidpunkt: --poster, annars poster: i klippets post i galleri.yaml, annars 0
function posterFromYaml() {
  try {
    const entries = parse(readFileSync('src/content/galleri.yaml', 'utf8'));
    return entries?.find?.((e) => e?.video === `${name}.mp4`)?.poster;
  } catch {
    return undefined;
  }
}
const posterTime = Number(posterIndex >= 0 ? args[posterIndex + 1] : (posterFromYaml() ?? 0));
if (!Number.isFinite(posterTime) || posterTime < 0) {
  console.error(`Ogiltig tidpunkt för stillbilden: ${args[posterIndex + 1]}`);
  process.exit(1);
}

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
if (posterTime >= duration) {
  console.error(`poster: ${posterTime} s ligger efter klippets slut (${duration.toFixed(2)} s)`);
  process.exit(1);
}
console.log(`${basename(input)}: ${size[1]}×${size[2]}, ${duration.toFixed(1)} s, ${hasAudio ? 'med ljud' : 'utan ljud'}`);

// Skala ner till max 1080 px höjd (aldrig upp), jämna mått för H.264
const scale = `scale=-2:'min(${MAX_HEIGHT},ih)'`;
const common = ['-c:v', 'libx264', '-profile:v', 'high', '-level', '4.1', '-pix_fmt', 'yuv420p', '-vf', scale, '-movflags', '+faststart'];

function ffmpeg(list) {
  execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...list], { stdio: 'inherit' });
}

// Stillbilden: första bildrutan vid eller efter tidpunkten, samma storlek som
// videon. -ss före -i söker exakt när bilden avkodas om (inte bara till
// närmaste nyckelbildruta).
function writePoster() {
  ffmpeg(['-ss', String(posterTime), '-i', input, '-vf', scale, '-frames:v', '1', '-q:v', '2', posterOut]);
  if (posterTime > 0) writeFileSync(posterInfo, JSON.stringify({ time: posterTime }) + '\n');
  else rmSync(posterInfo, { force: true });
  console.log(`poster: ${posterOut} (${MB(statSync(posterOut).size)}, ${posterTime ? `${posterTime} s` : 'första bildrutan'})`);
}

if (posterOnly) {
  writePoster();
  process.exit(0);
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

// 3. Stillbild
writePoster();

console.log(`\nLägg till i src/content/galleri.yaml:\n- video: ${name}.mp4\n  category: ${category}\n  alt: Kort beskrivning av klippet${posterTime ? `\n  poster: ${posterTime}` : ''}`);
