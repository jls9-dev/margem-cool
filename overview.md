# Margem Cool — overview

The front door. A useful information site about the Margem Sul — the nine concelhos on the south bank of the Tejo — written for the people who live there.

**siteType:** Content · **status:** live · **margemcool.pt**

## Find everything
- **Brand** → [`brand/guidelines.md`](brand/guidelines.md) · full canon in [`docs/standards/brand.md`](docs/standards/brand.md).
- **Coolest features** → [`docs/highlights.md`](docs/highlights.md). **Ideas** → [`IDEAS.md`](IDEAS.md).
- **Decisions (why)** → [`decisions.md`](decisions.md). **Stack** → [`reference.md`](reference.md).
- **How to run / work here** → [`README.md`](README.md) · [`CLAUDE.md`](CLAUDE.md).
- **Standards** → [`docs/standards/`](docs/standards/). **Processes** → [`docs/processes/`](docs/processes/).
- **Strategy** → [`business/marketing-plan.md`](business/marketing-plan.md).

## What is here

| | |
|---|---|
| **Place pages** | Nine concelhos, ~40 freguesias, and the bairros and lugares inside them. `src/content/places/`, served at `/lugares/` and `/en/places/`. |
| **Guides** | Landmarks, beaches, markets, festas, dishes. `src/content/articles/{pt,en}/`, served at `/guias/` and `/en/guides/`. |
| **Pillars** | Six top-level hubs, content in [`src/data/pillars.ts`](src/data/pillars.ts). |

## The three rules that govern everything

1. **Portuguese first.** Essentially all search demand for this region is Portuguese-language. English editions are translations, in British English.
2. **Publish first, review after.** Nothing is held as a draft waiting for sign-off. Lucia reviews what is already live.
3. **A page earns its place in the index by having content on it.** Everything else is `noindex, follow` and out of the sitemap — the build fails if those two disagree.

Conforms to the Spandera [Brand-Repo Standard](https://github.com/jls9-dev/spandera-studio/blob/main/BRAND-REPO-STANDARD.md).
