import { z, defineCollection, type CollectionEntry } from 'astro:content';

/* -------------------------------------------------------------------------
 * Shared vocabularies — single source of truth, exported for use elsewhere.
 * ------------------------------------------------------------------------- */

export const pillarVocabulary = z.enum([
  'comer_beber',
  'praia_natureza',
  'lugares_bairros',
  'cultura_agenda',
  'viver_aqui',
  'dormir',
  'recomenda',
]);
export type Pillar = z.infer<typeof pillarVocabulary>;

export const articleFormatVocabulary = z.enum([
  'essay',
  'feature',
  'guide',
  'recommendation',
  'list',
  'interview',
  'news',
  'opinion',
]);

export const establishmentTypeVocabulary = z.enum([
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

export const serviceTypeVocabulary = z.enum([
  'builder', 'plumber', 'electrician', 'gardener', 'cleaner',
  'mechanic_mobile', 'vet_mobile', 'tutor', 'translator',
  'photographer', 'designer', 'developer', 'accountant', 'lawyer',
  'real_estate_agent', 'architect', 'engineer', 'other',
]);

export const outdoorTypeVocabulary = z.enum([
  'beach', 'river_beach', 'pool_natural', 'walk_short', 'walk_long',
  'hiking_trail', 'cycling_route', 'viewpoint', 'mata', 'serra_section',
  'park', 'garden_public', 'doca', 'cais',
]);

export const eventTypeVocabulary = z.enum([
  'festa_popular', 'feira', 'romaria', 'procissao', 'concert',
  'exhibition', 'theatre', 'cinema_outdoor', 'sport_event',
  'farmers_market', 'flea_market', 'workshop', 'other',
]);

// Note: every entity's URL slug is derived from its file path by Astro's
// content collections (entry.slug). `slug` is a reserved frontmatter key
// stripped before Zod validation, so we never declare it in the schemas
// below. Format and uniqueness are enforced in src/utils/validate-refs.ts.
const weekday = z.enum(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']);
const month = z.enum([
  'jan', 'feb', 'mar', 'apr', 'may', 'jun',
  'jul', 'aug', 'sep', 'oct', 'nov', 'dec',
]);

/* -------------------------------------------------------------------------
 * Places — concelho, freguesia, bairro, lugar
 * ------------------------------------------------------------------------- */

const pageStatus = z.enum(['placeholder', 'thin', 'developed', 'comprehensive']);

const placeSchema = z.object({
  level: z.enum(['concelho', 'freguesia', 'bairro', 'lugar']),
  name_pt: z.string(),
  name_en: z.string().optional(),

  parent_slug: z.string().optional(),

  geo: z.object({
    centroid: z.tuple([z.number(), z.number()]).optional(),
    bounds: z.array(z.tuple([z.number(), z.number()])).optional(),
    area_km2: z.number().optional(),
  }).optional(),

  population: z.number().optional(),
  population_year: z.number().optional(),

  pt: z.object({
    short_description: z.string().max(280),
    page_status: pageStatus,
  }),
  en: z.object({
    short_description: z.string().max(280),
    page_status: pageStatus,
  }),

  last_updated: z.date(),
  last_visited: z.date().optional(),
  draft: z.boolean().default(false),
});

/* -------------------------------------------------------------------------
 * Establishments
 * ------------------------------------------------------------------------- */

const reviewStatusEstablishment = z.enum(['unreviewed', 'visited', 'recommended', 'archived']);

const establishmentSchema = z.object({
  name: z.string(),
  type: establishmentTypeVocabulary,
  sector: z.enum(['public', 'private', 'civic_community', 'religious']),

  place_slugs: z.array(z.string()).min(1),
  address: z.string().optional(),
  postal_code: z.string().optional(),
  coordinates: z.tuple([z.number(), z.number()]).optional(),

  phone: z.string().optional(),
  email: z.string().email().optional(),
  website: z.string().url().optional(),
  instagram: z.string().optional(),
  facebook: z.string().optional(),

  hours: z.array(z.object({
    days: z.array(weekday),
    open: z.string(),
    close: z.string(),
    notes: z.string().optional(),
  })).optional(),
  closed_days: z.array(z.string()).optional(),
  seasonal_closure: z.string().optional(),

  pt: z.object({
    short_description: z.string().max(280),
    review_status: reviewStatusEstablishment,
    recommendation_note: z.string().optional(),
    last_visited: z.date().optional(),
  }),
  en: z.object({
    short_description: z.string().max(280),
    review_status: reviewStatusEstablishment,
    recommendation_note: z.string().optional(),
    last_visited: z.date().optional(),
  }),

  details: z.union([
    z.object({
      kind: z.literal('restaurant'),
      price_range: z.enum(['€', '€€', '€€€', '€€€€']).optional(),
      cuisine_tags: z.array(z.string()).optional(),
      dietary: z.array(z.enum(['vegetarian', 'vegan', 'gluten_free', 'pescatarian'])).optional(),
      reservations: z.enum(['required', 'recommended', 'not_required', 'not_accepted']).optional(),
      outdoor_seating: z.boolean().optional(),
    }),
    z.object({
      kind: z.literal('hotel'),
      stars: z.number().min(1).max(5).optional(),
      rooms: z.number().optional(),
      pool: z.boolean().optional(),
      restaurant: z.boolean().optional(),
      pet_friendly: z.boolean().optional(),
    }),
    z.object({
      kind: z.literal('generic'),
    }),
  ]).optional(),

  last_updated: z.date(),
  draft: z.boolean().default(false),
});

/* -------------------------------------------------------------------------
 * Services
 * ------------------------------------------------------------------------- */

const reviewStatusService = z.enum(['unreviewed', 'used', 'recommended', 'archived']);

const serviceSchema = z.object({
  name: z.string(),
  type: serviceTypeVocabulary,

  service_area_slugs: z.array(z.string()).min(1),

  phone: z.string().optional(),
  email: z.string().email().optional(),
  website: z.string().url().optional(),
  instagram: z.string().optional(),
  facebook: z.string().optional(),

  pt: z.object({
    short_description: z.string().max(280),
    review_status: reviewStatusService,
    recommendation_note: z.string().optional(),
  }),
  en: z.object({
    short_description: z.string().max(280),
    review_status: reviewStatusService,
    recommendation_note: z.string().optional(),
  }),

  languages_spoken: z.array(z.enum(['pt', 'en', 'es', 'fr', 'de', 'other'])).optional(),

  last_updated: z.date(),
  draft: z.boolean().default(false),
});

/* -------------------------------------------------------------------------
 * Beach / Outdoor
 * ------------------------------------------------------------------------- */

const beachOutdoorSchema = z.object({
  name: z.string(),
  type: outdoorTypeVocabulary,

  place_slugs: z.array(z.string()).min(1),
  coordinates: z.tuple([z.number(), z.number()]).optional(),

  parking: z.enum(['free', 'paid', 'limited', 'none']).optional(),
  access: z.enum(['easy', 'moderate', 'difficult']).optional(),
  facilities: z.array(z.enum([
    'lifeguard', 'showers', 'toilets', 'cafe', 'restaurant',
    'umbrella_rental', 'sunbed_rental', 'wheelchair_accessible',
    'dog_friendly', 'family_friendly',
  ])).optional(),

  best_months: z.array(month).optional(),
  blue_flag: z.boolean().optional(),

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

/* -------------------------------------------------------------------------
 * Events
 * ------------------------------------------------------------------------- */

const eventSchema = z.object({
  name: z.string(),
  type: eventTypeVocabulary,

  place_slugs: z.array(z.string()).min(1),
  venue_establishment_slug: z.string().optional(),

  recurrence: z.enum(['one_off', 'annual', 'monthly', 'weekly', 'irregular']),
  date_start: z.date().optional(),
  date_end: z.date().optional(),
  typical_month: month.optional(),

  organiser_establishment_slug: z.string().optional(),
  organiser_note: z.string().optional(),

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

/* -------------------------------------------------------------------------
 * Articles — editorial pieces
 * ------------------------------------------------------------------------- */

const articleSchema = z.object({
  language: z.enum(['pt', 'en']),

  title: z.string(),
  dek: z.string().optional(),
  pillar: pillarVocabulary,
  format: articleFormatVocabulary,

  translation_of: z.string().optional(),

  author: z.string(),
  author_note: z.string().optional(),

  published: z.date(),
  last_updated: z.date(),

  place_slugs: z.array(z.string()).optional(),
  establishment_slugs: z.array(z.string()).optional(),

  hero_image: z.string().optional(),
  hero_image_caption: z.string().optional(),
  hero_image_credit: z.string().optional(),

  meta_description: z.string().max(160).optional(),

  draft: z.boolean().default(false),
  featured: z.boolean().default(false),

  tags: z.array(z.string()).optional(),
});

/* -------------------------------------------------------------------------
 * Collections
 * ------------------------------------------------------------------------- */

export const collections = {
  places: defineCollection({ type: 'content', schema: placeSchema }),
  establishments: defineCollection({ type: 'content', schema: establishmentSchema }),
  services: defineCollection({ type: 'content', schema: serviceSchema }),
  beaches: defineCollection({ type: 'content', schema: beachOutdoorSchema }),
  events: defineCollection({ type: 'content', schema: eventSchema }),
  articles: defineCollection({ type: 'content', schema: articleSchema }),
};

export type PlaceEntry = CollectionEntry<'places'>;
export type EstablishmentEntry = CollectionEntry<'establishments'>;
export type ArticleEntry = CollectionEntry<'articles'>;
