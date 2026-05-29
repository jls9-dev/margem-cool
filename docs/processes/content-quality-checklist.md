# Content quality checklist

> **Status**: stub · **Last reviewed**: 2026-05-29 · **Type**: process

The self-review gate every page passes before merging. The safety net that replaces "human review" under the automation principle. If a page passes every check here, it can ship; if it fails any, it doesn't, no matter how close to deadline.

## To be written

This document will be the canonical pre-ship checklist. Expected sections:

1. **Principles check**
   - [ ] Genuinely useful for residents — would James actually want this?
   - [ ] Doesn't pretend to be more than it is
   - [ ] Length follows the subject, not a target
2. **Brand voice (brand.md §4)**
   - [ ] *Tu* register if PT, plain direct EN
   - [ ] No banned vocabulary (brand.md §4.7 / §4.8)
   - [ ] Portuguese terms used freely in English without italicisation
   - [ ] No exclamation marks, no listicle structures
3. **UX**
   - [ ] H1 unique and answers the page's question
   - [ ] Sections are scannable, H2/H3 structure is clean
   - [ ] Mobile-readable (tested at 360px)
   - [ ] Actionable info (where, when, how, contact) easy to find
4. **SEO**
   - [ ] Meta title ≤60 chars, meta description ≤160 chars
   - [ ] Primary keyword in H1, title tag, first 100 words
   - [ ] Basic terms (NW Block 1) covered naturally
   - [ ] PAA questions answered explicitly
5. **Schema and links**
   - [ ] JSON-LD includes Article + BreadcrumbList + FAQPage (if FAQ present)
   - [ ] FAQ in JSON-LD matches on-page FAQ text
   - [ ] Internal links resolve (no 404s)
   - [ ] At least 5 internal links distributed through the body
   - [ ] hreflang link to the other language version
6. **Content collection validity**
   - [ ] Zod schema passes
   - [ ] `parent_slug` / `place_slugs` / `translation_of` references resolve
   - [ ] `last_updated` is today
7. **Build**
   - [ ] `npm run build` passes
   - [ ] No new console warnings

Until written, run the implicit checks listed in `seo-routine.md` Phase 5.
