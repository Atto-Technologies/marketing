// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

import mdx from '@astrojs/mdx';

export default defineConfig({
  output: 'static',
  site: 'https://atto.tech',
  compressHTML: true,
  trailingSlash: 'ignore',
  integrations: [sitemap({
    // Marketing site — every public route is indexable.
    filter: (page) => !page.includes('/drafts/'),
    changefreq: 'weekly',
    priority: 0.7,
  }), mdx()],
});