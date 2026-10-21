// Läser in src/content/texter.md. Frontmatter innehåller korta texter,
// kontaktuppgifter och meta; brödtexten är om-texten.
import { frontmatter, Content as About } from '../content/texter.md';

export interface Texter {
  wordmark: string;
  tagline: string;
  categories: string;
  footer: string;
  gallery: {
    design: string;
    photography: string;
  };
  contact: {
    email: string;
    phone: string;
    instagram: string;
    linkedin: string;
  };
  meta: {
    title: string;
    description: string;
  };
}

export const texter = frontmatter as Texter;
export { About };

// **fetstil** i frontmatter-fält → <b>, övrig text HTML-escapas
export function inline(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
}
