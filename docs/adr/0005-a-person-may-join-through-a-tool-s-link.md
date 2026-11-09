# A Person may join through a Tool's link, never on their own

## Status

accepted (2026-11-09). Amends the glossary's "there is no sign-up": there is still no
sign-up page, but someone holding a Tool's link may make themselves a Person.

## Decision

Nobody can walk up to `swavely.lol` and make an account. But someone a Person has
invited, by a link a Tool hands out, may become a Person themselves: they give a name
and an email, the Hub sends a code, and they are in.

- **Only through a Tool, never the Hub.** The Hub's sign-in page stays as it is: a
  stranger is told the Tool is invite-only. The way in is a Tool's own page, today
  MoveLink's **Move link**, where a Helper who has signed up is offered an account.
- **Credited to whoever handed out the link.** The Tool calls `addPerson` with
  `addedBy` set to the Person whose link it was (the Move's first Organizer) and says
  where they came from, so the People page shows "joined through Sam's Move". A Hub
  Admin can remove them, one or a batch, as any other Person (ADR-0003).
- **No approval.** Nobody taps "let Dave in". The Tool limits when its link admits
  anyone: MoveLink only while the Move is still to come.
- **Joining grants nothing but being a Person.** They can sign in, use what they were
  invited to from any device, and start a Move of their own. Every other Invite-only
  Tool still shows them only what its own Organizers have added them to.

## Context

MoveLink's Helpers sign up from a shared link with only a name, remembered by one
browser. Some want to change their answer from another phone, be reminded, or run a Move
of their own next year, and each of those needs a Person. Making Nathan add every
friend's friend by hand defeats the link; an open sign-up page invites the spam and
growth a family hub does not want. Growth that follows real invitations is slow by
construction.

## Considered Options

**Open sign-up.** Anyone with an email. Rejected: nothing on swavely.lol is meant for
strangers to join.

**An Organizer approves each one.** Safer, but it pesters the person moving at the
busiest time of their year and leaves the Helper waiting to fix their own answer.
Declined.

## Consequences

- `HubApiContract.addPerson` gains an optional `via` (a short line, "Sam's Move"), added
  and not altered, which the People page shows.
- A link posted somewhere public can bring in many People at once. They see nothing of
  anyone else's, but they do cost codes and clutter; the People page's "joined through"
  is how a Hub Admin finds and removes them.
- A Person who joined this way and later has nothing in any Tool stays a Person. That
  is the Hub's usual rule (a Person is never deleted for sitting something out).
