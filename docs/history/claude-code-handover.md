# Claude Code Handover — Margem Cool

> **Status**: archived · **Last reviewed**: 2026-05-29 · **Type**: history (one-off record from Phase 0 handover; not actively maintained)

This document was the original handover from the design conversation to the Claude Code session that built Phase 0. Phase 0 is complete; this document is kept for historical context. For current canonical references see `docs/standards/` and `docs/processes/`.

The two companion documents (`brand.md` and `architecture.md`) are the canonical references for editorial and technical decisions respectively. This document is operational — it tells you what to do, in what order.

---

## Project status at handover

**Phase**: 0 (foundation, not yet started)
**Date of handover**: late May 2026
**Codebase state**: empty repo, three documentation files (`brand.md`, `architecture.md`, this file) and `README.md`. No Astro project initialised, no schemas implemented, no content yet.
**Brand state**: fully defined and committed. See `brand.md`.
**Architecture state**: fully designed and committed. See `architecture.md`.

The conversational work that produced this state ran for many hours across multiple sessions and explored a large design space. The decisions in the two reference documents are the committed outcomes of that work. Do not re-open decisions documented as committed unless you have a specific reason to — and if you do, raise it explicitly with the user before changing direction.

---

## Project owner context

- **Name**: James
- **Location**: Belverde (Seixal concelho, Fernão Ferro freguesia), Portugal
- **Other businesses**: South Bank Real Estate (southbank.pt — Margem Sul property), Lisbon Property (lisbonproperty.pt — Lisbon buyer's agent), Spandera Studio (spandera.studio — creative studio)
- **Co-collaborator on this project**: Lucia, who is a native Portuguese speaker and provides the language calibration that AI cannot reliably deliver. Defer to her judgement on any Portuguese-language register, idiom, or phrasing question.
- **Technical setup**: VSCodium + Claude Code, Astro/Cloudflare Pages/GitHub workflow, comfortable with TypeScript, prefers privacy-respecting open-source tooling
- **Voice with the user**: direct, concise, British English, no buzzwords, no marketing-speak. Match the editorial voice of the project itself.

---

## What to do first

### Step 1 — Read the documentation

Before writing any code:

1. Read `README.md` (top-level orientation)
2. Read `docs/standards/brand.md` (editorial and visual constraints)
3. Read `docs/standards/architecture.md` (technical structure)
4. Read this document in full

These are not optional. The decisions in them are committed. Building without reading them will produce work that has to be redone.

### Step 2 — Confirm the working environment

Verify the environment is ready:

```bash
node --version   # Should be 20+ for current Astro
npm --version    # Should be 10+
git status       # Should be clean
```

If anything's missing, install before proceeding. The project assumes a recent Node, npm, and git.

### Step 3 — Initialise the Astro project

Create the Astro project structure in the existing repo. Do not use the Astro starter templates — they include design choices the project explicitly rejects (e.g. unnecessary CSS frameworks, irrelevant example content). Instead, set up the project manually with just the parts needed.

```bash
npm create astro@latest -- --template minimal --typescript strict --no-install --skip-houston .
```

After init, install:

```bash
npm install
npm install @astrojs/sitemap @astrojs/rss
```

Confirm the project builds (even if empty):

```bash
npm run build
npm run dev
```

The empty site should be visible at localhost. This confirms the environment.

### Step 4 — Implement the Zod schemas

This is the first real code task. Open `docs/standards/architecture.md` and translate the five entity schemas (Place, Establishment, Service, Beach/Outdoor, Event) plus the Article schema into `src/content/config.ts`.

The schemas in `architecture.md` are normative. Implement them as written. The exception: where the architecture document says "TBD" or marks a decision as open, use the recommendation in section 9 of `architecture.md` for the default and note in code comments that the decision can be revisited.

After implementing:

1. Run `npm run build` — should pass with empty content collections
2. Add a single test Place file (a concelho — start with Almada as a placeholder) and confirm the build picks it up and validates it
3. Deliberately introduce a schema violation in the test file and confirm the build fails — this proves validation is working

### Step 5 — Seed the canonical place hierarchy

The 9 concelhos and 39 freguesias of the Margem Sul are a known fixed list. Create placeholder Place files for all of them so the geographic hierarchy is in place from day one, even before content is written.

Concelhos: Almada, Seixal, Sesimbra, Setúbal, Palmela, Barreiro, Moita, Montijo, Alcochete.

The full freguesia list is in `architecture.md` section 9 or can be verified via `geoapi.pt` if needed. Each freguesia file should reference its concelho via `parent_slug`.

For each placeholder Place, populate:
- `slug`, `level`, `name_pt`
- `parent_slug` for freguesias
- `pt.short_description` (one sentence, can be improved later)
- `pt.page_status: 'placeholder'`
- `en.short_description` (one sentence translation)
- `en.page_status: 'placeholder'`
- `last_updated: new Date()`

Don't worry about geo data, population figures, or anything else for this seeding. Just get the hierarchy in place.

After seeding, the build should validate all parent_slug references. Run `npm run build` and confirm zero errors.

### Step 6 — Build the brand components

Three brand components are the foundation of the visual identity:

1. **`src/components/brand/Wordmark.astro`** — the stacked *margem cool* wordmark with the *l*-into-river. Inline SVG for crisp rendering at any size. The river path is the specific curve we committed to. Props: `size` (controls the wordmark dimensions), `monochrome` (boolean — when true, renders entirely in the current text colour for reverse contexts).

2. **`src/components/brand/MastheadLockup.astro`** — the full masthead: wordmark + *Análise atenta* descriptor + *A Margem Sul, sem filtros* tagline. Used in headers and About pages. Props: `compact` (boolean — for compact contexts, renders the single-line variant; default is two-line).

3. **`src/components/brand/MCMonogram.astro`** — the MC monogram for compact contexts. Serif letterforms with integrated river element. Props: `variant` ('open' or 'contained') and `size`.

These three components are heavily used throughout the site. Build them carefully with proper SVG so they render crisply at any size and respect the colour tokens.

### Step 7 — Set up design tokens

Create `src/styles/tokens.css` with custom properties for all design tokens:

```css
:root {
  /* Colour palette — Industrial Coast */
  --mc-teal: #0F5C5D;
  --mc-rust: #B85C38;
  --mc-cream: #F5F1E8;
  --mc-charcoal: #1F2328;
  --mc-cool-grey: #8A949E;
  
  /* Dark mode equivalents */
  --mc-teal-dark: #1F7A7C;
  --mc-rust-dark: #D17347;
  
  /* Semantic colour roles */
  --color-background: var(--mc-cream);
  --color-text: var(--mc-charcoal);
  --color-accent: var(--mc-rust);
  --color-brand: var(--mc-teal);
  --color-text-secondary: var(--mc-cool-grey);
  
  /* Typography */
  --font-display: 'Outfit Variable', system-ui, sans-serif;
  --font-body: 'Source Serif 4', Georgia, serif;
  
  /* Type scale */
  --type-wordmark: 92px;
  --type-hero: 56px;
  --type-h1: 44px;
  --type-h2: 28px;
  --type-h3: 22px;
  --type-lead: 20px;
  --type-body: 18px;
  --type-small: 14px;
  --type-caption: 13px;
  
  /* Mobile sizes */
  --type-hero-mobile: 36px;
  --type-h1-mobile: 32px;
  --type-h2-mobile: 24px;
  --type-body-mobile: 17px;
  
  /* Vertical rhythm — base unit 8px */
  --space-xs: 8px;
  --space-sm: 16px;
  --space-md: 24px;
  --space-lg: 32px;
  --space-xl: 48px;
  --space-2xl: 64px;
  --space-3xl: 80px;
  
  /* Layout */
  --max-page-width: 1200px;
  --content-column: 720px;
  --wide-section: 1080px;
  
  /* Line heights */
  --leading-body: 1.6;
  --leading-display: 0.95;
  --leading-headline: 1.15;
}

@media (prefers-color-scheme: dark) {
  :root {
    --color-background: var(--mc-charcoal);
    --color-text: var(--mc-cream);
    --color-accent: var(--mc-rust-dark);
    --color-brand: var(--mc-teal-dark);
  }
}
```

This file is included in `BaseLayout.astro` and every other style file references these tokens.

### Step 8 — Set up self-hosted fonts

Download the variable-weight versions of Outfit and Source Serif 4 from Google Fonts:

- https://fonts.google.com/specimen/Outfit (variable, weights 100–900)
- https://fonts.google.com/specimen/Source+Serif+4 (variable, weights 200–900, with italics)

Place the `.woff2` files in `public/fonts/`. Reference them via `@font-face` in `src/styles/base.css`:

```css
@font-face {
  font-family: 'Outfit Variable';
  src: url('/fonts/Outfit-Variable.woff2') format('woff2-variations');
  font-weight: 100 900;
  font-display: swap;
}

@font-face {
  font-family: 'Source Serif 4';
  src: url('/fonts/SourceSerif4-Variable.woff2') format('woff2-variations');
  font-weight: 200 900;
  font-display: swap;
}

@font-face {
  font-family: 'Source Serif 4';
  src: url('/fonts/SourceSerif4-Italic-Variable.woff2') format('woff2-variations');
  font-weight: 200 900;
  font-style: italic;
  font-display: swap;
}
```

This keeps the publication independent of Google's hosting and improves both performance and privacy.

### Step 9 — Build the base layout

`src/layouts/BaseLayout.astro` is the wrapper for every page. It should:

- Set the HTML language attribute correctly per-page
- Include the design tokens and base styles
- Render a header with the masthead lockup
- Render the navigation (placeholder for now — will be built out in step 11)
- Render a footer with the secondary tagline *O outro lado* and the MC monogram
- Include hreflang link tags for the alternate-language version
- Include a single JSON-LD script with the page's structured data

Build this carefully — every page inherits from it.

### Step 10 — Build the homepage placeholder

`src/pages/index.astro` is the Portuguese homepage. For Phase 0, build a placeholder homepage that:

- Renders the full masthead lockup centred
- Shows a hero phrase (something like *Em construção — estamos a construir uma publicação da Margem Sul. Volta em breve.*)
- Links to the placeholder About page
- Establishes the visual identity

This is not the launch homepage; it's a Phase 0 placeholder that demonstrates the brand and architecture are working. The real homepage with content comes in Phase 1.

### Step 11 — Build the navigation

The publication's primary navigation, even at placeholder stage:

Portuguese: *Início · Lugares · Comer & Beber · Praia & Natureza · Cultura · Viver Aqui · Sobre*
English equivalent.

The pillar pages are all stubs at this stage — they just render a "coming soon" placeholder with the masthead. The Lugares page lists the 9 concelhos with their placeholder Place pages.

This proves the routing works end-to-end.

### Step 12 — Set up the build pipeline

- Create the GitHub repo (if not already created)
- Push the initial codebase
- Connect to Cloudflare Pages
- Configure the build (Astro static, output to `dist/`)
- Confirm the first deploy succeeds
- Confirm `margemcool.com` and `margemcool.pt` resolve correctly (or set them up if not already)
- Set up branch-deploy previews so changes can be reviewed before merge
- Add the basic redirects: `/pt/` → `/`, etc.

### Step 13 — Establish the validation workflow

Before considering Phase 0 complete:

1. Confirm `npm run build` fails appropriately on schema violations (test with deliberate bad input)
2. Confirm broken `parent_slug` references fail the build
3. Confirm broken `translation_of` references fail the build
4. Confirm the build is fast (under 30 seconds for empty/placeholder content)
5. Document the validation rules in a top-level `CONTRIBUTING.md` so future contributors know what they're committing to

### Step 14 — Document deviations

If during Phase 0 work you make any decisions that aren't covered in `brand.md` or `architecture.md`, document them. Either:

- Update the relevant doc with the new decision, or
- Add a `CHANGELOG.md` entry noting the deviation and reasoning

This is the project's institutional memory. Don't lose decisions to git history alone.

---

## What success looks like at end of Phase 0

When the following are all true, Phase 0 is complete and Phase 1 (content) can begin:

- [ ] Astro project initialised and building cleanly
- [ ] All five entity schemas (Place, Establishment, Service, Beach/Outdoor, Event) implemented in `src/content/config.ts` matching `architecture.md`
- [ ] Article schema implemented
- [ ] Zod validation working — confirmed by deliberately failing a build
- [ ] Cross-reference validation working — broken parent_slug, place_slug, translation_of all caught at build time
- [ ] All 9 concelhos and all 39 freguesias exist as placeholder Place files
- [ ] Wordmark, MastheadLockup, MCMonogram brand components built and used in the BaseLayout
- [ ] Design tokens defined in tokens.css and referenced throughout
- [ ] Self-hosted fonts working — Outfit and Source Serif 4 rendering correctly with Portuguese diacritics
- [ ] BaseLayout in use across all pages
- [ ] Placeholder homepage rendering correctly in both languages
- [ ] Pillar pages exist as stubs
- [ ] Navigation works end-to-end
- [ ] hreflang tags generated correctly
- [ ] JSON-LD generation working for the page types built so far
- [ ] Build pipeline live on Cloudflare Pages, both domains resolving
- [ ] CONTRIBUTING.md documents how to add content and what validation expects

This is roughly 2–4 weeks of focused work. Don't rush — the foundation determines everything that comes after. A solid Phase 0 makes Phase 1 fast; a sloppy Phase 0 makes the whole project slow.

---

## What Phase 1 looks like (after Phase 0)

Phase 1 is the content launch. Don't start it until Phase 0 is fully complete.

Phase 1 produces:

- All 9 concelho overview pages with real (not placeholder) content
- 4–6 fully built area pages (the launch triad: Cacilhas in Almada, Setúbal city centre, Palmela/Azeitão — plus 1–3 more spread across other concelhos)
- 6 anchor articles, one per pillar, each genuinely good
- Working About page in both languages
- RSS feeds in both languages
- The homepage actually populated with featured content

Phase 1 is roughly 6–10 weeks of work depending on writing pace.

---

## Operating notes for working with the user

### Decisions and pushback

The user has thought hard about this project's brand, voice, and architecture. The decisions in the reference documents are committed. Do not propose alternatives to committed decisions unless there's a specific reason — and if you do, raise it explicitly rather than acting on it.

When working on something not covered by the references, infer from principles and ask for confirmation. The user is capable of making decisions; don't hide them in commits.

### Portuguese content

Any Portuguese-language content you write or modify must be reviewed by Lucia before commit. The user has noted that AI tools (including Claude) consistently miss native-speaker register and idiom issues. The fix is process: nothing in Portuguese ships without native review. Build this assumption into your workflow.

In practice: when you write Portuguese content, mark it `draft: true` in the front matter and surface it for Lucia's review. Only after she clears it does `draft` flip to `false`.

### Voice in commits and PRs

Commit messages match the publication's voice: clear, concise, direct, no marketing language. Examples:

Good:
- `add Place schema and 9 concelho placeholders`
- `fix translation_of validation for English articles`
- `MC monogram contained variant for favicon`

Avoid:
- `✨ Feat: amazing new schemas! 🚀`
- `Beautiful improvements to validation`
- `Refactor for better DX and DevX`

### What to escalate vs handle independently

Handle independently:
- Anything covered explicitly by `brand.md` or `architecture.md`
- Implementation details of committed decisions
- Bug fixes
- Performance optimisations within the performance budget
- Accessibility improvements

Escalate to user:
- Anything affecting the published Portuguese content (always — Lucia must review)
- Architectural decisions not covered by `architecture.md`
- Adding new dependencies (especially anything that hosts data externally or sends to third parties)
- Changes to brand vocabulary, palette, typography
- Changes to the entity model
- Anything affecting the public URL structure once a URL has been published

### The repository philosophy

The repository is the source of truth. Decisions live in committed files (docs, code, content), not in conversations or external tools. If a decision matters enough to make, it matters enough to commit.

The repository is also durable. The publication should be readable in 10 years. Don't make decisions that lock the publication into a service that might disappear. Cloudflare Pages and GitHub are reasonable platform commitments; everything else should be portable.

---

## Glossary of terms used in this project

For quick reference. See `brand.md` and `architecture.md` for fuller context.

- **Margem Sul** — the nine concelhos on the south side of the Tejo (also called the Península de Setúbal in administrative contexts)
- **Concelho** — a municipality (the 9 of them in the Margem Sul)
- **Freguesia** — a civil parish (39 in the Margem Sul after the 2013 reform)
- **Bairro** — a neighbourhood, informal
- **Lugar** — a named place smaller than a bairro
- **Pillar** — one of the publication's six content categories (Comer & Beber, Praia & Natureza, Lugares & Bairros, Cultura & Agenda, Viver Aqui, Dormir; plus Margem Cool Recomenda at maturity)
- **Tasca** — a small informal Portuguese eatery, has no English equivalent
- **Pastelaria** — a Portuguese-style café-bakery serving cakes, coffee, sometimes light food
- **Junta de Freguesia** — the elected local administration of a freguesia
- **Câmara Municipal** — the elected local administration of a concelho
- **Colectividade** — a community/cultural/sports association, often historic, often the social heart of a neighbourhood
- **Festa popular** — a community celebration, often religious in origin, often annual
- **Caderneta predial** — the official Portuguese property identity document
- **AMI licence** — the licence required to operate as a real estate agent in Portugal (relevant context for the user's other businesses, not this project)

---

## Final note

This project is a real publication aspiring to become a regional institution. It's not a side project, not a content-marketing operation, not a property-business front. The standards are accordingly high: the writing, the visual identity, the architecture, the build quality all matter and all need to hold up over years.

Build it like that.

*Margem Cool · Análise atenta · A Margem Sul, sem filtros · O outro lado*
