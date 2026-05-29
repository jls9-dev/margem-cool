# Standards — what is true about Margem Cool

Canonical documents describing the project's brand, voice, architecture, and patterns. Read before doing any work that touches the area.

## Documents

| Doc | Status | What it covers | Read before… |
|---|---|---|---|
| [brand.md](brand.md) | canonical | Brand identity, voice, vocabulary, visual system, banned terms, editorial principles | Drafting any user-facing copy, building any UI |
| [architecture.md](architecture.md) | canonical | Entity model, URL structure, content schemas, validation rules, Schema.org mapping | Touching content collections, routes, the data model |
| [page-patterns.md](page-patterns.md) | canonical | Page structure patterns derived from LP and SBRE — hero, facts panel, sections, FAQ, JSON-LD `@graph` | Building or extending a page template |
| [colour-policy.md](colour-policy.md) | canonical | Background-tone rules — what each tone means, when to use it, what it rules out | Designing any new component or section; deciding on backgrounds |

## Stubs (to be written)

| Doc | Status | What it will cover |
|---|---|---|
| visual-identity.md | not yet written | If/when we split the visual side of brand.md into its own document — palette, type, wordmark, logo applications |
| voice.md | not yet written | If/when we split the writing-voice side of brand.md into its own document — register, tu form, banned vocabulary, sentence rules |
| vocabulary.md | not yet written | The canonical list of Portuguese terms used freely in English and English terms used in Portuguese — currently lives inside brand.md §4.6 |
| seo-strategy.md | not yet written | High-level SEO posture — how PT and EN compete, priority of place pages, long-tail strategy, what "winning" looks like |

## Conventions

- Every doc starts with `> **Status**: ... · **Last reviewed**: YYYY-MM-DD · **Type**: standard`
- Status values: `canonical` (current truth), `draft` (in progress), `experimental` (try it, may change), `archived` (kept for context only)
- When you make a substantive change, update `Last reviewed`
- When standards conflict with code, update both so they agree
