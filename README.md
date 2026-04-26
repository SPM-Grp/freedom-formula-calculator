# CLEAR Command Center

The single tool that follows a CLEAR Program participant through all eight weeks.

- **Unenrolled visitors** land on EXODUS — the Freedom Formula Calculator. Weeks 2–7 appear locked in the left nav.
- **Enrolled participants** see weeks unlock progressively as they advance through the program. Everything they build here is saved, connected, and cumulative.

Same app, same URL, two experiences — governed by Supabase auth + the `enrolled_weeks` field on the `users` table.

**Live URL:** https://freedom-formula-calculator.vercel.app

---

## Stack

- **React 18 + Vite** — single-page app, client-side routing via left-nav state.
- **Supabase** — Postgres DB + Google OAuth. Two tables (`command_center_data`, `freedom_log`) plus `users`. RLS on everything.
- **Recharts** — line, area, bar, and pie charts.
- **Vercel** — auto-deploys from `main`.

No CSS framework, no UI library — styles are inline primitives in `src/lib/theme.js` and `src/components/ui.jsx`. This matches the original single-file calculator's aesthetic.

---

## Project structure

```
10-command-center-app/
├── package.json
├── vite.config.js
├── index.html
├── .env.example
├── migrations/
│   └── 001_initial.sql            # Supabase schema + RLS + append-only trigger
├── SUPABASE_SETUP.md              # One-time infra setup walkthrough
├── DEPLOY.md                      # Deployment + regression checklist
└── src/
    ├── main.jsx
    ├── App.jsx                    # Auth + enrollment + shell
    ├── constants.js               # Categories, yields, weeks, thresholds, bucket schemas
    ├── printSummary.js            # "Save My Numbers" print HTML generator
    ├── lib/
    │   ├── supabase.js            # Supabase client + Google OAuth helpers
    │   ├── math.js                # All solvers, verdict, formatters, Defensibility / Capital formulas
    │   └── theme.js               # Colors, fonts, styles, gradients
    ├── hooks/
    │   ├── useAuth.js             # Session + Google OAuth flow
    │   ├── usePersistence.js      # Command Center data + freedom_log
    │   └── useEnrollment.js       # enrolled_weeks → lock/unlock logic
    └── components/
        ├── AppShell.jsx           # Left nav + sub-tabs + week dispatch
        ├── LeftNav.jsx
        ├── SubTabs.jsx
        ├── LockedPreview.jsx
        ├── ui.jsx                 # Shared primitives: Card, MoneyInput, Slider, KPI, Callout, etc.
        └── weeks/
            ├── StartHere.jsx      # For Visitors + For Participants
            ├── Exodus.jsx         # 6 sub-tabs (E, X, O, D, U, S)
            ├── Reveal.jsx         # Effective Rate + Tax Landscape
            ├── Eliminate.jsx      # Strategy Filter (4 buckets)
            ├── Assess.jsx         # Strategy Impact
            ├── Launch.jsx         # Implementation Timeline
            ├── Insulate.jsx       # Defensibility Score
            ├── Target.jsx         # Capital Placement Allocator
            └── Yield.jsx          # Track Your Freedom
```

---

## Quick start

```bash
npm install
cp .env.example .env.local
# Paste VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY (see SUPABASE_SETUP.md)
npm run dev
```

Visit http://localhost:5173.

If you don't want to set up Supabase yet, omit `.env.local` — the app runs in guest mode with ephemeral in-memory state. EXODUS (Week 1) is fully functional; other tabs render locked preview cards.

---

## Data model

### `users`
One row per authenticated user. `enrolled_weeks` governs the left-nav lock state.

### `command_center_data`
Flat key-value store, indexed by `(user_id, week_slug, subtab_slug, field_key)`. Stores every input across every tab. Values are text — the app parses on read.

Example rows:
```
user_id=X, week=exodus,  subtab=root,                 field=pv              → "500000"
user_id=X, week=exodus,  subtab=root,                 field=lifestyle_vals  → "{...}"
user_id=X, week=reveal,  subtab=tax_landscape,        field=agi             → "450000"
user_id=X, week=assess,  subtab=strategy_impact,      field=pmt             → "65000"
```

### `freedom_log`
Append-only. One row per (user, year). Only `notes` may be updated post-insert (enforced by trigger). Deletes are blocked by RLS (no delete policy exists).

---

## Cross-week data dependencies

```
EXODUS (pv, fv, n, r, r_breakeven, etr, lifestyle_total)
  ├─▶ REVEAL (Effective Rate pre-fill; Tax Landscape independent)
  ├─▶ ASSESS (math base)
  ├─▶ TARGET (threshold pre-fill, r comparison)
  └─▶ YIELD  (Row 1 baseline)

ELIMINATE (Keep list)
  ├─▶ LAUNCH   (strategy row pre-populate)
  └─▶ INSULATE (via LAUNCH)

ASSESS (pmt)
  └─▶ LAUNCH (dashed reference line)

LAUNCH (strategy list w/ savings, owner, activation month)
  ├─▶ INSULATE (auto-populate scoring table)
  └─▶ TARGET   (freed-capital estimate = Σ savings × n)
```

All downstream weeks degrade gracefully — dependency prompts instead of crashes when upstream data is missing.

---

## Constitutional guardrails (cannot regress)

- HOA is a separate lifestyle category from Housing
- Hobbies & Activities is a separate category from Giving & Charity
- Exactly 9 lifestyle categories
- Moderate yield = 7% (not 5%)
- Buffer = 12.5% of lifestyle subtotal
- Break-even formula = `inflation / (1 − effective_tax_rate)`
- Verdict bands: `<7%` green · `7–12%` gold · `>12%` red
- `freedom_log` is append-only
- "Teaching ≠ Prescription" — no tab recommends strategies; they capture participant + CPA inputs and show impacts

These are enforced in `src/constants.js` and `src/lib/math.js`. Changing them requires a brand review.

---

## License & copyright

© 2026 SP Media Inc. All rights reserved. CLEAR™ is a trademark of SP Media Inc.
Educational framework only — not financial advice.
