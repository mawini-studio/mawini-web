# mawini.com – plan och spec

Projektplan för Mats egen portfoliosajt. Läs denna först (gäller även Claude Code).

## Mål
Ersätta Wix-sajten med en egenbyggd, snabb statisk sajt på **mawini.com**.
Förlaga: Carrd-skissen "mawini studio" (enkel sida, vitt kort mot randig bakgrund).

## Teknik
- Mats Mac: Node v26, utvecklar i VS Code
- **Astro** (statisk sajt), bilder via `astro:assets` (automatiska storlekar, WebP/AVIF, lazy loading)
- Typsnitt via npm/Fontsource: `@fontsource/ibm-plex-sans`, `@fontsource/ibm-plex-mono` (självhostade)
- Git + GitHub, deploy till **Netlify** (eller GitHub Pages)
- DNS ligger kvar hos **Loopia** (Starter-konto, ingen FTP-hosting)

## Design
| Token | Värde |
|---|---|
| Accent | `#FF4600` |
| Bakgrundsränder | `#DEDEDE`, diagonala, ca 1 px linje / 6–8 px mellanrum |
| Text | `#111` |
| Ordmärke | IBM Plex Mono, glest spärrat, gemener |
| Brödtext | IBM Plex Sans (Regular + SemiBold) |

- Länkar: svarta, tunn orange understrykning (1 px, offset 3 px), orange vid hover/focus
- Avdelare: streckade orange linjer
- Kontaktikoner: grå i vila, orange vid hover

## Struktur
1. Header: "mawini studio" + rund logga (`material/logo/MWN_logotype_2025_A2.svg`, fill #FF4600)
2. Intro: "creator of things", kategorier, kontaktikoner
3. Galleri: justified grid (lika radhöjd, bredd efter bildens proportioner, färre per rad på mobil)
4. Om-text
5. Footer

## Galleri
- Klick öppnar **lightbox**: pilar, tangentbord, swipe, Esc stänger
- **Inga bildtexter** visas. Datafilen har valfria fält (titel, kund, år) som bara visas om ifyllda
- Alt-text på alla bilder (`material/bildlista.md`)
- Kategorimappar: graphic-design, photography, illustration, other

## Eventuellt senare
- Ruta runt länkar (vit botten, tunn orange ram)
- Kategorifilter
- Case-sidor (t.ex. Beaujolais Nouveau-serien)

## Lansering (när sajten är klar)
1. Deploya till Netlify, testa på tillfällig URL
2. Loopia: ta bort vidarebefordran på mawini.com, lägg A/CNAME mot Netlify
3. **Rör inte MX-posterna** (e-post info@ / mats@mawini.com, mats@killershark.se)
4. mawini.se, mawini.eu, killershark.se, matswnilsson.se → vidarebefordra till https://mawini.com
5. Kontrollera HTTPS, avpublicera Wix

## Öppna frågor
- Filnamn som börjar med `-` döps om vid import (t.ex. `-dsc2079.jpeg` → `dsc2079.jpg`)

## Status
- [x] Spec: färger, typsnitt, länkstil
- [x] Domän/hosting-plan
- [x] Material: logga + första bildurval
- [x] Texter och kontaktlänkar (`material/texter.md`)
- [ ] Sätta upp Astro-projekt + Git
- [ ] Bygga layout
- [ ] Galleri + lightbox
- [ ] Deploy + DNS-byte
