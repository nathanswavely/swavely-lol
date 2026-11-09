import { getEnv as kitEnv } from '@swavely-lol/kit/env';

/**
 * The Worker env: wrangler.jsonc vars, secrets, and .dev.vars locally, from the kit
 * (ADR-0004), typed as the Hub's. In development DEV_DB_LATENCY_MS slows the database
 * to production's round trip.
 */
export const getEnv = (): HubEnv => kitEnv<HubEnv>();
