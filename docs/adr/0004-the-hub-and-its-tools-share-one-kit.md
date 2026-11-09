# The Hub and its Tools share one kit, installed at a tag

## Status

accepted (2026-11-09). Amends ADR-0001, whose shape stands: separate repos, separate
Workers, a service binding, the Hub sending every email. What changes is that a Tool no
longer copies the Hub's files; it installs them.

## Decision

What every Tool on `swavely.lol` needs lives in one public repo,
`nathanswavely/swavely-lol-kit`, installed by the Hub and each Tool from GitHub at a
pinned tag (no registry; the repo is public).

- **The contract.** `HubApiContract`, `Person`, `Viewer`, `Notice`, imported rather than
  copied. The Hub implements it; a Tool calls it. Still added to, never altered.
- **The shell.** One component for the cog menu, the way home, theme and sign-out, used
  by the Hub as well as every Tool, so moving between them changes nothing but the page.
- **The guard.** Middleware a Tool configures with which of its paths need a Person,
  plus the headers every Tool sends (same-origin POSTs, noindex, no-store).
- **The plumbing.** `u`, `hubUrl`, the env with development latency, and a Removals
  runner that keeps the `removedSince` cursor so a Tool writes only its own delete
  (ADR-0003).
- **Liquid Textile**, vendored once, in the kit, with the textile finish and lol skin.

A Tool's own language, data and pages stay in its own repo.

## Context

Two Tools in, the copies had already drifted: the Hub moved to a settings cog while the
gift exchange kept the old bar. MoveLink, the second Tool born here, would have been a
third copy of the contract, the shell, the env helpers, the purge pattern and Liquid
Textile. ADR-0001 declined a shared package between the Portal and the Hub, a company
product and a family toy; between the Hub and its own Tools the same reasoning points
the other way.

## Considered Options

**Keep copying, with a sync script** like Liquid Textile's. No new repo to tag, but it
relies on remembering to run it, and the stale bar shows copies drift regardless.

**A Turborepo**, the Hub and every Tool as apps in one repo with the kit as a package
(asked about 2026-11-09). Atomic changes across Tools, one install, cached checks, and
it keeps ADR-0001's runtime shape. Declined because each Tool should still stand alone
on the portfolio, with its own repo and history, which was ADR-0001's reason against
one App. Revisit if that stops mattering.

## Consequences

- "Adding a Tool" in the README becomes: a repo, a route, a `HUB` binding, the kit at
  its current tag, and a line in `src/lib/tools.ts`.
- A change to the kit reaches a Tool only when that Tool bumps its tag. A Tool can lag;
  `check` in each repo is what catches a break.
- The Hub, the gift exchange and MoveLink move onto it together (Nathan, 2026-11-09),
  in gift season: the gift exchange deploys only with `npm run test:removal` passing
  and its look unchanged but for the shell.
- `src/lib/contract.ts`, `src/lib/dev-latency.ts`, the shell and
  `scripts/sync-liquid-textile.sh` move out of the Hub into the kit.
