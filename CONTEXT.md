# WeGoJUAN

Group trip planning. Friends who want to travel together find the dates when everyone is free, then plan the trip itself (activities, accommodation, meals).

## Language

### Trips

**Trip**:
A group outing lasting one or more consecutive days that its members plan together. A one-day outing is still a **Trip**; single-meal meetups (e.g. a dinner) are not what this product is for.
_Avoid_: Event, meetup, appointment

**Date Range**:
The span of days the **Organizer** opens for choosing. **Marks** outside it play no part in the **Trip**. It cannot start in the past when the **Trip** is created. When it is changed later, its start may stay where it is even if that day has passed, but cannot move to another day in the past. Its end is never before its start. Days added by extending it start **Unknown** for every **Member**.
_Avoid_: period, window (a **Window** is something else)

**Today**:
The current date in Thailand, whatever device or timezone a person is in. Every rule about the past (a **Date Range** start, which **Windows** are suggested) is measured against it.
_Avoid_: local date, device date

**Duration**:
How many consecutive days the **Trip** lasts — one fixed number, at least 1 and no longer than the **Date Range**. Not a range like "3–4 days".
_Avoid_: length, trip days

**Organizer**:
The **User** who created a **Trip**. Exactly one per **Trip**, always a **User** (never a **Guest**), and also a **Member** of it. Can remove any other **Member** (their **Marks** on the **Trip** go with them), replace the **Invite Link**, and delete the **Trip**. Cannot leave the **Trip** — only delete it.
_Avoid_: owner, host, admin

**Invite Link**:
The link through which people join a **Trip** as **Members**. Anyone who opens it joins immediately — no approval step. One active link per **Trip**; replacing it makes the old one stop working. A removed **Member** can rejoin through the current link.
_Avoid_: invite code, share link

**Member**:
A person taking part in a **Trip** whose availability is compared. Either a **User** or a **Guest**. Every **Member** sees every other **Member**'s **Marks** on that **Trip**, by name, day by day; people who are not **Members** see none. Display names are unique within a **Trip**, across **Users** and **Guests**. A **Member** can leave at any time, and their **Marks** on the **Trip** go with them.
_Avoid_: participant, attendee

**User**:
A person with an account. Only a **User** has a **Personal Calendar**.
_Avoid_: account (as a synonym for the person)

**Guest**:
A **Member** without an account. A **Guest**'s **Marks** belong to that one **Trip** only and are never reused elsewhere. A **Guest** is recognised only on the device they joined from. A **Guest** who signs up becomes a **User** and keeps their place and **Marks** on the **Trip**.
_Avoid_: anonymous user, visitor

### Availability

**Personal Calendar**:
A **User**'s private record of which days they are **Free** or **Busy**. One per **User**, filled once and reused across trips via **Push**. A **Trip** never reads it directly, and nothing writes to it without the **User**'s consent — when a **Trip** gets **Confirmed Dates**, each **User** is only offered to mark those days **Busy**.
_Avoid_: availability (as a noun for the whole thing), schedule

**Mark**:
A statement about a single calendar day (a date with no time of day): either **Free** or **Busy**. Lives in one of two places — on a **User**'s **Personal Calendar**, or on a **Trip** for one **Member**. At most one **Mark** per day in each place.
_Avoid_: slot, entry, availability record

**Reason**:
Optional private text on a **Busy** day of a **User**'s **Personal Calendar** saying why they are busy (e.g. "workday"). One per day, only on **Busy** days. Never leaves the **Personal Calendar** — other **Members** only ever see **Busy**. The **User** sees their own **Reasons** while choosing days to **Push**, but they are never copied into the **Trip**. Accepting the offer to mark a **Trip**'s **Confirmed Dates** **Busy** fills in that **Trip**'s title as the **Reason**, except on days that already have one. Plain text: it stays as written if the **Trip** later changes or is deleted.
_Avoid_: note, label, description, busy reason

**Push**:
A **User** copying **Marks** from their **Personal Calendar** into a **Trip**, limited to the **Trip**'s **Date Range**. Only **Free** / **Busy** is copied, never the **Reason**. The **User** sees every day where the two differ and picks which of those days to overwrite; unpicked days keep the **Trip**'s current **Mark**. A snapshot: later changes to the **Personal Calendar** reach the **Trip** only through another **Push** (offered as a re-sync prompt).
_Avoid_: share, sync, link (all imply a live connection)

**Trip-only Mark**:
A **User**'s **Mark** on a **Trip** that deliberately differs from their **Personal Calendar** — set by editing the **Trip** directly or by leaving a day unpicked during **Push**.
_Avoid_: override, exception

**Free** / **Busy**:
The only two values a **Mark** can have. There is no "maybe" — a user who is unsure leaves the day unmarked.
_Avoid_: maybe, tentative

**Unknown**:
The state of a day that has no **Mark**. Never assumed to be **Free**. A **User** who has not pushed is **Unknown** on every day of the **Trip**.
_Avoid_: unmarked-means-free, default free

### Matching

**Window**:
A run of consecutive days, exactly **Duration** long, inside the **Date Range** — one candidate time for the **Trip**. **Windows** that start before today are not suggested. Suggested **Windows** are ranked by fewest **Busy** **Members**, then most **Available** **Members**, then earliest start.
_Avoid_: slot, option, date choice

**Available**:
A **Member** who is **Free** on every day of a **Window**. Used only for a **Member** across a **Window**, never for a single day (a day is **Free**).
_Avoid_: free (for a Window), can go

**Busy** / **Unknown** (in a **Window**):
A **Member** is **Busy** in a **Window** if **Busy** on at least one of its days; otherwise **Unknown** if any of its days is **Unknown**. **Available**, **Busy** and **Unknown** together cover every **Member** exactly once.

**Confirmed Dates**:
The one **Window** the **Organizer** has chosen as when the **Trip** happens. Only the **Organizer** sets, changes or clears it; **Members** can still change their **Marks** afterwards.
_Avoid_: final date, chosen window, booked dates

**Finding Dates** / **Confirmed**:
The two states of a **Trip**: **Finding Dates** until it has **Confirmed Dates**, **Confirmed** after. Clearing the **Confirmed Dates** returns it to **Finding Dates**.
_Avoid_: planning (reserved for planning the trip's contents — activities, accommodation, meals), draft, scheduled

## Flagged ambiguities

- **"Event"** was used for what is now a **Trip**. Resolved: **Trip** is the only term; single-meal meetups are out of scope.
- **"Planning"** could mean finding dates or planning the trip's contents. Resolved: the date phase is **Finding Dates**; "planning" means only activities, accommodation and meals.
- **"Free" vs "Available"** — resolved: a day is **Free**; a **Member** across a whole **Window** is **Available**.
- **"Busy" / "Unknown"** apply both to a single day and to a **Member** in a **Window**. Kept deliberately: the **Window** meaning is derived directly from the day meaning.

## Example dialogue

> **Dev:** Ploy created a **Trip** for Dec 1–20 with a **Duration** of 3. Nat joined from the **Invite Link** without signing up — so he's a **Guest**?
> **Domain expert:** Yes. He marks his days on the **Trip** by hand. Ploy is a **User**, so she **Pushes** from her **Personal Calendar** instead.
> **Dev:** Ploy's calendar says she's **Busy** on Dec 10, but she unticked it during **Push**. What does Nat see?
> **Domain expert:** **Free** — that's a **Trip-only Mark**. Nat only ever sees what's on the **Trip**, never her **Personal Calendar**.
> **Dev:** Bank joined but never marked anything. Does the top **Window** treat him as **Available**?
> **Domain expert:** No, he's **Unknown** — we never assume **Free**. The top **Window** is the one with the fewest **Busy** **Members**; an **Unknown** can still be chased in the group chat.
> **Dev:** Once Ploy picks Dec 5–7 the **Trip** is **Confirmed**. Does that write **Busy** to everyone's calendar?
> **Domain expert:** No. Each **User** is offered to mark those days **Busy** on their own **Personal Calendar**. Nat is a **Guest**, so he isn't asked.
