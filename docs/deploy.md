# Deploying WeGoJUAN

- **Backend (API + PostgreSQL):** Railway
- **Frontend (web app):** Vercel
- **Production branch:** `main`. Feature work merges into `dev`; a pull request from `dev` to `main` is a release.

## How the pieces connect

The browser only ever talks to the Vercel domain. Vercel forwards every `/api/*` request to the Railway API behind the scenes (`web/vercel.json`).

```
browser ──▶ https://<your-app>.vercel.app ──┬─ /, /trips/…, /join/…  → web app (index.html)
                                             └─ /api/*, /healthz     → https://<your-api>.up.railway.app
```

Why route everything through Vercel: the login and guest cookies are first-party (`SameSite=Lax`). If the web app called the Railway domain directly, browsers would treat those cookies as third-party, and Safari would block them. Login would then fail on iPhones.

---

## 1. Railway (do this first — Vercel needs its domain)

1. **New Project → Deploy from GitHub repo** → pick this repository.
2. In the project, **New → Database → PostgreSQL**.
3. Open the API service → **Settings**:
   - **Source → Root Directory:** `backend`. Railway finds `backend/Dockerfile` by itself.
   - **Source → Branch:** `main`.
   - **Deploy → Healthcheck Path:** `/healthz`.
4. API service → **Variables**:

   | Variable | Value |
   |---|---|
   | `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` (a reference to the Postgres service) |
   | `JWT_SECRET` | a long random string, e.g. the output of `openssl rand -base64 48` (at least 32 characters) |

   - Don't set `PORT`. Railway sets it, and the API reads it.
   - `APP_ENV=production` is already set in the image. In production, cookies are marked `Secure` (HTTPS only).
   - `ALLOWED_ORIGINS` isn't needed, because the browser never calls Railway directly.
5. API service → **Settings → Networking → Generate Domain**. Copy the domain, e.g. `wegojuan-api-production.up.railway.app`.
6. Check it: open `https://<that-domain>/healthz`. You should get an empty page with status 200.

Every deploy runs the database migrations (`goose up`) before the API starts. If a migration fails, the new deploy doesn't go live and the previous one keeps running.

## 2. Point the web app at the API

In `web/vercel.json`, replace both occurrences of `REPLACE-WITH-RAILWAY-DOMAIN.up.railway.app` with the Railway domain from step 1.5. Merge that change into `dev`, then into `main`.

## 3. Vercel

1. **Add New → Project** → import this repository.
2. Settings:
   - **Root Directory:** `web`
   - **Framework Preset:** Vite. This sets build command `npm run build` and output `dist`.
   - **Environment Variables:** none needed.
3. **Settings → Git → Production Branch:** `main`.
4. Deploy, then open the site. Register an account, create a trip, and open its invite link in a private window to try joining as a guest.

## Releasing

1. Merge features into `dev` as usual.
2. Open a pull request **`dev` → `main`** and merge it.
3. Railway and Vercel both deploy `main` automatically.

## Things to know

- **Preview deployments share production data.** Vercel builds a preview for every other branch (including `dev`), and those previews forward `/api` to the same Railway API. Add a separate Railway environment later if you want isolated test data.
- **Run one API instance.** The login rate limit (10 failed attempts per email per 10 minutes) is kept in the API's memory, and migrations run at startup. Both assume a single instance.
- **Back up the database.** Turn on Railway's Postgres backups for your plan; all trips and marks live there.
- **Changing `JWT_SECRET` logs everyone out.** Guests aren't affected; they're recognised by a separate device cookie.
- **There's no password reset in the app yet.** If a user forgets their password during the beta, reset it directly in the database.
