// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
const siteUrl = process.env.SITE_URL ?? 'https://prepbase.ze-ro.workers.dev';

export default defineConfig({
  site: siteUrl,
  trailingSlash: 'never',
  integrations: [react(), sitemap()],
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
