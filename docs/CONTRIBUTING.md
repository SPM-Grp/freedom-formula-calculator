# Contributing to the Command Center

## Principles

1. **Teaching ≠ Prescription.** The app describes, doesn't recommend. Every strategy description ends in "your CPA will validate."
2. **Family-unit language.** No assumption of spouse / traditional household. See [constitutional rules in project instructions](../../../CLEAR-Program-Cowork/00-governance/).
3. **Redirection** (not Redirect) — the `-ion` form is constitutional.
4. **"The EXODUS Method"** keeps "The." All other weeks drop "The" in app chrome.
5. **Defaults fire immediately.** `useField` uses direct cache access so defaults propagate without user interaction. Don't re-introduce the `get(..., undefined)` pattern — it's a footgun (JS default-parameter substitution breaks it).
6. **No excluded strategies.** Syndicated Conservation Easements, Micro-Captive Insurance, Puerto Rico Act 60 abuse are excluded from the library entirely. Tests enforce this.

---

## Local setup

```bash
cd "/Users/Sam/Documents/Claude Projects/CLEAR Program/CLEAR-Program-Cowork/10-command-center-app"
cp .env.example .env.local   # paste Supabase creds
npm install
npm run dev                  # opens localhost:5173
```

See `SUPABASE_SETUP.md` if you need to provision infra.

---

## Workflow

1. **Read Master Documents v3.4** in `00-governance/CLEAR_Program_Master_Documents_v3_4.md` before touching week content. It's the single source of truth.
2. **Run tests before committing** — `npm test`. All 95 tests must pass.
3. **Run a production build** — `npm run build`. Bundle should stay under ~1.2MB (currently ~1.04MB).
4. **Regression-test the 6 constitutional EXODUS guardrails** before merging:
   - HOA separate from Housing
   - Hobbies & Activities separate from Giving & Charity
   - 9 lifestyle categories exactly
   - Moderate yield = 7%
   - Buffer = 12.5%
   - Break-even = inflation / (1 − ETR)

---

## Code organization

```
src/
├── App.jsx, main.jsx                 # Root
├── constants.js                       # Weeks, URLs, categories, disclaimers
├── printSummary.js                    # Save My Numbers HTML generator
├── lib/
│   ├── math.js                        # All solvers, formatters
│   ├── supabase.js                    # Client + auth
│   └── theme.js                       # Colors, fonts, styles
├── hooks/
│   ├── useAuth.js                     # Google OAuth
│   ├── usePersistence.js              # command_center_data layer
│   └── useEnrollment.js               # enrolled_weeks → lock state
├── data/
│   ├── strategies.js                  # 27-strategy library
│   ├── strategies.test.js
│   ├── strategyPrompts.js             # 4 tab-specific LLM prompts
│   └── strategyPrompts.test.js
├── components/
│   ├── AppShell.jsx                   # Left nav + sub-tabs + routing
│   ├── LeftNav.jsx
│   ├── SubTabs.jsx
│   ├── LockedPreview.jsx
│   ├── SaveIndicator.jsx
│   ├── ErrorBoundary.jsx
│   ├── AskDelphi.jsx                  # Floating "Ask Sam" button
│   ├── ui.jsx                         # Shared primitives (Card, KPI, VerdictHero, Tooltip, etc.)
│   ├── StrategyComponents.jsx         # Picker, InfoCard, Roadmap, Checklist, NotHere
│   └── weeks/                         # One file per week
│       ├── StartHere.jsx, Exodus.jsx, Reveal.jsx, Eliminate.jsx,
│       ├── Assess.jsx, Launch.jsx, Insulate.jsx, Target.jsx, Yield.jsx
└── test/
    └── setup.js                       # Vitest setup (jest-dom matchers, cleanup)
```

Plus at project root:

```
migrations/001_initial.sql              # Supabase schema
docs/STRATEGY_LIBRARY.md                # This set
docs/TESTING.md
docs/CONTRIBUTING.md
SUPABASE_SETUP.md                       # One-time infra setup
DEPLOY.md                               # Vercel deploy + regression checklist
SPEC_DEVIATIONS.md                      # Where implementation deviates from v2.1/v2.0
COMMAND_CENTER_FIELDS.md                # Every persisted field_key cataloged
README.md
```

---

## Adding a week component

Hypothetical — if a Week 9 is ever added:

1. Add `weeks: [..., { slug: "new_week", nav: "NEW", title: "NEW", weekNumber: 9, ... }]` to `constants.js`
2. Create `src/components/weeks/NewWeek.jsx` — use `PageHeader`, `SectionEyebrow`, and the shared primitives from `ui.jsx` to match EXODUS's visual DNA
3. Register in `AppShell.jsx → WEEK_COMPONENTS`
4. Add a migration to `001_initial.sql` if the week needs new tables (rare — `command_center_data` is flat key-value)
5. Add locked-preview teaser to `LockedPreview.jsx → WEEK_TEASERS`
6. Update Master Documents v3.4

---

## Adding a strategy

See [STRATEGY_LIBRARY.md — Adding a strategy](./STRATEGY_LIBRARY.md#adding-a-strategy).

---

## Adding a field to the persistence layer

1. Use `useField` (scalars) or `useJSONField` (arrays/objects) in your component
2. Add an entry to `COMMAND_CENTER_FIELDS.md` documenting the key + purpose + downstream consumers
3. No schema migration needed — `command_center_data` is a flat key-value store

---

## When the build breaks

1. `npm run build` — look at the exact line/column in the error
2. If it's a syntax error in `strategies.js`: check for `number+,` patterns (JS doesn't allow postfix `+`)
3. If it's a JSX parsing error in a `.js` file: move the JSX to a `.jsx` file, OR use `React.createElement` instead
4. If Vite can't resolve a Supabase import: check that `@supabase/supabase-js` version in `package.json` supports the features you're using (auth v2 is 2.38+)

---

## Style

- **Inline styles** over CSS classes. Matches EXODUS's original vocabulary and keeps components self-contained.
- **Shared primitives** in `ui.jsx` (Card, SectionEyebrow, VerdictHero, Tooltip, etc.). Don't re-invent — extend.
- **Georgia serif** for numbers, `Helvetica Neue` for UI. Constitutional.
- **Gold** (`#C4A265`) and **goldLight** (`#D4B47A`) for accents; **dark green** (`#1A3C2E`) for primary background.
- **No emojis in code** unless the user explicitly wants them rendered.

---

## Accessibility minimums

- Every icon-only button gets an `aria-label` and `title`
- Every input has a `Label` above it
- Keyboard navigation works across the step nav, sub-tabs, strategy picker
- Tooltips are `role="tooltip"` and reveal on `:focus-within` as well as `:hover`
- Color is never the only signal (verdict bands have text labels too)

---

## What NOT to do

- **Don't add tax advice anywhere.** Not in strategy summaries, not in CPA questions, not in helpers. We describe; CPAs advise.
- **Don't recommend specific providers** by name (unless it's a structural necessity like IRS-required forms). The library says "engage a qualified cost seg engineer," not "use ABC Cost Seg Co."
- **Don't include excluded strategies.** The tests block this at CI time anyway.
- **Don't show a range without "your CPA will validate"** qualifier somewhere near it.
- **Don't break the constitutional rules** in `src/constants.js` (9 lifestyle categories exactly, HOA separate, Hobbies separate, Moderate=7%, Buffer=12.5%).

---

## Getting help

Sam's Delphi: https://www.delphi.ai/sam-alherech
