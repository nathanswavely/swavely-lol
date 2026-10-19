/**
 * The Shelf: Tools first, then Projects, each in the order shown (ADR-0002). A Tool that
 * lives here is its own repo and Worker on a route under the apex (ADR-0001); anything
 * that lives elsewhere keeps its own domain and its tile links out. Adding one is a line
 * here.
 */
export interface Tile {
  name: string;
  /** One short line under the name. */
  blurb: string;
  /** A path on swavely.lol ('/gifts') for a Tool that lives here, or a full URL. */
  href: string;
  /** Open: anyone. Invite-only: sign-in when opened, never indexed. Projects are open. */
  access: 'open' | 'invite';
  /** The tile's ink, from the lol skin. */
  colour: 'pine' | 'cranberry' | 'gold' | 'sage';
  /** A single glyph for the tile. */
  mark: string;
  repo?: string;
  /** Built but not open to use yet; the tile says so instead of its access. */
  soon?: boolean;
}

/** Small apps that do one job each. */
export const TOOLS: Tile[] = [
  {
    name: 'Gift exchange',
    blurb: 'Draws names for our family gift exchange and keeps wish lists.',
    href: '/gifts',
    access: 'invite',
    colour: 'cranberry',
    mark: '🎁',
    repo: 'https://github.com/nathanswavely/gift-exchange',
  },
  {
    name: 'Jump Back In',
    blurb: 'Finds the episode to pick a show back up from, without spoilers.',
    href: 'https://jumpbackin.show',
    access: 'open',
    colour: 'pine',
    mark: '📺',
    repo: 'https://github.com/nathanswavely/episode-finder',
  },
];

/** Bigger things with their own domains and users; always linked out. */
export const PROJECTS: Tile[] = [
  {
    name: 'Showliner',
    blurb: 'Booking and show-night software for independent venues and artists.',
    href: 'https://showliner.io',
    access: 'open',
    colour: 'gold',
    mark: '🎤',
  },
  {
    name: 'Lancaster Patchwork',
    blurb: 'A living culture map and calendar for Lancaster, PA.',
    href: 'https://lancasterpatchwork.org',
    access: 'open',
    colour: 'sage',
    mark: '🧵',
    repo: 'https://github.com/nathanswavely/patchwork',
  },
  {
    name: 'quilt.host',
    blurb: 'Managed hosting for Patchwork instances.',
    href: 'https://quilt.host',
    access: 'open',
    colour: 'pine',
    mark: '🪡',
    soon: true,
  },
];

export const isExternal = (t: Tile) => /^https?:\/\//.test(t.href);

/** The Tool that lives at this path on swavely.lol, if any. */
export function toolAt(path: string): Tile | undefined {
  return TOOLS.find((t) => !isExternal(t) && (path === t.href || path.startsWith(t.href + '/')));
}

/** Where a tile points: its URL, or its path on the Tools' origin in development. */
export function toolHref(env: HubEnv, href: string): string {
  if (/^https?:\/\//.test(href)) return href;
  return env.TOOLS_ORIGIN ? new URL(href, env.TOOLS_ORIGIN).toString() : href;
}
