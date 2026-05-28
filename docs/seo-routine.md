# SEO routine for Margem Cool

The canonical per-page SEO process. Every non-utility page is built through these phases. The CLI tools in `scripts/seo/` automate the API-mediated parts.

For utility pages (Contacto, Sobre, Parcerias, Colofão, Privacy) skip Phases 1, 2 and 6. For pillar / place / article pages run the full routine.

## Phases

### 1 — Research

Two parallel NeuronWriter queries per page, one per language, both on `google.pt`.

```bash
npm run seo:brief -- "cacilhas" --lang pt
npm run seo:brief -- "cacilhas" --lang en
```

Briefs land in `seo/briefs/<slug>-<lang>.md` plus a raw JSON dump alongside (gitignored). Cross-check the key terms against Ubersuggest for real volume; drop weird terms; add high-volume terms NeuronWriter missed. **NeuronWriter is one input, not gospel** — `feedback_neuronwriter_not_gospel.md` in the global memory.

### 2 — Plan

From each brief: primary keyword + 3-5 supporting keywords per language. H1/H2/H3 skeleton informed by the competitor structure. The gap between what competitors cover and what users seem to want is where we win.

### 3 — Draft (English first)

Re-read `docs/brand.md` §4 before writing. Voice rules, *tu* register, banned vocabulary, sentence-level grammar. Draft English copy hitting the keyword frequencies, the H1/H2 skeleton, the gap. Generate meta title (≤60 chars), meta description (≤160 chars), JSON-LD (BreadcrumbList + page-type schema).

### 4 — Translate to Portuguese

Translate the locked English into Portuguese. Mark `draft: true`. Flag for Lucia's review before the page leaves draft.

### 5 — Self-review

Each page passes:

- **Useful for residents**: would James (or any Margem Sul resident) actually want this?
- **Clear UX**: actionable info surfaces fast, mobile-readable, consistent layout
- **Brand voice (brand.md §4)**: *tu*, no banned vocabulary, plain language
- **Meta valid**: title and description within limits, JSON-LD parses
- **Cross-references valid**: internal links resolve, `parent_slug` and `place_slugs` point to real entities
- **Word count in ballpark** of the competitor average

Since we don't rely on human review (`project_margem_cool_principles.md`), this self-review is the safety net.

### 6 — Score

```bash
npm run seo -- score <queryId> --html dist/lugares/almada/cacilhas/index.html
```

Iterates against the NeuronWriter score. Below target → adjust supporting term frequencies, push again. The `evaluate-content` endpoint scores without writing back to NW history.

### 7 — Ship

`npm run build` runs the cross-reference validator (`src/utils/validate-refs.ts`). If green, Cloudflare Pages auto-deploys. For automated routines: PR auto-merges only if self-review *and* NW score both pass.

### 8 — Monitor

Monthly: re-score in NW, check Cloudflare Analytics + Google Search Console. Pages past their staleness threshold (`last_updated` field) surface for refresh in the weekly automation pass.

## What gets researched separately for PT vs EN

For every keyword: two queries. PT version on google.pt in Portuguese. EN version on google.pt in English. Different briefs, different competitors, different volumes. PT will typically be 5-20× the EN volume for any given local Margem Sul topic.

## What page types get the full routine

| Page type | Phases that fire |
|---|---|
| **Utility** (Contacto, Sobre, Parcerias, Privacy) | 3 (light), 4, 5, 7 |
| **Homepage** (`/`, `/en/`) | 3, 4, 5, 7 — branded query, no real competition |
| **Pillar landing** (Comer & Beber, etc.) | All 8 |
| **Place page** (Cacilhas, Almada, etc.) | All 8 — highest-value SEO category long-term |
| **Article / feature / guide** | All 8 |

## NeuronWriter CLI commands

```bash
npm run seo:projects             # list all NW projects on the account
npm run seo:brief -- "<kw>" --lang pt
npm run seo:brief -- "<kw>" --lang en
npm run seo -- queries           # list existing queries in margemcool.pt
npm run seo -- score <id> --html <file>
```

Briefs save to `seo/briefs/`. The CLI lives at `scripts/seo/cli.mjs`. API client at `scripts/seo/neuronwriter.mjs`. Brief formatter at `scripts/seo/format-brief.mjs`.

The NeuronWriter project ID for Margem Cool is **a0a84277fc3b8868** (project name `margemcool.pt`). Default engine google.pt, default language Portuguese; the EN brief overrides language per query.
