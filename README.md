# WeGoJUAN

**Find the dates when everyone in your group is free — then lock in the trip.**

Planning a trip with friends usually stalls on one question: *when can we all go?* WeGoJUAN answers it. Everyone marks the days they're free or busy, and the app shows which dates work for the whole group.

## How it works

1. **Mark your own calendar.** Keep a Personal Calendar of the days you're free or busy. You fill it in once and reuse it for every trip.
2. **Create a trip.** Pick the range of dates you're open to (for example, December 1–20) and how many days the trip lasts.
3. **Invite your friends with a link.** Share it in your group chat. Friends can join with an account, or as a guest without signing up.
4. **Everyone marks their days.** The trip calendar shows your own days and a small two-letter label for each friend who is free (green) or busy (red) on each day.
5. **See the best dates.** The app ranks every possible date range: the fewest people busy first, then the most people free, then the earliest start.
6. **Confirm the dates.** The organizer picks a date range. Everyone is offered to block those days as busy on their own calendar, so they don't double-book.

## Features

- **Personal Calendar.** Mark each day as free or busy. A day you haven't marked counts as *unknown*, never as free.
- **Your calendar stays private.** A trip never reads your calendar on its own. Use **Push** to copy your marks into a trip, and choose day by day which ones to copy. You can also set different marks for one trip only.
- **Re-sync reminders.** If you change your calendar after pushing to a trip, the app reminds you to update that trip.
- **Trip calendar.** A month view of the trip, showing your own mark and your friends' marks at a glance. Tap a day to set your mark and see who's free, who's busy, and who hasn't answered yet.
- **Suggested dates.** A ranked list of date ranges that fit the trip length. Each one shows who's free, who's busy and who's still unknown.
- **Guests welcome.** Friends can join with just a name. The app remembers them on the device they joined from. If they sign up later, they keep their place and their marks.
- **Organizer tools:**
  - confirm or clear the final dates;
  - change the date range or trip length;
  - remove a member;
  - create a new invite link (the old one stops working);
  - delete the trip.
- **Leave anytime.** Any member except the organizer can leave a trip.

## Coming later

Once the dates are set, plan the trip itself: activities, accommodation and meals.

## Built with

- **Backend:** Go (Fiber), PostgreSQL
- **Web:** React, Vite, TanStack Query, Tailwind CSS

## Run it locally

You need Docker, or Go and Node.js with Docker for the database.

```bash
make dev        # database, migrations, API (hot reload) and web in Docker
# open http://localhost:5173
```

Or run the API on your machine:

```bash
make db         # start Postgres in Docker and apply migrations
make air        # run the API with hot reload (reads backend/.env)
cd web && npm install && npm run dev
```

## Project docs

- [`CONTEXT.md`](CONTEXT.md): the glossary of terms used in the app (Trip, Member, Guest, Mark, Push, Window…)
- [`docs/adr/`](docs/adr/): key design decisions
