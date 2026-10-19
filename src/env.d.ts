/// <reference types="astro/client" />

/** Environment the Worker runs with: wrangler.jsonc vars, secrets, bindings, and .dev.vars locally. */
interface HubEnv {
  /** Hub Admins, comma-separated (secret). */
  ADMIN_EMAILS?: string;
  /** Every email goes out through Resend (secret). */
  RESEND_API_KEY?: string;
  MAIL_FROM?: string;
  /** Optional Reply-To on every email. */
  REPLY_TO?: string;
  /** Development only: '1' lets `astro dev` send real mail. */
  DEV_SEND_MAIL?: string;
  /** Development only: where Tools run (http://localhost:4332). Production: same origin. */
  TOOLS_ORIGIN?: string;
  /** People, managers, codes and sessions. */
  DB: D1Database;
}

declare namespace App {
  interface Locals {
    /** The signed-in Person, if any; set by src/middleware.ts. Only /people requires one. */
    viewer?: import('./lib/contract').Viewer & { sessionIdHash: string };
  }
}
