// @ts-check
import { readdirSync, readFileSync } from 'node:fs';
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
const siteUrl = process.env.SITE_URL ?? 'https://prebase.ze-ro.workers.dev';

// Tag pages are auto-generated listings. A tag with one or two topics is a thin
// page that adds little and dilutes crawl budget, so it is kept out of the
// sitemap and marked noindex on the page itself (see src/pages/tags/[tag].astro).
const MIN_TAG_ITEMS = 3;

function thinTags() {
  const dir = new URL('./src/data/topics/', import.meta.url);
  const counts = new Map();
  for (const file of readdirSync(dir)) {
    if (!file.endsWith('.json')) continue;
    const items = JSON.parse(readFileSync(new URL(file, dir), 'utf8'));
    for (const item of items) {
      for (const tag of item.tags ?? []) {
        counts.set(tag, (counts.get(tag) ?? 0) + 1);
      }
    }
  }
  return new Set(
    [...counts].filter(([, count]) => count < MIN_TAG_ITEMS).map(([tag]) => tag),
  );
}

const thin = thinTags();

export default defineConfig({
  site: siteUrl,
  trailingSlash: 'never',
  integrations: [
    react(),
    sitemap({
      filter: (page) => {
        // Search result pages are infinite thin duplicates.
        if (page.includes('/search')) return false;
        const match = page.match(/\/tags\/([^/]+)\/?$/);
        if (match) return !thin.has(decodeURIComponent(match[1]));
        return true;
      },
    }),
  ],
  markdown: {
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark' },
    },
  },
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'hover',
  },
  build: {
    inlineStylesheets: 'auto',
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
