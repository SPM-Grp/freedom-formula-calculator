# Strategy Library — Reference

The strategy library is the data backbone for ELIMINATE, ASSESS, LAUNCH, and INSULATE. It lives at `src/data/strategies.js` and ships with **29 strategies** across the 10 constitutional categories from Master Documents v3.4.

Strategies can carry a `featured: true` flag — featured entries are sorted to the top of any picker dropdown (with a gold "★ FEATURED" badge) so headline, program-specific structures appear first. Currently only the Asymmetric Leveraged Charitable Contribution is featured.

---

## Why the library exists

Without it, every strategy entry in ELIMINATE is a free-text string with no downstream value. The library transforms that text into:

- **ELIMINATE** → autocomplete dropdown, inline info card with summary + IRC sections + scrutiny flag
- **ASSESS** → typical savings range reference (Keep-list strategies)
- **LAUNCH** → implementation roadmap (owner, lead time, numbered steps, annual activities, CPA questions)
- **INSULATE** → documentation checklist (required docs, retention, audit triggers)

When a user picks a strategy from ELIMINATE's autocomplete, the `strategyId` propagates through `keep_rows → launch.strategies → insulate.scores`, so every subsequent tab inherits the library metadata.

---

## Categories (10 — constitutional)

| `category` | Label | Typical contents |
|---|---|---|
| `benefit_optimization_w2` | Benefit Optimization (W-2) | 401(k), HSA, Backdoor Roth, Mega Backdoor Roth |
| `benefit_optimization_owner` | Benefit Optimization (Owner) | Solo 401(k), Defined Benefit, SEP-IRA, Section 105 Plan / Family HRA, ICHRA |
| `entity_structuring` | Entity Structuring | S-Corp, FMC, Reasonable Comp |
| `asset_depreciation` | Asset Depreciation | Cost Seg, STR Stack, §179 |
| `charitable` | Charitable | DAF, Asymmetric Leveraged, QCD |
| `event_driven` | Event-Driven | Augusta Rule, Hire Your Children, Home/Vehicle/Meals |
| `income_character` | Income Character | QSBS, §1031 |
| `income_timing` | Income Timing | NQDC |
| `loss_based` | Loss-Based | REPS, FF&E on Business Acquisition |
| `credit_based` | Credit-Based | R&D Credit (flagged), O&G IDC, Solar/EV |

---

## Strategy object shape

```js
{
  id: "cost_segregation",              // unique, snake_case — used in persistence
  name: "Cost Segregation Study",       // human-readable — rendered in UI
  category: "asset_depreciation",       // must match a STRATEGY_CATEGORIES id
  type: "deferral",                     // "reduction" | "deferral" | "redirection"
  ircSections: ["§168", "§179"],        // array of code sections, rendered inline

  summary: "Short 1-2 sentence explanation.",
  whoFor: ["bullet", "bullet"],         // 3-5 profile fits
  disqualifiers: ["bullet", "bullet"],  // 2-4 show-stoppers

  typicalSavings: {
    min: 50000,
    max: 500000,
    basis: "first-year paper loss at high marginal rate",
  },

  implementation: {
    primaryOwner: "cpa + cost seg engineer",
    leadTimeWeeks: 6,
    steps: ["Step 1", "Step 2", ...],       // 5-7 chronological steps
    annualActivities: ["..."],              // optional
    costRange: { min: 5000, max: 15000, note: "Per property" },
  },

  documentation: {
    required: ["doc 1", "doc 2", ...],      // 5-7 items
    retention: "Permanent — cost basis...",
    auditTriggers: ["trigger 1", ...],      // 3-5 triggers
  },

  cpaQuestions: ["Question 1?", ...],       // 3-5 specific questions

  scrutiny: {                               // optional — only on flagged strategies
    level: "elevated" | "heightened",
    reason: "Why the IRS scrutinizes this...",
  },

  relatedStrategies: ["other_id", ...],     // optional
  hoverDefinition: "Extended explanation",  // optional — rendered in Tooltip
}
```

---

## IRS scrutiny policy

The library flags three tiers:

- **None** — standard. No visual flag.
- **Elevated** (`⚠ orange`) — known IRS audit focus, legitimate when properly executed. Current flagged: R&D Credit, FMC, STR Stack, FF&E Business Acquisition, Augusta Rule, Hire Your Children, Asymmetric Leveraged Charitable.
- **Heightened** (`⚠ red`) — active IRS enforcement with recent actions. Current flagged: REPS + Material Participation (IRS now uses analytics; reconstructed logs fail).

**Permanently excluded** from the library (not flagged — not included at all):

- Syndicated Conservation Easements (listed transactions per Oct 2024 regs)
- Micro-Captive Insurance (§831(b)) abuse
- Puerto Rico Act 60 abuse (active DOJ/IRS investigations)

These exclusions are tested in `strategies.test.js — excluded abusive strategies are NOT in library`.

---

## Source of truth

Strategy content comes from:

1. **Master Documents v3.4** — the 10 category canonical taxonomy
2. **Week 5 LAUNCH lesson plan** — implementation profiles for 11 categories
3. **Week 6 INSULATE lesson plan** — documentation profiles for 13 strategies
4. **Week 5 audit file** (`CLEAR-Program-Cowork/Weeks5-8_Source_Material_Audit.md`) — edge cases
5. **Recent IRS enforcement data** — scrutiny flags, exclusions

When lesson plans are updated, `strategies.js` should be updated to match. No autogen — these are hand-curated because the cost of inaccuracy in tax content is high.

---

## Adding a strategy

1. Add the object to `STRATEGY_LIBRARY` in `src/data/strategies.js`, in the correct category section.
2. Run `npm test` — the integrity tests will catch missing fields, unknown category, duplicate id, empty implementations, empty documentation, invalid scrutiny levels.
3. If the strategy is commonly known by an acronym (FMC, QCD, etc.), add it to `ACRONYM_DEFINITIONS` in `src/components/ui.jsx`. The `withAcronymTooltips` helper in `StrategyComponents.jsx` will render a hover tooltip automatically.
4. If the strategy has IRS scrutiny, set the `scrutiny` field — color + badge + reason render automatically.
5. Update this doc's category table if the new strategy is notable.

---

## Removing or deprecating a strategy

1. Remove it from `STRATEGY_LIBRARY`.
2. Existing user data referencing its id via `command_center_data.value` (containing `strategyId: "<removed>"`) will gracefully fall back to free-text display — the UI tolerates missing strategies.
3. Optionally run a cleanup SQL: `update command_center_data set value = regexp_replace(value, '<removed_id>', 'deprecated_<removed_id>') where field_key in (...);` if you want to rename rather than orphan.

---

## Customizing per-strategy behavior

Most per-strategy UI is driven by the data shape — no code changes needed. But some behavior is opinionated:

- **Checklist → doc-score mapping** (`src/components/weeks/Insulate.jsx → checklistScoreToDocScore`):
  - 100% checked → 5 (Audit-Ready)
  - 80–99% → 4 (Strong)
  - 50–79% → 3 (Functional)
  - 20–49% → 2 (Partial)
  - <20% → 1 (None)
- **Defensibility Score formula** (`src/lib/math.js → defensibilityScore`):
  - Per-strategy: `base = (docScore / 5) × 90 + cpaBonus`, capped at 100
  - `cpaBonus`: yes = 10, partial = 5, no = 0
  - Overall: weighted average by annual savings

If you want different thresholds or weightings, edit those two functions directly.

---

## LLM prompt templates

`src/data/strategyPrompts.js` defines four prompt templates — one per tab — for strategies not in the library. Users copy the prompt, fill in `[STRATEGY NAME]` + their context, paste into any AI tool. The `StrategyNotHere` component renders them inline with a one-click copy button and expandable preview.

Tests (`strategyPrompts.test.js`) verify:
- All four tab variants exist
- Each has title + subtitle + body
- Every prompt includes `[STRATEGY NAME]` placeholder
- Every prompt tells the AI "do not give tax advice"
- Tab-specific prompts reference tab-specific concepts (7-test filter, Freedom Formula vars, chronological execution plan, audit triggers)
