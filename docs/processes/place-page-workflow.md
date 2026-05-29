# Place-page workflow

> **Status**: stub · **Last reviewed**: 2026-05-29 · **Type**: process

The end-to-end workflow for building one place page (concelho / freguesia / bairro / lugar), from NeuronWriter brief to live page. Generalises the Cacilhas pilot.

## To be written

This document will be filled in once the Cacilhas pilot has been run end-to-end. Expected sections:

1. **Pulling the briefs** — `npm run seo:brief` PT + EN, with the v2 formatter
2. **Filtering competitors** — which SERP entries to read, which to ignore. Tie to `seo-routine.md` Phase 1.
3. **Outlining the page** — taking the brief's intent-bucketed sections and translating into the canonical place-page section structure
4. **Writing the English** — drafting against the brief, hitting term frequencies naturally, respecting `brand.md` §4 (voice)
5. **Translating to Portuguese** — EN as master, mark `draft: true`, flag for Lucia
6. **Building the page** — populating the Place collection front matter (facts, FAQ, related links), letting the template render
7. **Self-review** — using `content-quality-checklist.md`
8. **Scoring** — `npm run seo -- score` against both PT and EN queries; iterate if below target
9. **Shipping** — commit, push, watch the build, confirm live

Until written, follow `seo-routine.md` for the high-level process and refer to `page-patterns.md` for the structural template.
