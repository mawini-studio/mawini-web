import { defineCollection } from 'astro:content';
import { file } from 'astro/loaders';
import { z } from 'astro/zod';
import { parse } from 'yaml';

// Galleriet: en post per bild i src/content/galleri.yaml.
// Filnamnet blir id, och positionen i filen sparas som order så att
// galleriet alltid visas i samma ordning som i filen.
const galleri = defineCollection({
  loader: file('src/content/galleri.yaml', {
    parser: (text) =>
      (parse(text) as Record<string, unknown>[]).map((item, order) => ({
        ...item,
        id: item.file,
        order,
      })),
  }),
  schema: z.object({
    file: z.string(),
    category: z.enum(['graphic-design', 'photography', 'illustration', 'other']),
    alt: z.string().min(1),
    title: z.string().optional(),
    client: z.string().optional(),
    year: z.number().int().optional(),
    order: z.number(),
  }),
});

export const collections = { galleri };
