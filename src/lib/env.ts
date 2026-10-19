import { env as workerEnv } from 'cloudflare:workers';

/**
 * The Worker env: wrangler.jsonc vars, secrets, and .dev.vars locally. `astro dev`
 * runs on workerd too, so the same import serves both.
 */
export function getEnv(): HubEnv {
  return workerEnv as unknown as HubEnv;
}
