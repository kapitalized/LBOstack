# Neon integration: Vercel + localhost

Use the same Neon project for production (Vercel) and development (localhost). The app reads `DATABASE_URL`, `NEON_AUTH_BASE_URL`, and `NEON_AUTH_COOKIE_SECRET`.

---

## Quick fix: `relation "project_main" does not exist` / `relation "user_profiles" does not exist`

The app tables were never created in Postgres. **Migrations must run with `DATABASE_URL` set.** Plain `npx drizzle-kit migrate` does **not** load `.env.local`, so it often skips applying migrations.

1. Put your Neon URL in **`.env.local`** as `DATABASE_URL=...`
2. From the **repo root** run:
   ```bash
   npm run migrate:all
   ```
   That runs **Payload** then **Drizzle** migrations using env from `.env.local`.

3. For **production** Neon, run the same command once with production URL in `.env.local` (or set `DATABASE_URL` in the shell — do not commit secrets).

| Script | What it runs |
|--------|----------------|
| `npm run migrate:all` | `payload migrate` + `drizzle-kit migrate` |
| `npm run migrate:payload` | Payload only (`users`, CMS tables) |
| `npm run migrate:drizzle` | Drizzle only (`user_profiles`, `project_main`, org tables, …) |

---

## 1. Neon project and connection string

1. Go to [neon.tech](https://neon.tech) and sign in (you already have an account).
2. Create a **new project** (or use an existing one). Choose region and Postgres version.
3. In the project → **Connection details** (or Dashboard).
4. Copy the **connection string** and ensure it ends with `?sslmode=require`.  
   This is your `DATABASE_URL` (e.g. `postgresql://user:pass@ep-xxx.region.neon.tech/neondb?sslmode=require`).

---

## 2. Enable Neon Auth

1. In the same Neon project, go to **Integrations** or **Auth** (Neon Auth).
2. **Enable Neon Auth**. Neon creates the `neon_auth` schema.
3. Copy the **Auth URL** → this is `NEON_AUTH_BASE_URL`.
4. Generate a **cookie secret** (min 32 characters), e.g.:
   - `openssl rand -base64 32` (terminal), or use a password generator.
   - Save it in your app as `NEON_AUTH_COOKIE_SECRET`. You do **not** set this in the Neon Console—it stays only in your app (`.env.local` / Vercel env).

---

## 3. Vercel (production)

1. In **Vercel Dashboard** → your project → **Settings** → **Environment Variables**.
2. Add for **Production** (and **Preview** if you want):

   | Name | Value |
   |------|--------|
   | `DATABASE_URL` | Neon connection string (with `?sslmode=require`) |
   | `NEON_AUTH_BASE_URL` | Neon Auth URL from step 2 |
   | `NEON_AUTH_COOKIE_SECRET` | Your 32+ char cookie secret from step 2 |

3. **Optional:** Link Neon to Vercel so Vercel can inject `DATABASE_URL`:
   - Project → **Storage** or **Integrations** → connect **Neon** → authorize and select the same Neon project.
4. **Redeploy** so new env vars are applied (Deployments → … → Redeploy).

---

## 4. Localhost (development)

1. In the repo root, copy the example env file:
   - `cp .env.example .env.local` (or copy `.env.example` to `.env.local` manually).
2. Edit `.env.local` and set:

   | Name | Value |
   |------|--------|
   | `DATABASE_URL` | Same Neon connection string as in Vercel |
   | `NEON_AUTH_BASE_URL` | Same Neon Auth URL |
   | `NEON_AUTH_COOKIE_SECRET` | Same cookie secret (or a separate one for dev) |

3. Add other vars as needed (e.g. `PAYLOAD_SECRET`, `BLOB_READ_WRITE_TOKEN`). See `.env.example`.
4. Run `npm run dev`. The app will use Neon for DB and auth on localhost.

---

## 5. Payload CMS admin (`/admin`) — required migrations

Payload stores **admin users** in Postgres tables `users` and `users_sessions` (not Neon Auth). The app sets `push: false` in `payload.config.ts`, so **you must apply Payload migrations** to the same database as `DATABASE_URL`.

**Symptom:** Admin shows “Failed query” selecting from `users` / `users_sessions` — usually **`relation "users" does not exist`** or a missing column (e.g. `role`) if only part of the migrations ran.

**Fix (local or CI), using your Neon URL:**

1. Ensure `.env.local` has `DATABASE_URL` (and `PAYLOAD_SECRET` set for production-like runs).
2. From the repo root run:
   - `npm run migrate:payload`  
   - or `npx payload migrate`
3. Repeat for **production** by running the same command with **Vercel’s `DATABASE_URL`** (e.g. `DATABASE_URL="postgresql://..." npx payload migrate` in a trusted environment). Do **not** commit secrets.

After migrations succeed, open `/admin` again and sign in (create the first admin user if prompted).

### App tables (`project_main`, chat, reports, …)

These live in `public` and are **not** created by Payload. They come from **Drizzle** (`lib/db/schema.ts`).

1. Prefer **`npm run migrate:all`** (see [Quick fix](#quick-fix-relation-project_main-does-not-exist--relation-user_profiles-does-not-exist) above) so `DATABASE_URL` is loaded from `.env.local`.
2. Do this for **each environment** (local Neon URL, then production) after `migrate:payload` or whenever you pull new migrations.

If you skip this step, the dashboard can show **“Failed to load projects”** / API errors like **`relation "project_main" does not exist`**.

---

## 6. Optional: sync schema (Drizzle)

If you use Drizzle and custom tables:

- **Pull** schema from Neon (includes `neon_auth`): `npx drizzle-kit pull`
- **Generate** migrations: `npx drizzle-kit generate`
- **Apply** to Neon: `npx drizzle-kit migrate` (uses `DATABASE_URL` from `.env.local` or your shell).

See `docs/SCHEMA_SETUP.md` for details.

---

## 7. Session cookies and different URLs

The app sets the session cookie for your host so login works. In development we use `domain: 'localhost'` so the same cookie works for `localhost:3000`, `localhost:3001`, etc. On **http://localhost** the auth route rewrites cookies (removes `Secure` and `__Secure-` prefix) so the browser will store and send them; otherwise you’d get a redirect loop (login → dashboard → logged out → login). In production (HTTPS), leave cookies as-is. Set `COOKIE_DOMAIN` (e.g. `.your-app.com`) only if you need cross-subdomain sessions; otherwise leave it unset.

**Sessions are tied to the exact origin** (protocol + host + port). These are all different origins, so each has its own session cookie:

- `http://localhost:3000`
- `http://localhost:3001`
- `https://your-app.vercel.app`
- `https://your-app-git-branch.vercel.app` (preview)

So if you log in on **localhost:3000**, then open the app on **Vercel** (or another port), you will not be logged in there. The same user exists in Neon Auth, but the browser does not send the cookie to a different origin.

**What to do:**

1. **Use one origin per workflow.** For local dev use only `http://localhost:3000` (or one port). For production use your main Vercel URL. Log in again when you switch.
2. **Stick to one port locally.** If you sometimes use 3000 and sometimes 3001, use the same port so the cookie is reused (e.g. always `npm run dev` and use 3000).
3. **Preview deployments** have their own URL and thus their own session; log in on each preview if you need to test auth there.

This is normal browser behavior and not a bug in Neon Auth.

---

## Checklist

- [ ] Neon project created; connection string copied (`DATABASE_URL`)
- [ ] Neon Auth enabled; `NEON_AUTH_BASE_URL` and `NEON_AUTH_COOKIE_SECRET` set
- [ ] Vercel: same three env vars added; redeploy done
- [ ] Localhost: `.env.local` with same three vars; `npm run dev` works
- [ ] `npm run migrate:all` run against Neon (local + production DB as needed) — `/admin` + `/dashboard` / Organisation
- [ ] `PAYLOAD_SECRET` set in Vercel for Payload (generate a long random string)
