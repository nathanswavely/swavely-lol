// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

// Every page is rendered on request: the sign-in check in src/middleware.ts runs on
// every request, and nothing here is worth prerendering.
export default defineConfig({
  site: 'https://swavely.lol',
  output: 'server',
  // No Astro sessions and no image service: the adapter must not provision the
  // SESSION KV namespace or the IMAGES binding it would otherwise add on deploy.
  session: false,
  adapter: cloudflare({
    imageService: 'passthrough',
  }),
});
