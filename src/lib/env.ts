import { env as workerEnv } from 'cloudflare:workers';
import { withLatency } from './dev-latency';

/**
 * The Worker env: wrangler.jsonc vars, secrets, and .dev.vars locally. `astro dev`
 * runs on workerd too, so the same import serves both. In development DEV_DB_LATENCY_MS
 * slows the database to production's round trip (dev-latency.ts).
 */
let cached: HubEnv | undefined;
export function getEnv(): HubEnv {
  if (cached) return cached;
  const env = workerEnv as unknown as HubEnv;
  const ms = import.meta.env.DEV ? Number(env.DEV_DB_LATENCY_MS ?? 0) : 0;
  cached = ms ? { ...env, DB: withLatency(env.DB, ms) } : env;
  return cached;
}
