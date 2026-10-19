# swavely.lol

The language of the hub at `swavely.lol`: the people it knows and how they reach the
small tools that run beside it. Each **Tool** keeps its own language in its own repo.
This file is a glossary, not a spec.

## Language

**Hub**:
The site at `swavely.lol` itself. Knows the **People**, signs them in, and lists the
**Tools**. Owns no tool's data.
_Avoid_: Portal (that is Swavely Creative's client site), dashboard, home

**Tool**:
One small app at a path under `swavely.lol`, in its own repo, that asks the **Hub** who
is signed in and keeps everything else to itself. The family gift exchange is the
first.
_Avoid_: App (client-ops uses App for the whole of `swavely.lol`), module, plugin

**Person**:
Someone the **Hub** knows: a name, and usually an email address. With an email they can
sign in. Without one they cannot, and are **Managed**. A Person is never deleted for
sitting something out; each Tool decides who takes part in what.
_Avoid_: User, member (the Portal's word), account

**Hub Admin**:
A Person who sees every Person and every **Tool's** settings, and who alone may hand
out a Tool's own powers (in the gift exchange, starting a Group). Not a way round a
Tool's secrets: what a Tool keeps from its own users (who drew whom) it keeps from the
Hub Admin too. Nathan, named in
configuration so he cannot lock himself out. There is no sign-up: a Person exists
because a Hub Admin or a Tool's organizer added them.
_Avoid_: Owner, superuser, Admin unqualified (each Tool has its own organizers)

**Managed**:
Said of a **Person** with no sign-in of their own, a child or a grandparent, whom one or
more other People act for. Whoever manages them does in each Tool what that Person
would do themselves.
_Avoid_: Dependent, child account, sub-user
