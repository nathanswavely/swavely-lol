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
  /** A Tool that lives here: the port its `npm run dev` uses, so the Hub links to it locally. */
  devPort?: number;
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
    devPort: 4332,
  },
  {
    name: 'MoveLink',
    blurb: 'Rounds up friends, trucks and boxes for moving day.',
    href: '/move',
    access: 'invite',
    colour: 'sage',
    mark: '📦',
    repo: 'https://github.com/nathanswavely/movelink',
    devPort: 4333,
    // Until MoveLink's Worker is deployed; the Hub ships first (ADR-0001).
    soon: true,
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

/**
 * Where a path on swavely.lol is served from. In production, here: every Tool shares the
 * origin. In development each Tool runs on its own port of TOOLS_ORIGIN's host, the
 * port its tile names, and anything else is the Hub's own.
 */
export function toolOrigin(env: HubEnv, path: string): string | null {
  if (!env.TOOLS_ORIGIN) return null;
  const tile = toolAt(path);
  if (!tile?.devPort) return null;
  const url = new URL(env.TOOLS_ORIGIN);
  url.port = String(tile.devPort);
  return url.origin;
}

/** Where a tile points: its URL, or its path, on its Tool's port in development. */
export function toolHref(env: HubEnv, href: string): string {
  if (/^https?:\/\//.test(href)) return href;
  const origin = toolOrigin(env, href);
  return origin ? new URL(href, origin).toString() : href;
}
