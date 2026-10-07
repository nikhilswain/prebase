# prepbase

A fast, structured developer interview knowledge base. Search a topic, understand
it, revise it, move on.

Built with Astro, TypeScript, React islands and Tailwind. Content lives in plain
JSON so questions can be added or corrected without touching application code.

## Stack

- Astro for static generation and routing
- TypeScript everywhere
- React only for genuinely interactive islands: search, quick revision,
  interview mode and listing filters
- Tailwind CSS v4 with a small design-token layer
- Shiki for build-time syntax highlighting, no client-side highlighting library
- `@astrojs/sitemap` plus generated metadata for SEO

## Getting started

```bash
npm install
npm run dev
```

Other scripts:

```bash
npm run build     # static build to dist/
npm run preview   # preview the build
npm run check     # astro check + TypeScript
npm run assets    # regenerate favicons, icons and og.png
npm run deploy    # build and deploy to Cloudflare Workers
```

## Deploying to Cloudflare Workers

The site is a static build served by Cloudflare Workers static assets. The
binding lives in `wrangler.jsonc`:

- `assets.directory` is `./dist`, so the Worker serves the Astro output
- `assets.html_handling` is `drop-trailing-slash`, matching Astro's
  `trailingSlash: "never"` and the canonical URLs
- `assets.not_found_handling` is `404-page`, serving the generated `404.html`

In the Cloudflare dashboard (Workers Builds) set:

| Setting | Value |
| --- | --- |
| Build command | `npm run build` |
| Deploy command | `npx wrangler deploy` |
| Node version | `22` (see `.nvmrc`) |
| `SITE_URL` | your production URL |

Without a Wrangler config the Worker deploys with no assets attached and every
route returns 404. The `name` in `wrangler.jsonc` must match the Worker in the
dashboard exactly, otherwise `wrangler deploy` creates a second Worker and the
existing URL keeps serving the old build.

Test the exact production behaviour locally before pushing:

```bash
npm run build
npx wrangler dev --port 8788   # then curl http://localhost:8788/abc
```

## Project structure

```
src/
  config.ts            Site metadata, navigation, footer
  data/
    categories.json    Categories, ordering and status
    topics/*.json      Questions, concepts, comparisons, challenges, gotchas, cheat sheets
    revision/*.json    Quick Revision cards per category
  lib/
    content-types.ts   The content model as TypeScript types
    content.ts         Loads, validates and indexes content
    search.ts          Search scoring and grouping, shared with the client
    search-index.ts    Builds the search index
    seo.ts             JSON-LD builders
  components/
    site/              Header, footer, breadcrumbs, search trigger, theme toggle
    ui/                Cards, lists, section headings, badges
    content/           Topic rendering: header, body, code blocks, comparisons
    search/            Search command palette island
    revision/          Quick Revision board island
    interview/         Interview Mode island
    list/              Listing layout and filter island
  layouts/
    BaseLayout.astro   Head, metadata, theme script, shell
  pages/
    index.astro        Landing page
    explore.astro      Category index
    [category]/        Category listing and topic pages
    quick-revision/    Quick Revision index and per-category board
    interview.astro    Interview Mode
    questions | comparisons | challenges | cheat-sheets
    tags/              Tag index and per-tag listing
    contribute.astro   Content guide
    robots.txt.ts      Generated robots.txt with the correct sitemap URL
    search-index.json.ts  Static search index endpoint
```

## Adding content

Edit `src/data/topics/<category>.json`. Each entry follows the model in
`src/lib/content-types.ts`. Content is validated at build time: duplicate ids,
missing required fields and mismatched comparison rows fail the build, and related
links that point at missing topics are reported.

A minimal question looks like this:

```json
{
  "id": "js-closures",
  "slug": "closures",
  "category": "javascript",
  "type": "question",
  "title": "What is a closure?",
  "summary": "A function that keeps a reference to its creation scope.",
  "difficulty": "easy",
  "tags": ["scope", "functions"],
  "shortAnswer": "A closure is a function bundled with its lexical environment.",
  "explanation": ["The captured scope stays alive while the closure is reachable."],
  "example": { "language": "javascript", "code": "..." },
  "commonMistakes": [],
  "followUps": [],
  "related": ["js-lexical-scope"],
  "sources": [],
  "reviewStatus": "unreviewed"
}
```

Supported types: `question`, `concept`, `comparison`, `challenge`, `gotcha`,
`cheat-sheet`. Quick Revision cards live in `src/data/revision/*.json` with
`short`, `medium` and `detail` levels.

### Review status and trust

Every topic carries a `reviewStatus` of `unreviewed`, `community-reviewed` or
`verified`, and an optional `generated: true` flag. Unreviewed, generated pages
are marked `noindex` until someone reviews them. AI output is never treated as
authoritative on its own.

## SEO

Every topic is a static, crawlable page: `/javascript/closures`,
`/react/useeffect`, `/css/flexbox-vs-grid`. Pages carry unique titles,
descriptions, canonical URLs, OpenGraph and Twitter metadata, breadcrumbs,
JSON-LD (`TechArticle`, `Question`, `CollectionPage`, `BreadcrumbList`) and a
sitemap. `robots.txt` points at the sitemap and the search index is exposed at
`/search-index.json`.

Set `SITE_URL` in the build environment when deploying:

```bash
SITE_URL=https://your-domain.com npm run build
```

It falls back to `https://prebase.zerro.dev`. `astro.config.mjs` and
`src/config.ts` both read it, so canonical URLs, OpenGraph and Twitter images,
JSON-LD, `robots.txt` and the sitemap all follow automatically.

## Notes

- The dev server can run in the background with `astro dev --background`.
- Most content pages ship no client JavaScript beyond the idle-loaded search
  dialog. Interactive features are isolated islands.
