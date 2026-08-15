# Margem Cool — business plan

**Internal only.** The full picture for the team: what Margem Cool is as a business, how it grows and
what it could earn. Companion to [`marketing-plan.md`](marketing-plan.md) (channel detail) and the
brand canon in `docs/standards/brand.md`. Honest throughout; hard numbers are marked **[fill — real
assumptions, don't invent]**. First written 15 August 2026.

## 1. The opportunity & why now

The Margem Sul — nine concelhos, roughly 800,000 residents on Lisbon's south bank — is being
discovered: the fastest-rising property region in Portugal, a new airport confirmed at Alcochete, and
Lisbon's overflow arriving across the river. Yet no dedicated publication covers it. The measured
SERPs for its biggest terms are held by Wikipedia, ferry operators, booking platforms and Instagram —
not one regional guide. The demand is real and measured: the region's place names and named entities
draw hundreds of thousands of Portuguese-language searches a month. First mover can own it.

## 2. The problem

Residents, newcomers and visitors searching for the Margem Sul find scraps: outdated listicles written
from Lisbon, tourism copy that recommends a beach train that stopped running in 2019, and nothing at
all for most freguesias. The information exists nowhere in one trustworthy, current place.

## 3. The solution & the edge

Margem Cool is the useful, characterful, residents-first guide to the Margem Sul, written from inside
it. The edge is threefold: **complete coverage** (every concelho, freguesia and lugar — the product
claim no competitor makes), **facts that stay true** (perishable claims carry their source and are
re-checked weekly — unique in the portfolio and rare on the open web), and **a near-fully automated
content engine** on the Spandera operating layer, so the cost of being comprehensive is engineering,
not headcount.

## 4. Market & why now

Demand measured 2026-08-10 (DataForSEO, Portugal, Portuguese): costa da caparica 201,000 searches a
month, almada 135,000, seixal / barreiro / sesimbra / montijo ~110,000 each, setúbal 60,500. The
informational seams we can own: **where to eat** (~121,000 monthly across 59 tested queries),
**beaches** (~42,800), plus named entities a local publication wins outright — praia da Figueirinha
49,500, Lagoa de Albufeira 27,100, choco frito ~18,700, Mercado do Livramento 12,100. Essentially all
of it Portuguese-language, hence the site's Portuguese-first rule. The regional phrase itself
("margem sul", 4,400) is the brand, not the keyword strategy.

## 5. Who pays — customer & first segment

Nobody yet, by design: the first product is an **owned audience** of Margem Sul residents and
newcomers, reached through search. The paying customers, when the audience justifies them, are
**local businesses** (listings, sponsorship), **advertisers/affiliates** (travel, transport, food),
and — already wired — the **LS Atlantic property funnel**, since a warm local audience is the top of
South Bank Real Estate's pipeline. First paying segment and timing **[fill — James's call once
traffic baselines exist]**.

## 6. Business model & unit economics

A content business with a near-zero marginal cost base: hosting is Cloudflare Pages (free tier),
the stack is the shared Spandera engine, and articles are auto-drafted then human-reviewed, so the
cash cost of a page is essentially API usage. Fixed costs: domains (margemcool.pt / .com), SEO
tooling shared across the portfolio. Revenue lines (future): local listings/sponsorship, affiliate,
events, and referred property leads. Rates and mix **[fill — set when monetisation opens]**.

## 7. Traction & proof

Live at margemcool.pt since May 2026. As of 15 August 2026: 19 Portuguese guides live with English
editions, 16 of 50 place pages substantively written (the rest deliberately noindexed until they have
content), real GeoJSON map of all nine concelhos, weekly fact-check and ferry-fare pipelines running,
and a 22-article proposal queue awaiting approval. Instrumented from day one; traffic baseline
**[fill — read from Cloudflare/GSC at next monthly review]**.

## 8. Go-to-market

Sequenced by measured demand: Setúbal → Sesimbra → Costa da Caparica → Alcochete → Palmela → Montijo
→ Seixal → Almada, then the long tail to 100% coverage. Named entities and "restaurantes em X" pages
carry the volume; place pages carry the completeness claim. The queue schedules seasonal pieces four
months before their peak so they rank in time. Portuguese first, English as translation. Full channel
detail in [`marketing-plan.md`](marketing-plan.md).

## 9. Competition & moat

No dedicated Margem Sul publication exists — the competition is Wikipedia, Time Out Lisbon's
occasional day-trip pieces, booking platforms and municipal sites. The moat, in order: completeness
(50+ real place pages nobody else will write), currency (the weekly fact check), local voice (the
honest section; *tu* register; no tourism clichés), and the automation that makes all three
sustainable for a solo operator. A copycat must rebuild the engine, not just the pages.

## 10. The numbers — projections & returns

The engine's costs are known and small; the revenue side is deliberately unmodelled until the
audience exists. Structure to fill at first monetisation review:

| | Sessions/mo | Revenue |
|---|---|---|
| Stage 1 exit (coverage) | [fill] | €0 by design |
| Stage 2 exit (audience) | [fill] | first experiments |
| Stage 3 (monetised) | [fill] | [fill] |

Plus the unpriced return that already flows: qualified local awareness for South Bank Real Estate.

## 11. Investment

Cash invested to date is minimal (domains, shared tooling, API usage — **[fill if a real figure is
ever needed]**). The real investment is engineering time on the automation, which is portfolio
infrastructure: the routines built here transfer to every content brand. No external capital sought.

## 12. Milestones & roadmap — the growth stages

- **Stage 1 — Coverage (now → [fill]).** Every concelho and freguesia page written; the six pillars
  live; entity pages for the high-volume beaches, markets, dishes and festas. Exit test: a resident
  can look up any place in the region and find a real page.
- **Stage 2 — Audience.** Rankings compound; returning visitors and an owned channel (newsletter or
  equivalent **[fill — choose]**) grow; monthly review tracks sessions, returners and leads passed to
  South Bank. Exit test: **[fill — traffic threshold]**.
- **Stage 3 — Revenue.** Switch on the first paying line (likely local listings/sponsorship) without
  compromising the residents-first voice; price and mix **[fill]**.

## 13. Team & how it's run

James (direction, English editions, approvals) · Lucia (Portuguese review — after publication, by
design) · the Spandera engine (drafting, scheduling, fact-checking, deployment). Weekly automated
publish with light review; monthly review sets focus. Decisions are recorded in `decisions.md` the
session they are made.

## 14. Risks & mitigations

- **Google dependency.** Nearly all acquisition is organic search. Mitigate: owned channel in Stage 2,
  completeness that earns direct/return visits, and honest content that survives algorithm updates.
- **Map-pack suppression.** "Restaurantes em X" head terms sit under a local pack; CTR will lag
  impressions. Mitigate: dish-led and entity-led queries where organic wins.
- **AI-drafted content quality.** The name is a promise; a mediocre page damages the brand. Mitigate:
  the uber-cool bar, the banned-vocabulary rules, publish-first-review-after with corrections carried
  forward.
- **Fact drift.** The exact failure the weekly fact check exists to prevent; keep it running.
- **Seasonality.** Beach and festa demand swings up to 220×; the peak-minus-four scheduling absorbs
  it, but monthly numbers will be lumpy — judge trends year on year.

## Portfolio insights (cross-pollinated)

- **From BITS — build for one real user first:** every page passes "would a resident actually use
  this?", James and Lucia being residents zero.
- **From Parts — unlock value the customer already has:** the region's places, dishes and festas are
  the latent value; Margem Cool makes them findable.
- **From Lisbon Property — be unambiguously on the customer's side:** residents-first, honest picks,
  no paid placement; when sponsorship arrives it is labelled.
- **From South Bank — be early to a rising space:** same wave, same river bank; the two brands
  compound each other.
- **From Frigiliana — own a compounding audience through genuinely useful content:** this plan is that
  insight, applied at regional scale.
- **From Spandera — run on the shared engine; feed the portfolio:** Margem Cool consumes the operating
  layer and contributes back the fact-check and seasonal-queue patterns, already portfolio standards
  in waiting.
