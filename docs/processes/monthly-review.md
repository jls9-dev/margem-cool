# Monthly review cadence

> **Status**: stub · **Last reviewed**: 2026-05-29 · **Type**: process

Once a month James and Claude walk the docs and the running automation, refresh stale things, retire dead things, capture what we've learned.

## To be written

Expected sections:

1. **When and how it runs** — first of the month, triggered by cloud routine, opens a Markdown checklist file in a PR
2. **What gets reviewed**
   - Every `Last reviewed` date older than 90 days
   - Every doc with `Status: draft` — is it canonical now, or kill it?
   - Every doc with `Status: experimental` — keep or retire?
   - Any process that produced an unexpected output in the last month
   - The weekly automation's PR history — what got merged, what got blocked, what got escalated
3. **What gets updated**
   - `Last reviewed` dates on docs we touched but didn't change content of
   - Content of docs that drifted from reality
   - New entries in standards/README.md and processes/README.md for anything new
4. **What gets retired**
   - Stubs that haven't been written and aren't being used → delete or move to history
   - Standards no longer true → fix or move to history
5. **Output** — a short retrospective note committed to `docs/history/reviews/YYYY-MM.md`

Until written, the monthly review runs manually: open `docs/README.md`, walk each index, ask "is this still right?"
