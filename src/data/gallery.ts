import type { ImageMetadata } from 'astro';

// Ordning och alt-texter från material/bildlista.md.
// Ordningen här = ordningen i galleriet. title, client och year är valfria
// och visas bara i lightboxen när de är ifyllda.

export type Category = 'graphic-design' | 'photography' | 'illustration' | 'other';

export interface GalleryItem {
  file: string;
  category: Category;
  alt: string;
  title?: string;
  client?: string;
  year?: number;
}

export const gallery: GalleryItem[] = [
  { file: 'beaujolais-nouveau-poster-2025.jpg', category: 'graphic-design', alt: 'Beaujolais Nouveau poster 2025, black ink illustration of a smiling woman' },
  { file: 'dsc2079.jpg', category: 'photography', alt: 'Modernist apartment block against a deep blue sky' },
  { file: 'super-express-50-70-a2.jpg', category: 'graphic-design', alt: 'Super Express poster, Japanese bullet train in a mountain landscape' },
  { file: 'dsc3250.jpg', category: 'photography', alt: 'Fashion doll reclining on a lounge chair beside a yellow toilet' },
  { file: 'beaujolais-nouveau-poster-2023.jpg', category: 'graphic-design', alt: 'Beaujolais Nouveau poster 2023, woman with closed eyes in navy and red' },
  { file: 'dsc4754.jpg', category: 'photography', alt: 'Parisian building by the Seine framed by tree branches' },
  { file: 'beaujolais-nouveau-poster-2020.jpg', category: 'graphic-design', alt: 'Beaujolais Nouveau poster 2020, minimal line portrait on yellow' },
  { file: 'dsc2407.jpg', category: 'photography', alt: 'Paris rooftops and chimneys under a cloudy sky' },
  { file: 'beaujolais-nouveau-poster-2026.jpg', category: 'graphic-design', alt: 'Beaujolais Nouveau poster 2026, smiling woman against teal stripes' },
  { file: 'dsc8252.jpg', category: 'photography', alt: 'Still life of wilting ranunculus flowers in warm light' },
  { file: 'beaujolais-nouveau-poster-2021.jpg', category: 'graphic-design', alt: 'Beaujolais Nouveau poster 2021, teal halftone portrait' },
  { file: 'dscf1352.jpg', category: 'photography', alt: 'Industrial silos and steel walkway' },
  { file: 'beaujolais-nouveau-poster-2024.jpg', category: 'graphic-design', alt: 'Beaujolais Nouveau poster 2024, ink portrait on dotted blue' },
  { file: 'dsc8012.jpg', category: 'photography', alt: 'White facade with rows of windows and a blossoming tree' },
  { file: 'beaujolais-nouveau-poster-2022.jpg', category: 'graphic-design', alt: 'Beaujolais Nouveau poster 2022, purple and pink portrait on yellow' },
  { file: 'l1030224.jpg', category: 'photography', alt: 'Window in a weathered concrete wall reflecting clouds' },
  { file: 'beaujolais-nouveaul-logotype-wbkg-a.jpg', category: 'graphic-design', alt: 'Beaujolais Nouveau logotype in red script on striped background' },
  { file: 'dsc2558.jpg', category: 'photography', alt: 'Black and white gravestone plaque, Anna Busch 1855–1912' },
  { file: 'l1032298.jpg', category: 'photography', alt: 'Vintage Le Moulin Rouge hotel sign in front of a roadside motel' },
];

const images = import.meta.glob<{ default: ImageMetadata }>(
  '../assets/gallery/*/*.{jpg,jpeg,png,webp}',
  { eager: true },
);

export function imageFor(item: GalleryItem): ImageMetadata {
  const mod = images[`../assets/gallery/${item.category}/${item.file}`];
  if (!mod) throw new Error(`Galleribild saknas: ${item.category}/${item.file}`);
  return mod.default;
}
