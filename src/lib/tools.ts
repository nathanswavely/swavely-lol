/**
 * The Tools on swavely.lol, as the Hub lists them. A Tool is its own repo and Worker
 * on a route under the apex (ADR-0001); adding one is a line here once it is deployed.
 */
export interface Tool {
  /** Its path on swavely.lol, which is also its route. */
  path: string;
  name: string;
  blurb: string;
  repo: string;
}

export const TOOLS: Tool[] = [
  {
    path: '/gifts',
    name: 'Gift exchange',
    blurb: 'Draw names, keep a wish list, and see what everyone else would like.',
    repo: 'https://github.com/nathanswavely/gift-exchange',
  },
];

/** Where a Tool's link points: its path, on the Tools' origin in development. */
export function toolHref(env: HubEnv, path: string): string {
  return env.TOOLS_ORIGIN ? new URL(path, env.TOOLS_ORIGIN).toString() : path;
}
