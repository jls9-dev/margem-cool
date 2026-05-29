# Margem Cool — documentation

This directory holds every document Claude Code or James need to consult when working on Margem Cool. It is split into three categories.

| Directory | What it holds | When to read |
|---|---|---|
| **[standards/](standards/)** | What is *true* about the project — brand, voice, architecture, page patterns, vocabulary | Before any work that touches that area |
| **[processes/](processes/)** | How we *do* things — SEO routine, place-page workflow, content quality checks, automation | Before running a recurring process |
| **[history/](history/)** | One-off records of past decisions — handovers, migration notes | When you need historical context only |

## How these documents are maintained

- **Every document has** `Status: canonical | draft | experimental | archived` and `Last reviewed: YYYY-MM-DD` at the top.
- **Improvements happen via commits** to this repo. The git history is the audit trail of how our thinking evolved.
- **Both James and Claude can edit** any document. Substantive changes update the `Last reviewed` date.
- **Monthly review cadence** — once a month we walk each index, mark what needs change, refresh stale dates. A cloud routine pings on the 1st of each month.

## How to use this in practice

Before starting a piece of work:
1. Open the relevant index (`standards/README.md` or `processes/README.md`)
2. Read the documents flagged as required for that task
3. If the work uncovers something the docs don't yet capture, add it — commit with a clear message

When the docs and the code disagree:
- For standards: the *intent* is what matters. Update either the code or the doc so they agree, and surface the decision.
- For processes: the *current behaviour* is the doc. If reality has drifted, update the doc to match — or fix reality to match.

---

*If you're new to the project, start with `standards/brand.md`, then `standards/architecture.md`, then `processes/seo-routine.md`.*
