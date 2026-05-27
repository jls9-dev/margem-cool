# Margem Cool

A Portuguese-language and English-language editorial publication about the Margem Sul — the nine concelhos on the south side of the Tejo. Local, peer-to-peer, attentive, opinionated without being aggressive. Built as a 3-year project to become the unmatched Margem Sul reference resource.

This repository contains everything: brand documentation, architectural decisions, code schemas, content, and the build pipeline.

## Quick start for Claude Code

Read these documents in order before doing anything else:

1. `docs/brand.md` — canonical brand reference. The constraints all visual and editorial work must respect.
2. `docs/architecture.md` — entity model, taxonomy, URL structure, content management. The constraints all code must respect.
3. `docs/claude-code-handover.md` — the working session handover. Where this project is, what's next, what to build.

After reading these, you should understand:
- What Margem Cool is (a publication, not a business)
- Who it's for (residents of the Margem Sul, plus visitors and curious-from-outside)
- How it operates (peer-to-peer, attentive, of-the-place not about-the-place)
- What it's built on (Astro + Markdown + Zod + Cloudflare Pages + GitHub)
- The 6 editorial pillars and the geographic spine (9 concelhos, 39 freguesias)
- The 5 entity types (Place, Establishment, Service, Beach/Outdoor, Event)
- The bilingual structure (Portuguese-first, English alongside)
- The build phase we're in (Phase 0 — architecture before content)

## Conceptual core

*Margem Cool é uma publicação da Margem Sul, escrita de onde vivemos, em português e inglês, para as pessoas da região e para quem a quer conhecer melhor.*

*Margem Cool is a publication of the Margem Sul, written from where we live, in Portuguese and English, for the people of the region and the people who want to know it better.*

## Brand vocabulary

- **Masthead descriptor**: *Análise atenta*
- **Primary tagline**: *A Margem Sul, sem filtros*
- **Secondary positioning**: *O outro lado*

## Tech stack

- **Site framework**: Astro
- **Hosting**: Cloudflare Pages
- **Repository**: GitHub
- **Content**: Markdown files with Zod-validated front matter
- **Typography**: Outfit Variable (display/UI) + Source Serif 4 (body), both Google Fonts
- **Palette**: Industrial Coast (teal #0F5C5D, rust #B85C38, cream #F5F1E8, charcoal #1F2328, cool grey #8A949E)

## What this project is not

- Not a property-business marketing site (despite South Bank Real Estate being a sister company at arm's length)
- Not a tourism guide
- Not a content-marketing operation
- Not a single-author blog
- Not an expat-Portugal lifestyle publication

It is a regional publication aspiring to become a local institution. All decisions should be checked against that ambition.

## Repository structure

```
margem-cool/
├── docs/                        # Brand, architecture, and handover docs
│   ├── brand.md                 # Canonical brand reference
│   ├── architecture.md          # Entity model, taxonomy, URL structure
│   └── claude-code-handover.md  # Working session handover
├── src/
│   ├── content/                 # All editorial content as Markdown
│   │   ├── articles/            # Editorial pieces by language and pillar
│   │   │   ├── pt/
│   │   │   └── en/
│   │   ├── places/              # Concelho, freguesia, bairro entities
│   │   ├── establishments/      # Restaurants, hotels, shops, civic
│   │   ├── services/            # Tradespeople, mobile services
│   │   ├── beaches/             # Beaches and outdoor places
│   │   └── events/              # Festas, feiras, recurring events
│   ├── pages/                   # Astro page templates
│   ├── components/              # Astro components
│   ├── layouts/                 # Page layouts
│   └── data/                    # Taxonomy, controlled vocabularies, GeoJSON
├── public/                      # Static assets, images, OG defaults
├── astro.config.mjs
├── package.json
└── README.md (this file)
```

## Workflow

1. All content lives in Markdown with structured front matter
2. Build runs on every push to GitHub
3. Validation is strict — build fails on schema violations
4. Deployment is automatic to Cloudflare Pages
5. Brand documentation is the source of truth for all visual and editorial decisions

---

*Margem Cool · Análise atenta · A Margem Sul, sem filtros · O outro lado*
