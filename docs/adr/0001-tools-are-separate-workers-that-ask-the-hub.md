# Tools are separate Workers that ask the Hub who is signed in

## Status

accepted (2026-10-18)

## Decision

`swavely.lol` is one **Hub** and any number of **Tools**, each its own public repo and
its own Cloudflare Worker, sharing one sign-in.

- **The Hub owns the People and the sign-in.** Email codes and sessions, the rules of
  client-ops ADR-0009, copied from the Portal's `src/lib/auth.ts` rather than shared as a
  package: one is a company product, the other a family toy, and a fix in one should not
  force a release of the other. Its own D1, its own Resend key, sending from
  `send.swavely.lol`. Nothing connects its People to the Portal's Members.
- **Each Tool owns a path.** The Hub's Worker takes the route `swavely.lol/*`; a Tool
  takes a more specific one (`swavely.lol/gifts*`), which Cloudflare prefers. Each Tool
  keeps its own data in its own D1 and refers to People by the Hub's id.
- **A Tool asks the Hub over a service binding.** The Hub exports an RPC entrypoint
  (`HubApi`) that only a bound Worker can reach, never the public: who holds this
  session, who are these People, add this Person. A Tool never reads the Hub's tables.
- **The Hub sends every email.** A Tool calls `notify` with People and a notice; the
  Hub knows their addresses, sends a Managed Person's notice to their managers, and
  holds the only Resend key. A Tool never sees an address it has no need of and holds
  no secret at all.
- **The session cookie is host-only.** `lol_session`, set without `Domain=`, so the
  browser sends it to `swavely.lol` and its paths and never to a Sandbox at
  `<name>.swavely.lol` (client-ops ADR-0012).
- **The repos are public, the data never is.** Names, addresses and draws live only in
  D1. The repos carry code and a made-up family for local development.
- **One look.** Liquid Textile, vendored, with the textile finish and the `lol` skin,
  light and dark, in the Hub and every Tool.

## Considered Options

**One App, every Tool a folder in it.** Sharing sign-in is free that way, but each Tool
should stand alone on the portfolio, with its own repo and history. Declined.

**Tools read the Hub's database.** A second Worker can bind the same D1. Then every
Tool depends on the Hub's tables, and a change there is a change in every repo.
Rejected.

**A signed cookie each Tool verifies with a shared secret.** No lookup at all, but a
session cannot be ended before it expires, and ending one is ADR-0009's whole answer to
a lost phone. Rejected.

**Each Tool on its own subdomain** (`gifts.swavely.lol`), asked about 2026-10-19.
Subdomains of swavely.lol are Sandboxes (client-ops ADR-0007), and the session cookie is
host-only so that no Sandbox, some of them client WordPress, ever receives it. A Tool
on a subdomain would need that cookie widened to `.swavely.lol`, which hands every
Sandbox a family member's session, or a sign-in handoff with a session per Tool.
Rejected; paths keep one sign-in free. A short name can still be a redirect to the
path, as www is. Revisit only if Sandboxes move off swavely.lol.

**The Hub forwards each Tool's requests to it.** One public Worker, Tools reachable only
behind it. It needs bindings both ways (the Tool also adds People), a cycle to bootstrap
on every fresh deploy. Rejected for routes.

## Consequences

- A new Tool is a repo, a route, a `HUB` service binding and a line in the Hub's list of
  Tools (`src/lib/tools.ts`).
- Locally the Hub and a Tool run on two ports of `localhost`. Cookies ignore the port, so
  signing in on the Hub signs you in to the Tool; the binding resolves through
  Wrangler's dev registry when both are running.
- The Hub is deployed before any Tool, since a Tool's binding names it.
