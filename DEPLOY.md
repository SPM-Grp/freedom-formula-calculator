# Deployment — CLEAR Command Center

Vercel-hosted. Auto-deploys from the `main` branch of `github.com/walherech/freedom-formula-calculator`.

---

## First-time deploy (wholesale replacement)

The v2.1 Command Center is a ground-up rebuild. The existing repo's single-file `App.jsx` is replaced; the Vite config, entry point, and dependencies are all new.

```bash
# 1. Clone the existing repo
git clone https://github.com/walherech/freedom-formula-calculator.git
cd freedom-formula-calculator

# 2. Create a staging branch for the rebuild
git checkout -b v2-command-center

# 3. Nuke the existing src/ and config files (everything except .git/ and README.md)
find . -maxdepth 1 ! -name .git ! -name README.md ! -name '.' ! -name '..' -exec rm -rf {} +

# 4. Copy the new app over
cp -r "/Users/Sam/Documents/Claude Projects/CLEAR Program/CLEAR-Program-Cowork/10-command-center-app/." .

# 5. Install deps locally and smoke test
cp .env.example .env.local
# paste Supabase creds into .env.local
npm install
npm run dev
# Visit http://localhost:5173 — confirm EXODUS still works, auth works, persistence works.

# 6. Commit and push
git add .
git commit -m "CLEAR Command Center v1.0 — full 8-week build (v2.1 spec)"
git push -u origin v2-command-center

# 7. On Vercel: preview deploy happens automatically for the branch.
#    Open the preview URL, smoke test again, then merge to main.

# 8. Once merged to main, production auto-deploys in ~60 seconds.
```

---

## Vercel environment variables

Vercel dashboard → your project → **Settings** → **Environment Variables**.

Add for all three environments (Production, Preview, Development):

| Variable | Value |
|---|---|
| `VITE_SUPABASE_URL` | `https://YOUR_PROJECT_REF.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | the anon public key |

After adding env vars, trigger a redeploy: **Deployments** → three-dot menu on the latest deployment → **Redeploy**.

---

## Pre-deploy regression checklist

Run through this list every time before merging to `main`. Each item must pass.

### EXODUS regression guardrails (constitutional — cannot regress)

- [ ] HOA is a **separate category** from Housing (check Step X)
- [ ] Hobbies & Activities is a **separate category** from Giving & Charity (check Step X)
- [ ] Exactly **9 lifestyle categories** visible (count them)
- [ ] Moderate yield option shows **7%** (not 5%, not 8%)
- [ ] Buffer calculation uses **12.5%** of subtotal
- [ ] Break-even formula is `inflation / (1 − ETR)`
- [ ] Verdict bands: `<7%` green, `7-12%` gold, `>12%` red
- [ ] Save My Numbers button still generates the print HTML

### Persistence

- [ ] Sign in, enter values on EXODUS, sign out, sign back in → values restored
- [ ] Sign in, enter values on REVEAL Tax Landscape, navigate away, come back → values restored
- [ ] Unsigned guest can use EXODUS with ephemeral local state (no crash)
- [ ] Debounced save fires within 1 second of last keystroke (watch Network tab)
- [ ] `beforeunload` flushes pending writes (close tab mid-typing, reopen, values are there)

### Cross-week data flow

- [ ] ELIMINATE Keep list pre-populates LAUNCH strategy rows
- [ ] LAUNCH strategies appear in INSULATE with scoring controls
- [ ] ASSESS PMT appears as dashed reference line in LAUNCH chart
- [ ] EXODUS PV/FV/n flows to YIELD Row 1
- [ ] EXODUS lifestyle total pre-fills TARGET threshold
- [ ] LAUNCH freed capital (savings × n) pre-fills TARGET total capital
- [ ] REVEAL Effective Rate pre-fills current ETR from EXODUS

### Lock/unlock behavior

- [ ] Unauthenticated visitor: EXODUS unlocked, Start Here unlocked, YIELD unlocked, Weeks 2–7 locked
- [ ] Clicking a locked week shows the preview card with correct title + description
- [ ] `?preview=all` unlocks everything + shows preview-mode banner in left nav
- [ ] Setting `enrolled_weeks = 3` in `users` table unlocks Weeks 1–3 for that user
- [ ] YIELD never locks (visible + functional even for unenrolled visitors)

### Auth

- [ ] Google sign-in completes the OAuth flow
- [ ] `users` row is upserted on first sign-in (check Table Editor)
- [ ] Sign out clears session; refresh preserves signed-out state
- [ ] `VITE_SUPABASE_URL` / `_ANON_KEY` missing → app still renders EXODUS (guest mode) instead of crashing

### freedom_log (YIELD append-only)

- [ ] Add a row → appears in `freedom_log` table
- [ ] Attempt to delete via UI → no delete button exists
- [ ] Attempt to update non-notes column via SQL → fails with trigger error
- [ ] CSV export includes all rows (baseline + saved)
- [ ] Unenrolled guest can add rows to local state (ephemeral)

---

## Rollback

Vercel dashboard → **Deployments** → find the last-known-good deployment → three-dot menu → **Promote to Production**.

Rollback is ~10 seconds. No DB rollback required — schema changes are additive only.

---

## Admin helpers

- **`?preview=all`** — unlocks every week without changing DB state. Use when recording demos or filming teaching videos. The left nav shows a "⚙ Preview · all weeks unlocked" indicator.
- **`?set_weeks=N`** (must be signed in) — sets the current user's `enrolled_weeks` to N (0–8), then reloads. Shortcut for toggling enrollment during pilot without opening the Supabase dashboard. RLS ensures users can only modify their own row.
- **Direct SQL** — when setting enrollment for someone else:
  ```sql
  update public.users
  set enrolled_weeks = 3, cohort = 'pilot-2026-q2'
  where email = 'participant@example.com';
  ```

## Operational niceties

- **Save indicator** — top-right chip shows "Saving…" during debounced writes, "Saved · HH:MM" on success (fades after 2s), "Save failed — will retry" if the upsert errors. Retries automatically every 3s on error; also flushes on `beforeunload`.
- **Error boundary** — each week is wrapped. If a render error occurs inside one week, only that week's area shows a fallback with a reload button; the rest of the app keeps working.
- **Guest mode** — if Supabase env vars are missing or the user isn't signed in, EXODUS + YIELD (partial) render with in-memory state. No crash, no persistence. This is the deployed lead-magnet state for anonymous visitors.

## Known edge cases

1. **Guest state doesn't persist.** Unauthenticated visitors can use EXODUS + YIELD, but their inputs are in-memory only. The "Sign in to save your progress" banner prompts authentication.
2. **Email visibility.** The `users` table stores `email`. RLS prevents other users from seeing it, but the user's own email is visible in the left-nav footer.
3. **freedom_log append-only.** If a user enters a row with wrong values, they cannot edit the numeric fields. They can update `notes` to add context. Enforced by DB trigger.
4. **Preview mode is client-side only.** `?preview=all` unlocks tabs but does not grant data access — RLS still enforces per-user row isolation.
5. **36-month LAUNCH chart window.** Strategies activating more than 36 months from today show flat zero bands on the chart until within the window. Full run-rate KPI still reflects them.
6. **2025 AGI thresholds are hardcoded.** Update `AGI_THRESHOLDS_2025` in `src/constants.js` annually, or add a year selector in a future iteration.

---

## Post-deploy announcement

Copy from `CLEAR_Command_Center_Spec_v2_1.md` → **Skool Announcement Copy** section. Post to the Skool community under Announcements.
