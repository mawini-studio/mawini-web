import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { defineCollection } from 'astro:content';
import type { Loader } from 'astro/loaders';
import { z } from 'astro/zod';
import { parse } from 'yaml';

// Galleriet: en post per bild (eller bildpar) i src/content/galleri.yaml.
// Filnamnet blir id, och positionen i filen sparas som order så att
// galleriet alltid visas i samma ordning som i filen.

const image = z.object({
  file: z.string(),
  category: z.enum(['graphic-design', 'photography', 'illustration', 'other']),
  alt: z.string().min(1),
  title: z.string().optional(),
  client: z.string().optional(),
  year: z.number().int().optional(),
  // Tunn ljusgrå linje (#dedede) runt bilden (för bilder med vit bakgrund)
  border: z.boolean().optional(),
});

// Bildpar: två bilder staplade i samma kolumn. Båda måste hamna i samma
// sektion, alltså båda foton eller båda icke-foton.
const pair = z
  .object({
    kind: z.literal('pair'),
    order: z.number(),
    pair: z.tuple([image, image], {
      error: 'pair: ska innehålla exakt två bilder',
    }),
  })
  .refine(
    ({ pair: [a, b] }) => (a.category === 'photography') === (b.category === 'photography'),
    {
      message:
        'Bilderna i ett par måste ligga i samma sektion: båda photography, eller båda graphic-design/illustration/other',
    },
  );

// Videoklipp: importeras med `npm run import-video`, som skapar <namn>.mp4,
// <namn>.poster.jpg och ev. <namn>.audio.mp4 i src/assets/gallery/<kategori>/
const video = z.object({
  kind: z.literal('video'),
  order: z.number(),
  video: z.string().regex(/\.mp4$/, 'video: ska vara filnamnet på den importerade .mp4-filen'),
  category: image.shape.category,
  alt: image.shape.alt,
  title: image.shape.title,
  client: image.shape.client,
  year: image.shape.year,
  // Tidpunkt i sekunder som stillbilden tas från (annars första bildrutan)
  poster: z.number().min(0, 'poster: ska vara en tidpunkt i sekunder, t.ex. 2.0').optional(),
});

function idOf(item: Record<string, unknown>, order: number): string {
  if (typeof item.file === 'string') return item.file;
  if (typeof item.video === 'string') return item.video;
  if (Array.isArray(item.pair)) {
    return `pair:${item.pair.map((p: { file?: unknown }) => String(p?.file)).join('+')}`;
  }
  // Saknar både file och pair – schemat ger ett tydligt fel
  return `post-${order + 1}`;
}

// Egen loader i stället för Astros file(): den loggar bara fel och bygger
// vidare med ett tomt eller gammalt galleri. Här stoppar ogiltig YAML,
// en post som inte är en lista eller samma bild två gånger bygget.
const FILE = 'src/content/galleri.yaml';

function galleriLoader(): Loader {
  return {
    name: 'galleri-loader',
    load: async ({ config, store, parseData, logger, watcher }) => {
      const path = fileURLToPath(new URL(FILE, config.root));

      async function sync() {
        let data: unknown;
        try {
          data = parse(await readFile(path, 'utf-8'));
        } catch (error) {
          throw new Error(`${FILE}: ogiltig YAML – ${(error as Error).message}`);
        }
        if (!Array.isArray(data)) {
          throw new Error(`${FILE}: filen ska vara en lista med poster som börjar med "- "`);
        }
        const seen = new Set<string>();
        const entries = [];
        for (const [order, raw] of data.entries()) {
          const item = (raw ?? {}) as Record<string, unknown>;
          const id = idOf(item, order);
          if (seen.has(id)) throw new Error(`${FILE}: ${id} finns med två gånger`);
          seen.add(id);
          // kind styr vilken del av schemat som gäller, så att felmeddelandena blir tydliga
          const kind = 'pair' in item ? 'pair' : 'video' in item ? 'video' : 'image';
          entries.push({ id, data: await parseData({ id, data: { ...item, kind, order }, filePath: path }) });
        }
        store.clear();
        for (const entry of entries) store.set({ ...entry, filePath: FILE });
      }

      await sync();
      watcher?.add(path);
      watcher?.on('change', async (changed) => {
        if (changed !== path) return;
        try {
          await sync();
          logger.info(`${FILE} inläst igen`);
        } catch (error) {
          logger.error((error as Error).message);
        }
      });
    },
  };
}

const galleri = defineCollection({
  loader: galleriLoader(),
  schema: z.discriminatedUnion('kind', [
    image.extend({ kind: z.literal('image'), order: z.number() }),
    pair,
    video,
  ]),
});

export const collections = { galleri };
