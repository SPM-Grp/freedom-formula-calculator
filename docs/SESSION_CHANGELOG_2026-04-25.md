# Command Center — Session Changelog · 2026-04-25

A self-contained reference for NotebookLM ingestion. This document captures
every meaningful change made to the CLEAR Command Center web app
(`10-command-center-app/`) on 2026-04-25 so cross-document consistency
checks have ground truth without diffing the repo.

The session covered three workstreams: an **auth + persistence resilience
pass** (fix the "Loading your numbers…" hang), a **strategy library
expansion** (HRAs added, Asymmetric Charitable promoted), and a
**book + community CTA pass** (book linked from more surfaces, Skool URL
fixed).

---

## 1 · Auth + persistence resilience

### Symptom
After a hard refresh of the running dev server at `localhost:5173`, the app
got stuck on the dark-green "Loading your numbers…" splash and never
rendered the dashboard.

### Root cause
In `src/hooks/useAuth.js`, the original effect was:

```js
supabase.auth.getSession().then(async ({ data }) => {
  setSession(data.session ?? null);
  if (data.session?.user) {
    const row = await ensureUserRow(data.session.user); // BLOCKING
    setUserRow(row);
  }
  setLoading(false); // never reached if ensureUserRow hangs
});
```

If `ensureUserRow()` hung — RLS misconfig, missing trigger, slow DB —
`setLoading(false)` never ran. `App.jsx` gates its render on
`auth.loading`, so the splash stayed up forever.

### Fix — `src/hooks/useAuth.js`
- `setLoading(false)` now fires the instant `getSession()` resolves —
  before `ensureUserRow()` is even called.
- `ensureUserRow()` runs in a non-blocking background promise; its result
  updates `userRow` only when it returns successfully.
- `.catch()` handlers on both `getSession()` and `ensureUserRow()` log a
  console warning instead of leaving the app silently hung.
- A 4-second hard safety timer force-flips `loading=false` even if
  `getSession` itself never resolves.
- Same non-blocking pattern applied to `onAuthStateChange` so the
  post-OAuth redirect can't hang either.

### Fix — `src/hooks/usePersistence.js`
Same defense-in-depth pattern applied to the `command_center_data`
load query: a 4-second safety timer plus a Promise-rejection handler.
If the load query hangs or throws, the app renders with empty cache
(prior values reappear on next successful load) rather than getting
stuck on the per-week `LoadingState` spinner.

### Bonus — `signInWithGoogle` diagnostics
Added in the same file. The function now:
- Logs every click with `[useAuth] signInWithGoogle clicked` plus
  `configured` and `origin`.
- Wraps the SDK call in `try/catch` so SDK throws don't disappear
  silently.
- After a successful `signInWithOAuth` returns a `data.url`, falls back
  to a manual `window.location.href = data.url` after 100ms if the SDK
  hasn't already redirected — belt-and-suspenders for SDK builds where
  `detectSessionInUrl` doesn't auto-navigate.

### Verification
Sam's `auth.users` row in Supabase shows `last_sign_in_at` updating on
2026-04-24 22:45:51 UTC, confirming the OAuth round-trip itself works
end-to-end. The Google sign-in button is functional — diagnostics are
in place if it ever appears not to be.

---

## 2 · Strategy library expansion

The library at `src/data/strategies.js` grew from **27 to 29 strategies**.
Two additions, one promotion, and one architectural feature.

### 2.1 · Section 105 Plan / Family HRA — added
- `id: "section_105_plan"`
- `category: "benefit_optimization_owner"`
- `type: "reduction"`
- `ircSections: ["§105", "§106", "§125"]`
- **What it does:** sole-prop or single-LLC owner hires a family-unit
  member as a bona fide employee, then reimburses 100% of family medical
  expenses (premiums, deductibles, copays, dental, vision, OTC) tax-free
  through the business. Converts personal medical spend into pre-tax
  business deductions.
- **Disqualifier called out explicitly:** S-Corp >2% shareholders cannot
  use this — §1372 / §318 attribution blocks self-reimbursement.
- **Implementation owner:** specialized TPA (BASE, TASC, AgriPlan) + CPA.
- **Documentation focus:** plan document + SPD, employment file for the
  family-unit employee (job description, time records, payroll registers),
  itemized substantiation per claim, reasonable-compensation analysis.
- **Audit triggers logged:** sham employment (no documentable work),
  reimbursements exceeding reasonable wage, S-Corp shareholders
  attempting it, missing contemporaneous substantiation.
- Typical savings: $4K–$18K on $15K–$50K of family medical spend.

### 2.2 · ICHRA (Individual Coverage HRA) — added
- `id: "ichra"`
- `category: "benefit_optimization_owner"`
- `type: "reduction"`
- `ircSections: ["§105", "§9831", "Notice 2018-88"]`
- **Scrutiny flag:** `elevated`. Reason: class designs that look engineered
  to benefit owners over rank-and-file are an audit focus area; defensible
  designs follow workforce facts, not desired outcomes.
- **What it does:** business reimburses each employee for individual-market
  premiums + qualified medical, tax-free, with employer-set monthly caps
  that can be class-tiered (full-time / part-time / salaried / hourly /
  geographic).
- **Disqualifier called out explicitly:** same §1372 attribution issue —
  S-Corp >2% shareholders can't self-reimburse.
- **Implementation owner:** ICHRA administrator (Take Command, HealthEquity,
  Gravie) + benefits counsel + CPA.
- **Documentation focus:** plan document with class definitions, 90-day
  employee notice, monthly substantiation, ALE compliance (Form 1094/1095)
  if 50+ FTEs, nondiscrimination testing analysis.
- Typical savings: $6K–$25K on $15K–$50K reimbursed.

### 2.3 · Asymmetric Leveraged Charitable Contribution — promoted
- `id: "asymmetric_charitable"` now carries `featured: true`.
- The strategy describes the annual CLEAR-vetted structure where ~$1 of
  contribution generates ~$5–$6 of deduction, with leverage rates that
  vary by calendar window (6:1 through June, 5:1 July–October, closes
  early-to-mid November).
- This is the headline strategy Sam wants every prospect and participant
  to evaluate, so it now sorts to the top of the StrategyPicker dropdown
  with a gold "★ FEATURED" badge.

### 2.4 · `featured` flag — architectural addition
- New optional field on any strategy object.
- `src/data/strategies.js` → `searchStrategies(q)` was refactored to
  stable-sort featured strategies first within both empty-query and
  filtered result sets, while preserving original library order within
  each group.
- `src/components/StrategyComponents.jsx` → `StrategyPicker` dropdown
  rows now render a gold "★ Featured" pill before the strategy name when
  `s.featured === true`.
- File header in `strategies.js` documents the semantics so future
  additions know how to use the flag.

### 2.5 · Test coverage updates
`src/data/strategies.test.js`:
- Strategy count assertion updated 27 → 29.
- `mustHave` list extended with `section_105_plan` and `ichra` so future
  refactors can't accidentally remove them.
- Three new tests: (a) `asymmetric_charitable` carries `featured: true`,
  (b) `searchStrategies("")` returns featured first and the first result
  is `asymmetric_charitable`, (c) `searchStrategies("charitable")` still
  leads with the featured strategy within the matching set.
- Constitutional language tests still pass — the new HRA strategies use
  "family-unit member" language, no "spouse" / "wife" / "husband"
  references in user-facing fields.

**Test suite status:** 101/101 passing (38 strategies, 55 math, 8 prompts).

---

## 3 · Book + community CTA pass

### 3.1 · Book CTA — extended to two new surfaces
The book (`Rich But Broke MD` at `https://richbutbrokemd.com`, exposed as
`BOOK_URL` in `src/constants.js`) was previously linked from exactly one
place: the "For Visitors" variant of Start Here. It's now also on:

- **`src/components/LockedPreview.jsx`** — the page visitors hit when
  they click any locked week in the left nav (REVEAL · ELIMINATE · ASSESS
  · LAUNCH · INSULATE · TARGET). New "📕 NOT READY FOR THE PROGRAM?
  Start with the book — Rich But Broke MD" card sits below the primary
  "Learn About CLEAR" CTA. Highest-traffic visitor surface; visitors
  clicking around locked weeks now see the book on every single one.

- **`src/components/weeks/StartHere.jsx` → `ForParticipants`** — softer,
  secondary placement at the bottom of the participant orientation page,
  framed as "the book behind CLEAR — useful to gift to a colleague who's
  curious about the program, or to re-read between weeks." Members who
  came in through the program but haven't read the book have a path to
  it; members who want to share it have a path too.

All three book CTAs use the same gold-bordered card pattern, link to
`BOOK_URL`, and open in a new tab.

### 3.2 · Skool community URL — fixed
Old URL `https://www.skool.com/onepercentplaybook` returned 404 — the
slug Skool now uses is hyphenated. Fixed in `src/constants.js`:

```js
export const SKOOL_COMMUNITY_URL =
  "https://www.skool.com/the-one-percent-playbook/about" +
  "?ref=8a906363386042a0838db4fecee1dfa6";
```

The new URL also carries Sam's referral code, so any signup that comes
through this link is attributed to him. The constant is referenced once,
in `StartHere.jsx → ForParticipants` ("Questions about the program? Visit
the Skool community →").

---

## Summary of files touched

| File | Change |
|---|---|
| `src/hooks/useAuth.js` | Defense-in-depth refactor + diagnostics on `signInWithGoogle` |
| `src/hooks/usePersistence.js` | Safety timer + rejection handler on initial load |
| `src/data/strategies.js` | +Section 105, +ICHRA, `featured` flag on Asymmetric, `searchStrategies` sort refactor, header doc updated |
| `src/data/strategies.test.js` | Count 27→29, new must-have entries, 3 new featured/HRA tests |
| `src/components/StrategyComponents.jsx` | "★ Featured" badge in `StrategyPicker` dropdown |
| `src/components/LockedPreview.jsx` | Imports `BOOK_URL`; new "Not ready?" book card below primary CTA |
| `src/components/weeks/StartHere.jsx` | Book card added to `ForParticipants` view |
| `src/constants.js` | `SKOOL_COMMUNITY_URL` updated to working hyphenated slug + referral code |
| `docs/STRATEGY_LIBRARY.md` | Count 27→29, HRAs listed, `featured` flag documented |

---

## Constitutional compliance check

- ✅ **Teaching ≠ Prescription** — every new strategy frames the structure,
  who-it-fits, and disqualifiers; never recommends "do this." All carry
  CPA validation language.
- ✅ **Sam = "former CPA"** — no founder / CEO / licensed CPA language
  appears in new content. Constitutional regression test
  (`/founder|CEO|licensed cpa/i`) still passes.
- ✅ **Family-unit language** — Section 105 and ICHRA copy uses
  "family-unit member" / "family unit" throughout. Constitutional
  regression test (`/spouse|husband|wife/i`) still passes.
- ✅ **"Redirection" not "Redirect"** — type-field validation in tests
  still passes; new strategies use `"reduction"`.
- ✅ **IRS-listed transactions excluded** — Section 105 and ICHRA are
  legitimate, well-established structures (since 1954 and 2018 respectively),
  not on any abusive-transactions list.

---

## Open follow-ups

- **Authority Video Script v3.2** — still pending (remove "founder and
  CEO," change to "former CPA"). This is on the launch sequence ahead of
  recording Week 4.
- **Week 8 Lesson Plan v1.1** — fix "Acceleration" → "Accountability" for
  the A in the CLEAR acronym walk-through.
- **Week 2 REVEAL Deck v1.1** — Slide 62 tier label, Slide 72 line
  description swap.
- **Week 3 Participant Handout v1.1** — REPS / material participation
  carve-out to Tree 6 row.
- **File Manifest v1.3** — needs update reflecting Command Center
  build progress.
- **Command Center deploy** — code is ready; next step is the 5-phase
  deploy plan (Phase 1 local smoke test through Phase 5 announce on
  Skool).

---

*Generated 2026-04-25 by the Command Center engineering session. Test
suite green at time of generation: 101/101.*
