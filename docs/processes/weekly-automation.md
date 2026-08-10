# The weekly routine

> **Status**: canonical · **Last reviewed**: 2026-08-10 · **Type**: process

Runs Mondays at 06:00 UTC via `.github/workflows/weekly-routine.yml`. Two tracks. Neither publishes prose.

## Why it is shaped this way

The obvious design is a content factory: draft pages on a schedule, merge them, repeat. That is the wrong first priority.

The biggest risk to this site is not that we publish too slowly — it is that **what we have already published quietly stops being true**. Three of the most useful things discovered on 2026-08-10 were corrections, not additions: the Transpraia beach train has not run since 2019 and every guide on the internet still says it does; the Arrábida access rules are reissued with new dates every year; the Cacilhas ferry fare changed in May. A routine that adds pages while the old ones rot makes the site worse over time.

So the first track keeps what exists true, and the second decides what to add.

## Track 1 — Keep true

**`npm run fares`** re-reads the Transtejo Soflusa tariff table into `src/data/ferry-fares.json` with the date it was read. If a fare moved, the routine commits it. This is the only thing it commits without a human, because it is a number copied from an operator's own table with no judgement in it.

**`npm run facts`** checks every claim any page has declared. A page that states something perishable declares it in frontmatter:

```yaml
verify:
  - claim: "Arrábida sem Carros: 4 de Junho a 15 de Setembro, das 07h00 às 20h00"
    source: "https://www.mun-setubal.pt/arrabida-sem-carros/"
    checked: 2026-08-10
    note: "O programa é reemitido todos os anos. Reler na primavera."
```

The check re-fetches the source and looks for the hard signals in the claim — prices, times, dates, numbers — accepting alternative spellings (`7h00`, `7:00`). Drift opens an issue; it never edits the page.

**What it cannot do.** It matches numbers, not meaning. A rule that changes shape without changing its figures passes. A clean run means "nothing obviously moved", not "everything is still true". It is a smoke alarm.

**Declare a claim whenever a page states**: an opening time, a fare or price, a festival date, an access or parking rule, a timetable. Do not declare prose.

**When no primary source publishes the fact in readable form, say so on the page.** The market hours on the Mercado do Livramento guide are the worked example: several secondary sources agree on 7h–14h, the câmara publishes nothing machine-readable, so the page states what we can stand behind (closed Mondays, a morning market) and tells the reader to confirm before a trip that depends on the half hour. That is better than an authoritative-looking number nobody can re-check.

## Track 2 — What to write next

**`npm run next`** reads `src/data/keyword-targets.json`, subtracts what is already published, and ranks what is left.

**The ranking is not by volume, and that is the whole point.** A page needs months to rank, so the question is not "what is biggest" but "what must exist by when". Each target's deadline is its peak month minus four; anything swinging less than 3× across the year counts as flat and fills the gaps.

Sorting by annual average would put beach pages in the queue in June — four months after the window to plant them closed — and Carnaval de Sesimbra in February, while it is happening. It also surfaces things instinct misses: **ameijoas à Bulhão Pato and moscatel de Setúbal peak in December**, so they get written in August.

The queue lands in an issue. Drafting is a human-and-Claude job following [`place-page-workflow.md`](place-page-workflow.md), gated by [`content-quality-checklist.md`](content-quality-checklist.md).

## Refreshing the targets

`src/data/keyword-targets.json` is generated from the Spandera keyword universe plus DataForSEO monthly history. Refresh it quarterly — volumes move and new terms appear. Attach volume **before** theming; the universe was themed blind once and became a dumping ground that led with Porto shopping-centre keywords.

## Kill switches

`routine.json` at the repo root:

```json
{ "keepTrue": true, "writeNext": true }
```

Set either to `false` and that track stops at the next run. No code change, no deploy.

## What is deliberately not automated

- **Photographs.** The routine can report a page without one. It cannot take one, and a low-resolution stand-in is worse than none — the choco frito guide ships bare for exactly this reason.
- **First-person claims.** We say we went somewhere only if someone did.
- **Recommendations.** The Cacilhas riverside section and the choco frito guide work because they give the reader criteria rather than a fabricated ranking. That judgement is made each time.
- **Merging prose.** The routine opens issues. People write and merge.

## See also

- [`place-page-workflow.md`](place-page-workflow.md) · [`content-quality-checklist.md`](content-quality-checklist.md) · [`seo-routine.md`](seo-routine.md)
