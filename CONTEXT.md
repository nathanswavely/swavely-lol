# swavely.lol

The language of the hub at `swavely.lol`: the things it puts on show, the people it
knows, and how they get in. Each **Tool** keeps its own language in its own repo. This
file is a glossary, not a spec.

## Language

**Hub**:
The site at `swavely.lol` itself. Shows the **Shelf**, knows the **People**, and signs
them in when a Tool asks it to. Owns no tool's data.
_Avoid_: Portal (that is Swavely Creative's client site), dashboard, home

**Shelf**:
The front page of `swavely.lol`: every **Tool**, then every **Project**, as tiles, to anyone
who visits, signed in or not. The one page meant to be found by search.
_Avoid_: Homepage, launcher, app selector, directory

**Tool**:
A small app of Nathan's that does one job, on the **Shelf**, **Open** or **Invite-only**.
Most live at a path under `swavely.lol`, each in its own repo and Worker; some live on
their own domain (Jump Back In at `jumpbackin.show`) and their tile leads there. The
family gift exchange is the first that lives here.
_Avoid_: App (client-ops uses App for the whole of `swavely.lol`), module, plugin

**Project**:
Something bigger than a **Tool**, with its own domain and users beyond family and
friends: Showliner, Lancaster Patchwork, quilt.host. Its tile always links out; the Hub
holds nothing of it.
_Avoid_: Product, app, client work (that is Swavely Creative's)

**Open**:
A **Tool** anyone can use without signing in. Indexed like the Shelf.
_Avoid_: Public (everything on the Shelf is public to look at), free

**Invite-only**:
A **Tool** only **People** can use. Its tile is on the Shelf for everyone, with a lock;
signing in happens when someone opens it, never before. Never indexed.
_Avoid_: Private, members-only, locked

**Person**:
Someone the **Hub** knows: a name, and usually an email address. With an email they can
sign in, which they need only for **Invite-only** Tools. Without one they cannot, and are **Managed**. A Person is never deleted for
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
