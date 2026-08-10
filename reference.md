# Margem Cool — the stack card

| | |
|---|---|
| **Domain** | margemcool.pt (canonical, PT-first). margemcool.com redirects via Cloudflare Bulk Redirect. www → apex in code, `functions/`. |
| **Hosting** | Cloudflare Pages, project `margem-cool`, auto-deploy from `main`. |
| **Framework** | Astro 5, static output, `trailingSlash: 'always'`, stylesheets inlined. |
| **Content** | Astro content collections — `places`, `articles`, plus `establishments`, `services`, `beaches`, `events` (declared, still empty). |
| **Analytics** | Cloudflare Web Analytics via Zaraz, EU visitors included. Opt-out at `/optout/`. |
| **Search Console** | `sc-domain:margemcool.pt`. Read through the Spandera ops console, `/api/gsc?slug=margem-cool`. |
| **SEO tooling** | NeuronWriter project `a0a84277fc3b8868` (engine google.pt, Portuguese). CLI at `scripts/seo/`, key at `~/.claude/.../secrets/neuronwriter.txt`. |
| **Keyword data** | DataForSEO, location 2620 / language pt. Universe lives in Spandera at `src/data/keyword-universe/margem-cool.json`. |
| **Ops console** | `https://spandera.studio/operations/…?slug=margem-cool`, behind Cloudflare Access. |

## Scripts

| command | what it does |
|---|---|
| `npm run build` | Build, then gate on hreflang and on noindex/sitemap agreement. |
| `npm run facts` | Re-check every declared perishable claim against its source. |
| `npm run fares` | Re-read the Transtejo tariff table into `src/data/ferry-fares.json`. |
| `npm run next` | What to write next, ranked by when each page must exist. |
| `npm run photo` | Prepare a source photograph for use — EXIF rotation, resize, strip metadata. |
| `npm run seo` | NeuronWriter CLI — briefs, queries, scoring. |
| `npm run geo:build`, `brand:wordmark`, `brand:favicons` | Regenerate geodata and brand assets. |

## Build gates

`check-hreflang.mjs` — every alternate served directly and matching its canonical.
`check-noindex.mjs` — the sitemap and the robots tags must agree, in both directions.

## Automation

`.github/workflows/weekly-routine.yml`, Mondays 06:00 UTC. Kill switches in `routine.json`.
