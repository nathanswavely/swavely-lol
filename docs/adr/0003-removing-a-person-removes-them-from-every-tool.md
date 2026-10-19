# Removing a Person removes them from every Tool

## Status

accepted (2026-10-19). Builds on ADR-0001: the Hub still never reaches into a Tool.

## Decision

When a **Hub Admin** removes a **Person** on the People page, the Hub forgets them and
keeps only their bare id on a list, `removed_people`. Each **Tool** that stores anything
about People reads that list on a schedule and deletes what it holds of each.

- **The Hub forgets at once.** One batch: the Person's row, their sessions, who they
  manage and who manages them, any sign-in code waiting for their address, and the
  tombstone: the id and when. No name, no email.
- **A Tool asks.** `HubApi.removedSince(since)` returns the ids removed at or after a
  time, oldest first. The Tool keeps how far it has read and asks from there; the
  boundary comes back again, so a Tool's removal must be safe to run twice. An id on the
  list never returns: ids are random and never reused.
- **On a cron trigger, hourly.** Each Tool's Worker has a `scheduled` handler. The People
  page says "within the hour", and the privacy page's promise holds from then.
- **Explicit, never inferred.** A Tool deletes only the ids the Hub names. It never treats
  "the Hub no longer knows this id" as a removal.
- **Each Tool decides what "what they added" means** and records it in its own repo. The
  gift exchange deletes their Wish list and every Claim to or from it, their Exclusions,
  their place in every Group and Exchange, and their Pairings (gift-exchange ADR-0002).
- **A purge never acts for the people left behind.** It deletes; it does not decide
  for them or email them. When a removal leaves a Tool's shared thing broken, that
  Tool's own people mend it. In the gift exchange (Nathan, 2026-10-19: "leave to
  organizer for now"), a drawn Exchange that loses someone is not Re-paired by the
  purge: their Giver is told their name was withdrawn, and the Exchange's Organizers
  see "Re-pair now", which runs the usual Re-pairing and its emails only when pressed.
- **The tombstones stay.** A bare random id says nothing about anyone once the row behind
  it is gone, and keeping them lets a Tool that was down, or added later, catch up.

## Considered Options

**The Hub calls each Tool.** A signed request to a purge route on each Tool, or a
service binding from the Hub to each Tool. A signed request means a shared secret in
every Tool, which ADR-0001 keeps at none; a binding back means bindings both ways, the
cycle ADR-0001 rejected. Either way the Hub must know every Tool and retry the ones that
were down. Rejected.

**Tools purge whoever the Hub no longer knows.** No new state on the Hub at all: a Tool
lists its ids, asks `people()`, and deletes the missing. But a wrong database, a fresh
local seed or a bug returning nothing would read as everyone removed, and the Tool would
delete every wish list it has. Rejected for being one mistake from total loss.

**Purge on the next request instead of a schedule.** A Tool could check the list in its
middleware. Then the data of someone nobody looks at lingers until somebody visits, and
every request pays for the check. A cron is cheaper and finishes on its own.

**Keep the Person's data and show them as "Someone".** What the code did before this.
It breaks the privacy page's promise. Rejected.

## Consequences

- A Tool that stores People needs a cron trigger and a cursor table; the README's
  "Adding a Tool" says so, and the gift exchange's `src/lib/purge.ts` is the pattern.
- Removing someone is not undone by adding them again: they come back as a new Person,
  with a new id, and nothing of before.
- Between the removal and the next run, a Tool may still show them as "Someone". At most
  an hour.
- Things a removed Person made that belong to others too, a Group or an Exchange they
  started, stay, still marked as created by their bare id.
