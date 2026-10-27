# Trips hold snapshot copies of Marks; the Personal Calendar is never read by a Trip

A User's Personal Calendar is personal data they may not want every trip member to see. So a Trip never reads it directly: each Member's Marks are stored on the Trip itself. A User fills them by **Push** — copying Marks from their Personal Calendar within the Trip's date range, choosing day by day which differing days to overwrite. A Guest fills them by hand. Matching only ever reads the Trip's Marks, so Users and Guests are treated identically.

## Considered Options

- **Live read with no consent** — the Trip reads the Personal Calendar directly. Rejected: every Member sees all of a User's busy days in range without the User ever agreeing.
- **Live read after one-time consent** — after confirming once, the Trip keeps reading the Personal Calendar. Rejected: a User loses control of what is shown after that point, cannot keep a Trip-only Mark, and Guests would need a separate code path.
- **Snapshot copy on Push (chosen)** — what a User pushed is exactly what others see.

## Consequences

- Trip Marks go stale when the Personal Calendar changes. Mitigation: when a User edits days on their Personal Calendar that overlap a Trip they have pushed to, prompt them to re-sync; the prompt previews each differing day with a checkbox.
- Marks are stored in two places (Personal Calendar per User, Trip per Member). This duplication is intentional.
