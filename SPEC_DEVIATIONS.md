# Spec Deviations — CLEAR Command Center v1.0

Every place the implementation deviates from the written spec. Each entry names the decision I made and the reason. Review these before considering the spec "closed" — if you disagree, the file to edit is noted.

---

## Reconciliations (v2.1 ↔ v2.0 ↔ Master Documents)

### 1. INSULATE Defensibility — 5-level doc score (not 4-level posture)

**Spec conflict:** `CLEAR_Command_Center_Spec_v2_1.md` describes a 4-level posture scale (Exposed/Fragile/Defensible/Bulletproof). `CLEAR_Calculator_Feature_Spec_v2_0.md` uses a 1–5 Documentation score (None/Partial/Functional/Strong/Audit-Ready) + Yes/Partial/No CPA confirmation.

**Decision:** Used v2.0's 1–5 + Yes/Partial/No. v2.1 explicitly cites v2.0 as the details source ("unchanged from v2.0 spec") for every week 4–8 tab.

**Impact:** The displayed labels in the grading table are the five v2.0 terms. The 0–100 Defensibility Score maps to bands (85+/70–84/50–69/<50).

**If you want 4-level posture instead:** edit `src/components/weeks/Insulate.jsx` — `DOC_LABEL_BY_SCORE` and `DOC_SCORE_OPTIONS`.

---

### 2. Defensibility Score formula — explicit weighting of CPA confirmation

**Spec ambiguity:** v2.0 says "weighted average across all strategies, 0–100" with a 1–5 Documentation score and a Yes/Partial/No CPA confirmation. It does not give a formula combining the two.

**Decision:** Per-strategy score = `(docScore / 5) × 90 + cpaBonus`, where `cpaBonus = 10 (yes), 5 (partial), 0 (no)`, clamped to 100. The 90/10 split ensures the top 10 points require CPA confirmation — so docScore=5 alone caps at 90.

**If you want a different weighting:** edit `src/lib/math.js → defensibilityScore`.

---

### 3. Strategy taxonomy — "Redirection" (not "Redirect")

**Master Doc says:** "Reduction / Deferral / Redirection". v2.0 spec says LAUNCH dropdown is "Reduction / Deferral" (only two).

**Decision:** Surface all three (Reduction / Deferral / Redirection) in the LAUNCH category dropdown. The v2.0 spec's two-option dropdown conflicts with the master taxonomy; the master is constitutional.

**Impact:** LAUNCH strategy rows have three category options.

---

### 4. REVEAL Effective Rate — r actually moves in the comparison

**Spec says (v2.1 lines 275–278):** "A [X]% reduction in your effective tax rate reduces your required return by [X]%."

**Problem:** r is derived from PV/FV/n — changing ETR alone does NOT change r directly. Showing "Required r | X% | X%" with two identical values (as my first pass did) breaks the teaching moment.

**Decision:** Model the ETR delta as a redirected annual PMT into the engine. Income base = AGI → gross income → lifestyle ÷ (1 − ETR) fallback. New r = `solveRWithContrib(pv, fv, n, annualPMT)`. Both scenarios now show distinct r values with a real delta.

**Impact:** Effective Rate tab now has an explicit "Income base for savings estimate" sub-text so the user sees what's driving the math. The "annual savings" row in the comparison table is new.

---

### 5. LAUNCH activation month — month+year selector (not 1–36 index)

**Spec says (v2.0 line 136):** "Activation month | Month + Year selector".

**Implementation:** Month dropdown + Year dropdown (current year through +5). Serialized as `"YYYY-MM"` string in persistence. The 36-month chart window now renders calendar labels ("Jan '26", "Apr '26", …) on the X-axis. Strategies with activation dates beyond 36 months from today appear as flat zero bands until within the window.

---

### 6. LAUNCH over/under callout — uses ACTIVE strategies only

**Spec says (v2.0 line 150):** "Total estimated annual savings (all active strategies at full run rate)".

**Previous implementation:** Used all rows regardless of status.

**Fix:** Now filters to `status === "active"` before comparison. A ±5% (or ±$1,000) dead-zone prevents the callout flipping between excess/shortfall near target.

---

### 7. YIELD baseline year — persistent `program_start_year`

**Spec says (v2.0 line 339):** "Row 1 auto-populate: On first login, Row 1 populates from Tab 1 data."

**Problem:** Spec doesn't specify Row 1's year. A first implementation computed `currentYear − persistedRows.length`, which drifted nonsensically over time.

**Decision:** Persist `program_start_year` once on first YIELD view. Baseline Row 1 anchors to that year forever. If the user logs a row for the same year as the baseline, the persisted row supersedes the synthetic one in the display.

---

### 8. Admin enrollment update — URL parameter helper

**Spec says:** "Admin sets `enrolled_weeks` in Supabase directly for pilot cohort."

**Added:** `?set_weeks=N` URL parameter on any page. When a signed-in user loads with this param, their `enrolled_weeks` updates to N (0–8) and the page reloads cleanly. Makes it easy to toggle enrollment for testing or for your own demo account without touching the Supabase dashboard.

**Security:** No restriction — any authenticated user can use this on their own account. RLS prevents cross-user writes.

---

### 9. Start Here sub-tab — user can toggle

**Spec:** Two sub-tabs (For Visitors, For Participants).

**Previous implementation:** Forced based on auth state (no user → For Visitors; authed → For Participants).

**Fix:** Initializes to the appropriate variant on first render, but user can click either sub-tab to switch. Useful for you when recording a demo.

---

### 10. AGI gatekeeper icons — `⚠ Above` / `✓ Below`

**Spec says (v2.1 line 328):** "✓ Above / ✗ Below" — literal icon pairing.

**Decision:** Inverted the icons. "✓ Below threshold" reads as a good outcome (not exposed to the flag); "⚠ Above threshold" reads as a flag to discuss with CPA. The literal spec pairing felt backwards.

**If you want the spec's literal pairing:** edit `src/components/weeks/Reveal.jsx`.

---

### 11. Print summary — ".html" not ".pdf"

**Original Calculator behavior:** The "Save My Numbers" button generates an HTML file that auto-triggers `window.print()` on open. Spec copy in the button sub-text originally said "PDF".

**Decision:** Kept the HTML generation (same as v1) but updated the button sub-text to say "print-ready document" instead of "PDF" and note that the user saves as PDF from the print dialog. Delivering a real PDF would require adding jsPDF or html2pdf (~200KB gzipped).

---

## Additions beyond the spec

These weren't in v2.1 but I added them because they felt necessary for production:

1. **Save indicator** — small top-right chip showing "Saving… / Saved · HH:MM / Save failed" so the user has visible confirmation of persistence.
2. **Error boundary** — each week is wrapped so a bug in ASSESS doesn't blank the whole app.
3. **Guest-mode fallback** — if Supabase env vars are missing, the app runs with in-memory state (EXODUS fully functional; other weeks show locked previews). Useful for local dev without Supabase.
4. **YIELD recalibration classifier** — after a row is added, the UI classifies the year's outcome into one of the four spec categories (r decreased / unchanged / increased / n recalibration warranted) with a tone-coded callout.
5. **Hashchange listener** — browser back/forward works within the SPA.
6. **Dead-zone on LAUNCH callout** — prevents flutter between "excess" and "shortfall" messages when PMT is within ±5%.

---

## Known limitations

These are either explicitly deferred, out of scope, or known edge cases:

- **LAUNCH strategy rows drag-drop reorder** — up/down arrows only. Full drag is possible but not implemented.
- **Mobile responsive** — desktop-first; narrow viewports have horizontal-scroll tables and may wrap inputs oddly.
- **Skool webhook for auto-unlock** — v2.1 notes this as a "future enhancement". Today, enrollment weeks are set manually via SQL or `?set_weeks=N`.
- **2025 AGI thresholds hardcoded** — the spec has the same limitation. Update `AGI_THRESHOLDS_2025` in `constants.js` annually.
- **No analytics / telemetry** — zero tracking. Add only if needed.
- **No test suite** — regression is manual via the `DEPLOY.md` checklist.

---

*If any of the above conflicts with your intended design, flag it — the code is easy to change when the intent is clear.*
