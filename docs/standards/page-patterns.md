# Page patterns — derived from LP and SBRE

> **Status**: canonical · **Last reviewed**: 2026-05-29 · **Type**: standard

The Lisbon Property and South Bank Real Estate guides are the proven-working benchmark for what a well-structured, SEO-optimised, useful guide page looks like in James's ecosystem. This document captures the patterns those guides converge on, ready to adapt for Margem Cool place pages and pillar landings.

For the **colour and tone policy** — what each background tone means and when to use it — see [`colour-policy.md`](colour-policy.md). This document covers structural patterns; that one covers tone.

Source guides studied: `southbank-pt/src/pages/guides/arrabida-natural-park.astro`, `southbank-pt/src/pages/guides/wine-setubal-peninsula.astro`, `southbank-pt/src/pages/guides/where-is-the-margem-sul.astro`, `lisbonproperty-pt/src/content/guides/lisbon-metropolitan-area.md`, plus the SBRE and LP `[slug].astro` templates.

## The canonical page structure

Top to bottom, every well-optimised guide follows this skeleton:

1. **Breadcrumb nav** — `Home → Guides → [page]`
2. **Hero section** — small-caps eyebrow tag, H1, one-sentence lede, "Updated [Month Year]" badge
3. **Quick facts panel** — 4 metric cards (value + label) on a coloured strip
4. **Intro section** — eyebrow + H2 ("Overview" framing) + 2-3 paragraph orientation
5. **4–7 content sections** — each with eyebrow + H2 + section subtitle + multiple H3 sub-sections within
   - Sections alternate cream / white backgrounds for visual rhythm
   - Each section covers one user intent (history, getting there, food, walks, festas, living here, practical)
   - Callout boxes inside sections for important warnings or tips
6. **FAQ section** — 6–8 questions using native HTML `<details>` elements; answers are self-contained
7. **Related guides** — 3 cards in a grid linking to other internal guides
8. **CTA section** — single clear call-to-action ("Get in touch", "Book a call")
9. **Back to all guides** link
10. **JSON-LD `@graph`** with Article + BreadcrumbList + FAQPage

## SEO and meta optimisation

| Element | Pattern |
|---|---|
| **Meta title** | 50–65 chars, em-dash separator, sometimes a year for currency. *"Arrábida Natural Park — Hiking, Viewpoints, and Outdoor Guide"* |
| **Meta description** | 140–160 chars, hits geo + intent terms naturally |
| **H1** | Cleaner than meta title — drop listicle structure. *"Arrábida Natural Park — Hiking & Outdoor"* |
| **H2 structure** | One per user intent. 4–7 of them. Verbal, not noun-only. *"The Best Hikes in the Park"*, *"Beyond Walking"* |
| **H3 within H2** | One per specific named entity. *"Convento da Arrábida loop"*, *"Cabo Espichel coast walk"* |
| **Updated date** | Visible in the hero AND in JSON-LD `dateModified` |
| **JSON-LD** | `@graph` with Article (datePublished, dateModified, author, publisher, mainEntityOfPage), BreadcrumbList (3 items), FAQPage (matching the on-page FAQ exactly) |
| **Internal links** | Inline in body prose (always) + Related Guides grid at end (always 3 cards) |

## Content quality patterns

- **Specific named entities everywhere.** Real place names (Galapinhos, Convento da Arrábida, Quinta de Catralvos), real prices (€10–€25 a tasting, €4,500–€5,500/m²), real distances (12–15km traverse), real times (5–7 hours, before 10am or after 4pm).
- **Practical info section always present** — access, parking, hours, season, what to bring, safety, maps. Bedrock for "things to do" intent.
- **Opinion mixed with facts** — *"the most beautiful landscape within an hour of Lisbon"*, *"the most visitor-ready of the major producers"*. Authoritative without being precious.
- **Portuguese terms used freely** without italicisation — *concelho, freguesia, festa, tasca, miradouro, quinta, junta, caderneta, vindima*. Matches the brand voice in `brand.md` §4.6.
- **Length is substantial.** Arrábida 1,900 words. Wine guide 1,800. Lisbon metropolitan area 2,500. *All well over* NeuronWriter's competitor-median word counts. Length follows the subject's genuine demands, not an SEO target — see `feedback_neuronwriter_use_judiciously.md`.

## FAQ pattern

The FAQ block is essential for both rich snippets and user utility. Pattern:

- 6–8 questions
- Each question is a real question a reader would ask (not keyword-stuffed)
- Each answer is **a complete self-contained statement** — readable on its own when Google pulls it into a featured snippet
- HTML implementation: native `<details><summary>` for the visual; JSON-LD `FAQPage` for the structured data
- The on-page FAQ text and the JSON-LD FAQ text should match (Google penalises mismatches)

## The quick-facts panel

Four metric cards. Each has:
- A **value** in large display type — number, label, period, status
- A **label** in small caps describing what the value means

Examples:
- *"17,500 ha — Park area"*, *"501m — Highest peak"*, *"Year-round — Hiking season"*, *"UNESCO — Biosphere reserve"*
- *"DOC — Península de Setúbal"*, *"Moscatel — Signature wine"*, *"25+ — Wineries to visit"*, *"~€15 — Typical tasting"*

The facts panel sits between hero and intro. It gives Google (and the reader) immediate structured signals about what the page covers.

## Sections — what to include for each intent

For a place / area page specifically, the sections that work hardest:

| Section | What it covers | User intent |
|---|---|---|
| **Overview** | What this place is, who it's for, what makes it distinctive | Informational |
| **Geography & layout** | Where it sits, how it's organised, what's around it | Informational |
| **Getting there** | Transport options, drive times, ferry, train, bus | Practical (very high intent) |
| **Where to eat & drink** | Named restaurants, tascas, cafés with brief notes | Recommendation |
| **What to see & do** | Specific landmarks, walks, viewpoints, activities | Recommendation + practical |
| **Calendar / festas / events** | Annual cycle, recurring events with months | Informational + practical |
| **Living here** (concelho/freguesia only) | Schools, healthcare, transport, daily life | Residents-focused |
| **The honest bit** | Trade-offs, what's harder, what's changing | Trust signal — competitors rarely do this |
| **Practical** | Hours, parking, season, accessibility, safety | Practical |
| **FAQ** | 6–8 common questions | Informational + rich snippets |

Most place pages will use 5–8 of these. Smaller places (a *lugar*) will use fewer. Concelho overviews will use all.

## Internal linking pattern

- **In-line links within prose** to other guides and place pages. Used as part of the natural flow, not appended at the end.
- **Related Guides grid** at the bottom — always 3 cards, each with name + 1-sentence description + "Read the guide →" link
- **CTA** to a single clear next step (contact, newsletter, related place)
- **Back to index** link at the very bottom

Density target: 5–15 internal links per substantial page, distributed throughout the body, not clustered at the end.

## Component reuse

LP and SBRE have shared CSS classes (`sb-guide-*` family on SBRE, similar on LP) so every guide pages renders consistently. For Margem Cool, we should build the equivalent: a small set of reusable Astro components.

Proposed Margem Cool components:

- `<GuideHero>` — eyebrow + H1 + lede + updated date
- `<QuickFacts>` — 4-card metric strip
- `<Section>` — alternating cream/white, takes eyebrow + title + subtitle + body slot
- `<H3Block>` — H3 + paragraph(s), the standard sub-section
- `<Callout>` — important note inside a section
- `<FAQ>` — list of question/answer pairs; renders both `<details>` and the JSON-LD FAQPage
- `<RelatedGrid>` — 3 cards
- `<CTA>` — single call to action
- `<BackLink>` — bottom link to index

The JSON-LD `@graph` should be generated from the data on the page (front matter + FAQ items) — not hand-written per page. One utility function.

## What SBRE/LP have that Margem Cool should NOT copy

- The **buyer-agent CTA pattern** ("Book a free call") — Margem Cool doesn't sell a service. Replace with newsletter signup (when ready) or "got something to add" contact link.
- The **eyebrow tags using "Living in the Margem Sul"** — Margem Cool is *of* the Margem Sul; we wouldn't tag every section that way. Use neutral eyebrows: "Overview", "Getting there", "Where to eat", etc.
- The **sidebar with buyer-agent CTA** (LP template) — replace with on-page TOC for long pages.
- The **opinion lean toward foreign buyers** — *"foreign property buyer", "most of our clients"* — wrong audience for Margem Cool. We write for residents and people who want to know the place better.

## Length philosophy

Per `feedback_neuronwriter_use_judiciously.md`:

- Don't target competitor word count median
- Length follows subject demand
- Major concelho pages: 2,000–4,000 words is fine
- Smaller freguesia pages: 800–2,000 words depending on substance
- *Bairros* and *lugares*: 400–1,200 words
- Pillar landing pages: 1,500–3,000 words
- Articles: whatever the subject earns

Long is fine when paired with:
- Strong section structure (H2 + H3)
- Anchored TOC on desktop for >2,000 words
- Tight intros
- Quick facts and callouts to break up prose
- Mobile-readable line lengths and section spacing

## Take-aways for the place-page template

Build once, apply to all 9 concelhos and 39 freguesias:

1. Markdown content collection (as in LP) so content lives in data, not code — supports the automation principle
2. Frontmatter carries: title, descriptions (PT + EN), facts array, FAQs array, related places/guides, last_updated
3. Body in markdown for narrative sections (Overview, History, Honest bit, etc.)
4. Some sections (Eat & Drink listings, Getting There options) might be data-driven from the establishments/places collections — automatically composed from related entities, not hand-written
5. Template renders: Hero → Facts → Intro → Markdown body → FAQ (from frontmatter) → Related → CTA → Back link
6. JSON-LD generated from frontmatter automatically (Article + BreadcrumbList + FAQPage + AdministrativeArea)

Next decision: design the place-page template using these patterns, applied to Cacilhas as the first build.
