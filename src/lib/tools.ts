/**
 * The Shelf: every Tool, in the order it is shown (ADR-0002). A Tool that lives here is
 * its own repo and Worker on a route under the apex (ADR-0001); one that lives elsewhere
 * keeps its own domain and its tile links out. Adding a Tool is a line here.
 */
export interface Tool {
  name: string;
  /** One line under the name. */
  blurb: string;
  /** A path on swavely.lol ('/gifts') for a Tool that lives here, or a full URL. */
  href: string;
  /** Open: anyone. Invite-only: sign-in when opened, never indexed. */
  access: 'open' | 'invite';
  /** The tile's ink, from the lol skin. */
  colour: 'pine' | 'cranberry' | 'gold' | 'sage';
  /** A single glyph for the tile. */
  mark: string;
  repo?: string;
}

export const TOOLS: Tool[] = [
  {
    name: 'Gift exchange',
    blurb: 'Draw names for the family, keep a wish list, and nobody peeks.',
    href: '/gifts',
    access: 'invite',
    colour: 'cranberry',
    mark: '🎁',
    repo: 'https://github.com/nathanswavely/gift-exchange',
  },
  {
    name: 'Jump Back In',
    blurb: "Stopped a show years ago? Find the episode to pick up from, without spoilers.",
    href: 'https://jumpbackin.show',
    access: 'open',
    colour: 'pine',
    mark: '📺',
    repo: 'https://github.com/nathanswavely/episode-finder',
  },
];

export const isExternal = (t: Tool) => /^https?:\/\//.test(t.href);

/** The Tool that lives at this path on swavely.lol, if any. */
export function toolAt(path: string): Tool | undefined {
  return TOOLS.find((t) => !isExternal(t) && (path === t.href || path.startsWith(t.href + '/')));
}

/** Where a tile points: its URL, or its path on the Tools' origin in development. */
export function toolHref(env: HubEnv, href: string): string {
  if (/^https?:\/\//.test(href)) return href;
  return env.TOOLS_ORIGIN ? new URL(href, env.TOOLS_ORIGIN).toString() : href;
}
