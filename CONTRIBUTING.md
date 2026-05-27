# Contributing to Margem Cool

This document records the working rules for adding content and code. The canonical references are `docs/brand.md` (editorial and visual) and `docs/architecture.md` (technical and structural). This file is the working how-to.

## Running the project

```bash
npm install     # one-off
npm run dev     # local dev at http://localhost:4321
npm run build   # production build, runs full validation
npm run preview # serve the dist/ output locally
```

A successful build produces every page in `dist/`. Build time should stay under a few seconds while content is still small.

## Adding content

### Adding a Place (concelho, freguesia, bairro, lugar)

Places live in `src/content/places/`. The directory layout mirrors the hierarchy:

```
src/content/places/
├── almada.md                              # concelho "almada"
├── almada/
│   ├── cacilhas.md                        # freguesia "almada/cacilhas"
│   └── almada-cova-da-piedade-pragal-e-cacilhas.md
└── seixal.md
```

A Place's slug is its file path without `.md`. Cross-references use this same identifier.

Required front matter (see `architecture.md` §3.1 for the full schema):

```yaml
---
level: freguesia          # concelho | freguesia | bairro | lugar
name_pt: "Cacilhas"
name_en: "Cacilhas"       # optional
parent_slug: "almada"     # omitted for concelhos
pt:
  short_description: "..."   # max 280 characters
  page_status: placeholder    # placeholder | thin | developed | comprehensive
en:
  short_description: "..."
  page_status: placeholder
last_updated: 2026-05-27
draft: false
---
```

### Adding an Establishment, Service, Beach or Event

Flat under each collection directory. File name becomes the slug. See `architecture.md` §3 for the full schemas. Cross-references to Places use the Place's slug (e.g. `almada/cacilhas`).

### Adding an Article

Articles are paired by `translation_of`. The Portuguese article is the original; the English article points to it.

```
src/content/articles/
├── pt/
│   └── onde-comer-em-cacilhas.md          # original
└── en/
    └── onde-comer-em-cacilhas.md          # translation_of: "onde-comer-em-cacilhas"
```

The English slug stays in Portuguese for pairing stability (see `architecture.md` §9.2). The English `title` and body are translated; only the URL slug remains Portuguese.

## What the build validates

Validation runs in `src/utils/validate-refs.ts` and is called from any page that needs cross-referenced data. The build fails on:

- **Schema violations**: missing required fields, wrong types, value outside an enum, `short_description` over 280 chars.
- **Slug format**: must match `[a-z0-9-]+(/[a-z0-9-]+)*`. ASCII only, hyphens, optional slash for nesting.
- **Place hierarchy violations**: a freguesia must have a concelho parent; a bairro must have a freguesia parent; a concelho cannot have `parent_slug`.
- **Broken references**: any `parent_slug`, `place_slugs`, `service_area_slugs`, `venue_establishment_slug`, `organiser_establishment_slug`, `establishment_slugs` pointing to a slug that does not exist.
- **Translation pairing**: every English article must have `translation_of` pointing to a real Portuguese article.

Test that validation works by deliberately introducing a broken reference — `npm run build` should refuse to complete.

## Brand and editorial constraints

These are enforced by review, not by code. Before committing content, check:

- Portuguese uses `tu` register, not `você` in singular. Pronouns mostly dropped.
- English uses the Portuguese place names with diacritics (Setúbal not Setubal, Belém not Belem).
- Portuguese terms with no clean English equivalent (tasca, pastelaria, pousada, junta de freguesia, colectividade, festa, freguesia, concelho, bairro) are used naturally in English without italicisation.
- None of the banned vocabulary in `brand.md` §4.7 / §4.8. *Authentic, hidden gem, must-visit, charming, vibrant* — never.
- "In the Margem Sul", not "on the Margem Sul".
- Dates and times use locale-appropriate formats: PT `27 de maio de 2026, 19h00`; EN `27 May 2026, 7pm`.
- No exclamation marks. Almost never.

## Portuguese content needs Lucia's review

AI tools consistently miss native-speaker register and idiom issues. Any Portuguese content drafted by Claude or another AI must be reviewed by Lucia before the page leaves `draft: true`. Mark new Portuguese content as drafts and surface for review.

## Commit messages

Match the publication's voice. Clear, concise, direct.

Good:
- `add Place schema and 9 concelho placeholders`
- `fix translation_of validation for English articles`
- `MC monogram contained variant for favicon`

Avoid:
- `✨ Feat: amazing new schemas! 🚀`
- `Beautiful improvements to validation`
- `Refactor for better DX`

## Brand assets

The wordmark, masthead lockup, and MC monogram are in `src/components/brand/`. They are inline SVG so they inherit the page's font and respond to the colour tokens. Do not import them as static image files.

Design tokens are in `src/styles/tokens.css`. Five colours of the Industrial Coast palette and one type scale. No other colours should be introduced.

## Open decisions to revisit

The freguesia list seeded in Phase 0 is best-effort and based on the 2013 administrative reform. Before the publication launches publicly, Lucia should verify each freguesia name against the official municipal record (geoapi.pt or the Câmara Municipal sites). Names with diacritics may need attention.
