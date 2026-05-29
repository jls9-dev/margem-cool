# Brief format specification (v2)

> **Status**: canonical · **Last reviewed**: 2026-05-29 · **Type**: process

The format `scripts/seo/cli.mjs brief` writes to `seo/briefs/<slug>-<lang>.md`. v2 supersedes the dump-everything v1 that mixed signal and noise. v2 is a **drafting-ready document** — a reader (or automated drafter) writes the page directly from the brief without going back to fish through raw NW data.

## Principles

1. **Surface signal first.** Topic-importance matrix + PAA at the top, not buried below noise.
2. **Filter noise automatically.** Drop heading lists, drop aggregator/timetable competitors, drop one-off terms.
3. **Pre-bucket intents.** Topic matrix items get mapped into canonical place-page section slots so the brief outputs a section-by-section skeleton.
4. **Don't pretend NW is the target.** "Median competitor word count" is a floor, not a goal. Length follows subject demand.
5. **Stay honest.** Show the source — query ID, NW URL, generation date — so reviewers can drill in when needed.

## Document structure

The v2 brief contains exactly these sections, in this order:

### Header

```
# NeuronWriter brief — "<keyword>" (<Language>)

- Generated: YYYY-MM-DD
- Engine: <engine>
- Language: <Language>
- Query ID: <id>
- NW URL: <url>
- Median competitor word count: <n> (treat as floor, not target)
```

### 1. User intent (page skeleton)

The most important block. From `ideas.topic_matrix` and `ideas.people_also_ask`, ordered by importance. Each intent flagged with its canonical place-page section slot.

```
## 1. User intent — what users actually want to know

| Importance | Question / intent | Section slot |
|---|---|---|
| 10/10 | Onde apanhar um barco para Cacilhas? | Getting there |
| 10/10 | Quanto tempo demora a viagem? | Getting there |
| 9/10  | O que significa "Cacilhas"? | History / What & where |
| 9/10  | Qual é a história e a idade? | History |
| 8/10  | Opções de transporte? | Getting there |
| 8/10  | O que fazer e visitar? | What to see & do |
| 7/10  | Onde comer e ficar? | Eat & drink |
| ...   | ... | ... |
```

The mapping between user-intent text and section slot is rule-based — keywords like *"chegar", "barco", "ferry", "transporte"* → `Getting there`; *"comer", "restaurante", "marisqueira"* → `Eat & drink`; etc. The mapping is in `scripts/seo/intent-buckets.mjs` (to be built).

### 2. Topical vocabulary

From `terms.content_basic` and `terms.content_extended`, with rules:

- **Basic terms**: all of them. They're vocabulary the page should cover.
- **Extended terms**: top 20 by `usage_pc`, then any with `usage_pc >= 22%`. Drop terms that look like noise (one-character, pure numbers, single-letter words). Show the suggested usage range.

```
## 2. Topical vocabulary

### Must cover (basic terms)
- cacilhas — 3–16× (in 100% of top results)
- cais — 1–3× (67%)
- ...

### Worth covering (extended terms, filtered)
- freguesia de cacilhas — 1× (22%)
- cetárias — 1× (22%)
- cais do ginjal — 1× (11%)
- quinta do almaraz — 1× (22%)
- ...
```

### 3. Suitable competitors

The filtered competitor list. Excludes known-noise domains (ferry timetables, hotel aggregators, social-media tag pages, Wikipedia clones, our own LP/SBRE properties). Includes a short note on what each one does well and where it's thin.

```
## 3. Competitors worth reading

| Source | Words | NW score | Strengths | Gaps |
|---|---|---|---|---|
| Time Out — Roteiro por Cacilhas | 1,916 | 63 | Restaurants, walks, vibe | Light on history, no transport detail |
| Lisboa Secreta — Cacilhas | 583 | 54 | Casual roteiro | Shallow on everything |
| Wikipedia — Cacilhas | 1,707 | 72 | History, archaeology | No practical, no voice |
```

A second collapsed block shows the raw SERP for transparency, but flagged as "do not benchmark against these":

```
<details>
<summary>Raw SERP (not for benchmarking)</summary>

- Transtejo timetable (ferry company, transactional)
- Wikipedia history-only entry
- Agoda hotel aggregator
- ...
</details>
```

### 4. Meta tag hints

From `terms.title` and `terms.desc`, top terms by `usage_pc`:

```
## 4. Meta tag word suggestions

### Page <title>
- cacilhas (89%)
- cais do sodré (33%)
- transtejo soflusa (33%)
- almada (33%)

### Meta description
- cacilhas (56%)
- lisboa (22%)
- almada (22%)
- ...
```

### 5. What to ignore

A short closing block that explicitly names the noise the formatter dropped, so the reader knows what was filtered:

```
## 5. What this brief excluded

The following NW outputs were excluded as noise:
- All competitor H1/H2 text dumps (90% noise, signal carried by section 1 + 3)
- Competitor word-count median as a "target" (treated as floor only)
- N raw competitors classified as noise: <list of dropped domains>

If you need the raw data, see `seo/briefs/<slug>-<lang>.raw.json`.
```

### 6. Writer notes

Static reminders:

```
## 6. Writer notes

- This brief is one input, not gospel (`feedback_neuronwriter_use_judiciously.md`).
- Length follows subject demand. The median is a floor, never a target.
- Before drafting copy: re-read `docs/standards/brand.md` §4.
- After writing, score via: npm run seo -- score <queryId> --html <built file>
```

## Implementation

Implemented in `scripts/seo/format-brief.mjs`. The formatter is pure — takes the NW response JSON, produces the v2 markdown. No file I/O inside the formatter (the CLI handles that).

Supporting modules:

- `scripts/seo/intent-buckets.mjs` — rule-based mapping from user-intent text to canonical section slot
- `scripts/seo/noise-filter.mjs` — list of noise-domain patterns and noise-term predicates

## Evolution

This is v2. v3 will be triggered when:
- The intent → section-slot mapping reveals new section types we don't currently have
- A new NW field becomes important (e.g. SERP feature flags, image pack signals)
- We add EN-vs-PT contrast directly in the brief (currently you read both files side by side)

When v3 ships, this document is updated, `Last reviewed` bumped, and old v2 briefs get regenerated for consistency.

## What v1 looked like (kept for context)

v1 dumped every NW field, including:
- Block 3 — H1 headings from competitors (90% noise)
- Block 4 — H2/H3 headings (same)
- 60-term extended list with many one-off terms
- Word count "target" framed misleadingly
- 25-row competitor table mixing aggregators and timetables with actual guides

v1 was useful for sitting with James in one review session. It wasn't safe to feed into automated drafting. v2 fixes that.
