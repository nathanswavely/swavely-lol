# The Shelf comes first; sign-in when a Tool asks

## Status

accepted (2026-10-19). Amends ADR-0001, whose shape stands: the Hub still owns the People
and the sign-in. What changes is that sign-in is no longer the front door. Also amends
client-ops ADR-0012 on indexing.

## Decision

`swavely.lol` opens on the **Shelf**: every **Tool** as a tile, to anyone, signed in or
not. Sign-in happens only when someone opens an **Invite-only** Tool.

- **Two kinds of access.** An **Open** Tool needs no sign-in (Jump Back In). An
  **Invite-only** Tool needs a Person (the gift exchange). Each Tool's tile says which.
- **Invite-only tiles are shown to everyone, with a lock.** Opening one signed out goes to
  sign-in, which names the Tool and says it is invite-only, so a stranger is told why no
  code comes rather than left waiting for one.
- **Tools may live elsewhere.** A Tool on its own domain keeps it; its tile links out.
  Only Tools born here live at `swavely.lol/<path>`.
- **The Shelf is found by search; Invite-only is not.** The Shelf and Open Tools are
  indexed. Sign-in, the People page and every Invite-only Tool send `noindex` and are
  disallowed in `robots.txt`. Sandboxes at `<name>.swavely.lol` stay noindex
  (client-ops ADR-0007).
- **The Shelf is a list in code**, `src/lib/tools.ts`: name, line, where it lives, access,
  and the tile's colour. It changes a few times a year; a CMS would be heavier than the
  list.

## Context

The Hub was built as a sign-in in front of one family Tool. Two days in, Nathan wants it
to be what neil.fun is for toys: a front page of things he made, some anyone can use,
some only family, and some that live on their own domains. A sign-in as the first thing
anyone sees suits none of that, and it told a stranger nothing about what was here.

## Consequences

- The middleware no longer sends everyone to `/login`; it guards only what needs a
  Person (the People page), and each Invite-only Tool keeps guarding itself.
- `/login?next=/gifts` says "Gift exchange is invite-only" before asking for an address.
- ADR-0012's "the apex is still never indexed" becomes: the Shelf and Open Tools are
  indexed; the rest is not.
- A Tool that is Open needs no `HUB` binding at all, though it may keep one to greet
  someone who happens to be signed in.
