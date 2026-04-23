// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  output: 'static',
  site: 'https://atto.tech',
  compressHTML: true,
  trailingSlash: 'ignore',
});
