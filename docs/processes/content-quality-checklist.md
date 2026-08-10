# Content quality checklist

> **Status**: canonical · **Last reviewed**: 2026-05-29 · **Type**: process

The pre-ship gate every page passes before merging. Replaces "human review" under the automation principle — if a page passes every check here, it can ship; if it fails any, it doesn't, regardless of deadline pressure.

Run this on every place page, pillar page, and article before commit. The weekly automation routine (when built) uses this list as the auto-merge gate: pass all → merge; fail any → flag for James.

## How to use it

Walk top to bottom. Tick each box. Mark pass / fail per item. Any fail blocks the ship.

If you find yourself disagreeing with a check, the response is **not** to ignore the check — it's to update this document (and commit the change in the same PR as the page that needed it). The list evolves; ignoring a check defeats its purpose.

---

## 1. Principles check

The four operating principles must hold for this page.

- [ ] **Useful for residents.** Would James (or any actual Margem Sul resident) want this information? Not "is it well written" — "is it useful?"
- [ ] **Cool, not boring.** Visually varied — at least 2-3 distinct tones across the page (per `colour-policy.md`). Brand palette (rust + teal) appears, not just cream + charcoal. River curve appears as a layout element where appropriate.
- [ ] **Length follows subject demand.** Not padded to hit a competitor median. Not arbitrarily short either. The Cacilhas template (extensive multi-component place with rich history) is c. 2,000 words in body + structured components; a small bairro might be 400 words in body. Both fine if they match the subject.
- [ ] **Simple, robust, fast.** No new dependencies for one page. No clever code that future-Claude won't understand. Build stays under 1.5s.

## 2. Brand voice (per `brand.md` §4)

- [ ] **Portuguese uses *tu* register.** Verb conjugation carries it; explicit *tu* is rare.
- [ ] **No banned vocabulary** (brand.md §4.7 EN + §4.8 PT). Scan for: *hidden gem, must-visit, charming, authentic, vibrant, picturesque, breathtaking, instagrammable, perfect for, ultimate guide*. PT equivalents: *encantador, pitoresco, imperdível, único, autêntico, joia escondida, paraíso de…, alma de…*
- [ ] **Portuguese terms used freely in English without italicisation.** *Tasca, marisqueira, freguesia, concelho, festa, miradouro, cetárias, conserva* etc. — roman, not italic.
- [ ] **No exclamation marks.** Almost never. Listicle counts ("5 reasons to…", "10 best…") not used.
- [ ] **Place names with diacritics in both languages.** *Setúbal, Belém, Almada Velha* — not anglicised.
- [ ] **Locale-appropriate numbers and dates.** EN: *27 May 2026, 7pm, €2.00*. PT: *27 de maio de 2026, 19h00, 2,00€*.
- [ ] **Specific named things over generic atmospherics.** *Ponto Final on the Cais do Ginjal*, not "a charming riverside restaurant".

## 3. UX (per Principle 4)

- [ ] **H1 unique** and answers the page's question. Not just the place name in isolation if context helps.
- [ ] **Sections scannable.** H2/H3 structure within body is clean, intuitive.
- [ ] **Mobile-readable.** Test at 360px width. Type sizes legible, components stack cleanly, sticky header doesn't dominate.
- [ ] **Actionable info surfaces early.** Where, when, how, contact — should be reachable in the first scroll or via QuickFacts.
- [ ] **Slim sticky header behaves correctly.** No overflow at common widths.

## 4. SEO

- [ ] **Meta title ≤70 characters**, includes the primary keyword.
- [ ] **Meta description ≤170 characters**, useful summary that includes 1-2 secondary keywords naturally.
- [ ] **Primary keyword in H1, first 100 words of body, and at least one H2.**
- [ ] **NW Block 1 basic terms covered naturally** in body or component data. Not stuffed.
- [ ] **All high-importance topic-matrix intents addressed** somewhere on the page (body, FAQ, component).
- [ ] **Internal links to at least 2 other pages** — typically parent place, sibling places, related guides.

## 5. Schema and structured data

- [ ] **JSON-LD `@graph` generated automatically** via `buildPlaceJsonLd` — verify it's in the page source.
- [ ] **AdministrativeArea / Place** (depending on level) with `containedInPlace` for hierarchy.
- [ ] **BreadcrumbList** matches visible breadcrumb.
- [ ] **Article** with proper `datePublished`, `dateModified` (from `last_updated`), author, publisher.
- [ ] **FAQPage** (when FAQs present) — items match on-page FAQ text exactly.

## 6. Content collection validity

- [ ] **Zod schema passes** — `npm run build` doesn't error on the entry.
- [ ] **`parent_slug` resolves** — points to an existing Place.
- [ ] **`featured_links` hrefs resolve** to real pages.
- [ ] **`last_updated` is today** (or the actual update date).
- [ ] **NW query IDs in frontmatter** as `nw_query_pt` and `nw_query_en`.

## 7. Build and validation

- [ ] **`npm run build` passes** with no new warnings.
- [ ] **No 404s** on internal links.
- [ ] **No `console.log` or debug output** left in code.

## 8. Both languages

- [ ] **English page passes everything above.**
- [ ] **Portuguese page passes everything above OR is `page_status: placeholder` pending Lucia.** Never ship Portuguese as `developed` without her review.
- [ ] **`hreflang` link to the other-language version** is generated correctly.

## 9. Visual check

- [ ] **Render at 360px (phone)**, 768px (tablet), 1280px (desktop). Each width works.
- [ ] **Dark mode looks intentional.** Each section's tone has a dark equivalent.
- [ ] **No layout glitches** at common scroll positions.
- [ ] **Tonal palette consistent** with `colour-policy.md`. No ad-hoc tones added.

## 10. Evidence, photographs and judgement

Added 2026-08-10 after reviewing the Cacilhas and Belverde pilots. Both passed every check above and were still recognisably desk research. These are the checks that would have caught it.

- [ ] **The page has photographs.** At least one for any page above `placeholder`. A place page with no picture of the place fails the brand promise before a word is read. Source order: James's own library (catalogued in `project_southbank_photos.md` — check it before assuming we have nothing), then a properly licensed photo with attribution. Prepare with `npm run photo -- <source> <key>`; reference by key.
- [ ] **Every photo has alt, caption and credit.** Alt describes it for someone who can't see it; the caption says what the reader is looking at; the credit names who took it. All three, both languages for alt and caption.
- [ ] **No sources named in the body copy.** Never "according to Wikipedia", "the Junta's page doesn't say", "sources disagree about". Where we looked is our business; the reader wants the answer or an honest "this isn't settled". Naming a source in prose is the clearest tell that a page was written at a desk.
- [ ] **No precise number we haven't verified.** Dish prices, opening hours and phone numbers go stale within months and are the fastest thing for a local reader to disprove. Use the price band (€–€€€€) and name the dish instead. A precise figure is allowed only when it comes from a source we can re-read on a schedule — the ferry fares in `src/data/ferry-fares.json` (`npm run fares`) are the model: fetched from the operator, stamped with the date checked.
- [ ] **No stale third-party accolades.** "Time Out readers' Best Restaurant 2018" is not a recommendation in 2026. If we're citing someone else's award, it has to be current and it has to matter.
- [ ] **The page makes a recommendation.** A list of ten restaurants with no view on which to choose is a directory, not a guide, and fails Principle 3 outright. Somewhere the page must say which one, for whom, and why — framed on grounds we can defend (location, queue, what it's for), never on an experience we haven't had.
- [ ] **First-person claims are true.** We say "we ate there" only if someone did. A photograph proves we stood there, not that we ordered. Where a claim needs a visit we haven't made, write around it or flag it to James as needing verification.

## 11. Honest gut check

- [ ] **Would I read this if I didn't have to?** Honest answer. If "no" the page isn't done — find what's making it skimmable and fix that before shipping.
- [ ] **Does the page feel Margem Cool?** Brand promise is in the name. Walls of cream prose with no visual rhythm are an immediate fail (per `project_margem_cool_must_be_cool.md`).

---

## When something fails

A single failed check blocks shipping. Don't argue with the list; fix the failure.

If the failure is **substantive** (you genuinely think the rule shouldn't apply here):
1. Don't ship.
2. Raise the disagreement explicitly — to James in conversation, or as a commit message updating this checklist with the rationale.
3. Update the list in the same PR as the page that needed the change. The next page benefits.

## See also

- [`place-page-workflow.md`](place-page-workflow.md) — the workflow this checklist sits at the end of
- [`brief-format.md`](brief-format.md) — what the v2 brief output includes
- [`../standards/brand.md`](../standards/brand.md) §4 — voice rules
- [`../standards/colour-policy.md`](../standards/colour-policy.md) — tonal rules
