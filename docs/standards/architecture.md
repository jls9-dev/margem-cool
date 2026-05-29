# Margem Cool — Architecture

> **Status**: canonical · **Last reviewed**: 2026-05-29 · **Type**: standard

This document codifies the technical and structural decisions that the codebase implements. When in doubt about a data-model or URL-structure question, defer to this document over local instinct. When this document is wrong or incomplete, update it and commit alongside the code change.

The companion document is `brand.md`, which covers the editorial, visual, and linguistic constraints. Architecture decisions should be consistent with the brand principles; this document is the technical translation of those principles into structure.

---

## 1. Tech stack

- **Site framework**: Astro (static site generation, file-based routing, content collections)
- **Hosting**: Cloudflare Pages
- **Repository**: GitHub
- **Content**: Markdown with Zod-validated front matter, organised into Astro content collections
- **Build pipeline**: GitHub push triggers Cloudflare Pages build; build runs Astro; failed validation fails the build
- **Styling**: TBD — likely vanilla CSS with custom properties, or Tailwind. Decision deferred to Phase 0 work, but no CSS-in-JS, no design-system dependency, nothing that locks the project into a specific framework.
- **Typography**: Outfit Variable + Source Serif 4, both self-hosted from Google Fonts via local files in `public/fonts/`
- **No CMS, no database, no headless service.** Markdown files in the repo are the source of truth. This is intentional: the publication's content is durable, version-controlled, portable, and doesn't depend on external infrastructure that could disappear.

---

## 2. Entity model

The publication has five entity types. Each entity is a discrete content type with its own Astro content collection and Zod schema. They are distinguished by what they represent, not by how they're displayed.

### 2.1 Place

A geographic entity at one of four levels of hierarchy.

| Level | Examples | Hierarchy parent |
|-------|----------|------------------|
| concelho | Almada, Seixal, Setúbal | (none — top level) |
| freguesia | Caparica e Trafaria, Cacilhas, Azeitão (Santa Maria) | concelho |
| bairro | Cova da Piedade (within Almada freguesia), Verdizela (within Charneca de Caparica) | freguesia |
| lugar | A named cluster smaller than a bairro — informal but with own identity | freguesia or bairro |

The `place` is the geographic spine of the publication. Every other entity (Establishment, Service, Beach, Event) belongs to one or more Places.

### 2.2 Establishment

Anything with **physical premises that customers visit**. This is the diagnostic criterion: if customers go to a place to receive the service or interact with the entity, it's an Establishment.

Includes: restaurants, tascas, cafés, padarias, hotels, pousadas, agroturismo, shops, livrarias, ourivesarias, peixarias, talhos, mercados municipais, shopping centres, juntas de freguesia, câmaras municipais, schools, libraries, churches, colectividades, sociedades filarmónicas, pharmacies.

Restaurants and Hotels are **types within Establishment** using a discriminated union pattern, not separate entity types. The `type` field controls which schema variant applies.

The `sector` field categorises Establishments by ownership/operation type:
- `public` — câmaras, juntas, public schools, public hospitals
- `private` — restaurants, hotels, shops, private services
- `civic_community` — colectividades, associations, voluntary organisations
- `religious` — churches, religious institutions

### 2.3 Service

A provider **without customer-visiting premises**. The contrast to Establishment is the physical-premises rule.

Includes: builders, gardeners, plumbers, electricians, mobile mechanics, home-visit veterinarians, cleaners, freelancers, mobile food vendors without fixed location.

Services do not get area-page recommendation listings in the same way Establishments do. They appear in *Viver Aqui* practical content and dedicated service-directory pages later in the project.

### 2.4 Beach / Outdoor place

A beach, swimming spot, walking trail, viewpoint, mata, serra section, or other outdoor place where the publication directs people for outdoor experience.

Distinct from Establishment because outdoor places don't have an owner/operator in the same sense. Praia da Adraga isn't owned by anyone; nobody runs it. The publication writes about it, recommends it, gives practical information about it, but the entity is the place itself, not an organisation.

### 2.5 Event

A festa, feira, concert, exhibition, romaria, religious procession, or any time-bound happening. Events can be one-off or recurring annually.

Events relate to Places (where they happen) and may relate to Establishments (the colectividade that organises them, the venue that hosts them).

---

## 3. Zod schemas (canonical)

These schemas define the front-matter structure for each content type. Astro's content collections enforce them at build time.

The schemas below are normative — the actual implementation in `src/content/config.ts` should match these and be updated when these change.

### 3.1 Place

```typescript
import { z, defineCollection } from 'astro:content';

const placeSchema = z.object({
  // Identity
  slug: z.string().regex(/^[a-z0-9-]+$/),
  level: z.enum(['concelho', 'freguesia', 'bairro', 'lugar']),
  name_pt: z.string(),
  name_en: z.string().optional(), // Most places use Portuguese name in both languages
  
  // Hierarchy — every non-concelho place points up
  parent_slug: z.string().optional(), // Required for freguesia, bairro, lugar
  
  // Geography
  geo: z.object({
    centroid: z.tuple([z.number(), z.number()]).optional(), // [lat, lng]
    bounds: z.array(z.tuple([z.number(), z.number()])).optional(), // GeoJSON-ready polygon points
    area_km2: z.number().optional(),
  }).optional(),
  
  // Demographics (concelho/freguesia level)
  population: z.number().optional(),
  population_year: z.number().optional(), // Year of the population figure
  
  // Editorial
  pt: z.object({
    short_description: z.string().max(280),
    page_status: z.enum(['placeholder', 'thin', 'developed', 'comprehensive']),
  }),
  en: z.object({
    short_description: z.string().max(280),
    page_status: z.enum(['placeholder', 'thin', 'developed', 'comprehensive']),
  }),
  
  // Build metadata
  last_updated: z.date(),
  last_visited: z.date().optional(),
  draft: z.boolean().default(false),
});

export const places = defineCollection({
  type: 'content',
  schema: placeSchema,
});
```

### 3.2 Establishment

```typescript
const establishmentTypeVocabulary = z.enum([
  // Food and drink
  'restaurant', 'tasca', 'marisqueira', 'cervejaria', 'pastelaria',
  'padaria', 'cafe', 'esplanada', 'bar', 'wine_bar',
  'food_truck_fixed_location', 'food_market_stall',
  
  // Accommodation
  'hotel', 'pousada', 'agroturismo', 'guesthouse', 'hostel', 'quinta_with_rooms',
  
  // Shops
  'livraria', 'ourivesaria', 'peixaria', 'talho', 'frutaria',
  'mercearia', 'sapataria', 'retrosaria', 'ferragens', 'florista',
  'farmacia', 'galeria', 'shopping_centre', 'mercado_municipal',
  
  // Civic and public
  'junta_de_freguesia', 'camara_municipal', 'biblioteca', 'museu',
  'escola_publica', 'escola_privada', 'centro_de_saude', 'hospital',
  
  // Community
  'colectividade', 'sociedade_filarmonica', 'casa_do_povo',
  'associacao_cultural', 'clube_desportivo',
  
  // Religious
  'igreja', 'capela', 'mosteiro', 'santuario',
]);

const establishmentSchema = z.object({
  // Identity
  slug: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string(), // Display name, usually Portuguese
  type: establishmentTypeVocabulary,
  sector: z.enum(['public', 'private', 'civic_community', 'religious']),
  
  // Location
  place_slugs: z.array(z.string()).min(1), // Place(s) this belongs to, most specific first
  address: z.string().optional(),
  postal_code: z.string().optional(),
  coordinates: z.tuple([z.number(), z.number()]).optional(), // [lat, lng]
  
  // Contact
  phone: z.string().optional(),
  email: z.string().email().optional(),
  website: z.string().url().optional(),
  instagram: z.string().optional(), // @handle or full URL
  facebook: z.string().optional(),
  
  // Hours
  hours: z.array(z.object({
    days: z.array(z.enum(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'])),
    open: z.string(), // "12:00"
    close: z.string(), // "23:00"
    notes: z.string().optional(),
  })).optional(),
  closed_days: z.array(z.string()).optional(), // ['mon', 'tue'] for weekly closures
  seasonal_closure: z.string().optional(), // Free-form note about seasonal closures
  
  // Editorial — bilingual
  pt: z.object({
    short_description: z.string().max(280),
    review_status: z.enum(['unreviewed', 'visited', 'recommended', 'archived']),
    recommendation_note: z.string().optional(), // One-line reason for recommendation
    last_visited: z.date().optional(),
  }),
  en: z.object({
    short_description: z.string().max(280),
    review_status: z.enum(['unreviewed', 'visited', 'recommended', 'archived']),
    recommendation_note: z.string().optional(),
    last_visited: z.date().optional(),
  }),
  
  // Type-specific data via discriminated union
  details: z.union([
    // Restaurant
    z.object({
      kind: z.literal('restaurant'),
      price_range: z.enum(['€', '€€', '€€€', '€€€€']).optional(),
      cuisine_tags: z.array(z.string()).optional(),
      dietary: z.array(z.enum(['vegetarian', 'vegan', 'gluten_free', 'pescatarian'])).optional(),
      reservations: z.enum(['required', 'recommended', 'not_required', 'not_accepted']).optional(),
      outdoor_seating: z.boolean().optional(),
    }),
    // Hotel
    z.object({
      kind: z.literal('hotel'),
      stars: z.number().min(1).max(5).optional(),
      rooms: z.number().optional(),
      pool: z.boolean().optional(),
      restaurant: z.boolean().optional(),
      pet_friendly: z.boolean().optional(),
    }),
    // Generic — everything else
    z.object({
      kind: z.literal('generic'),
    }),
  ]).optional(),
  
  // Build metadata
  last_updated: z.date(),
  draft: z.boolean().default(false),
});
```

### 3.3 Service

```typescript
const serviceTypeVocabulary = z.enum([
  'builder', 'plumber', 'electrician', 'gardener', 'cleaner',
  'mechanic_mobile', 'vet_mobile', 'tutor', 'translator',
  'photographer', 'designer', 'developer', 'accountant', 'lawyer',
  'real_estate_agent', 'architect', 'engineer', 'other',
]);

const serviceSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string(),
  type: serviceTypeVocabulary,
  
  // Service area (Places they serve, not where they're based)
  service_area_slugs: z.array(z.string()).min(1),
  
  // Contact
  phone: z.string().optional(),
  email: z.string().email().optional(),
  website: z.string().url().optional(),
  instagram: z.string().optional(),
  facebook: z.string().optional(),
  
  // Editorial
  pt: z.object({
    short_description: z.string().max(280),
    review_status: z.enum(['unreviewed', 'used', 'recommended', 'archived']),
    recommendation_note: z.string().optional(),
  }),
  en: z.object({
    short_description: z.string().max(280),
    review_status: z.enum(['unreviewed', 'used', 'recommended', 'archived']),
    recommendation_note: z.string().optional(),
  }),
  
  languages_spoken: z.array(z.enum(['pt', 'en', 'es', 'fr', 'de', 'other'])).optional(),
  
  last_updated: z.date(),
  draft: z.boolean().default(false),
});
```

### 3.4 Beach / Outdoor place

```typescript
const outdoorTypeVocabulary = z.enum([
  'beach', 'river_beach', 'pool_natural', 'walk_short', 'walk_long',
  'hiking_trail', 'cycling_route', 'viewpoint', 'mata', 'serra_section',
  'park', 'garden_public', 'doca', 'cais',
]);

const beachOutdoorSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string(),
  type: outdoorTypeVocabulary,
  
  // Location
  place_slugs: z.array(z.string()).min(1),
  coordinates: z.tuple([z.number(), z.number()]).optional(),
  
  // Practical
  parking: z.enum(['free', 'paid', 'limited', 'none']).optional(),
  access: z.enum(['easy', 'moderate', 'difficult']).optional(),
  facilities: z.array(z.enum([
    'lifeguard', 'showers', 'toilets', 'cafe', 'restaurant',
    'umbrella_rental', 'sunbed_rental', 'wheelchair_accessible',
    'dog_friendly', 'family_friendly',
  ])).optional(),
  
  // Seasonality
  best_months: z.array(z.enum([
    'jan', 'feb', 'mar', 'apr', 'may', 'jun',
    'jul', 'aug', 'sep', 'oct', 'nov', 'dec',
  ])).optional(),
  blue_flag: z.boolean().optional(),
  
  // Editorial
  pt: z.object({
    short_description: z.string().max(280),
    notes: z.string().optional(),
  }),
  en: z.object({
    short_description: z.string().max(280),
    notes: z.string().optional(),
  }),
  
  last_updated: z.date(),
  last_visited: z.date().optional(),
  draft: z.boolean().default(false),
});
```

### 3.5 Event

```typescript
const eventTypeVocabulary = z.enum([
  'festa_popular', 'feira', 'romaria', 'procissao', 'concert',
  'exhibition', 'theatre', 'cinema_outdoor', 'sport_event',
  'farmers_market', 'flea_market', 'workshop', 'other',
]);

const eventSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string(),
  type: eventTypeVocabulary,
  
  // Location
  place_slugs: z.array(z.string()).min(1),
  venue_establishment_slug: z.string().optional(), // If hosted by a specific establishment
  
  // Timing
  recurrence: z.enum(['one_off', 'annual', 'monthly', 'weekly', 'irregular']),
  date_start: z.date().optional(),
  date_end: z.date().optional(),
  typical_month: z.enum([
    'jan', 'feb', 'mar', 'apr', 'may', 'jun',
    'jul', 'aug', 'sep', 'oct', 'nov', 'dec',
  ]).optional(), // For annual events without confirmed dates
  
  // Organisation
  organiser_establishment_slug: z.string().optional(),
  organiser_note: z.string().optional(),
  
  // Editorial
  pt: z.object({
    short_description: z.string().max(280),
    notes: z.string().optional(),
  }),
  en: z.object({
    short_description: z.string().max(280),
    notes: z.string().optional(),
  }),
  
  free_entry: z.boolean().optional(),
  
  last_updated: z.date(),
  draft: z.boolean().default(false),
});
```

### 3.6 Article (editorial pieces)

Articles are the editorial content — features, essays, recommendations, longer pieces — that sit on top of the entity data. They reference entities but are themselves a separate content type.

```typescript
const pillarVocabulary = z.enum([
  'comer_beber',       // Eat & Drink
  'praia_natureza',    // Beach & Outdoors
  'lugares_bairros',   // Places & Neighbourhoods
  'cultura_agenda',    // Culture & What's On
  'viver_aqui',        // Living Here
  'dormir',            // Where to Stay
  'recomenda',         // Margem Cool Recomenda (added at maturity)
]);

const articleFormatVocabulary = z.enum([
  'essay',             // Long-form editorial
  'feature',           // Reported piece with structure
  'guide',             // Practical guide
  'recommendation',    // Short opinionated piece
  'list',              // Genuinely list-shaped content (not listicles)
  'interview',         // Q&A or profile
  'news',              // Time-bound update
  'opinion',           // Editorial opinion
]);

const articleSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  language: z.enum(['pt', 'en']),
  
  // Editorial identity
  title: z.string(),
  dek: z.string().optional(), // Subtitle / one-line summary beneath title
  pillar: pillarVocabulary,
  format: articleFormatVocabulary,
  
  // Bilingual pairing
  translation_of: z.string().optional(), // Slug of the equivalent article in the other language
  
  // Attribution
  author: z.string(),
  author_note: z.string().optional(), // E.g. "by the Margem Cool team"
  
  // Dates
  published: z.date(),
  last_updated: z.date(),
  
  // Geographic and entity relationships
  place_slugs: z.array(z.string()).optional(), // Places this piece is about
  establishment_slugs: z.array(z.string()).optional(), // Establishments referenced
  
  // Display
  hero_image: z.string().optional(), // Path to image in public/
  hero_image_caption: z.string().optional(),
  hero_image_credit: z.string().optional(),
  
  // SEO
  meta_description: z.string().max(160).optional(),
  
  // Status
  draft: z.boolean().default(false),
  featured: z.boolean().default(false),
  
  // Tags (free-form, in addition to controlled pillar)
  tags: z.array(z.string()).optional(),
});
```

---

## 4. URL structure

URLs are deliberate. They reflect the publication's hierarchy and are stable enough that links from year one still work in year five.

### 4.1 Top-level structure

```
/                           # Portuguese homepage (default)
/en/                        # English homepage
/pt/                        # Portuguese homepage (explicit)
```

The Portuguese homepage is at root (`/`) because Portuguese is the host language. The English version sits at `/en/`. The `/pt/` redirect to `/` exists for clarity, not as canonical.

### 4.2 Pillar pages

```
/{pillar-pt}/               # Portuguese pillar landing page
/en/{pillar-en}/            # English pillar landing page
```

Pillar slugs:
- `comer-e-beber` / `eat-and-drink`
- `praia-e-natureza` / `beach-and-outdoors`
- `lugares-e-bairros` / `places-and-neighbourhoods`
- `cultura-e-agenda` / `culture-and-whats-on`
- `viver-aqui` / `living-here`
- `dormir` / `where-to-stay`
- `recomenda` / `recommends` (added at maturity)

### 4.3 Place pages

Places use hierarchical URLs reflecting the concelho-freguesia-bairro hierarchy:

```
/lugares/{concelho}/                              # Concelho overview page
/lugares/{concelho}/{freguesia}/                  # Freguesia page
/lugares/{concelho}/{freguesia}/{bairro}/         # Bairro page
/lugares/{concelho}/{freguesia}/{bairro}/{lugar}/ # Lugar page (rare)

/en/places/{concelho}/                            # English equivalents
/en/places/{concelho}/{freguesia}/
...
```

Place slugs are always Portuguese (ASCII-folded), even on English pages. `setubal` not `setubal-en`. `principe-real` not `prince-royal`.

Examples:
- `/lugares/almada/cacilhas/`
- `/lugares/seixal/fernao-ferro/verdizela/`
- `/en/places/setubal/azeitao/`

### 4.4 Article pages

Articles use a flat slug structure under each pillar, with the language prefix determining the language:

```
/{pillar-pt}/{article-slug}/
/en/{pillar-en}/{article-slug}/
```

The article slug is the article's own identifier and is the same across languages where possible (so that the pairing is visible in URLs).

Examples:
- `/comer-e-beber/onde-comer-em-cacilhas/`
- `/en/eat-and-drink/onde-comer-em-cacilhas/`

Note: the English URL keeps the Portuguese slug as a deliberate signal that the article is a translation of a Portuguese original. The publication is Portuguese-first and the URL structure reflects it. The English title in the page H1 carries the English title properly; only the slug remains Portuguese for stability and pairing.

Alternative pattern (decide before launch): English slug for English URL, with `translation_of` linking the two. The pattern above is simpler; the alternative is more SEO-friendly in English markets. Worth deciding explicitly in Phase 0.

### 4.5 Establishment, Service, Beach, Event pages

These entity types do not get their own top-level URL pages by default. They are referenced within articles, area pages, and listing pages, and can be navigated to as anchored references rather than as canonical pages.

In Phase 2 or 3 — once enough entities exist — establishment-listing pages may be added at:

```
/comer-e-beber/onde-comer/{place-slug}/
/en/eat-and-drink/where-to-eat/{place-slug}/
```

These pages list all reviewed Establishments of food-and-drink types within the named Place. Other listing patterns will emerge as needed.

### 4.6 Utility pages

```
/sobre/                     # About page (Portuguese)
/en/about/                  # About page (English)
/contacto/                  # Contact (Portuguese)
/en/contact/                # Contact (English)
/colofao/                   # Colophon / credits (Portuguese)
/en/colophon/               # Colophon (English)
/politica-de-privacidade/   # Privacy policy
/en/privacy-policy/
```

### 4.7 Newsletter / RSS

```
/rss.xml                    # Portuguese RSS feed
/en/rss.xml                 # English RSS feed
/newsletter/                # Newsletter signup
/en/newsletter/
```

### 4.8 Sitemap and OpenSearch

```
/sitemap.xml                # Sitemap (all languages)
/opensearch.xml             # OpenSearch description
```

---

## 5. Bilingual content pattern

### 5.1 Articles

Articles exist as separate Markdown files per language, paired by `translation_of`.

```
src/content/articles/
├── pt/
│   ├── onde-comer-em-cacilhas.md
│   └── azeitao-um-fim-de-semana.md
└── en/
    ├── onde-comer-em-cacilhas.md          # Same slug as PT version
    └── azeitao-um-fim-de-semana.md
```

The English file's front matter includes `translation_of: 'onde-comer-em-cacilhas'` pointing to the Portuguese original. The Astro build cross-references the pair and generates `hreflang` tags in the HTML head of each page.

Translation pointer rules:
- Every English article must have a `translation_of` value pointing to a real Portuguese article slug
- Portuguese articles can exist without an English translation; English articles cannot exist without a Portuguese original
- The translation_of pointer is validated at build time; broken pointers fail the build

### 5.2 Places, Establishments, Services, Beaches, Events

These entities have **bilingual fields embedded in a single file** (the `pt` and `en` objects in the schemas above). One file per entity, not one per language. This is because the underlying data (geography, contact details, hours) is language-neutral; only the editorial description varies.

The Astro page templates pick the appropriate language fields based on the page language.

### 5.3 hreflang and SEO

Every page in both languages includes:
- `<link rel="alternate" hreflang="pt" href="...">`
- `<link rel="alternate" hreflang="en" href="...">`
- `<link rel="alternate" hreflang="x-default" href="...">`  (points to Portuguese version)

This is generated automatically from the translation pointers.

---

## 6. Validation rules

Build-time validation is strict. The build fails on any of the following:

### 6.1 Schema violations

- Required fields missing
- Field types incorrect
- Field values outside enum vocabularies
- Field length constraints violated (e.g. `short_description` > 280 chars)
- Slug format invalid (must match `/^[a-z0-9-]+$/`)

### 6.2 Cross-reference violations

- `parent_slug` on a Place pointing to a non-existent Place
- `parent_slug` hierarchy violation (e.g. a freguesia pointing to a bairro as parent)
- `place_slugs` on any entity pointing to non-existent Places
- `translation_of` on an English article pointing to a non-existent Portuguese article
- `venue_establishment_slug` on an Event pointing to a non-existent Establishment
- `organiser_establishment_slug` similarly

### 6.3 Brand consistency violations

These are warnings rather than errors but should be reviewed before publication:

- Article content containing banned vocabulary (see `brand.md` for the list)
- Article in English containing italicised Portuguese terms (Portuguese terms should be roman)
- Article in Portuguese using *você* in singular (should be *tu* register)
- Article without `hero_image` if `featured: true`
- Article without `meta_description` (warning, not error)

The build can run with warnings; it cannot run with errors.

### 6.4 Taxonomy consistency

- Pillar values must match the controlled vocabulary
- Format values must match the controlled vocabulary
- Establishment type values must match the vocabulary
- Service type values must match the vocabulary

When new vocabulary terms are needed, they are added to the canonical lists in `src/data/vocabularies/` and the change is committed alongside the content that needs the new term.

---

## 7. File and directory structure

```
margem-cool/
├── docs/
│   ├── brand.md
│   ├── architecture.md
│   └── claude-code-handover.md
│
├── src/
│   ├── content/
│   │   ├── config.ts                    # Zod schemas for all collections
│   │   │
│   │   ├── articles/
│   │   │   ├── pt/
│   │   │   │   └── {slug}.md
│   │   │   └── en/
│   │   │       └── {slug}.md
│   │   │
│   │   ├── places/
│   │   │   └── {concelho}/
│   │   │       ├── _concelho.md         # Concelho-level metadata and intro
│   │   │       └── {freguesia}/
│   │   │           ├── _freguesia.md
│   │   │           └── {bairro}/
│   │   │               └── _bairro.md
│   │   │
│   │   ├── establishments/
│   │   │   └── {slug}.md                # Flat, slugs globally unique
│   │   │
│   │   ├── services/
│   │   │   └── {slug}.md
│   │   │
│   │   ├── beaches/
│   │   │   └── {slug}.md
│   │   │
│   │   └── events/
│   │       └── {slug}.md
│   │
│   ├── pages/
│   │   ├── index.astro                  # Portuguese homepage
│   │   ├── [pillar]/
│   │   │   ├── index.astro              # Pillar landing
│   │   │   └── [article].astro          # Article page
│   │   ├── lugares/
│   │   │   └── [...slug].astro          # Catch-all for place hierarchy
│   │   ├── sobre.astro
│   │   ├── contacto.astro
│   │   └── en/
│   │       ├── index.astro
│   │       ├── [pillar]/
│   │       └── places/
│   │
│   ├── components/
│   │   ├── brand/
│   │   │   ├── Wordmark.astro          # The stacked wordmark
│   │   │   ├── MastheadLockup.astro    # Wordmark + descriptor + tagline
│   │   │   ├── MCMonogram.astro
│   │   │   └── RiverDivider.astro      # The river-curve as layout element
│   │   ├── layout/
│   │   ├── navigation/
│   │   ├── article/
│   │   ├── place/
│   │   └── establishment/
│   │
│   ├── layouts/
│   │   ├── BaseLayout.astro
│   │   ├── ArticleLayout.astro
│   │   ├── PlaceLayout.astro
│   │   └── PillarLayout.astro
│   │
│   ├── data/
│   │   ├── vocabularies/
│   │   │   ├── pillars.json
│   │   │   ├── article-formats.json
│   │   │   ├── establishment-types.json
│   │   │   ├── service-types.json
│   │   │   ├── outdoor-types.json
│   │   │   └── event-types.json
│   │   ├── concelhos.json               # Canonical list of 9 concelhos
│   │   ├── freguesias.json              # Canonical list of 39 freguesias
│   │   └── geo/
│   │       ├── concelhos.geojson        # Boundary polygons
│   │       └── freguesias.geojson
│   │
│   ├── styles/
│   │   ├── tokens.css                   # Design tokens (colours, type scale, spacing)
│   │   ├── base.css                     # Reset, body, basic typography
│   │   ├── typography.css
│   │   ├── layout.css
│   │   └── components/
│   │
│   └── utils/
│       ├── i18n.ts                      # Language detection, hreflang generation
│       ├── place-hierarchy.ts           # Place tree navigation
│       └── schema-org.ts                # JSON-LD generation from front matter
│
├── public/
│   ├── fonts/
│   │   ├── Outfit-Variable.woff2
│   │   └── SourceSerif4-Variable.woff2
│   ├── images/
│   │   ├── articles/
│   │   ├── places/
│   │   └── og/                          # OpenGraph default images
│   ├── favicon.ico
│   ├── favicon.svg
│   ├── apple-touch-icon.png
│   └── robots.txt
│
├── astro.config.mjs
├── package.json
├── tsconfig.json
├── .gitignore
├── .nvmrc
├── README.md
└── LICENSE                              # MIT for code; content separately licensed
```

---

## 8. Schema.org JSON-LD

Every page generates appropriate Schema.org JSON-LD from its front matter. This is what gives the publication good SEO and proper structured-data signals.

### 8.1 Mapping table

| Entity / Page type | Schema.org type | Notes |
|--------------------|-----------------|-------|
| Place (concelho/freguesia) | `AdministrativeArea` | With `containedInPlace` for hierarchy |
| Place (bairro/lugar) | `Place` | With `containedInPlace` pointing to freguesia |
| Establishment (restaurant) | `Restaurant` | With `servesCuisine`, `priceRange`, `openingHours` |
| Establishment (hotel) | `Hotel` or `LodgingBusiness` | With `starRating` |
| Establishment (shop) | `Store` | With sub-type where appropriate (`BookStore`, `JewelryStore` etc.) |
| Establishment (museum) | `Museum` | |
| Establishment (church) | `PlaceOfWorship` | |
| Establishment (junta de freguesia) | `GovernmentOffice` | |
| Establishment (mercado municipal) | `Market` | |
| Service | `Service` with `provider` | |
| Beach | `BeachResort` or generic `Place` with `additionalType` | |
| Event | `Event`, `Festival`, `MusicEvent`, etc. | Subtype based on `type` field |
| Article | `NewsArticle` or `Article` | With proper `inLanguage`, `about`, `mentions` |
| Homepage | `WebSite` with `SearchAction` | |
| About page | `AboutPage` | |

### 8.2 Generation

The mapping is implemented in `src/utils/schema-org.ts` as a pure function taking the entity front matter and returning the JSON-LD object. The page template injects the JSON-LD into the document head.

All entities with coordinates emit `geo` properties. All entities with addresses emit `address`. All bilingual content emits proper `inLanguage` and references to the translation pair via `workTranslation` / `translationOfWork`.

---

## 9. Open architectural questions

These remain to be decided before or during Phase 0 work:

### 9.1 CSS approach

Vanilla CSS with custom properties, or Tailwind, or another approach?

**Recommendation**: vanilla CSS with custom properties. The publication is content-driven, the design is restrained, the team is small. Tailwind adds dependency weight that doesn't earn its place here. Custom properties give the design tokens we need. Decision deferred to Phase 0 implementation but vanilla is the working assumption.

### 9.2 English article slugs

Keep Portuguese slug across languages (current proposal, simpler), or have English slugs for English articles (better SEO, more complex)?

**Recommendation**: Portuguese slug across languages for Phase 1. The simplicity is worth it and the publication's English-language SEO ambitions are modest. Can be revisited if English audience grows materially.

### 9.3 Place page structure for very small places

What happens when a *lugar* doesn't have enough material for its own page? Does it redirect to the parent freguesia, or does it have a stub page?

**Recommendation**: stub pages with a clear "this place is small — here's what we know" framing. Better than redirecting because the URL remains stable and the publication can grow the page later.

### 9.4 Newsletter platform

The publication will need a newsletter eventually. What platform? Buttondown, Substack, ConvertKit, self-hosted Ghost?

**Recommendation**: deferred to Phase 2. The Phase 1 launch doesn't need a newsletter; the publication can grow its readership through RSS, social, and direct-traffic first. When the newsletter is added, Buttondown is a reasonable starting choice (good Markdown support, simple, EU-friendly pricing).

### 9.5 Comments

Whether the publication has comments at all. Options: no comments (cleanest), commento or similar (lightweight third-party), reactions only (e.g. emoji react without text).

**Recommendation**: no comments for Phase 1 and 2. Reader contact is via email and social. Comments add moderation overhead and rarely add editorial value at this scale.

### 9.6 Analytics

What analytics, if any? Cloudflare's built-in analytics, Plausible, Fathom, none?

**Recommendation**: Cloudflare Web Analytics (built into the hosting, privacy-respecting, free). No Google Analytics. If more depth needed later, Plausible is the upgrade path.

---

## 10. Performance budget

The publication should be fast. Targets:

- **Lighthouse Performance score**: 95+ on every page
- **First Contentful Paint**: under 1.2s on 3G
- **Total Blocking Time**: under 100ms
- **Cumulative Layout Shift**: under 0.05
- **Page weight**: under 500KB for most pages, under 1MB for image-heavy pages

To hit these:
- Static site generation (no client-side hydration except where strictly needed)
- Self-hosted fonts with `font-display: swap`
- Images optimised at build time (WebP with JPG fallback, multiple resolutions, proper sizing)
- No third-party scripts except analytics (and analytics is light)
- Minimal JavaScript on the client

---

## 11. Accessibility

WCAG 2.1 AA minimum, AAA for body text contrast.

- All images have `alt` text
- Heading hierarchy is semantic (one H1 per page, sequential H2-H6)
- Focus states are visible
- Keyboard navigation works for every interactive element
- Skip-to-content link on every page
- Language attribute set on the HTML element and on any inline language switches
- Form labels properly associated
- Colour is not the only signal for any UI element
- Reduced-motion preferences respected

---

## 12. Internationalisation beyond PT/EN

The publication starts bilingual (PT/EN). Could expand later — Spanish, French, German, Dutch are the most plausible additions for the foreign-resident audience.

The architecture should not lock the publication into exactly two languages. Mostly already handled by the schemas (the `pt` and `en` objects can be supplemented with `es`, `fr`, etc.) but should be considered when designing components that render language-aware content.

For Phase 1 and Phase 2, the publication is strictly PT/EN. Other languages are a Phase 3+ consideration if at all.

---

*This document is the canonical architecture reference for Margem Cool. When code and this document disagree, the document is wrong or the code is wrong — investigate and update one of them.*
