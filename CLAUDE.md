# Margem Cool — working notes for Claude

This file loads automatically whenever Claude Code starts in this repo. Read it before doing anything.

## First read

Always start with [`docs/README.md`](docs/README.md). It maps the documentation structure. The two index files you'll most often consult:

- **[`docs/standards/README.md`](docs/standards/README.md)** — what's true about the project (brand, architecture, page patterns). Read the relevant standard before doing any work that touches that area.
- **[`docs/processes/README.md`](docs/processes/README.md)** — how we do things (SEO routine, place-page workflow, automation). Read the relevant process before running it.

When in doubt about the project's framing or principles, the source of truth is the principles section below + the canonical standards in `docs/standards/`.

## Operating principles for this project

Load-bearing. Every architectural and content decision should be checked against them. The full canonical version lives in `project_margem_cool_principles.md` + `project_margem_cool_must_be_cool.md` in the global memory.

0. **Margem Cool has to actually be cool.** The name is a brand promise. Every page must be visually interesting, varied per section, with the brand palette (rust + teal) present, the river curve appearing as a layout element, and presentation that earns the name. Walls of monotone cream text are an immediate fail. Think component-first per section: timeline for histories, cards for restaurants, bigger numerals for facts, pull-quotes for striking lines. Don't overwhelm — variety with restraint — but don't be boring either. See `project_margem_cool_must_be_cool.md`.
1. **Near-total automation.** Weekly automated content drops with minimal James input. Engineer the routine, not the exception. Don't rely on human review as the safety net — self-review against these principles is the safety net.
2. **Simple, robust, fast, efficient systems.** Every system in this repo — schemas, generators, scrapers, build pipelines, scheduled routines — should be simple to understand, robust to changes, fast at runtime, efficient in resources. Weigh options on all four.
3. **Genuinely useful for residents.** The test for any page or feature: would James (or any Margem Sul resident) actually want this? Not "is this impressive editorial". Just: is it useful?
4. **Clear and simple UX.** Mobile-readable, actionable parts surface first, layout consistent across page types, no decorative chrome that doesn't earn its place. (Writing voice is governed by `docs/standards/brand.md` §4, not by this principle. Visual variety is governed by principle 0, not by this one.)

## Framing

Margem Cool is a **useful content site about the Margem Sul**. The brand voice (peer-to-peer, *tu* register, no banned vocabulary) still applies because it produces clear useful content. The "publication aspiring to become an institution" framing has been relaxed — content sites can be useful, this one will be, and it may grow into more over time.

## Before drafting any user-facing copy

**Re-read `docs/standards/brand.md` §4** — voice principles, *tu* register, Portuguese terms in English, banned vocabulary (EN + PT), sentence-level grammar, specific stylistic rules. Writing can be eloquent and interesting but must respect the rules.

## Operating posture for this repo

- **Push and deploy without reserve through ~2026-06-25.** No real visitors yet — every change goes straight to `main` and Cloudflare auto-deploys. Don't ask "shall I push?". See `project_margem_cool_free_deploy.md` in the global memory.
- **The build must pass before pushing.** `npm run build` runs schema and cross-reference validation. Broken builds are not "live without reserve", they're broken.
- **Portuguese content needs Lucia's review.** Anything new in Portuguese is `draft: true` until she clears it.
- **Draft and discuss in English first, translate to Portuguese after.** James's English is stronger than his Portuguese. Show him EN copy for review; PT comes once EN is locked. See `feedback_english_first_then_translate.md`.

## Hard-won lessons

**When James reports the same problem more than once and the fix doesn't land, STOP and ask what specifically isn't right. Do not invent a new theory and present it as a question to validate.** A screenshot is a description of the symptom, not the diagnosis. "Yes" to my own suggestion is not the same as fresh direction. If he explicitly says "the file is fine, the usage is wrong" — fix usage, not the file. Stop iterating after the second failed fix; step back and ask.

## The wordmark setup as it stands

- Generator: `scripts/build-wordmark-svg.mjs` traces Outfit SemiBold glyphs via opentype.js and composes the l-stem and river paths. Re-run with `node scripts/build-wordmark-svg.mjs`.
- Output: `public/wordmark.svg` (horizontal) and `public/wordmark-stacked.svg` (hero use). Print PNGs at `public/brand/`.
- Both SVGs carry an embedded `<style>` block with `prefers-color-scheme` so they adapt to dark mode.
- Components inline the SVG via Astro's `?raw` import — when SVG is loaded via `<img>` the embedded style block can get ignored by some browsers and class-based fills don't apply. Inline embedding fixes that.
- **Don't change the river path lightly.** James committed to the multi-bezier river-into-l gesture. If something looks wrong about the wordmark, the answer is usually in how it's being placed in a layout, not in regenerating the curve.

## The site map as built in Phase 0

- 9 concelhos + 39 freguesias seeded as placeholder Places at `src/content/places/`
- Hierarchy encoded by directory layout — `places/almada/cacilhas.md` has slug `almada/cacilhas`, `parent_slug: "almada"`
- 6 pillar stubs in each language at `src/pages/{pillar}/index.astro` and `src/pages/en/{pillar}/index.astro`
- BaseLayout at `src/layouts/BaseLayout.astro` handles hreflang, canonical, OG, JSON-LD
- Cross-reference validation in `src/utils/validate-refs.ts` runs via `getStaticPaths`
- Slim sticky header with mobile hamburger drop-down; footer with pillar + publication link columns

## Domain setup

- Canonical: `margemcool.pt`. PT-first matches the brand brief.
- `margemcool.com` → redirects to `margemcool.pt` via Cloudflare Bulk Redirect rules.
- Hosting: Cloudflare Pages. Repo: `jls9-dev/margem-cool` on GitHub.
- Robots.txt blocks AI training crawlers (GPTBot, Google-Extended, ClaudeBot, CCBot, etc.), allows search and AI live-retrieval bots. Cloudflare's "Manage Robots.txt" should stay OFF.
- NeuronWriter project: `margemcool.pt` (ID `a0a84277fc3b8868`). API key at `~/.claude/projects/-Users-jameslumley-savile/secrets/neuronwriter.key`. SEO CLI at `scripts/seo/`.

## When something feels off

Re-read this file. Then re-read the relevant standard in `docs/standards/`. Then ask James what specifically isn't working before changing anything.
