# Place-page workflow

> **Status**: canonical · **Last reviewed**: 2026-05-29 · **Type**: process

The end-to-end procedure for taking a Margem Sul place from placeholder to a developed published page. Run this whenever building or refreshing a place page. Cacilhas was the worked example used to derive this — see [`/lugares/almada/almada-cova-da-piedade-pragal-e-cacilhas/cacilhas/`](../../src/content/places/almada/almada-cova-da-piedade-pragal-e-cacilhas/cacilhas.md) as the reference implementation.

## Prerequisites

Before starting:
- The place exists in the file tree at `src/content/places/.../<slug>.md`. If not, create the file as a placeholder first; the seed routine creates concelhos and freguesias, but bairros and lugares need adding by hand or via the weekly automation.
- The NeuronWriter project `margemcool.pt` (ID `a0a84277fc3b8868`) is set up. See [`docs/processes/seo-routine.md`](seo-routine.md) and `reference_neuronwriter_api.md` in global memory.
- You've read the [`docs/standards/brand.md`](../standards/brand.md) §4 voice rules, [`docs/standards/colour-policy.md`](../standards/colour-policy.md), and `project_margem_cool_must_be_cool.md` from global memory.

## The phases

### Phase 1 — Pull both NeuronWriter briefs

```bash
npm run seo:brief -- "<keyword>" --lang pt
npm run seo:brief -- "<keyword>" --lang en
```

Two queries per place — one PT (on google.pt, language Portuguese), one EN (on google.pt, language English). Each consumes a monthly NW quota credit. Briefs save to `seo/briefs/<slug>-pt.md` and `seo/briefs/<slug>-en.md`.

Once both are pulled, note the query IDs — they go into the place's frontmatter as `nw_query_pt` and `nw_query_en`.

### Phase 2 — Filter the competitor list

The v2 brief auto-classifies competitors into useful / reference / noise via `scripts/seo/noise-filter.mjs`. Read the "Competitors worth reading" block. Identify the **2–3 actual guide-style competitors** worth learning from. Treat the noise block as confirmation of what to ignore. See [`brief-format.md`](brief-format.md) for what the formatter excludes and why.

For Cacilhas: Time Out *Roteiro por Cacilhas*, Lisboa Secreta, the Junta de Freguesia history page. For small places, expect zero suitable competitors — that's a signal we have a wide-open opportunity.

### Phase 3 — Pull primary-source facts

The NW brief gives keyword vocabulary; it doesn't give you facts. Pull facts from primary sources before drafting:

- Wikipedia PT (and EN where relevant)
- The Junta de Freguesia history page if one exists
- Câmara Municipal pages for the concelho
- Transtejo / Carris Metropolitana / Fertagus for transport facts
- Time Out / Lisboa Secreta / Mensagem de Lisboa for restaurants and what-to-do
- Direct from operator pages for prices, schedules, hours

Cross-check anything load-bearing (population, dates, prices) across at least two sources. The Cacilhas rewrite caught several factual errors from my first draft that came from leaning on general knowledge — verify, don't guess.

### Phase 4 — Plan the page structure

Decide which components the place needs. Not every component fits every place. Use the user-intent bucketing in the brief's section 1 to drive this — bucketed intents become components.

For Cacilhas (urban, well-known, lots of intents):
- QuickFacts (4 metrics)
- Body prose (overview, name, what to see, living here, the honest bit)
- Timeline (14 dated events)
- TransportOptions (5 modes)
- EateryGrid (10 places)
- FAQ (7 questions)
- Featured links (2 related guides)

For a small bairro (residential, low search volume, few intents): expect a much shorter version — maybe just QuickFacts, short body, a FAQ and a few featured links. The template handles missing components gracefully — every section hides itself when its data is absent. Don't pad with empty structure.

### Phase 5 — Draft in English

Before writing a single line: re-read [`brand.md`](../standards/brand.md) §4. Then draft the English. The order in which to compose:

1. **Frontmatter facts** — 4 facts that anchor the place. First one in rust accent — pick the most useful number (usually ferry/drive time for accessible places, or population for residential).
2. **Meta title** (≤70 chars), **meta description** (≤170 chars). Title leads with the place name + a short context phrase.
3. **FAQ** — answer the highest-importance intents from the brief's topic-matrix. 6–8 questions. Each answer self-contained.
4. **Timeline events** — chronological, each with year + body, optional label kicker for period names (Neolithic, Roman, Reconquista, etc.).
5. **Transport options** — each mode with duration, optional price, detail.
6. **Eateries** — with cuisine label, description, optional location chip, price-range chip, optional signature dish. First gets emphasis if it's the standout.
7. **Body prose** — narrative sections covering overview, name/etymology, what to see and do, living here, the honest bit. Lead paragraph carries the lead — first paragraph styling is applied automatically. Length follows subject demand; don't pad and don't aim at competitor median.

Apply the colour policy from [`../standards/colour-policy.md`](../standards/colour-policy.md): tone change = content type. Don't introduce ad-hoc tones.

### Phase 6 — Translate to Portuguese

The English locks the structure. The Portuguese is a translation, not an independent draft. Translate the frontmatter fields (facts labels, faq questions/answers, timeline body, transport options, eateries) and the body in turn. Mark `pt.page_status: placeholder` until Lucia has reviewed; promote to `thin` or `developed` when she clears it.

### Phase 7 — Self-review

Run [`content-quality-checklist.md`](content-quality-checklist.md). Every box must pass before the page ships.

### Phase 8 — Build, score, ship

```bash
npm run build                              # cross-reference validation runs
npm run seo -- score <query-id> --html <built-file>   # score against NW
```

If the NW score is below the comparable competitor scores, iterate — usually adjust supporting-term frequencies, not structural changes.

When the build passes and the self-review checks out: commit, push. Cloudflare deploys automatically. There is no preview-gate step; per the deploy-without-reserve project memory, push lands on production.

## Per place-type — what gets fired

| Place type | Phases that fire |
|---|---|
| **Concelho** (Almada, Setúbal, etc.) | All 8. Big pages, comprehensive treatment. |
| **Freguesia** (Cacilhas-as-freguesia, Costa da Caparica, Azeitão) | All 8. |
| **Bairro** (Cacilhas as bairro within the union, Belverde, Verdizela) | All 8 but expect fewer components — small places have less intent diversity |
| **Lugar** (named sub-area smaller than a bairro) | Mostly Phases 4–8; SEO research often returns very little |

## Common pitfalls observed

These are derived from the Cacilhas pilot — don't repeat them:

- **Lean on general knowledge instead of primary sources.** Several factual errors in the Cacilhas v1 draft came from this: wrong ferry price, wrong shipyard name, vague administrative status. Phase 3 exists to prevent it.
- **Mistake competitor median for a target word count.** Per `feedback_neuronwriter_use_judiciously.md` — it's a floor at best, usually meaningless. Length follows subject demand.
- **Skip etymology / honest-bit sections to keep the page short.** Those sections are part of the brand voice — the honest assessment and the layered history are what differentiates us from tourism pages. Cut elsewhere if length is the concern.
- **Pad small-place pages with empty structure.** If a place doesn't have 10 restaurants, don't invent them. If it doesn't need a Timeline, don't add one with two events. The template hides empty sections; let it.
- **Forget the NW query IDs in frontmatter.** Without them, future scoring runs can't find the query. Always add `nw_query_pt` and `nw_query_en`.

## After publishing

Monthly review (per [`monthly-review.md`](monthly-review.md)):
- Re-score the page in NW
- Check Cloudflare Analytics and Google Search Console for ranking + clicks
- Refresh if `last_updated` is over 90 days old

## See also

- [`seo-routine.md`](seo-routine.md) — the per-page SEO process this workflow implements
- [`brief-format.md`](brief-format.md) — the v2 brief spec
- [`content-quality-checklist.md`](content-quality-checklist.md) — the self-review gate
- [`../standards/brand.md`](../standards/brand.md) — voice and vocabulary
- [`../standards/colour-policy.md`](../standards/colour-policy.md) — tonal rules
- [`../standards/page-patterns.md`](../standards/page-patterns.md) — structural patterns
