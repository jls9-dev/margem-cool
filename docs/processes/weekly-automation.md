# Weekly automation routine

> **Status**: stub · **Last reviewed**: 2026-05-29 · **Type**: process

The cloud routine that runs once a week to keep Margem Cool moving without James's daily attention. The operational artefact of the automation principle (`project_margem_cool_automation_principle.md`).

## To be written

Expected sections, once the routine is built:

1. **Schedule and kill switch** — when it runs, how to pause it
2. **What it does each run**
   - Pull NW briefs for any place page with `page_status: placeholder` (capped at N per run to respect quota)
   - Enrich placeholder pages: festa calendar, transport notes, known establishments, FAQs from PAA
   - Draft + translate any pages flagged ready
   - Score back via NW; iterate to target
   - Open PRs against `main` with proposed changes
3. **Self-review gate** — uses `content-quality-checklist.md`. PR only auto-merges if every check passes.
4. **What gets escalated to James**
   - Any check that fails twice in a row
   - Any first-person experiential claim that needs human verification
   - Anything Portuguese that needs Lucia's review
5. **Output and monitoring** — where the routine logs, how to see what it did last week, how to audit decisions
6. **Quota management** — NW monthly query limits, prioritisation when capped
7. **Failure modes and recovery** — what happens when a run errors

This is the load-bearing piece of the project's operating model. Build with care.

Until written, automation runs manually via `npm run seo:brief` and PR creation by hand.
