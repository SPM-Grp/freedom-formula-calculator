import { useCallback, useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from "recharts";
import {
  LIFESTYLE_CATEGORIES,
  LIFESTYLE_KEYS,
  YIELD_OPTIONS,
} from "../../constants";
import {
  solveR,
  solveRWithContrib,
  solveNWithContrib,
  calcFVWithContrib,
  verdict,
  fmt,
  fmtPct,
  parseMoney,
} from "../../lib/math";
import { colors, alpha, fonts, styles } from "../../lib/theme";
import { useField, useJSONField } from "../../hooks/usePersistence";
import { VerdictCard } from "../ui";
import { generatePrintHTML } from "../../printSummary";

// ─── EXODUS — faithful port from FreedomFormulaCalculator.jsx (v1) ────────
// Every visual element matches the deployed lead magnet at
// https://freedom-formula-calculator.vercel.app. Do not change the UI
// without a lead-magnet-level review.
//
// Only delta from v1: state is persisted via useField/useJSONField and the
// top-level step navigation is handled by the AppShell's sub-tab bar (the
// in-step "EXODUS Step Nav" and Prev/Next buttons from v1 are removed; the
// outer app handles navigation between E/X/O/D/U/S).
// ─── Brand shortcuts (matching the original file) ─────────────────────────
const GOLD   = colors.gold;
const GOLD_L = colors.goldLight;
const DARK   = colors.dark;
const GREEN  = colors.success;
const RED    = colors.danger;

// Inline style primitives copied verbatim from the original file
const card = {
  background: "rgba(255,255,255,0.035)",
  border: "1px solid rgba(196,162,101,0.18)",
  borderRadius: 10,
  padding: "20px 22px",
  marginBottom: 16,
};
const inputS = {
  background: "rgba(0,0,0,0.3)",
  border: "1px solid rgba(196,162,101,0.3)",
  borderRadius: 6,
  color: "#fff",
  fontSize: 15,
  fontWeight: 600,
  padding: "10px 14px",
  width: "100%",
  outline: "none",
  boxSizing: "border-box",
  fontFamily: "Georgia, serif",
};
const lab = {
  color: GOLD_L,
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  marginBottom: 6,
  display: "block",
};
const subT = {
  color: "rgba(255,255,255,0.4)",
  fontSize: 11,
  lineHeight: 1.5,
};

// ─── Timmy — the program's recurring physician character ─────────────────
// $300K W-2, no entity, homeowner, married, two kids. Used as the demo
// persona throughout CLEAR. Loading these numbers shows the whole calculator
// working end-to-end in one click — reducing first-visit overwhelm.
const TIMMY = {
  pv: "250000",
  n: "15",
  inflation: "3",
  yieldRate: "0.07",
  yieldRate2: "0.04",
  effectiveTax: "35",
  vals: {
    housing:   "5000",
    hoa:       "500",
    transport: "1200",
    food:      "1500",
    health:    "800",
    family:    "2500",
    giving:    "500",
    hobbies:   "1500",
    personal:  "1500",
  },
};

// Placeholder examples — realistic ranges for a high-earning professional,
// shown as grey text in empty fields so users see what "typical" looks like.
const PLACEHOLDERS = {
  pv: "e.g. 500,000",
  n:  "15",
  housing:   "e.g. 3,500",
  hoa:       "e.g. 300",
  transport: "e.g. 1,200",
  food:      "e.g. 1,200",
  health:    "e.g. 600",
  family:    "e.g. 2,000",
  giving:    "e.g. 500",
  hobbies:   "e.g. 1,000",
  personal:  "e.g. 800",
};

// Step metadata — used for both the horizontal step nav and the step title block
const STEP_ORDER = ["E", "X", "O", "D", "U", "S"];
const STEP_META = {
  E: { letter: "E", title: "Expose",                sub: "Where you stand today" },
  X: { letter: "X", title: "The Missing Variable",  sub: "Design your dream → find FV" },
  O: { letter: "O", title: "Outpace Erosion",       sub: "What taxes & inflation steal" },
  D: { letter: "D", title: "Decode Your Number",    sub: "r is a verdict, not just a %" },
  U: { letter: "U", title: "Unlock the Levers",     sub: "Move PV, time, lifestyle, contributions" },
  S: { letter: "S", title: "Supercharge",           sub: "Tax mitigation as an r accelerator" },
};

// Comma-formatted number input. Stores the raw numeric string (no commas,
// no $) in state, displays with thousand separators. Shows commas live as
// you type. Designed to drop into existing $-prefix wrappers.
const NumberCommaInput = ({ value, onChange, placeholder, style, min = 0 }) => {
  // Strip anything that's not a digit or decimal
  const clean = (s) => String(s ?? "").replace(/[^\d.]/g, "");

  // Format for display: split on decimal, comma-separate the integer part
  const formatForDisplay = (s) => {
    const cleaned = clean(s);
    if (!cleaned) return "";
    const [intPart, decPart] = cleaned.split(".");
    const withCommas = intPart ? parseInt(intPart, 10).toLocaleString() : "";
    return decPart !== undefined ? `${withCommas}.${decPart}` : withCommas;
  };

  return (
    <input
      type="text"
      inputMode="decimal"
      placeholder={placeholder}
      value={formatForDisplay(value)}
      onChange={(e) => onChange(clean(e.target.value))}
      style={style}
      min={min}
    />
  );
};

// Numbered legend chip — used in Step S to tie chart lines to perspective cards
const LegendChip = ({ num, color, label, sub }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "6px 10px",
      background: "rgba(0,0,0,0.2)",
      borderRadius: 6,
      border: `1px solid ${color}33`,
    }}
  >
    <div
      style={{
        width: 22,
        height: 22,
        borderRadius: "50%",
        background: color + "22",
        border: `1px solid ${color}66`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 11,
        fontWeight: 800,
        color,
        fontFamily: "Georgia, serif",
        flexShrink: 0,
      }}
    >
      {num}
    </div>
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color, letterSpacing: "0.03em" }}>{label}</div>
      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", lineHeight: 1.3 }}>{sub}</div>
    </div>
  </div>
);

// Reusable slider component (verbatim from original)
const Slider = ({ label, value, onChange, min, max, step, display, sub }) => (
  <div style={{ marginBottom: 18 }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
      <div>
        <span style={{ color: GOLD_L, fontSize: 12, fontWeight: 700, letterSpacing: "0.04em" }}>{label}</span>
        {sub && <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 1 }}>{sub}</div>}
      </div>
      <span style={{ color: "#fff", fontSize: 15, fontWeight: 700, fontFamily: "Georgia, serif" }}>{display}</span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      style={{ width: "100%", accentColor: GOLD, cursor: "pointer", height: 6 }}
    />
  </div>
);

// ──────────────────────────────────────────────────────────────────────────
// Main Exodus container
// ──────────────────────────────────────────────────────────────────────────
export const Exodus = ({ activeSub, setActiveSub }) => {
  const activeIdx = Math.max(0, STEP_ORDER.indexOf(activeSub || "E"));
  const goTo = (idx) => {
    const clamped = Math.max(0, Math.min(STEP_ORDER.length - 1, idx));
    if (setActiveSub) setActiveSub(STEP_ORDER[clamped]);
  };
  // ─── Shared state (persisted) ───────────────────────────────────────────
  const [pv, setPv]                       = useField("exodus", "root", "pv", "");
  const [n, setN]                         = useField("exodus", "root", "n", "10");
  const [inflation, setInflation]         = useField("exodus", "root", "inflation", "3");
  const [yieldRate, setYieldRate]         = useField("exodus", "root", "yield_rate", "0.07");
  const [yieldRate2, setYieldRate2]       = useField("exodus", "root", "yield_rate_2", "0.04");
  const [showCompareStr, setShowCompareStr] = useField("exodus", "root", "show_compare", "false");
  const [effectiveTaxStr, setEffectiveTaxStr] = useField("exodus", "root", "effective_tax_rate", "35");
  const [vals, setVals]                   = useJSONField("exodus", "root", "lifestyle_vals",
    Object.fromEntries(LIFESTYLE_KEYS.map((k) => [k, ""])));

  // Step U levers (persisted so "what-ifs" survive tab switch)
  const [pvMultStr, setPvMultStr]   = useField("exodus", "u", "pv_mult",   "1");
  const [lifeMultStr, setLifeMultStr] = useField("exodus", "u", "life_mult", "1");
  const [nAdjStr, setNAdjStr]       = useField("exodus", "u", "n_adj",     "0");
  const [contribStr, setContribStr] = useField("exodus", "u", "contrib",   "0");

  // Step S Supercharge slider
  const [taxSavedStr, setTaxSavedStr] = useField("exodus", "s", "tax_saved", "0");

  // Unwrap strings → numbers / bools
  const effectiveTax = parseFloat(effectiveTaxStr) || 0;
  const setEffectiveTax = (v) => setEffectiveTaxStr(String(v));
  const showCompare = showCompareStr === "true";
  const setShowCompare = (b) => setShowCompareStr(b ? "true" : "false");
  const pvMult   = parseFloat(pvMultStr) || 1;
  const lifeMult = parseFloat(lifeMultStr) || 1;
  const nAdj     = parseFloat(nAdjStr) || 0;
  const contrib  = parseFloat(contribStr) || 0;
  const taxSaved = parseFloat(taxSavedStr) || 0;

  // ─── Derived values (single source of truth) ────────────────────────────
  const nVal    = parseFloat(n) || 10;
  const infVal  = (parseFloat(inflation) || 0) / 100;
  const yVal    = parseFloat(yieldRate) || 0.07;
  const subtotal = LIFESTYLE_KEYS.reduce((s, k) => s + parseMoney(vals[k]) * 12, 0);
  const buffer = subtotal * 0.125;
  const annualToday = subtotal + buffer;
  const annualFuture = annualToday * Math.pow(1 + infVal, nVal);
  const fv = yVal > 0 ? annualFuture / yVal : 0;
  const pvVal = parseMoney(pv);
  const r1 = solveR(pvVal, fv, nVal);
  const breakEven = effectiveTax < 100 ? infVal / (1 - effectiveTax / 100) : null;

  // Sample/reset handlers
  const loadSample = useCallback(() => {
    setPv(TIMMY.pv);
    setN(TIMMY.n);
    setInflation(TIMMY.inflation);
    setYieldRate(TIMMY.yieldRate);
    setYieldRate2(TIMMY.yieldRate2);
    setEffectiveTaxStr(TIMMY.effectiveTax);
    setVals(TIMMY.vals);
  }, [setPv, setN, setInflation, setYieldRate, setYieldRate2, setEffectiveTaxStr, setVals]);

  const resetAll = useCallback(() => {
    if (!window.confirm("Reset all EXODUS numbers to empty? This can't be undone.")) return;
    setPv("");
    setN("10");
    setInflation("3");
    setYieldRate("0.07");
    setYieldRate2("0.04");
    setEffectiveTaxStr("35");
    setVals(Object.fromEntries(LIFESTYLE_KEYS.map((k) => [k, ""])));
    setPvMultStr("1");
    setLifeMultStr("1");
    setNAdjStr("0");
    setContribStr("0");
    setTaxSavedStr("0");
  }, [setPv, setN, setInflation, setYieldRate, setYieldRate2, setEffectiveTaxStr, setVals,
      setPvMultStr, setLifeMultStr, setNAdjStr, setContribStr, setTaxSavedStr]);

  // First-visit banner — only when truly no data entered anywhere
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const isFullyEmpty = !pv && subtotal === 0 && taxSaved === 0;
  const showBanner = isFullyEmpty && !bannerDismissed;

  // Print handler
  const canPrint = pvVal > 0 && fv > 0;
  const handlePrint = useCallback(() => {
    const html = generatePrintHTML({
      pv, n, vals, inflation, yieldRate, effectiveTax,
      annualToday, annualFuture, fv, r1, breakEven,
    });
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Freedom-Formula-${new Date().toISOString().slice(0, 10)}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [pv, n, vals, inflation, yieldRate, effectiveTax, annualToday, annualFuture, fv, r1, breakEven]);

  const meta = STEP_META[activeSub] || STEP_META.E;

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      {/* Top bar — Freedom Formula formula + Save My Numbers (faithful to v1 header) */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 18,
          paddingBottom: 14,
          borderBottom: "1px solid rgba(196,162,101,0.18)",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <div style={{ fontSize: 10, letterSpacing: "0.15em", color: GOLD, fontWeight: 700, marginBottom: 4 }}>
            THE EXODUS METHOD · WEEK 1
          </div>
          <div style={{ fontFamily: "Georgia, serif", fontSize: 22, color: "#fff", fontWeight: 700 }}>
            Freedom Formula Calculator
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <button
            onClick={loadSample}
            title="Fill all steps with Timmy's numbers — the program's recurring physician character"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(196,162,101,0.3)",
              borderRadius: 6,
              color: GOLD_L,
              cursor: "pointer",
              padding: "8px 14px",
              fontSize: 12,
              fontWeight: 700,
              fontFamily: "inherit",
              letterSpacing: "0.04em",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = "rgba(196,162,101,0.12)";
              e.currentTarget.style.borderColor = GOLD;
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.06)";
              e.currentTarget.style.borderColor = "rgba(196,162,101,0.3)";
            }}
          >
            🧪 Try Sample Numbers
          </button>
          <button
            onClick={resetAll}
            title="Clear all EXODUS inputs"
            style={{
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 6,
              color: "rgba(255,255,255,0.5)",
              cursor: "pointer",
              padding: "8px 14px",
              fontSize: 12,
              fontWeight: 600,
              fontFamily: "inherit",
            }}
          >
            Reset
          </button>
          {canPrint && (
            <button
              onClick={handlePrint}
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(196,162,101,0.3)",
                borderRadius: 6,
                color: GOLD_L,
                cursor: "pointer",
                padding: "8px 14px",
                fontSize: 12,
                fontWeight: 700,
                fontFamily: "inherit",
                letterSpacing: "0.04em",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span style={{ fontSize: 14 }}>📄</span> Save My Numbers
            </button>
          )}
        </div>
      </div>

      {/* First-visit hint banner — only when truly empty */}
      {showBanner && (
        <div
          style={{
            background: "rgba(196,162,101,0.08)",
            border: `1px solid ${GOLD}55`,
            borderRadius: 10,
            padding: "14px 18px",
            marginBottom: 16,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 32, height: 32, borderRadius: "50%",
                background: GOLD + "22",
                border: `1px solid ${GOLD}66`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 16,
                flexShrink: 0,
              }}
            >
              👋
            </div>
            <div>
              <div style={{ color: GOLD_L, fontSize: 13, fontWeight: 700, marginBottom: 2 }}>
                First time here?
              </div>
              <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 12, lineHeight: 1.5 }}>
                Six steps. Ten minutes. The fastest way to see how it works is to load sample numbers, walk through the flow, then replace them with yours.
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => { loadSample(); setBannerDismissed(true); }}
              style={{
                background: GOLD,
                color: DARK,
                border: "none",
                borderRadius: 6,
                padding: "9px 18px",
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: "0.04em",
                fontFamily: "inherit",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              Load Sample →
            </button>
            <button
              onClick={() => setBannerDismissed(true)}
              style={{
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "rgba(255,255,255,0.4)",
                borderRadius: 6,
                padding: "9px 14px",
                fontSize: 12,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Disclaimer strip */}
      <div style={{ padding: "0 0 12px", marginBottom: 12, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
          Educational framework only. Not financial advice. Teaching ≠ Prescription. Your CPA validates. You decide.
        </span>
      </div>

      {/* Horizontal Step Nav — faithful to original v1 calculator */}
      <div
        style={{
          background: "rgba(0,0,0,0.2)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          padding: "0 0",
          overflowX: "auto",
          marginBottom: 24,
        }}
      >
        <div style={{ display: "flex", gap: 0, minWidth: "min-content" }}>
          {STEP_ORDER.map((letter, i) => {
            const meta = STEP_META[letter];
            const active = i === activeIdx;
            const done = i < activeIdx;
            return (
              <button
                key={letter}
                onClick={() => goTo(i)}
                style={{
                  background: "none",
                  border: "none",
                  borderBottom: active ? `3px solid ${GOLD}` : "3px solid transparent",
                  cursor: "pointer",
                  padding: "12px 16px 10px",
                  transition: "all 0.15s",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  opacity: active ? 1 : done ? 0.8 : 0.45,
                  whiteSpace: "nowrap",
                  fontFamily: "inherit",
                }}
              >
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    fontSize: 14,
                    fontWeight: 800,
                    fontFamily: "Georgia, serif",
                    flexShrink: 0,
                    background: active ? GOLD : done ? "rgba(196,162,101,0.2)" : "rgba(255,255,255,0.06)",
                    color: active ? DARK : done ? GOLD : "rgba(255,255,255,0.5)",
                    border: active ? "none" : done ? `1px solid ${GOLD}55` : "1px solid rgba(255,255,255,0.1)",
                  }}
                >
                  {done ? "✓" : letter}
                </span>
                <div style={{ textAlign: "left" }}>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: active ? 700 : 500,
                      color: active ? GOLD : done ? GOLD_L : "rgba(255,255,255,0.5)",
                    }}
                  >
                    {meta.title}
                  </div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{meta.sub}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step title (letter circle + title + sub) */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: GOLD,
              fontSize: 18,
              fontWeight: 800,
              color: DARK,
              fontFamily: "Georgia, serif",
            }}
          >
            {meta.letter}
          </span>
          <div>
            <div style={{ fontFamily: "Georgia, serif", fontSize: 20, fontWeight: 700, color: "#fff" }}>
              {meta.title}
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>{meta.sub}</div>
          </div>
        </div>
      </div>

      {/* Step content */}
      {activeSub === "E" && <StepE pv={pv} setPv={setPv} n={n} setN={setN} />}
      {activeSub === "X" && (
        <StepX
          vals={vals}
          setVals={setVals}
          inflation={inflation}
          setInflation={setInflation}
          n={n}
          yieldRate={yieldRate}
          setYieldRate={setYieldRate}
        />
      )}
      {activeSub === "O" && (
        <StepO
          inflation={inflation}
          effectiveTax={effectiveTax}
          setEffectiveTax={setEffectiveTax}
          annualToday={annualToday}
          annualFuture={annualFuture}
          n={n}
        />
      )}
      {activeSub === "D" && (
        <StepD
          pv={pv}
          n={n}
          fv={fv}
          yieldRate={yieldRate}
          inflation={inflation}
          effectiveTax={effectiveTax}
          yieldRate2={yieldRate2}
          setYieldRate2={setYieldRate2}
          showCompare={showCompare}
          setShowCompare={setShowCompare}
        />
      )}
      {activeSub === "U" && (
        <StepU
          annualToday={annualToday}
          fv={fv}
          pvBase={pvVal}
          nBase={nVal}
          infBase={infVal}
          yBase={yVal}
          pvMult={pvMult}
          setPvMult={(v) => setPvMultStr(String(v))}
          lifeMult={lifeMult}
          setLifeMult={(v) => setLifeMultStr(String(v))}
          nAdj={nAdj}
          setNAdj={(v) => setNAdjStr(String(v))}
          contrib={contrib}
          setContrib={(v) => setContribStr(String(v))}
        />
      )}
      {activeSub === "S" && (
        <StepS
          fv={fv}
          pvBase={pvVal}
          nBase={nVal}
          r1={r1}
          taxSaved={taxSaved}
          setTaxSaved={(v) => setTaxSavedStr(String(v))}
        />
      )}

      {/* Prev / Next — faithful to original v1 calculator */}
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 28, gap: 12 }}>
        {activeIdx > 0 ? (
          <button
            onClick={() => goTo(activeIdx - 1)}
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 8,
              color: "rgba(255,255,255,0.6)",
              cursor: "pointer",
              padding: "12px 24px",
              fontSize: 13,
              fontWeight: 600,
              fontFamily: "inherit",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.1)";
              e.currentTarget.style.color = "rgba(255,255,255,0.85)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.06)";
              e.currentTarget.style.color = "rgba(255,255,255,0.6)";
            }}
          >
            ← {STEP_ORDER[activeIdx - 1]}: {STEP_META[STEP_ORDER[activeIdx - 1]].title}
          </button>
        ) : (
          <div />
        )}
        {activeIdx < STEP_ORDER.length - 1 ? (
          <button
            onClick={() => goTo(activeIdx + 1)}
            style={{
              background: GOLD,
              border: `1px solid ${GOLD}`,
              borderRadius: 8,
              color: DARK,
              cursor: "pointer",
              padding: "12px 24px",
              fontSize: 13,
              fontWeight: 700,
              fontFamily: "inherit",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = GOLD_L;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = GOLD;
            }}
          >
            {STEP_ORDER[activeIdx + 1]}: {STEP_META[STEP_ORDER[activeIdx + 1]].title} →
          </button>
        ) : (
          <div
            style={{
              padding: "12px 20px",
              background: "rgba(196,162,101,0.1)",
              borderRadius: 8,
              border: `1px solid ${GOLD}33`,
            }}
          >
            <span style={{ fontSize: 13, color: GOLD_L, fontWeight: 600 }}>
              ✓ EXODUS Complete — Week 2 begins
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── STEP E: EXPOSE ───────────────────────────────────────────────────────
const StepE = ({ pv, setPv, n, setN }) => {
  const [whatCountsOpen, setWhatCountsOpen] = useState(false);
  return (
  <div>
    <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 14, lineHeight: 1.7, margin: "0 0 24px" }}>
      Before you can calculate where you need to go, you have to face where you are.{" "}
      <span style={{ color: GOLD_L, fontStyle: "italic" }}>Clarity starts with honesty.</span>
    </p>

    <div style={card}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8 }}>
        <span style={lab}>Present Value (PV) — Your deployable capital today</span>
        <button
          onClick={() => setWhatCountsOpen((s) => !s)}
          style={{
            background: "transparent",
            border: "none",
            color: GOLD_L,
            fontSize: 11,
            cursor: "pointer",
            fontFamily: "inherit",
            textDecoration: "underline",
            textUnderlineOffset: 3,
          }}
        >
          ℹ What counts?
        </button>
      </div>
      <div style={{ ...subT, marginBottom: 10 }}>
        Investable assets after emergency reserve. Not your home equity unless you plan to sell. Not your total net worth — your <em>deployable</em> capital.
      </div>
      {whatCountsOpen && (
        <div
          style={{
            background: "rgba(0,0,0,0.25)",
            border: "1px solid rgba(196,162,101,0.2)",
            borderRadius: 6,
            padding: "12px 14px",
            marginBottom: 12,
            fontSize: 12,
            lineHeight: 1.6,
            color: "rgba(255,255,255,0.65)",
          }}
        >
          <div style={{ marginBottom: 6 }}>
            <strong style={{ color: GREEN }}>Include:</strong> 401(k), IRA, Roth, brokerage,
            taxable investments, crypto, cash savings above emergency fund, investment real estate equity, business ownership value (if sellable).
          </div>
          <div>
            <strong style={{ color: RED }}>Exclude:</strong> primary home equity (unless you'd sell),
            vehicles, personal belongings, emergency reserve, expected inheritance (until received).
          </div>
        </div>
      )}
      <div style={{ position: "relative", maxWidth: 360 }}>
        <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: GOLD_L, fontSize: 14, fontWeight: 600 }}>$</span>
        <NumberCommaInput
          value={pv}
          onChange={setPv}
          placeholder={PLACEHOLDERS.pv}
          style={{ ...inputS, paddingLeft: 26 }}
        />
      </div>
    </div>

    <div style={card}>
      <span style={lab}>Timeline (n) — When does work become optional?</span>
      <div style={{ ...subT, marginBottom: 10 }}>
        Not when you "want" to retire — when you need this to be real. Pick the number that feels honest.
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))", gap: 8 }}>
        {[5, 10, 15, 20, 25, 30].map((v) => {
          const active = parseInt(n, 10) === v;
          return (
            <button
              key={v}
              onClick={() => setN(String(v))}
              style={{
                background: active ? GOLD : "rgba(255,255,255,0.04)",
                border: `1px solid ${active ? GOLD : "rgba(255,255,255,0.12)"}`,
                borderRadius: 6,
                color: active ? DARK : "rgba(255,255,255,0.65)",
                cursor: "pointer",
                padding: "12px 8px",
                fontSize: 16,
                fontFamily: "Georgia, serif",
                fontWeight: active ? 800 : 400,
                transition: "all 0.15s",
              }}
            >
              {v}<span style={{ fontSize: 11, opacity: 0.7 }}> yrs</span>
            </button>
          );
        })}
      </div>
    </div>

    {parseFloat(pv) > 0 && parseInt(n, 10) > 0 && (
      <div style={{ ...card, borderColor: GOLD + "33", background: "rgba(196,162,101,0.05)", textAlign: "center", padding: 28 }}>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", letterSpacing: "0.08em", marginBottom: 8 }}>
          YOUR STARTING POSITION
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 40, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 32, fontWeight: 800, color: GOLD, fontFamily: "Georgia, serif" }}>
              {fmt(parseFloat(pv))}
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>deployable capital</div>
          </div>
          <div>
            <div style={{ fontSize: 32, fontWeight: 800, color: "#fff", fontFamily: "Georgia, serif" }}>
              {n} years
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>to make work optional</div>
          </div>
        </div>
        <div style={{ marginTop: 16, fontSize: 13, color: "rgba(255,255,255,0.45)", lineHeight: 1.6 }}>
          Now the question: what does the machine you're building <em>for</em> actually need to produce?
        </div>
      </div>
    )}
  </div>
  );
};

// ─── STEP X: THE MISSING VARIABLE ─────────────────────────────────────────
const StepX = ({ vals, setVals, inflation, setInflation, n, yieldRate, setYieldRate }) => {
  const set = (k) => (e) => setVals({ ...vals, [k]: e.target.value });
  const nVal = parseFloat(n) || 10;
  const infVal = (parseFloat(inflation) || 0) / 100;
  const subtotal = LIFESTYLE_KEYS.reduce((s, k) => s + parseMoney(vals[k]) * 12, 0);
  const buffer = subtotal * 0.125;
  const annualToday = subtotal + buffer;
  const annualFuture = annualToday * Math.pow(1 + infVal, nVal);
  const yVal = parseFloat(yieldRate) || 0.07;
  const fv = yVal > 0 ? annualFuture / yVal : 0;

  return (
    <div>
      <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 14, lineHeight: 1.7, margin: "0 0 24px" }}>
        Design the life you've been deferring — not your current life extended.{" "}
        <span style={{ color: GOLD_L, fontStyle: "italic" }}>This is your permission to be honest about what you actually want.</span>
      </p>

      <div style={{ ...card, borderColor: GOLD + "33" }}>
        <div style={{ fontSize: 11, letterSpacing: "0.1em", color: GOLD, fontWeight: 700, marginBottom: 6 }}>
          MONTHLY LIFESTYLE — 9 CATEGORIES
        </div>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 12, margin: "0 0 18px", lineHeight: 1.6 }}>
          Enter monthly amounts. <strong style={{ color: GOLD_L }}>A blank is not zero — a blank is a number you didn't face yet.</strong>
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 14 }}>
          {LIFESTYLE_CATEGORIES.map((cat) => (
            <div key={cat.key}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 18 }}>{cat.icon}</span>
                <span style={lab}>{cat.label}</span>
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginBottom: 6, lineHeight: 1.5, paddingLeft: 26 }}>
                {cat.sub}
              </div>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: GOLD_L, fontSize: 14 }}>$</span>
                <NumberCommaInput
                  value={vals[cat.key] || ""}
                  onChange={(v) => setVals({ ...vals, [cat.key]: v })}
                  placeholder={PLACEHOLDERS[cat.key] || "0"}
                  style={{ ...inputS, paddingLeft: 26 }}
                />
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            marginTop: 20,
            padding: "14px 18px",
            background: "rgba(196,162,101,0.07)",
            borderRadius: 8,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          <div>
            <div style={{ color: GOLD_L, fontSize: 11, fontWeight: 700, letterSpacing: "0.06em" }}>
              ANNUAL COST (TODAY) + 12.5% BUFFER
            </div>
            <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, marginTop: 2 }}>
              Buffer covers what you forgot or haven't faced yet
            </div>
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: GOLD, fontFamily: "Georgia, serif" }}>
            {fmt(annualToday)}
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>/yr</span>
          </div>
        </div>
      </div>

      <div style={card}>
        <Slider
          label="Assumed Inflation"
          value={parseFloat(inflation) || 3}
          onChange={(v) => setInflation(String(v))}
          min={1}
          max={6}
          step={0.5}
          display={`${inflation}%`}
          sub="Default 3% — adjust to your outlook"
        />
      </div>

      <div style={card}>
        <span style={lab}>Yield Rate — how your machine produces income once built</span>
        <div style={{ ...subT, marginBottom: 12 }}>
          Framework, not prescription. Your risk tolerance determines the right range.
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 8 }}>
          {YIELD_OPTIONS.map((opt) => {
            const active = parseFloat(yieldRate) === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setYieldRate(String(opt.value))}
                style={{
                  background: active ? GOLD : "rgba(255,255,255,0.04)",
                  border: `1px solid ${active ? GOLD : "rgba(255,255,255,0.12)"}`,
                  borderRadius: 6,
                  color: active ? DARK : "rgba(255,255,255,0.65)",
                  cursor: "pointer",
                  padding: "10px 12px",
                  textAlign: "left",
                  fontSize: 12,
                  fontWeight: active ? 700 : 400,
                  transition: "all 0.15s",
                  fontFamily: "inherit",
                }}
              >
                <div style={{ fontWeight: 700, marginBottom: 1 }}>{opt.label} — {opt.cat}</div>
                <div style={{ fontSize: 10, opacity: 0.7 }}>{opt.desc}</div>
              </button>
            );
          })}
        </div>
        <div style={{ marginTop: 12, padding: "10px 14px", background: "rgba(0,0,0,0.2)", borderRadius: 6 }}>
          <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>
            Machine income is <span style={{ color: GOLD_L, fontWeight: 700 }}>pre-tax</span> · Step O covers what inflation and taxes do to your real return
          </span>
        </div>
      </div>

      {fv > 0 && (
        <div style={{ ...card, borderColor: GOLD + "55", background: "rgba(196,162,101,0.06)", textAlign: "center", padding: 28 }}>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", letterSpacing: "0.08em", marginBottom: 6 }}>
            THE MISSING VARIABLE — YOUR MACHINE SIZE
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
              gap: 16,
              marginBottom: 20,
              textAlign: "center",
            }}
          >
            <div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", letterSpacing: "0.06em" }}>Annual (Today)</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: GOLD_L, fontFamily: "Georgia, serif" }}>{fmt(annualToday)}</div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", letterSpacing: "0.06em" }}>Inflation-Adjusted ({nVal}yr)</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: GOLD_L, fontFamily: "Georgia, serif" }}>{fmt(annualFuture)}</div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", letterSpacing: "0.06em" }}>Yield Rate</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: GOLD_L, fontFamily: "Georgia, serif" }}>
                {(yVal * 100).toFixed(0)}%
              </div>
            </div>
          </div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", letterSpacing: "0.1em", marginBottom: 8 }}>
            FV — SIZE OF THE MACHINE
          </div>
          <div style={{ fontSize: 48, fontWeight: 900, color: GOLD, fontFamily: "Georgia, serif", lineHeight: 1 }}>
            {fmt(fv)}
          </div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginTop: 10 }}>
            This is the wealth engine that sustains your dream indefinitely.
          </div>
        </div>
      )}
    </div>
  );
};

// ─── STEP O: OUTPACE EROSION ──────────────────────────────────────────────
const StepO = ({ inflation, effectiveTax, setEffectiveTax, annualToday, annualFuture, n }) => {
  const infVal = (parseFloat(inflation) || 0) / 100;
  const breakEven = effectiveTax < 100 ? infVal / (1 - effectiveTax / 100) : null;
  const purchasingPowerLoss = annualToday > 0 ? annualFuture - annualToday : 0;

  return (
    <div>
      <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 14, lineHeight: 1.7, margin: "0 0 24px" }}>
        Your machine has two silent enemies: <span style={{ color: RED, fontWeight: 700 }}>inflation</span> and{" "}
        <span style={{ color: RED, fontWeight: 700 }}>taxes</span>. Before you celebrate any return, you need to know the number that means you're merely treading water.
      </p>

      {annualToday > 0 && (
        <div style={{ ...card, borderColor: "rgba(239,68,68,0.2)", background: "rgba(239,68,68,0.04)" }}>
          <div style={{ fontSize: 10, letterSpacing: "0.1em", color: RED, fontWeight: 700, marginBottom: 12 }}>
            INFLATION'S SILENT TAX
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: 20,
              flexWrap: "wrap",
              marginBottom: 16,
            }}
          >
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", letterSpacing: "0.06em" }}>YOUR DREAM TODAY</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#fff", fontFamily: "Georgia, serif" }}>
                {fmt(annualToday)}/yr
              </div>
            </div>
            <div style={{ fontSize: 24, color: RED }}>→</div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", letterSpacing: "0.06em" }}>
                SAME LIFE IN {parseInt(n, 10)} YEARS
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: RED, fontFamily: "Georgia, serif" }}>
                {fmt(annualFuture)}/yr
              </div>
            </div>
          </div>
          <div style={{ textAlign: "center", fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>
            Inflation costs you <span style={{ color: RED, fontWeight: 700 }}>{fmt(purchasingPowerLoss)}/yr</span> in purchasing power — and you haven't spent a dime more. The same groceries, the same rent, the same life. Just more expensive.
          </div>
        </div>
      )}

      <div style={{ ...card, borderColor: "rgba(239,68,68,0.2)", background: "rgba(239,68,68,0.04)" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div style={{ flex: 1, minWidth: 220 }}>
            <div style={{ fontSize: 10, letterSpacing: "0.1em", color: RED, fontWeight: 700, marginBottom: 8 }}>
              BREAK-EVEN RETURN
            </div>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, margin: "0 0 16px", lineHeight: 1.6 }}>
              The minimum return needed just to maintain purchasing power after taxes and inflation.{" "}
              <span style={{ color: GOLD_L }}>Below this line, your wealth is eroding even if the account balance grows.</span>
            </p>
            <Slider
              label="Your Effective Tax Rate"
              value={effectiveTax}
              onChange={setEffectiveTax}
              min={10}
              max={55}
              step={1}
              display={`${effectiveTax}%`}
              sub="If unsure, start with 30-35% for high earners"
            />
            <div style={{ marginTop: 8, padding: "12px 16px", background: "rgba(0,0,0,0.2)", borderRadius: 6 }}>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", fontFamily: "Georgia, serif" }}>
                {inflation}% inflation ÷ (1 − {effectiveTax}% tax) ={" "}
                <span style={{ color: RED, fontWeight: 700, fontSize: 16 }}>
                  {breakEven !== null ? fmtPct(breakEven) : "—"}
                </span>
              </div>
            </div>
          </div>
          <div
            style={{
              textAlign: "center",
              padding: "20px 28px",
              background: "rgba(0,0,0,0.25)",
              borderRadius: 10,
              minWidth: 130,
              flexShrink: 0,
            }}
          >
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", color: "rgba(255,255,255,0.35)", marginBottom: 6 }}>
              BREAK-EVEN
            </div>
            <div style={{ fontSize: 44, fontWeight: 900, color: RED, fontFamily: "Georgia, serif", lineHeight: 1 }}>
              {breakEven !== null ? fmtPct(breakEven) : "—"}
            </div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 8 }}>treading water line</div>
          </div>
        </div>
      </div>

      <div style={{ ...card, background: "rgba(0,0,0,0.2)", padding: 20 }}>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, margin: 0, lineHeight: 1.7 }}>
          <strong style={{ color: GOLD_L }}>Why this matters:</strong> A 6% return sounds great — until you realize inflation takes 3% and taxes take another 30% of the rest. Your <em>real</em> return is what's left after both. That's why Step D matters: your required return (r) has to beat this number, not just exist above zero.
        </p>
      </div>
    </div>
  );
};

// ─── STEP D: DECODE YOUR NUMBER ───────────────────────────────────────────
const StepD = ({ pv, n, fv, yieldRate, inflation, effectiveTax, yieldRate2, setYieldRate2, showCompare, setShowCompare }) => {
  const pvVal = parseMoney(pv);
  const nVal = parseFloat(n) || 10;
  const yVal1 = parseFloat(yieldRate) || 0.07;
  const yVal2 = parseFloat(yieldRate2) || 0.04;
  const infVal = (parseFloat(inflation) || 0) / 100;

  const r1 = solveR(pvVal, fv, nVal);
  const fv2 = yVal2 > 0 ? fv * (yVal1 / yVal2) : 0;
  const r2 = solveR(pvVal, fv2, nVal);

  const breakEven = effectiveTax < 100 ? infVal / (1 - effectiveTax / 100) : null;

  if (!pvVal || !fv || fv <= 0) {
    return (
      <div style={{ ...card, textAlign: "center", padding: 40 }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🔢</div>
        <div style={{ color: GOLD_L, fontSize: 16, fontWeight: 700, marginBottom: 8 }}>
          Complete Steps E and X first
        </div>
        <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 13 }}>
          You need a PV (Step E) and an FV (Step X) before r can be calculated.
        </div>
      </div>
    );
  }

  return (
    <div>
      <div
        style={{
          textAlign: "center",
          padding: "0 0 8px",
          color: "rgba(255,255,255,0.35)",
          fontSize: 12,
          letterSpacing: "0.06em",
        }}
      >
        r IS NOT JUST A PERCENTAGE — r IS A VERDICT
      </div>

      <VerdictCard r={r1} />

      {breakEven !== null && r1 !== null && (
        <div style={{ textAlign: "center", padding: "16px 0 8px", fontSize: 13, color: "rgba(255,255,255,0.45)" }}>
          Your break-even is <span style={{ color: RED, fontWeight: 700 }}>{fmtPct(breakEven)}</span>.
          {r1 > breakEven ? (
            <span> Your r of <span style={{ color: verdict(r1).color, fontWeight: 700 }}>{fmtPct(r1)}</span> clears it — but how comfortably?</span>
          ) : (
            <span> Your r of <span style={{ color: RED, fontWeight: 700 }}>{fmtPct(r1)}</span> doesn't even clear break-even. A lever needs to move.</span>
          )}
        </div>
      )}

      <div style={{ ...card, marginTop: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 14 }}>
          {[
            { lbl: "PV (Start)",   val: fmt(pvVal),       clr: "#fff" },
            { lbl: "FV (Machine)", val: fmt(fv),          clr: GOLD },
            { lbl: "Gap",          val: fmt(fv - pvVal),  clr: GOLD_L },
            { lbl: "Timeline",     val: nVal + " yrs",    clr: "#fff" },
            { lbl: "Required r",   val: fmtPct(r1),       clr: verdict(r1).color },
          ].map((item) => (
            <div key={item.lbl} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", letterSpacing: "0.06em", marginBottom: 2 }}>
                {item.lbl}
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: item.clr, fontFamily: "Georgia, serif" }}>
                {item.val}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={card}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: showCompare ? 16 : 0,
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          <div>
            <span style={lab}>Compare a second scenario?</span>
            <div style={subT}>See how a different yield rate changes r</div>
          </div>
          <button
            onClick={() => setShowCompare(!showCompare)}
            style={{
              background: showCompare ? GOLD : "rgba(255,255,255,0.06)",
              border: `1px solid ${showCompare ? GOLD : "rgba(255,255,255,0.15)"}`,
              borderRadius: 6,
              color: showCompare ? DARK : "rgba(255,255,255,0.6)",
              cursor: "pointer",
              padding: "8px 16px",
              fontSize: 12,
              fontWeight: 700,
              fontFamily: "inherit",
              transition: "all 0.15s",
            }}
          >
            {showCompare ? "✓ COMPARING" : "ADD SCENARIO B"}
          </button>
        </div>

        {showCompare && (
          <div>
            <div style={{ fontSize: 10, color: GREEN, fontWeight: 700, letterSpacing: "0.08em", marginBottom: 8 }}>
              SCENARIO B — SELECT YIELD
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 8 }}>
              {YIELD_OPTIONS.map((opt) => {
                const active = parseFloat(yieldRate2) === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setYieldRate2(String(opt.value))}
                    style={{
                      background: active ? GREEN : "rgba(255,255,255,0.04)",
                      border: `1px solid ${active ? GREEN : "rgba(255,255,255,0.12)"}`,
                      borderRadius: 6,
                      color: active ? DARK : "rgba(255,255,255,0.65)",
                      cursor: "pointer",
                      padding: "10px 12px",
                      textAlign: "left",
                      fontSize: 12,
                      fontWeight: active ? 700 : 400,
                      fontFamily: "inherit",
                    }}
                  >
                    <div style={{ fontWeight: 700 }}>{opt.label} — {opt.cat}</div>
                    <div style={{ fontSize: 10, opacity: 0.7 }}>{opt.desc}</div>
                  </button>
                );
              })}
            </div>

            {r2 !== null && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 16 }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", color: GOLD, marginBottom: 6 }}>
                    A — {(yVal1 * 100).toFixed(0)}% YIELD
                  </div>
                  <VerdictCard r={r1} full={false} />
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", color: GREEN, marginBottom: 6 }}>
                    B — {(yVal2 * 100).toFixed(0)}% YIELD
                  </div>
                  <VerdictCard r={r2} full={false} />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── STEP U: UNLOCK THE LEVERS ────────────────────────────────────────────
const StepU = ({
  annualToday, fv, pvBase, nBase, infBase, yBase,
  pvMult, setPvMult, lifeMult, setLifeMult, nAdj, setNAdj, contrib, setContrib,
}) => {
  const baseR = solveR(pvBase, fv, nBase);
  const adjPv = pvBase * pvMult;
  const adjAnnual = annualToday * lifeMult;
  const adjN = Math.max(nBase + nAdj, 1);
  const adjFuture = adjAnnual * Math.pow(1 + infBase, adjN);
  const adjFv = yBase > 0 ? adjFuture / yBase : 0;
  const adjR = solveRWithContrib(adjPv, adjFv, adjN, contrib);
  const delta = adjR !== null && baseR !== null ? (adjR - baseR) * 100 : null;

  // Compounding curves — shows how the trajectory steepens (when levers make
  // it easier) or flattens (when they make it harder). Both curves use their
  // OWN required return, so you can literally see the lever's effect.
  const chartData = useMemo(() => {
    if (!pvBase || pvBase <= 0) return [];
    const maxN = Math.max(nBase, adjN) + 1;
    const pts = [];
    for (let y = 0; y <= maxN; y++) {
      const baseline = y <= nBase && baseR !== null
        ? calcFVWithContrib(pvBase, baseR, y, 0)
        : null;
      const adjusted = y <= adjN && adjR !== null
        ? calcFVWithContrib(adjPv, adjR, y, contrib)
        : null;
      pts.push({
        year: y,
        baseline: baseline !== null ? Math.round(baseline) : null,
        adjusted: adjusted !== null ? Math.round(adjusted) : null,
      });
    }
    return pts;
  }, [pvBase, baseR, adjR, adjPv, contrib, nBase, adjN]);

  const yTickFormatter = (v) =>
    v >= 1e6 ? `$${(v / 1e6).toFixed(1)}M` :
    v >= 1e3 ? `$${Math.round(v / 1000)}K` :
    `$${v}`;

  const adjustedColor = delta !== null && delta < 0 ? GREEN : delta !== null && delta > 0 ? RED : GOLD;

  if (!pvBase || !fv || fv <= 0) {
    return (
      <div style={{ ...card, textAlign: "center", padding: 40 }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🎚️</div>
        <div style={{ color: GOLD_L, fontSize: 16, fontWeight: 700, marginBottom: 8 }}>
          Complete earlier steps first
        </div>
        <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 13 }}>
          Steps E and X provide the baseline that these levers adjust.
        </div>
      </div>
    );
  }

  return (
    <div>
      <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 14, lineHeight: 1.7, margin: "0 0 24px" }}>
        Your required return isn't fixed. Every variable is a lever.{" "}
        <span style={{ color: GOLD_L }}>You cannot pull any lever intelligently unless you know what r is first.</span>
      </p>

      <div style={{ ...card, borderColor: GOLD + "33" }}>
        <div style={{ fontSize: 10, letterSpacing: "0.1em", color: GOLD, fontWeight: 700, marginBottom: 12 }}>
          YOUR BASELINE
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))", gap: 12 }}>
          {[
            { l: "Lifestyle", v: fmt(annualToday) + "/yr" },
            { l: "PV",        v: fmt(pvBase) },
            { l: "FV",        v: fmt(fv) },
            { l: "Timeline",  v: nBase + " yrs" },
            { l: "r",         v: fmtPct(baseR) },
          ].map((i) => (
            <div key={i.l}>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", letterSpacing: "0.06em", marginBottom: 2 }}>
                {i.l}
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#fff", fontFamily: "Georgia, serif" }}>
                {i.v}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={card}>
        <div style={{ fontSize: 10, letterSpacing: "0.1em", color: GOLD, fontWeight: 700, marginBottom: 16 }}>
          MOVE THE LEVERS
        </div>
        <Slider
          label="Scale PV (deploy more capital)"
          value={pvMult}
          onChange={setPvMult}
          min={0.5} max={4} step={0.1}
          display={`${fmt(adjPv)} (${pvMult.toFixed(1)}×)`}
          sub="Inheritance, liquidation, windfall, aggressive saving"
        />
        <Slider
          label="Scale Lifestyle Target"
          value={lifeMult}
          onChange={setLifeMult}
          min={0.5} max={1.5} step={0.05}
          display={`${fmt(adjAnnual)}/yr (${(lifeMult * 100).toFixed(0)}%)`}
          sub="Reduce or expand your dream — changes FV needed"
        />
        <Slider
          label="Adjust Timeline"
          value={nAdj}
          onChange={setNAdj}
          min={-5} max={20} step={1}
          display={`${adjN} yrs (${nAdj >= 0 ? "+" : ""}${nAdj})`}
          sub="More time is the most powerful lever most people underestimate"
        />
        <Slider
          label="Annual Contributions"
          value={contrib}
          onChange={setContrib}
          min={0} max={200000} step={5000}
          display={fmt(contrib) + "/yr"}
          sub="Ongoing capital added — reduces how much PV needs to grow"
        />
      </div>

      {baseR !== null && adjR !== null && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div style={{ ...card, textAlign: "center" }}>
            <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, marginBottom: 4 }}>Baseline r</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: GOLD, fontFamily: "Georgia, serif" }}>
              {fmtPct(baseR)}
            </div>
            <div style={{ fontSize: 11, color: verdict(baseR).color, fontWeight: 700, marginTop: 6 }}>
              {verdict(baseR).band}
            </div>
          </div>
          <div style={{ ...card, textAlign: "center", borderColor: verdict(adjR).color + "44" }}>
            <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, marginBottom: 4 }}>Adjusted r</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: verdict(adjR).color, fontFamily: "Georgia, serif" }}>
              {fmtPct(adjR)}
            </div>
            <div style={{ fontSize: 11, color: verdict(adjR).color, fontWeight: 700, marginTop: 6 }}>
              {verdict(adjR).band}
            </div>
          </div>
        </div>
      )}

      {/* Compounding curve — the visual core of this step */}
      {chartData.length > 1 && baseR !== null && (
        <div style={card}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              marginBottom: 12,
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            <div>
              <div style={{ fontSize: 10, letterSpacing: "0.1em", color: GOLD, fontWeight: 700 }}>
                COMPOUNDING CURVE
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>
                Watch the shape change as you move the sliders. A steeper curve = harder climb. A gentler curve = the levers are working for you.
              </div>
            </div>
            <div style={{ display: "flex", gap: 14, fontSize: 11, color: "rgba(255,255,255,0.5)" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 12, height: 2, background: GOLD }} /> Baseline
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 12, height: 2, background: adjustedColor }} /> With levers
              </span>
            </div>
          </div>
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 8, right: 20, left: 4, bottom: 8 }}>
                <CartesianGrid stroke="rgba(196,162,101,0.1)" strokeDasharray="3 3" />
                <XAxis
                  dataKey="year"
                  stroke="rgba(255,255,255,0.3)"
                  tick={{ fontSize: 11, fill: "rgba(255,255,255,0.5)" }}
                  label={{ value: "Years", position: "insideBottom", offset: -2, fill: "rgba(255,255,255,0.4)", fontSize: 11 }}
                />
                <YAxis
                  stroke="rgba(255,255,255,0.3)"
                  tick={{ fontSize: 11, fill: "rgba(255,255,255,0.5)" }}
                  tickFormatter={yTickFormatter}
                  width={62}
                />
                <Tooltip
                  contentStyle={{
                    background: "#091410",
                    border: "1px solid rgba(196,162,101,0.3)",
                    borderRadius: 6,
                    fontSize: 12,
                  }}
                  labelStyle={{ color: GOLD_L, fontWeight: 700 }}
                  formatter={(v, name) => [fmt(v), name === "baseline" ? "Baseline" : "With levers"]}
                  labelFormatter={(l) => `Year ${l}`}
                />
                <ReferenceLine
                  y={fv}
                  stroke={GOLD}
                  strokeDasharray="4 4"
                  label={{ value: `Target FV ${fmt(fv)}`, fill: GOLD, fontSize: 10, position: "insideTopLeft" }}
                />
                {adjFv > 0 && Math.abs(adjFv - fv) > 1 && (
                  <ReferenceLine
                    y={adjFv}
                    stroke={adjustedColor}
                    strokeDasharray="2 4"
                    label={{ value: `Adjusted FV ${fmt(adjFv)}`, fill: adjustedColor, fontSize: 10, position: "insideBottomLeft" }}
                  />
                )}
                <Line
                  type="monotone"
                  dataKey="baseline"
                  name="baseline"
                  stroke={GOLD}
                  strokeWidth={2.5}
                  dot={false}
                  isAnimationActive={false}
                  connectNulls={false}
                />
                <Line
                  type="monotone"
                  dataKey="adjusted"
                  name="adjusted"
                  stroke={adjustedColor}
                  strokeWidth={2.5}
                  dot={false}
                  isAnimationActive={false}
                  connectNulls={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          {delta !== null && Math.abs(delta) > 0.01 && (
            <div
              style={{
                marginTop: 8,
                padding: "8px 12px",
                background: delta < 0 ? "rgba(34,197,94,0.06)" : "rgba(239,68,68,0.06)",
                border: `1px solid ${delta < 0 ? GREEN + "33" : RED + "33"}`,
                borderRadius: 6,
                fontSize: 12,
                color: "rgba(255,255,255,0.55)",
                lineHeight: 1.5,
              }}
            >
              {delta < 0 ? (
                <span>
                  The adjusted curve is <span style={{ color: GREEN, fontWeight: 700 }}>flatter</span> —
                  meaning a lower required return gets you to the target. That's the levers working for you.
                </span>
              ) : (
                <span>
                  The adjusted curve is <span style={{ color: RED, fontWeight: 700 }}>steeper</span> —
                  meaning a higher required return is needed. These lever positions make the climb harder.
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {delta !== null && (
        <div
          style={{
            ...card,
            textAlign: "center",
            background:
              delta < 0 ? "rgba(34,197,94,0.08)" :
              delta > 0 ? "rgba(239,68,68,0.08)" :
              "rgba(255,255,255,0.02)",
            borderColor:
              delta < 0 ? GREEN + "44" :
              delta > 0 ? RED + "44" :
              "rgba(255,255,255,0.08)",
          }}
        >
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 4, letterSpacing: "0.05em" }}>
            CHANGE IN REQUIRED RETURN
          </div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 800,
              color: delta < 0 ? GREEN : delta > 0 ? RED : "rgba(255,255,255,0.4)",
              fontFamily: "Georgia, serif",
            }}
          >
            {delta === 0
              ? "No change"
              : `${delta > 0 ? "+" : ""}${delta.toFixed(2)} percentage points`}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── STEP S: SUPERCHARGE ──────────────────────────────────────────────────
const StepS = ({ fv, pvBase, nBase, r1, taxSaved, setTaxSaved }) => {
  const newR = solveRWithContrib(pvBase, fv, nBase, taxSaved);
  const deltaR = r1 !== null && newR !== null ? (newR - r1) * 100 : null;

  const newN = taxSaved > 0 && r1 !== null ? solveNWithContrib(pvBase, fv, r1, taxSaved) : null;
  const deltaNMonths = newN !== null && nBase > 0 ? Math.round((nBase - newN) * 12) : null;
  const deltaNYears = deltaNMonths !== null ? Math.floor(deltaNMonths / 12) : null;
  const deltaNRemMonths = deltaNMonths !== null ? deltaNMonths % 12 : null;

  const biggerFV = taxSaved > 0 && r1 !== null ? calcFVWithContrib(pvBase, r1, nBase, taxSaved) : 0;
  const fvExcess = biggerFV > 0 ? biggerFV - fv : 0;

  // Supercharge compounding curves — THREE lines, one per perspective:
  //   Baseline     — pvBase at r1, no PMT. Hits fv at year nBase.            (grey)
  //   Bigger FV    — pvBase at r1, with PMT. Overshoots fv at nBase (P3).    (purple)
  //   Lower r      — pvBase at newR (the reduced required return), no PMT.
  //                  Still reaches fv at nBase, but with a gentler slope (P1). (green)
  // Perspective 2 (Sooner Freedom) shows as the crossing point where the
  // purple line hits fv — marked with a vertical reference line at newN.
  const chartData = useMemo(() => {
    if (!pvBase || pvBase <= 0 || r1 === null) return [];
    const maxN = nBase + 1;
    const pts = [];
    for (let y = 0; y <= maxN; y++) {
      pts.push({
        year: y,
        without: Math.round(calcFVWithContrib(pvBase, r1, y, 0)),
        withMit: taxSaved > 0 ? Math.round(calcFVWithContrib(pvBase, r1, y, taxSaved)) : null,
        lowerR:  taxSaved > 0 && newR !== null ? Math.round(calcFVWithContrib(pvBase, newR, y, 0)) : null,
      });
    }
    return pts;
  }, [pvBase, r1, newR, nBase, taxSaved]);

  const yTickFormatter = (v) =>
    v >= 1e6 ? `$${(v / 1e6).toFixed(1)}M` :
    v >= 1e3 ? `$${Math.round(v / 1000)}K` :
    `$${v}`;

  if (!pvBase || !fv || fv <= 0 || r1 === null) {
    return (
      <div style={{ ...card, textAlign: "center", padding: 40 }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🚀</div>
        <div style={{ color: GOLD_L, fontSize: 16, fontWeight: 700, marginBottom: 8 }}>
          Complete earlier steps first
        </div>
        <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 13 }}>
          Steps E, X, and D establish the numbers that Supercharge builds on.
        </div>
      </div>
    );
  }

  return (
    <div>
      <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 14, lineHeight: 1.7, margin: "0 0 24px" }}>
        Every dollar you don't lose to taxes is a dollar that compounds toward your FV. Tax mitigation isn't a trick — it's a lever.{" "}
        <span style={{ color: GOLD_L, fontStyle: "italic" }}>And now you can see exactly how it moves r, n, and FV.</span>
      </p>

      <div style={card}>
        <div style={{ fontSize: 10, letterSpacing: "0.1em", color: GOLD, fontWeight: 700, marginBottom: 12 }}>
          THE TAX MITIGATION LEVER
        </div>
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, margin: "0 0 16px", lineHeight: 1.6 }}>
          If you recovered capital from taxes — through legal, defensible strategies validated by your CPA — and redirected it into your wealth engine, what happens?
        </p>

        <Slider
          label="Annual Tax Capital Recovered"
          value={taxSaved}
          onChange={setTaxSaved}
          min={0} max={200000} step={5000}
          display={fmt(taxSaved) + "/yr"}
          sub="This is NOT a guarantee. It's a 'what if' — a reason to learn CLEAR."
        />

        <div style={{ padding: "12px 16px", background: "rgba(0,0,0,0.2)", borderRadius: 6, marginTop: 8 }}>
          <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}>
            Over {nBase} years at {fmt(taxSaved)}/yr →{" "}
            <span style={{ color: GOLD_L, fontWeight: 700 }}>{fmt(taxSaved * parseInt(nBase, 10))}</span>{" "}
            total contributed, each year compounding
          </span>
        </div>
      </div>

      {taxSaved > 0 && chartData.length > 1 && (
        <div style={card}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              marginBottom: 12,
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            <div>
              <div style={{ fontSize: 10, letterSpacing: "0.1em", color: GOLD, fontWeight: 700 }}>
                THREE PERSPECTIVES ON ONE CHART
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>
                One lever — tax mitigation at {fmt(taxSaved)}/yr — shown three ways. The same math, visualized as three curves.
              </div>
            </div>
          </div>

          {/* Numbered legend — ties chart lines to the three perspective cards below */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 8,
              marginBottom: 12,
            }}
          >
            <LegendChip num="0" color="rgba(255,255,255,0.85)" label="Baseline" sub="No mitigation, original r" />
            <LegendChip num="1" color={GREEN} label="Easier Path" sub="Lower r, no PMT — gentler slope" />
            <LegendChip num="2" color={GOLD} label="Sooner Freedom" sub="Purple line crosses target earlier" />
            <LegendChip num="3" color="#8b5cf6" label="Bigger Machine" sub="Same r + PMT, overshoots target" />
          </div>

          <div style={{ height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 8, right: 20, left: 4, bottom: 8 }}>
                <CartesianGrid stroke="rgba(196,162,101,0.1)" strokeDasharray="3 3" />
                <XAxis
                  dataKey="year"
                  stroke="rgba(255,255,255,0.3)"
                  tick={{ fontSize: 11, fill: "rgba(255,255,255,0.5)" }}
                  label={{ value: "Years", position: "insideBottom", offset: -2, fill: "rgba(255,255,255,0.4)", fontSize: 11 }}
                />
                <YAxis
                  stroke="rgba(255,255,255,0.3)"
                  tick={{ fontSize: 11, fill: "rgba(255,255,255,0.5)" }}
                  tickFormatter={yTickFormatter}
                  width={62}
                />
                <Tooltip
                  contentStyle={{
                    background: "#091410",
                    border: "1px solid rgba(196,162,101,0.3)",
                    borderRadius: 6,
                    fontSize: 12,
                  }}
                  labelStyle={{ color: GOLD_L, fontWeight: 700 }}
                  formatter={(v, name) => {
                    const label =
                      name === "without" ? "Baseline (no mitigation)" :
                      name === "withMit" ? "With mitigation (Bigger Machine path)" :
                      name === "lowerR"  ? "Lower r (Easier Path)" :
                      name;
                    return [fmt(v), label];
                  }}
                  labelFormatter={(l) => `Year ${l}`}
                />
                <ReferenceLine
                  y={fv}
                  stroke={GOLD}
                  strokeDasharray="4 4"
                  label={{ value: `Target FV ${fmt(fv)}`, fill: GOLD, fontSize: 10, position: "insideTopLeft" }}
                />
                {newN !== null && newN > 0 && newN < nBase && (
                  <ReferenceLine
                    x={Math.round(newN * 10) / 10}
                    stroke={GOLD}
                    strokeDasharray="3 3"
                    label={{ value: `Sooner: ${newN.toFixed(1)} yrs`, fill: GOLD, fontSize: 10, position: "insideTop" }}
                  />
                )}
                <Line
                  type="monotone"
                  dataKey="without"
                  name="without"
                  stroke="rgba(255,255,255,0.85)"
                  strokeWidth={3}
                  dot={false}
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="lowerR"
                  name="lowerR"
                  stroke={GREEN}
                  strokeWidth={2.5}
                  strokeDasharray="4 3"
                  dot={false}
                  isAnimationActive={false}
                  connectNulls={false}
                />
                <Line
                  type="monotone"
                  dataKey="withMit"
                  name="withMit"
                  stroke="#8b5cf6"
                  strokeWidth={2.5}
                  dot={false}
                  isAnimationActive={false}
                  connectNulls={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div
            style={{
              marginTop: 8,
              padding: "8px 12px",
              background: "rgba(0,0,0,0.2)",
              borderRadius: 6,
              fontSize: 11,
              color: "rgba(255,255,255,0.55)",
              lineHeight: 1.6,
            }}
          >
            <strong style={{ color: GOLD_L }}>How to read this:</strong>{" "}
            The grey line is your path today. The dashed green line grows slower (lower r) but still reaches the target — that's the <span style={{ color: GREEN, fontWeight: 700 }}>Easier Path</span>. The purple line grows faster because of the added contributions — and overshoots your target at year {nBase}, the <span style={{ color: "#8b5cf6", fontWeight: 700 }}>Bigger Machine</span>. Where purple crosses the dashed gold line (before year {nBase}) is <span style={{ color: GOLD, fontWeight: 700 }}>Sooner Freedom</span>.
          </div>
        </div>
      )}

      {taxSaved > 0 && (
        <>
          <div style={{ textAlign: "center", margin: "8px 0 16px" }}>
            <div style={{ fontSize: 10, letterSpacing: "0.15em", color: "rgba(255,255,255,0.35)", fontWeight: 700 }}>
              THREE WAYS TAX MITIGATION CHANGES YOUR EQUATION
            </div>
          </div>

          {/* Perspective 1 — Lower r */}
          <div style={{ ...card, borderColor: GREEN + "33", background: "rgba(34,197,94,0.04)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <div
                style={{
                  width: 28, height: 28, borderRadius: "50%",
                  background: GREEN + "20",
                  border: `1px solid ${GREEN}44`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 13, fontWeight: 800, color: GREEN, fontFamily: "Georgia, serif",
                  flexShrink: 0,
                }}
              >1</div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: GREEN, letterSpacing: "0.04em" }}>
                  EASIER PATH — LOWER REQUIRED RETURN
                </div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
                  Same goal, same timeline — but the mountain shrinks
                </div>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 12, alignItems: "center" }}>
              <div style={{ textAlign: "center", padding: "14px 12px", background: "rgba(0,0,0,0.2)", borderRadius: 8 }}>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", letterSpacing: "0.06em", marginBottom: 4 }}>
                  WITHOUT
                </div>
                <div style={{ fontSize: 28, fontWeight: 800, color: verdict(r1).color, fontFamily: "Georgia, serif" }}>
                  {fmtPct(r1)}
                </div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>
                  {verdict(r1).band}
                </div>
              </div>
              <div style={{ fontSize: 20, color: GREEN }}>→</div>
              <div
                style={{
                  textAlign: "center",
                  padding: "14px 12px",
                  background: GREEN + "10",
                  borderRadius: 8,
                  border: `1px solid ${GREEN}22`,
                }}
              >
                <div style={{ fontSize: 10, color: GREEN, letterSpacing: "0.06em", marginBottom: 4, fontWeight: 700 }}>
                  WITH TAX MITIGATION
                </div>
                <div style={{ fontSize: 28, fontWeight: 800, color: verdict(newR).color, fontFamily: "Georgia, serif" }}>
                  {fmtPct(newR)}
                </div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>
                  {verdict(newR).band}
                </div>
              </div>
            </div>
            {deltaR !== null && (
              <div style={{ textAlign: "center", marginTop: 12, padding: "8px 0" }}>
                <span style={{ fontSize: 20, fontWeight: 800, color: GREEN, fontFamily: "Georgia, serif" }}>
                  {deltaR.toFixed(2)} percentage points
                </span>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>
                  lower required return — same destination, gentler climb
                </div>
              </div>
            )}
          </div>

          {/* Perspective 2 — Sooner freedom */}
          <div style={{ ...card, borderColor: GOLD + "33", background: "rgba(196,162,101,0.04)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <div
                style={{
                  width: 28, height: 28, borderRadius: "50%",
                  background: GOLD + "20",
                  border: `1px solid ${GOLD}44`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 13, fontWeight: 800, color: GOLD, fontFamily: "Georgia, serif",
                  flexShrink: 0,
                }}
              >2</div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: GOLD, letterSpacing: "0.04em" }}>
                  SOONER FREEDOM — SAME RETURN, LESS TIME
                </div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
                  Keep your r the same — but work becomes optional faster
                </div>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 12, alignItems: "center" }}>
              <div style={{ textAlign: "center", padding: "14px 12px", background: "rgba(0,0,0,0.2)", borderRadius: 8 }}>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", letterSpacing: "0.06em", marginBottom: 4 }}>
                  WITHOUT
                </div>
                <div style={{ fontSize: 28, fontWeight: 800, color: "#fff", fontFamily: "Georgia, serif" }}>
                  {nBase} yrs
                </div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>
                  at {fmtPct(r1)} return
                </div>
              </div>
              <div style={{ fontSize: 20, color: GOLD }}>→</div>
              <div
                style={{
                  textAlign: "center",
                  padding: "14px 12px",
                  background: GOLD + "10",
                  borderRadius: 8,
                  border: `1px solid ${GOLD}22`,
                }}
              >
                <div style={{ fontSize: 10, color: GOLD, letterSpacing: "0.06em", marginBottom: 4, fontWeight: 700 }}>
                  WITH TAX MITIGATION
                </div>
                <div style={{ fontSize: 28, fontWeight: 800, color: GOLD, fontFamily: "Georgia, serif" }}>
                  {newN !== null ? `${newN.toFixed(1)} yrs` : "—"}
                </div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>
                  at {fmtPct(r1)} return
                </div>
              </div>
            </div>
            {deltaNMonths !== null && deltaNMonths > 0 && (
              <div style={{ textAlign: "center", marginTop: 12, padding: "8px 0" }}>
                <span style={{ fontSize: 20, fontWeight: 800, color: GOLD, fontFamily: "Georgia, serif" }}>
                  {deltaNYears > 0 ? `${deltaNYears} year${deltaNYears !== 1 ? "s" : ""}` : ""}
                  {deltaNYears > 0 && deltaNRemMonths > 0 ? ", " : ""}
                  {deltaNRemMonths > 0 ? `${deltaNRemMonths} month${deltaNRemMonths !== 1 ? "s" : ""}` : ""}{" "}
                  sooner
                </span>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>
                  freedom arrives earlier — that's time you can't buy back
                </div>
              </div>
            )}
            {deltaNMonths !== null && deltaNMonths <= 0 && (
              <div style={{ textAlign: "center", marginTop: 12, padding: "8px 0" }}>
                <span style={{ fontSize: 14, color: "rgba(255,255,255,0.4)" }}>
                  Contributions at this level don't meaningfully shorten the timeline at your current r.
                </span>
              </div>
            )}
          </div>

          {/* Perspective 3 — Bigger machine */}
          <div style={{ ...card, borderColor: "#8b5cf6" + "33", background: "rgba(139,92,246,0.04)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <div
                style={{
                  width: 28, height: 28, borderRadius: "50%",
                  background: "#8b5cf6" + "20",
                  border: `1px solid #8b5cf644`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 13, fontWeight: 800, color: "#8b5cf6", fontFamily: "Georgia, serif",
                  flexShrink: 0,
                }}
              >3</div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#8b5cf6", letterSpacing: "0.04em" }}>
                  BIGGER MACHINE — SAME RETURN, SAME TIMELINE
                </div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
                  Keep everything the same — your wealth engine just gets bigger
                </div>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 12, alignItems: "center" }}>
              <div style={{ textAlign: "center", padding: "14px 12px", background: "rgba(0,0,0,0.2)", borderRadius: 8 }}>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", letterSpacing: "0.06em", marginBottom: 4 }}>
                  YOUR GOAL
                </div>
                <div style={{ fontSize: 28, fontWeight: 800, color: "#fff", fontFamily: "Georgia, serif" }}>
                  {fmt(fv)}
                </div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>target FV</div>
              </div>
              <div style={{ fontSize: 20, color: "#8b5cf6" }}>→</div>
              <div
                style={{
                  textAlign: "center",
                  padding: "14px 12px",
                  background: "#8b5cf6" + "10",
                  borderRadius: 8,
                  border: `1px solid #8b5cf622`,
                }}
              >
                <div style={{ fontSize: 10, color: "#8b5cf6", letterSpacing: "0.06em", marginBottom: 4, fontWeight: 700 }}>
                  WITH TAX MITIGATION
                </div>
                <div style={{ fontSize: 28, fontWeight: 800, color: "#8b5cf6", fontFamily: "Georgia, serif" }}>
                  {fmt(biggerFV)}
                </div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>
                  actual FV at {fmtPct(r1)}
                </div>
              </div>
            </div>
            {fvExcess > 0 && (
              <div style={{ textAlign: "center", marginTop: 12, padding: "8px 0" }}>
                <span style={{ fontSize: 20, fontWeight: 800, color: "#8b5cf6", fontFamily: "Georgia, serif" }}>
                  +{fmt(fvExcess)} surplus
                </span>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>
                  your machine exceeds the goal — that's generational margin
                </div>
              </div>
            )}
          </div>

          {/* Summary insight */}
          <div style={{ ...card, background: "rgba(0,0,0,0.25)", borderColor: "rgba(255,255,255,0.08)" }}>
            <div style={{ fontSize: 10, letterSpacing: "0.1em", color: "rgba(255,255,255,0.35)", fontWeight: 700, marginBottom: 8 }}>
              SAME LEVER, THREE OUTCOMES
            </div>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, margin: 0, lineHeight: 1.7 }}>
              At <span style={{ color: GOLD_L, fontWeight: 700 }}>{fmt(taxSaved)}/yr</span> in recovered tax capital, you can choose your advantage: a{" "}
              <span style={{ color: GREEN, fontWeight: 700 }}>gentler climb</span> to the same summit,
              {deltaNMonths !== null && deltaNMonths > 0 ? (
                <span> arrive <span style={{ color: GOLD, fontWeight: 700 }}>
                  {deltaNYears > 0 ? `${deltaNYears}y ` : ""}{deltaNRemMonths > 0 ? `${deltaNRemMonths}m` : ""} sooner
                </span>,</span>
              ) : " the same timeline, "}
              or build a machine that's <span style={{ color: "#8b5cf6", fontWeight: 700 }}>{fmt(fvExcess)}</span> bigger than you need. In practice, you'll blend all three. The point is: <em>the lever is real and the math proves it.</em>
            </p>
          </div>
        </>
      )}

      {/* Bridge to Week 2 */}
      <div style={{ ...card, borderColor: GOLD + "33", background: "rgba(196,162,101,0.04)", marginTop: 8 }}>
        <div style={{ fontSize: 10, letterSpacing: "0.1em", color: GOLD, fontWeight: 700, marginBottom: 8 }}>
          BRIDGE TO WEEK 2: CLARITY
        </div>
        <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 13, margin: 0, lineHeight: 1.7 }}>
          You now have a number — your required return — and you've seen how every variable moves it. Tax mitigation isn't abstract anymore. It's a specific lever that produces a measurable effect on r, n, and FV.
        </p>
        <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 13, margin: "12px 0 0", lineHeight: 1.7 }}>
          But which strategies actually apply to <em>you</em>? Which are real reduction and which are just deferral? Which would survive scrutiny?{" "}
          <span style={{ color: GOLD_L, fontWeight: 700 }}>That's Week 2.</span>{" "}
          The CLEAR™ framework starts with Clarity — understanding exactly how your income is taxed and why your situation looks the way it does.
        </p>
        <div style={{ marginTop: 16, textAlign: "center" }}>
          <div style={{ fontFamily: "Georgia, serif", fontSize: 18, color: GOLD, letterSpacing: 1 }}>
            "You came in with a number you didn't know."
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 4 }}>
            Now you do. The question is: what are you going to do about it?
          </div>
        </div>
      </div>
    </div>
  );
};
