# Margem Cool — working notes for Claude

This file loads automatically whenever Claude Code starts in this repo. It carries the lessons and constraints that matter most for working on Margem Cool. Read it before doing anything.

## The three canonical references

**`docs/brand.md`** — editorial, visual, vocabulary. The constraints all visual and editorial work must respect.
**`docs/architecture.md`** — entity model, taxonomy, URL structure. The constraints all code must respect.
**`docs/claude-code-handover.md`** — what was built in Phase 0 and what Phase 1 looks like.

When in doubt about a brand/editorial decision, defer to `brand.md`. When in doubt about a structural/technical decision, defer to `architecture.md`. Don't reopen committed decisions without explicitly raising the question first.

## What this project is

A bilingual editorial publication of the Margem Sul, written from where we live, in Portuguese and English. Run by James (and Lucia, native Portuguese speaker). Not a property site. Not a tourism guide. Not content marketing. A real publication aspiring to become a regional institution.

## Operating principles for this project

Load-bearing. Every architectural and content decision should be checked against them. The full canonical version lives in `project_margem_cool_principles.md` in the global memory.

1. **Near-total automation.** Weekly automated content drops with minimal James input. Engineer the routine, not the exception. Don't rely on human review as the safety net — self-review against these principles is the safety net.
2. **Simple, robust, fast, efficient systems.** Every system in this repo — schemas, generators, scrapers, build pipelines, scheduled routines — should be simple to understand, robust to changes, fast at runtime, efficient in resources. Weigh options on all four.
3. **Genuinely useful for residents.** The test for any page or feature: would James (or any Margem Sul resident) actually want this? Not "is this impressive editorial". Just: is it useful?
4. **Clear and simple UX.** The interface and design — pages look like the answer to the user's question, actionable parts surface first, layout is consistent across page types, no decorative chrome that doesn't earn its place, mobile-readable. (Writing voice is governed by `brand.md` §4, not by this principle.)

## Framing

Margem Cool is a **useful content site about the Margem Sul**. That's the honest framing. The earlier "editorial publication aspiring to become a regional institution" framing in `brand.md` has been relaxed — content sites can be useful, this one will be, and it may grow into more over time. The brand voice (peer-to-peer, *tu* register, no banned vocabulary) still applies because it produces clear useful content. The "publication" scaffolding doesn't.

## Operating posture for this repo

- **Push and deploy without reserve through ~2026-06-25.** No real visitors yet — every change goes straight to `main` and Cloudflare auto-deploys. Don't ask "shall I push?". See `project_margem_cool_free_deploy.md` in the global memory for the time-bound version.
- **The build must pass before pushing.** `npm run build` runs schema and cross-reference validation. Broken builds are not "live without reserve", they're broken.
- **Portuguese content needs Lucia's review.** Anything new in Portuguese is `draft: true` until she clears it.
- **Draft and discuss in English first, translate to Portuguese after.** James's English is stronger than his Portuguese. Show him EN copy for review; PT comes once EN is locked. See `feedback_english_first_then_translate.md`.

## Hard-won lessons from this session (2026-05-27 / 28)

**When James reports the same problem more than once and your fix doesn't land, STOP and ask what specifically isn't right. Do not invent a new theory and present it as a question to validate.**

The failure mode: he said the wordmark was clipping. I fixed the math, it still looked wrong to him, so I jumped to "the curve looks unpolished" and proposed a simpler curve. He said yes, but he was only validating my self-generated diagnosis — not asking for a new river. The simpler curve looked worse, and the iteration cost an hour. When he then said *"the actual file is fine, it's just how it's being used"*, that was the answer he'd been giving all along; I'd been changing the wrong thing.

**Rules that come out of that:**
- When the user reports a visual problem, ask what specifically looks wrong before changing anything. A screenshot is a description of the symptom, not the diagnosis.
- "Yes" to my own suggestion is not the same as fresh direction. Don't infer it as approval to make bigger changes.
- If the user explicitly says "the file is fine, the usage is wrong" — fix usage, not the file. Even if you have a theory about the file.
- Stop iterating on the same area after the second failed fix. Step back and ask.

## The wordmark setup as it stands

- Generator: `scripts/build-wordmark-svg.mjs` traces Outfit SemiBold glyphs via opentype.js and composes the l-stem and river paths. Re-run with `node scripts/build-wordmark-svg.mjs`.
- Output: `public/wordmark.svg` (horizontal) and `public/wordmark-stacked.svg` (hero use).
- Both SVGs carry an embedded `<style>` block with `prefers-color-scheme` so they adapt to dark mode.
- Components inline the SVG via Astro's `?raw` import — when SVG is loaded via `<img>` the embedded style block can get ignored by some browsers and class-based fills don't apply. Inline embedding fixes that.
- **Don't change the river path lightly.** James committed to the multi-bezier river-into-l gesture. If something looks wrong about the wordmark, the answer is usually in how it's being placed in a layout, not in regenerating the curve.

## The site map as built in Phase 0

- 9 concelhos + 39 freguesias seeded as placeholder Places at `src/content/places/`
- Hierarchy encoded by directory layout — `places/almada/cacilhas.md` has slug `almada/cacilhas`, `parent_slug: "almada"`
- 6 pillar stubs in each language at `src/pages/{pillar}/index.astro` and `src/pages/en/{pillar}/index.astro`
- BaseLayout at `src/layouts/BaseLayout.astro` handles hreflang, canonical, OG, JSON-LD
- Cross-reference validation in `src/utils/validate-refs.ts` runs via `getStaticPaths`

## Domain setup

- Canonical: `margemcool.pt`. PT-first matches the brand brief.
- `margemcool.com` → redirects to `margemcool.pt` via Cloudflare Bulk Redirect rules.
- Hosting: Cloudflare Pages. Repo: `jls9-dev/margem-cool` on GitHub.
- Robots.txt blocks AI training crawlers (GPTBot, Google-Extended, ClaudeBot, CCBot, etc.), allows search and AI live-retrieval bots. Cloudflare's "Manage Robots.txt" should stay OFF.

## When something feels off

Re-read this file. Then re-read `brand.md` and `architecture.md`. Then ask James what specifically isn't working before changing anything.
