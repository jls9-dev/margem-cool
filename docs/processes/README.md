# Processes — how we do things on Margem Cool

Repeatable workflows, routines, and operating procedures. Read before running a process for the first time, or when its outputs aren't matching expectations.

## Documents

| Doc | Status | What it covers | Read before… |
|---|---|---|---|
| [seo-routine.md](seo-routine.md) | canonical | The 8-phase per-page SEO process — research, plan, draft, translate, self-review, score, ship, monitor | Building or refreshing any non-utility page |
| [brief-format.md](brief-format.md) | draft | NeuronWriter brief format spec — what fields, what filters, what the brief is for and isn't for | Generating, reading, or refactoring a brief |

## Stubs (to be written)

| Doc | Status | What it will cover |
|---|---|---|
| place-page-workflow.md | not yet written | End-to-end workflow for one place page: brief → competitor filter → outline → write EN → translate PT → score → ship. The Cacilhas-style flow, generalised |
| content-quality-checklist.md | not yet written | The self-review gate that every page passes before merging — principles check, brand voice check, schema check, link check, mobile check |
| weekly-automation.md | not yet written | The cloud routine that runs every week: which queries, which enrichments, what PRs it opens, kill switch, escalation |
| article-workflow.md | not yet written | For pillar features and editorial articles — distinct from place pages, lighter on schema, heavier on voice |
| festa-calendar-scraper.md | not yet written | Scraping festa/feira calendars from Câmara Municipal + Junta de Freguesia sites for the Cultura & Agenda pillar |
| translation-workflow.md | not yet written | How EN→PT translation runs, the Lucia review step, the draft-flag flow |
| monthly-review.md | not yet written | The monthly cadence — walking the indexes, refreshing stale docs, retiring archived ones |

## Conventions

- Every doc starts with `> **Status**: ... · **Last reviewed**: YYYY-MM-DD · **Type**: process`
- A process is canonical when it's been run end-to-end at least once and produced acceptable output
- Drafts can be followed but should be flagged in commits
- When a process changes (we learn something), update the doc and the `Last reviewed` date in the same commit as the underlying change
- Stubs exist to signal "this is coming"
