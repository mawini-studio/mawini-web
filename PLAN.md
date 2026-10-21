# mawini.com – plan och spec

Projektplan för Mats egen portfoliosajt. Läs denna först (gäller även Claude Code).

## Mål
Ersätta Wix-sajten med en egenbyggd, snabb statisk sajt på **mawini.com**.
Förlaga: Carrd-skissen "mawini studio" (enkel sida, vitt kort mot randig bakgrund).

## Teknik
- Mats Mac: Node v26, utvecklar i VS Code
- **Astro** (statisk sajt), bilder via `astro:assets` (automatiska storlekar, WebP/AVIF, lazy loading)
- Typsnitt via npm/Fontsource: `@fontsource/ibm-plex-sans`, `@fontsource/ibm-plex-mono` (självhostade)
- Git + GitHub (publikt repo `mawini-studio/mawini-web`), deploy till **GitHub Pages** via GitHub Actions (Astros officiella workflow, `.github/workflows/deploy.yml`), körs vid varje push till `main`
- Egen domän: `public/CNAME` innehåller `mawini.com`
- DNS ligger kvar hos **Loopia** (Starter-konto, ingen FTP-hosting)

## Design
| Token | Värde |
|---|---|
| Accent | `#FF4600` |
| Bakgrundsränder | `#DEDEDE`, diagonala, ca 1 px linje / 6–8 px mellanrum |
| Text | `#111` |
| Ordmärke | IBM Plex Mono, glest spärrat, gemener |
| Brödtext | IBM Plex Sans (Regular + SemiBold) |
| Textstorlek | 13 px överallt (även mobil), radavstånd 1.5. Ordmärke 15 px. CSS-variabler i `src/styles/global.css` |

- Länkar: svarta, tunn orange understrykning (1 px, offset 3 px), orange vid hover/focus
- Avdelare: streckade orange linjer
- Kontaktikoner: grå i vila, orange vid hover

## Struktur
1. Header: "mawini studio" + rund logga (`material/logo/MWN_logotype_2025_A2.svg`, fill #FF4600)
2. Intro: "creator of things", kategorier, kontaktikoner
3. Galleri: justified grid (lika radhöjd, bredd efter bildens proportioner, färre per rad på mobil)
4. Om-text
5. Footer

## Texter
- Alla texter och kontaktuppgifter finns i **`src/content/texter.md`** (enda källan)
- Frontmatter: ordmärke, intro, kategorier, footer, kontaktlänkar och meta (sidtitel, beskrivning)
- Brödtexten är om-texten. `**fetstil**` fungerar både i brödtexten och i frontmatter-fälten

## Galleri
- Enda källan: **`src/content/galleri.yaml`**, en post per bild med `file`, `category`, `alt` och valfria `title`, `client`, `year`
- Galleriet har två sektioner, var och en med eget justified grid: först **design** (allt som inte är foto: graphic-design, illustration, other), sedan **photography**. Rubrikerna är feta, samma storlek som brödtexten, och texten står i `src/content/texter.md` (`gallery.design`, `gallery.photography`)
- Ordningen inom varje sektion = ordningen i galleri.yaml. Läses via content collection (`src/content.config.ts`), som validerar fälten
- Bildfilerna ligger i `src/assets/gallery/<category>/`. Ett felstavat filnamn stoppar bygget med ett tydligt fel
- Klick öppnar **lightbox**: pilar, tangentbord, swipe, Esc stänger. Lightboxen bläddrar genom alla bilder i en följd (design → photography → tillbaka till början)
- **Inga bildtexter** visas i gridet. De valfria fälten (title, client, year) visas bara i lightboxen, och bara om de är ifyllda
- Alt-text på alla bilder (fältet `alt`)
- Kategorier: graphic-design, photography, illustration, other

## Eventuellt senare
- Ruta runt länkar (vit botten, tunn orange ram)
- Kategorifilter (OBS: synliga kategorier är nu "design / photography / code / other" medan bildmapparna heter graphic-design, photography, illustration, other – namnen behöver matchas om filter byggs)
- Case-sidor (t.ex. Beaujolais Nouveau-serien)
- Bildkonvertering: skript som skalar källbilder till ca 2400 px, JPG-kvalitet ~85, innan de läggs i src/ (håller nere repots storlek, nu ca 70 MB)

## Lansering (när sajten är klar)
1. Testa lokalt med `npm run build && npm run preview`. Aktivera GitHub Pages (Settings → Pages → Source: GitHub Actions). Obs: adressen mawini-studio.github.io/mawini-web/ visar inte sajten korrekt, eftersom den byggs för domänroten (mawini.com)
2. Loopia: ta bort vidarebefordran på mawini.com. Lägg A-poster för mawini.com mot 185.199.108.153, 185.199.109.153, 185.199.110.153, 185.199.111.153 (AAAA: 2606:50c0:8000::153 … 8003::153) och CNAME för www mot `mawini-studio.github.io`. Ange mawini.com som Custom domain under Settings → Pages
3. **Rör inte MX-posterna** (e-post info@ / mats@mawini.com, mats@killershark.se)
4. mawini.se, mawini.eu, killershark.se, matswnilsson.se → vidarebefordra till https://mawini.com
5. Kontrollera HTTPS, avpublicera Wix

## Öppna frågor
- (inga just nu)

## Beslut
- Filnamn som börjar med `-` döps om vid import (t.ex. `-dsc2079.jpeg` → `dsc2079.jpg`); bilderna ligger i `src/assets/gallery/<kategori>/`

## Status
- [x] Spec: färger, typsnitt, länkstil
- [x] Domän/hosting-plan
- [x] Material: logga + första bildurval
- [x] Texter och kontaktlänkar (`src/content/texter.md`)
- [x] Sätta upp Astro-projekt + Git
- [x] Bygga layout
- [x] Galleri + lightbox
- [x] Deploy till GitHub Pages + DNS-byte för mawini.com (2026-10-21)
- [x] Enforce HTTPS i GitHub
- [x] mawini.se, mawini.eu, killershark.se, matswnilsson.se → 301 till https://mawini.com (Loopia)
- [ ] Avpublicera Wix-sajten och säg upp ev. Wix-abonnemang

## Snabbreferens för Mats
**Redigera själv**
- Texter och kontaktuppgifter: `src/content/texter.md`
- Galleriets ordning och alt-texter: `src/content/galleri.yaml`

**Lägga till en bild**
1. Lägg bildfilen i `src/assets/gallery/<kategori>/` (graphic-design, photography, illustration eller other). Filnamn utan mellanslag, å/ä/ö och inledande bindestreck.
2. Lägg till en post i `src/content/galleri.yaml` där bilden ska synas i ordningen:
   ```yaml
   - file: filnamn.jpg
     category: photography
     alt: Kort beskrivning av bilden
   ```
3. Spara – bilden syns direkt på dev-servern. Fel kategori, saknad alt eller fel filnamn stoppar bygget med ett tydligt felmeddelande.

**VS Code**
- ⌘P öppnar en fil snabbt om du skriver en del av namnet, t.ex. *texter*
- ⇧⌘V förhandsvisar markdown formaterat
- Ändrade filer markeras med **M** i Explorer tills de är committade
