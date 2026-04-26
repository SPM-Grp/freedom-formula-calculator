# Supabase + Google OAuth Setup — CLEAR Command Center

This is the one-time infrastructure setup. Takes ~15 minutes. Do it once per environment (local + production).

---

## 1. Create (or reuse) a Supabase project

Go to https://supabase.com/dashboard → **New project**.

- Organization: your existing org (or Verdict's).
- Name: `clear-command-center`
- Database password: save in 1Password.
- Region: same as your Vercel region for lower latency.
- Pricing plan: Free tier is fine for the pilot.

Wait ~2 minutes for provisioning.

If you already have a Supabase project (e.g. Verdict) and want to reuse it: you can — Supabase supports multiple apps per project. Skip project creation and jump to step 2, but be aware that tables will be co-located with Verdict's.

---

## 2. Run the migration

- Project dashboard → left nav → **SQL Editor** → **New query**.
- Copy the contents of `migrations/001_initial.sql` into the editor.
- Click **Run**.
- Confirm in the Table Editor that these three tables exist:
  - `users`
  - `command_center_data`
  - `freedom_log`
- Confirm RLS is enabled on all three (shield icon on each table).

---

## 3. Configure Google OAuth

- Project dashboard → **Authentication** → **Providers** → **Google**.
- Toggle **Enable provider**.
- You need a Google Cloud OAuth client ID + secret. If you have one from Verdict, reuse it. Otherwise:
  - Go to https://console.cloud.google.com/
  - Create (or select) a project.
  - APIs & Services → **OAuth consent screen** → configure for **External**. Publish.
  - APIs & Services → **Credentials** → **+ Create credentials** → **OAuth client ID** → **Web application**.
  - **Authorized redirect URIs** — add all of these:
    - `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`
    - `http://localhost:5173` (for local dev)
    - `https://freedom-formula-calculator.vercel.app` (production)
    - `https://YOUR-CUSTOM-DOMAIN.com` if you attach one later
  - Copy the Client ID + Client secret back into Supabase.
- Save.

---

## 4. Add redirect URLs to Supabase Auth settings

- Authentication → **URL Configuration**.
- **Site URL** = `https://freedom-formula-calculator.vercel.app`
- **Additional redirect URLs** (add each on a new line):
  - `http://localhost:5173`
  - `https://freedom-formula-calculator.vercel.app`
  - `https://freedom-formula-calculator.vercel.app/**`
- Save.

---

## 5. Grab your env vars

- Project dashboard → **Settings** → **API**.
- Copy:
  - **Project URL** → paste into `VITE_SUPABASE_URL` in `.env.local` (local) and Vercel environment variables (production)
  - **anon public** key → `VITE_SUPABASE_ANON_KEY`

**Do not** use the `service_role` key. That key bypasses RLS and must never appear in client code.

---

## 6. Smoke test locally

```bash
cd 10-command-center-app
npm install
cp .env.example .env.local
# Paste VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY into .env.local
npm run dev
```

- Open http://localhost:5173
- Click **Sign in with Google** → complete the flow.
- You should land back on the app, signed in, with no errors in the console.
- Edit a value on EXODUS (e.g. PV). Wait 1 second. Refresh. The value should still be there.
- Check Supabase → Table Editor → `command_center_data`. You should see at least one row.

If anything fails, check:
- The redirect URI in Google Cloud matches `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback` exactly
- RLS policies ran (SQL editor → `select * from pg_policies where schemaname='public';` should list all the `..._self_*` policies)
- `.env.local` is not committed (it shouldn't be — see `.gitignore`)

---

## 7. Grant enrollment (admin step, per participant)

Unenrolled visitors see EXODUS + YIELD; all other weeks are locked. To unlock weeks for an enrolled participant, update their `enrolled_weeks` value in the `users` table:

```sql
update public.users
set enrolled_weeks = 3, cohort = 'pilot-2026-q2'
where email = 'participant@example.com';
```

- `enrolled_weeks = 1` unlocks EXODUS (already unlocked).
- `enrolled_weeks = 2` unlocks REVEAL.
- `enrolled_weeks = 8` unlocks everything.

For pilot cohort, you set this manually. Future enhancement: Skool webhook auto-increments `enrolled_weeks` on each week's completion.

---

## 8. Admin preview URL

When recording teaching videos or doing walkthroughs where you need all weeks unlocked without enrolling:

```
https://freedom-formula-calculator.vercel.app/?preview=all
```

The `?preview=all` query parameter unlocks every week for that session, regardless of auth or enrollment state. The left nav shows a small "⚙ Preview · all weeks unlocked" indicator.
