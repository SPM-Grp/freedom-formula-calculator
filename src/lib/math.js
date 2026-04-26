// CLEAR Freedom Formula — math solvers and formatters.
// These are the canonical solvers from the v1 calculator, preserved verbatim.
// Do not modify algorithm or convergence tolerances without a regression pass.

// ─── FORMATTERS ─────────────────────────────────────────────────────────────
export const fmt = (n) =>
  !isFinite(n) || n == null
    ? "—"
    : n >= 1e6
    ? `$${(n / 1e6).toFixed(2)}M`
    : `$${Math.round(n).toLocaleString()}`;

export const fmtPlain = (n) =>
  !isFinite(n) || n == null ? "—" : `$${Math.round(n).toLocaleString()}`;

export const fmtPct = (n) =>
  n === null || n === undefined || !isFinite(n) ? "—" : `${(n * 100).toFixed(1)}%`;

export const fmtPctInt = (n) =>
  n === null || n === undefined || !isFinite(n) ? "—" : `${Math.round(n * 100)}%`;

export const parseMoney = (v) => {
  if (v === null || v === undefined || v === "") return 0;
  const parsed = parseFloat(String(v).replace(/[$,\s]/g, ""));
  return isFinite(parsed) ? parsed : 0;
};

// Safely parse a number with a fallback. Unlike `parseFloat(x) || def` this
// respects legitimate 0 values (which the || fallback would silently replace).
export const num = (v, def = 0) => {
  if (v === null || v === undefined || v === "") return def;
  const n = typeof v === "number" ? v : parseFloat(String(v));
  return isFinite(n) ? n : def;
};

// ─── CORE SOLVERS ──────────────────────────────────────────────────────────

// Simple closed-form: r = (FV/PV)^(1/n) − 1
export const solveR = (pv, fv, n) => {
  if (!pv || !fv || !n || pv <= 0 || fv <= 0 || n <= 0) return null;
  const r = Math.pow(fv / pv, 1 / n) - 1;
  return isFinite(r) ? r : null;
};

// Direct FV: FV = PV(1+r)^n + C × [(1+r)^n − 1] / r  (ordinary annuity)
export const calcFVWithContrib = (pv, r, n, contrib) => {
  if (!pv || !n || pv <= 0 || n <= 0) return 0;
  const safeR = r || 0;
  if (Math.abs(safeR) < 1e-10) return pv + (contrib || 0) * n;
  const growth = Math.pow(1 + safeR, n);
  return pv * growth + (contrib || 0) * (growth - 1) / safeR;
};

// Bisection solver for r, given PV, FV, n, and annual contribution C.
// Converges within $1. 100 iterations, bounds [-0.5, 5.0].
export const solveRWithContrib = (pv, fv, n, contrib) => {
  if (!pv || !fv || !n || pv <= 0 || fv <= 0 || n <= 0) return null;
  if (!contrib || contrib <= 0) return solveR(pv, fv, n);

  const calcFV = (r) => {
    if (Math.abs(r) < 1e-10) return pv + contrib * n;
    const growth = Math.pow(1 + r, n);
    return pv * growth + contrib * (growth - 1) / r;
  };

  if (calcFV(0) >= fv) return 0;

  let lo = -0.5, hi = 5.0;
  for (let i = 0; i < 100; i++) {
    const mid = (lo + hi) / 2;
    const val = calcFV(mid);
    if (Math.abs(val - fv) < 1) return mid;
    if (val < fv) lo = mid;
    else hi = mid;
  }
  const result = (lo + hi) / 2;
  return isFinite(result) ? result : null;
};

// Bisection solver for n, given PV, FV, r, and annual contribution C.
export const solveNWithContrib = (pv, fv, r, contrib) => {
  if (!pv || !fv || !r || pv <= 0 || fv <= 0) return null;
  if (!contrib || contrib <= 0) {
    if (r <= 0 || fv <= pv) return null;
    const n = Math.log(fv / pv) / Math.log(1 + r);
    return isFinite(n) && n > 0 ? n : null;
  }

  const calcFV = (n) => {
    if (n <= 0) return pv;
    const growth = Math.pow(1 + r, n);
    return pv * growth + contrib * (growth - 1) / r;
  };

  if (calcFV(0) >= fv) return 0;

  let lo = 0, hi = 100;
  while (calcFV(hi) < fv && hi < 500) hi *= 2;
  if (calcFV(hi) < fv) return null;

  for (let i = 0; i < 100; i++) {
    const mid = (lo + hi) / 2;
    const val = calcFV(mid);
    if (Math.abs(val - fv) < 1) return mid;
    if (val < fv) lo = mid;
    else hi = mid;
  }
  const result = (lo + hi) / 2;
  return isFinite(result) && result > 0 ? result : null;
};

// ─── BREAK-EVEN & VERDICT ─────────────────────────────────────────────────

// break-even = inflation / (1 − effective_tax_rate)
// inflation and effectiveTax are expected as %-as-number (e.g. 3 for 3%, 35 for 35%)
export const breakEven = (inflationPct, effectiveTaxPct) => {
  if (effectiveTaxPct >= 100) return null;
  const inf = (inflationPct || 0) / 100;
  const etr = (effectiveTaxPct || 0) / 100;
  return inf / (1 - etr);
};

// Verdict band for required return r (decimal, e.g. 0.08 = 8%).
export const verdict = (r) => {
  if (r === null || r === undefined || !isFinite(r))
    return { band: "", color: "rgba(255,255,255,0.3)", detail: "" };
  const p = r * 100;
  if (p < 7)
    return {
      band: "Conservative path viable",
      color: "#22c55e",
      detail: "Well-managed conventional investing gets you there. Discipline required — but the path exists.",
    };
  if (p <= 12)
    return {
      band: "Deliberate decisions required",
      color: "#C4A265",
      detail: "Achievable but not automatic. Tax strategies and asset allocation matter significantly.",
    };
  return {
    band: "A lever needs to move",
    color: "#ef4444",
    detail: "Not a failure — information. More capital, more time, different lifestyle, or better vehicles.",
  };
};

// ─── LIFESTYLE → FV MACHINE SIZE ───────────────────────────────────────────

export const LIFESTYLE_BUFFER_PCT = 0.125; // 12.5% — constitutional constant

// Lifestyle inputs are MoneyInput-backed — after onBlur they're stored as
// "$X,XXX" strings. parseMoney strips the $ and commas; plain parseFloat
// returns NaN and collapses the entire Freedom Formula math. Do not regress.
export const annualFromMonthly = (monthlyVals, categoryKeys) =>
  categoryKeys.reduce((s, k) => s + parseMoney(monthlyVals[k]) * 12, 0);

export const lifestyleToFV = ({ monthlyVals, categoryKeys, inflationPct, yieldRate, nYears }) => {
  const subtotal = annualFromMonthly(monthlyVals, categoryKeys);
  const buffer = subtotal * LIFESTYLE_BUFFER_PCT;
  const annualToday = subtotal + buffer;
  const annualFuture = annualToday * Math.pow(1 + (inflationPct || 0) / 100, nYears || 0);
  const fv = yieldRate > 0 ? annualFuture / yieldRate : 0;
  return { subtotal, buffer, annualToday, annualFuture, fv };
};

// ─── DEFENSIBILITY (INSULATE) ─────────────────────────────────────────────

// Audit exposure per strategy: savings × n × (1 − doc/5).
// Multiplied across n years — undocumented positions accumulate risk year over year.
export const auditExposure = ({ annualSavings, nYears, docScore }) => {
  const s = parseFloat(annualSavings) || 0;
  const n = parseFloat(nYears) || 0;
  const d = parseFloat(docScore) || 0;
  return s * n * (1 - d / 5);
};

// Defensibility Score — weighted average across strategies, 0–100.
//
// Per-strategy score:
//   base   = (docScore / 5) × 90                    // cap base at 90 so the
//                                                     // top 10 points require
//                                                     // CPA confirmation
//   cpa    = yes: +10 · partial: +5 · no: 0
//   score  = min(100, base + cpa)
//
// Overall = weighted average of strategy scores, weighted by annual savings.
//
// Bands: 85+ Audit-Ready · 70–84 Strong · 50–69 Functional · <50 Action Required
// (per CLEAR_Calculator_Feature_Spec_v2_0.md).
export const defensibilityScore = (strategies) => {
  const rows = (strategies || []).filter((s) => (parseFloat(s.annualSavings) || 0) > 0);
  if (rows.length === 0) return null;
  const totalWeight = rows.reduce((s, r) => s + (parseFloat(r.annualSavings) || 0), 0);
  if (totalWeight <= 0) return null;

  const weighted = rows.reduce((acc, r) => {
    const doc = Math.max(0, Math.min(5, parseFloat(r.docScore) || 0));
    const cpaBonus = r.cpaConfirmed === "yes" ? 10 : r.cpaConfirmed === "partial" ? 5 : 0;
    const base = (doc / 5) * 90;
    const strategyScore = Math.min(100, base + cpaBonus);
    const weight = (parseFloat(r.annualSavings) || 0) / totalWeight;
    return acc + strategyScore * weight;
  }, 0);
  return Math.round(weighted);
};

export const defensibilityBand = (score) => {
  if (score === null || score === undefined) return { label: "—", color: "#888" };
  if (score >= 85) return { label: "Audit-Ready", color: "#22c55e" };
  if (score >= 70) return { label: "Strong", color: "#C4A265" };
  if (score >= 50) return { label: "Functional", color: "#f59e0b" };
  return { label: "Action Required", color: "#ef4444" };
};

// ─── CAPITAL PLACEMENT (TARGET) ───────────────────────────────────────────

// Blended r = (Foundation$ × FoundationYield + Swing$ × SwingReturn) / (Foundation$ + Swing$)
// (Swing$ = Total − Liquidity − Foundation; Liquidity excluded from deployed base.)
export const blendedReturn = ({
  foundation$, foundationYield, swing$, swingReturn,
}) => {
  const f = parseFloat(foundation$) || 0;
  const fy = parseFloat(foundationYield) || 0;
  const s = parseFloat(swing$) || 0;
  const sy = parseFloat(swingReturn) || 0;
  const deployed = f + s;
  if (deployed <= 0) return null;
  return (f * fy + s * sy) / deployed / 100;
};

export const foundationCoverage = ({ foundation$, foundationYield, lifestyleThreshold }) => {
  const f = parseFloat(foundation$) || 0;
  const fy = parseFloat(foundationYield) || 0;
  const t = parseFloat(lifestyleThreshold) || 0;
  if (t <= 0) return null;
  const income = f * (fy / 100);
  return { income, ratio: income / t };
};

// Time-to-threshold: year at which Foundation income first ≥ lifestyle threshold,
// assuming Foundation grows at its yield plus annual additions from freed capital.
export const timeToThreshold = ({
  foundation$, foundationYield, lifestyleThreshold, annualAddition,
  maxYears = 50,
}) => {
  const fy = (parseFloat(foundationYield) || 0) / 100;
  const t = parseFloat(lifestyleThreshold) || 0;
  let bal = parseFloat(foundation$) || 0;
  if (t <= 0 || fy <= 0) return null;
  for (let y = 0; y <= maxYears; y++) {
    if (bal * fy >= t) return y;
    bal = bal * (1 + fy) + (parseFloat(annualAddition) || 0);
  }
  return null; // Not reached within horizon
};

// ─── YIELD — FV RECALIBRATION ─────────────────────────────────────────────

// FV_adjusted = FV_original × (1 + CPI%)^n_remaining
export const recalibrateFV = ({ fvOriginal, cpiPct, nRemaining }) => {
  const fv = parseFloat(fvOriginal) || 0;
  const cpi = (parseFloat(cpiPct) || 0) / 100;
  const n = parseFloat(nRemaining) || 0;
  return fv * Math.pow(1 + cpi, n);
};
