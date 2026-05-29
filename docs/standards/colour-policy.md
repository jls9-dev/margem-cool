# Colour and tone policy

> **Status**: canonical · **Last reviewed**: 2026-05-29 · **Type**: standard

How Margem Cool uses colour — specifically background tone — to organise pages. This document is the canonical reference. When tone questions come up, the answer lives here.

For text-colour rules, button colours and link styles, see [`brand.md`](brand.md) §5.6. This document covers **background tone** only: what tones exist, what each one means, and when to use them.

## The headline rule

**A change in background tone signifies a different kind of content, not a sub-section within the same content.**

Within a single content type (e.g. body prose), the tone stays consistent. H2/H3 typography carries the hierarchy. Tone is reserved for component-level content blocks where the change of colour also signals a change of *kind*.

## The tonal palette

Each tone uses the brand palette ([`brand.md`](brand.md) §5.5 — Industrial Coast). The base canvas is cream. Each variant blends a small percentage of one accent into cream to create a perceptibly distinct family.

| Tone | Components using it | Brand accent | Meaning |
|---|---|---|---|
| **Cream** | Body prose · Hero · QuickFacts · BackLink | _(none — the canvas)_ | Default running content |
| **Warm cream** | TransportOptions | Rust ~4% | "How to get here" — movement, dynamic |
| **Sandstone** | EateryGrid | Charcoal ~6% | "Where to eat" — warm, rich |
| **Slate** | Timeline | Cool grey ~10% | Chronology / historical record — cool, documentary |
| **Cool cream** | FAQ | Teal ~5% | Common questions — calm, reference |
| **Inverted charcoal** | _Reserved for marquee CTA only_ | Charcoal background, cream text | The strongest tonal break — used sparingly |

Each component type has **one** signature tone, applied consistently across every page using that component. Once a component is on sandstone, it's always on sandstone.

Dark-mode equivalents: each component picks up the same accent tint, but against a charcoal base instead of cream. The semantics travel; the canvas inverts.

## What this rules out

- **Don't change tone mid-prose** to signal an H2 boundary. H2s within a single content type stay on the same canvas; the heading typography does the work.
- **Don't use tone purely decoratively.** A reader who sees sandstone should always be looking at Eat-and-drink content. The tone is a label.
- **Don't introduce new tones casually.** Adding a new tone is a commitment — every new instance of that tone has to mean the same content type. Each addition needs to be documented in this file.
- **Don't reuse a family for two components.** TransportOptions and a future "Where to drink" can't both be on warm cream — they'd blur together. Each component gets its own brand accent family.

## How borders behave

Section boundaries between distinct-tone components use a **tinted rule** of the section's own accent, not the generic `--color-rule`. That makes the boundary unambiguous instead of fading into noise.

- Warm cream (Transport) → rust-tinted rule
- Sandstone (Eat) → charcoal-tinted rule
- Slate (Timeline) → cool-grey-tinted rule
- Cool cream (FAQ) → teal-tinted rule

The signal is *the tinted line is the same family as the section it belongs to*.

## How to apply when designing a new component

1. Decide what *kind* of content it represents — is it practical info, recommendations, history, reference, contact, something else?
2. Check if an existing tone already covers that kind. If yes, use it.
3. If the kind is genuinely new, pick a brand accent that fits the content's feel (warm vs cool, dynamic vs calm, light vs marquee).
4. Build the component with that signature tone and tinted-rule boundaries.
5. Update this document with the new entry.

## When a page reads as too monotone

The wrong instinct is to add tone changes inside body prose. That breaks the policy and confuses semantics.

The right instinct is to ask: **should this dense prose section actually be a structured component carrying its own tone?** Long lists of named places → a card grid. Sequence of dated events → a Timeline. Question-and-answer block → an FAQ component. Once the content type is structured, the tone follows automatically.

## Cross-references

- [`brand.md`](brand.md) §5 — visual identity (palette, type, wordmark, logo)
- [`brand.md`](brand.md) §5.6 — text-colour rules
- [`page-patterns.md`](page-patterns.md) — page-level structural patterns derived from LP and SBRE
- Global memory: `project_margem_cool_must_be_cool.md`, `project_margem_cool_color_policy.md`
