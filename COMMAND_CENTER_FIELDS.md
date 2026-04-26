# Command Center — Field Catalog

Every persisted field in the app, keyed as `(week_slug, subtab_slug, field_key)`. Use this as the single reference when adding new tabs or debugging cross-week data flow.

All values are stored as TEXT in `command_center_data.value` (JSON-encoded for arrays/objects). The app parses on read.

---

## `exodus` / `root`

| field_key | kind | what it stores | consumed by |
|---|---|---|---|
| `pv` | money string | Present Value (e.g. `"$500,000"`) | REVEAL, ASSESS, TARGET, YIELD |
| `n` | number string | Timeline in years | REVEAL, ASSESS, TARGET, YIELD |
| `inflation` | percent string | Inflation rate (e.g. `"3"`) | REVEAL, YIELD |
| `yield_rate` | decimal string | Primary yield rate (e.g. `"0.07"`) | REVEAL, ASSESS, TARGET, YIELD |
| `yield_rate_2` | decimal string | Comparison yield rate (Step D) | — |
| `show_compare` | bool string | Whether Step D shows scenario comparison | — |
| `effective_tax_rate` | percent string | ETR (e.g. `"35"`) | REVEAL Effective Rate (pre-fill), YIELD |
| `lifestyle_vals` | JSON object | `{ housing, hoa, transport, ... }` monthly amounts | REVEAL, TARGET (via lifestyleTotal) |

## `exodus` / `u`

| field_key | kind | stores |
|---|---|---|
| `pv_mult` | number string | Step U PV multiplier |
| `life_mult` | number string | Step U lifestyle multiplier |
| `n_adj` | number string | Step U timeline adjustment |
| `contrib` | number string | Step U annual contribution |

## `exodus` / `s`

| field_key | kind | stores |
|---|---|---|
| `tax_saved` | number string | Step S tax capital slider |

## `reveal` / `effective_rate`

| field_key | kind | stores |
|---|---|---|
| `current_etr` | percent string | Current ETR (pre-filled from EXODUS) |
| `target_etr` | percent string | Target ETR (default = current − 5) |

## `reveal` / `tax_landscape`

| field_key | kind | stores |
|---|---|---|
| `filing_status` | enum | `single` / `mfj` / `mfs` |
| `gross_income` | money string | W-2 box 1 |
| `other_income` | money string | Side income, K-1 ordinary |
| `ltcg` | money string | Long-term capital gains |
| `stcg` | money string | Short-term capital gains |
| `agi` | money string | Form 1040 line 11 |
| `federal_tax` | money string | Form 1040 line 24 |
| `etr_override` | percent string | Manual ETR override (empty = use auto-calc) |
| `state_tax` | money string | Optional |
| `fica_tax` | money string | Optional |
| `deduction_type` | enum | `standard` / `itemized` |
| `deduction_amount` | money string | Standard or Schedule A total |
| `above_line` | money string | Retirement, HSA, SE health, etc. |
| `notes` | text | Unusual events this year |

## `eliminate` / `strategy_filter`

| field_key | kind | stores |
|---|---|---|
| `keep_rows` | JSON array | Keep bucket entries |
| `exclude_rows` | JSON array | Exclude bucket entries |
| `route_rows` | JSON array | Route bucket entries |
| `park_rows` | JSON array | Park bucket entries |

Each row object shape varies by bucket. See `src/constants.js → ELIMINATE_BUCKETS`.

## `assess` / `strategy_impact`

| field_key | kind | stores |
|---|---|---|
| `pmt` | number string | Estimated annual tax savings (PMT) |

## `launch` / `implementation_timeline`

| field_key | kind | stores |
|---|---|---|
| `strategies` | JSON array | One row per strategy. Fields: `__id, name, category, annualSavings, owner, activationMonth ("YYYY-MM"), status, fromEliminate` |
| `seeded_from_eliminate` | bool | Prevents re-seeding from ELIMINATE Keep list after first seed |

## `insulate` / `defensibility_score`

| field_key | kind | stores |
|---|---|---|
| `scores` | JSON object | `{ __id: { docScore: "1..5", cpaConfirmed: "yes"|"partial"|"no" } }` per LAUNCH strategy |

## `target` / `capital_placement`

| field_key | kind | stores |
|---|---|---|
| `total_capital` | money string | Total freed capital (pre-fills from LAUNCH) |
| `liquidity` | money string | Reserve amount |
| `foundation` | money string | Foundation allocation |
| `foundation_yield` | percent string | Expected Foundation yield |
| `swing_return` | percent string | Expected Swing return |
| `lifestyle_threshold` | money string | Annual income the Foundation must produce |

## `yield` / `track_your_freedom`

| field_key | kind | stores |
|---|---|---|
| `program_start_year` | int string | The baseline year (anchor for FV recalibration) |

**Note:** YIELD's annual rows are NOT in `command_center_data`; they live in the separate `freedom_log` table (append-only, per spec).

---

## Adding a new field

1. Add the field inside the appropriate week component using `useField` or `useJSONField`.
2. Add a row to this catalog.
3. If downstream weeks need to read it, document the dependency in the README's Cross-Week Data Dependencies section.
4. No schema migration needed — `command_center_data` is a flat key-value store.

---

## Removing a field (soft delete)

Because `command_center_data` is keyed by `(user_id, week, subtab, field_key)`, orphaned rows from removed fields are harmless — they just sit in the DB, never read. For cleanup:

```sql
delete from command_center_data
where week_slug = 'some_week'
  and field_key in ('deprecated_a', 'deprecated_b');
```

No RLS bypass needed; any admin role can run this.
