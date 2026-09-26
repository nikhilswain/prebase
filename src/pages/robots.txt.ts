import type { APIRoute } from 'astro';
import { SITE } from '../config';

export const GET: APIRoute = () =>
  new Response(
    `User-agent: *
Allow: /

Sitemap: ${SITE.url}/sitemap-index.xml
`,
    {
      headers: {
        'content-type': 'text/plain; charset=utf-8',
        'cache-control': 'public, max-age=86400',
      },
    },
  );
