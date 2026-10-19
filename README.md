# swavely.lol

A shelf of small tools: some open to anyone, some just for family and friends, some
living on their own domains. One look, and one sign-in for the ones that need it. Each tool is its own repo and its own Cloudflare Worker on
a path under `swavely.lol`; the first is the [gift exchange](https://github.com/nathanswavely/gift-exchange).

Start with [CONTEXT.md](CONTEXT.md) for the words, then
[ADR-0001](docs/adr/0001-tools-are-separate-workers-that-ask-the-hub.md) for how the
pieces fit.

## What it does

- **Shows the Shelf.** `swavely.lol` opens on every Tool as a tile, to anyone
  ([ADR-0002](docs/adr/0002-the-shelf-comes-first-sign-in-when-asked.md)). Open Tools go
  straight in; Invite-only ones ask for sign-in when opened. The list is
  [src/lib/tools.ts](src/lib/tools.ts).
- **Signs people in by emailed code.** No passwords. Codes are hashed, expire in ten
  minutes and allow five guesses; sessions are random, hashed, HttpOnly and host-only.
- **Knows the People.** A Person is a name and usually an email. Someone without one (a
  child, a grandparent) is *Managed*: the people who look after them act for them.
- **Answers the Tools.** `HubApi` (src/worker.ts) is an RPC entrypoint a Tool reaches over
  a Cloudflare service binding: who holds this session, who are these People, add
  someone, email someone, who has been removed. It is not reachable from the internet.
  The promise is [src/lib/contract.ts](src/lib/contract.ts).
- **Removes people everywhere.** Removing a Person on the People page leaves only their
  bare id on a list; each Tool reads it on a schedule and deletes what they added
  ([ADR-0003](docs/adr/0003-removing-a-person-removes-them-from-every-tool.md)).

## Stack

Astro (server output) on Cloudflare Workers, D1, Resend for mail, and
[Liquid Textile](src/styles/liquid-textile/VENDORED.md) with its textile finish and the
`lol` skin, light and dark.

## Running it

```
cp .dev.vars.example .dev.vars
npm install
npm run db:migrate:local && npm run db:seed:local
npm run dev                      # http://localhost:4331
```

The seed is a made-up family; sign in as `homer@example.com` and the code is shown on
the page. Run a Tool beside it (its own `npm run dev`, on 4332) and the binding finds
the Hub through Wrangler's dev registry; cookies ignore the port, so one sign-in covers
both. Signing out from a Tool's page only works in production, where both share an
origin.

## Deploying

1. The D1 database `swavely-lol` exists (2026-10-19); its id is in `wrangler.jsonc`.
2. `wrangler secret put ADMIN_EMAILS` and `wrangler secret put RESEND_API_KEY`.
3. The Resend domain `send.swavely.lol` verified, its DNS records in Cloudflare.
4. A proxied DNS record for the apex (an `AAAA` to `100::`) so the route matches.
5. `npm run deploy`. Then each Tool.

## Adding a Tool

A new repo with its own Worker and route (`swavely.lol/<path>*`), a `HUB` service
binding with `entrypoint: "HubApi"`, a copy of `src/lib/contract.ts`, and a line in
[src/lib/tools.ts](src/lib/tools.ts). A Tool that stores anything about a Person also
needs a cron trigger that asks `removedSince` and deletes it (ADR-0003); the gift
exchange's `src/lib/purge.ts` is the pattern.
