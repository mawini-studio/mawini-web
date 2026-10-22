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
    heading: string;
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

// I frontmatter-fält: **fetstil** → <b>, [text](adress) → <a>.
// Övrig text HTML-escapas.
export function inline(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2">$1</a>');
}

// Kontaktlänkarna, byggda en gång ur texter.md så att ikonerna i introt och
// kontaktsektionen alltid visar samma uppgifter.
export interface ContactLink {
  kind: 'email' | 'phone' | 'instagram' | 'linkedin';
  href: string;
  text: string;
  label: string;
  external: boolean;
}

export function contactLinks(contact: Texter['contact']): ContactLink[] {
  const handle = new URL(contact.instagram).pathname.split('/').filter(Boolean)[0];
  return [
    {
      kind: 'email',
      href: `mailto:${contact.email}`,
      text: contact.email,
      label: `E-mail ${contact.email}`,
      external: false,
    },
    {
      kind: 'phone',
      href: `tel:${contact.phone.replace(/[^+\d]/g, '')}`,
      text: contact.phone,
      label: `Call ${contact.phone}`,
      external: false,
    },
    {
      kind: 'instagram',
      href: contact.instagram,
      text: `@${handle}`,
      label: `Instagram @${handle}`,
      external: true,
    },
    {
      kind: 'linkedin',
      href: contact.linkedin,
      text: 'LinkedIn',
      label: 'LinkedIn',
      external: true,
    },
  ];
}
