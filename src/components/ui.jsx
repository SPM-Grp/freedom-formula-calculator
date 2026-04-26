import { colors, alpha, fonts, radii, styles } from "../lib/theme";
import { fmtPct, verdict } from "../lib/math";

// ─── Page header inside a week ─────────────────────────────────────────────
export const PageHeader = ({ title, subtitle }) => (
  <div style={{ marginBottom: 24 }}>
    <h1
      style={{
        fontFamily: fonts.serif,
        fontSize: 32,
        fontWeight: 700,
        color: colors.goldLight,
        margin: 0,
        letterSpacing: "-0.01em",
      }}
    >
      {title}
    </h1>
    {subtitle && (
      <div
        style={{
          color: alpha.whiteA60,
          fontSize: 14,
          marginTop: 6,
          maxWidth: 720,
          lineHeight: 1.5,
        }}
      >
        {subtitle}
      </div>
    )}
  </div>
);

// ─── Card ──────────────────────────────────────────────────────────────────
export const Card = ({ children, style, tone = "default" }) => {
  const toneMap = {
    default: {},
    gold: { background: alpha.goldA06, borderColor: alpha.goldA30 },
    success: { background: alpha.greenSoft, borderColor: alpha.greenBorder },
    warn: { background: "rgba(245,158,11,0.05)", borderColor: "rgba(245,158,11,0.35)" },
    danger: { background: alpha.redSoft, borderColor: alpha.redBorder },
    purple: { background: alpha.purpleSoft, borderColor: alpha.purpleBorder },
  };
  return (
    <div style={{ ...styles.card, ...toneMap[tone], ...(style || {}) }}>
      {children}
    </div>
  );
};

// ─── Label ─────────────────────────────────────────────────────────────────
export const Label = ({ children, style }) => (
  <label style={{ ...styles.label, ...(style || {}) }}>{children}</label>
);

export const SubText = ({ children, style }) => (
  <div style={{ ...styles.subText, ...(style || {}) }}>{children}</div>
);

// ─── Money / Percent inputs ────────────────────────────────────────────────
export const MoneyInput = ({ value, onChange, placeholder = "$0", style }) => (
  <input
    type="text"
    inputMode="decimal"
    value={value}
    placeholder={placeholder}
    onChange={(e) => onChange(e.target.value)}
    onBlur={(e) => {
      const raw = String(e.target.value).replace(/[$,\s]/g, "");
      const num = parseFloat(raw);
      if (isFinite(num) && num !== 0) {
        onChange(`$${Math.round(num).toLocaleString()}`);
      }
    }}
    style={{ ...styles.input, ...(style || {}) }}
  />
);

export const PercentInput = ({ value, onChange, step = "0.1", min = 0, max = 100, style }) => (
  <input
    type="number"
    value={value}
    onChange={(e) => onChange(e.target.value)}
    step={step}
    min={min}
    max={max}
    style={{ ...styles.input, ...(style || {}) }}
  />
);

export const TextInput = ({ value, onChange, placeholder, style, multiline = false, rows = 3 }) => {
  if (multiline) {
    return (
      <textarea
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        style={{
          ...styles.input,
          fontFamily: fonts.sans,
          fontSize: 13,
          fontWeight: 400,
          resize: "vertical",
          ...(style || {}),
        }}
      />
    );
  }
  return (
    <input
      type="text"
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      style={{ ...styles.input, fontFamily: fonts.sans, fontSize: 13, fontWeight: 400, ...(style || {}) }}
    />
  );
};

export const NumberInput = ({ value, onChange, step = 1, min, max, style }) => (
  <input
    type="number"
    value={value}
    onChange={(e) => onChange(e.target.value)}
    step={step}
    min={min}
    max={max}
    style={{ ...styles.input, ...(style || {}) }}
  />
);

// ─── Select ────────────────────────────────────────────────────────────────
export const Select = ({ value, onChange, options, style }) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    style={{
      ...styles.input,
      fontFamily: fonts.sans,
      fontSize: 13,
      fontWeight: 500,
      appearance: "none",
      background: `${alpha.blackA30} url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='6'><path d='M0 0l5 6 5-6z' fill='%23C4A265'/></svg>") no-repeat right 12px center`,
      paddingRight: 32,
      ...(style || {}),
    }}
  >
    {options.map((o) => {
      const v = typeof o === "string" ? o : o.value ?? o.key;
      const label = typeof o === "string" ? o : o.label;
      return (
        <option key={v} value={v} style={{ background: colors.dark }}>
          {label}
        </option>
      );
    })}
  </select>
);

// ─── Slider ────────────────────────────────────────────────────────────────
export const Slider = ({ label, value, onChange, min, max, step, display, sub }) => (
  <div style={{ marginBottom: 16 }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
      <Label>{label}</Label>
      <span style={{ fontFamily: fonts.serif, color: colors.goldLight, fontSize: 16, fontWeight: 700 }}>
        {display}
      </span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      style={{
        width: "100%",
        accentColor: colors.gold,
        marginTop: 4,
      }}
    />
    {sub && <SubText style={{ marginTop: 4 }}>{sub}</SubText>}
  </div>
);

// ─── Buttons ───────────────────────────────────────────────────────────────
export const Button = ({ children, onClick, disabled, variant = "primary", style, ...rest }) => {
  const base = variant === "ghost" ? styles.buttonGhost : styles.button;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        ...base,
        opacity: disabled ? 0.45 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
        ...(style || {}),
      }}
      {...rest}
    >
      {children}
    </button>
  );
};

// ─── Callout ───────────────────────────────────────────────────────────────
export const Callout = ({ children, tone = "gold", title, style }) => {
  const toneMap = {
    gold:    { bg: alpha.goldA06,    border: alpha.goldA30,   color: colors.goldLight },
    success: { bg: alpha.greenSoft,  border: alpha.greenBorder, color: colors.success },
    warn:    { bg: "rgba(245,158,11,0.05)", border: "rgba(245,158,11,0.4)", color: colors.warn },
    danger:  { bg: alpha.redSoft,    border: alpha.redBorder, color: colors.danger },
    purple:  { bg: alpha.purpleSoft, border: alpha.purpleBorder, color: colors.purple },
  };
  const t = toneMap[tone] || toneMap.gold;
  return (
    <div
      style={{
        background: t.bg,
        border: `1px solid ${t.border}`,
        borderRadius: radii.card,
        padding: "14px 18px",
        marginBottom: 12,
        ...(style || {}),
      }}
    >
      {title && (
        <div style={{ ...styles.label, color: t.color, marginBottom: 6 }}>{title}</div>
      )}
      <div style={{ color: alpha.whiteA60, fontSize: 13, lineHeight: 1.55 }}>{children}</div>
    </div>
  );
};

// ─── KPI card ──────────────────────────────────────────────────────────────
export const KPI = ({ label, value, valueColor, sub }) => (
  <div
    style={{
      background: alpha.whiteA04,
      border: `1px solid ${alpha.goldA12}`,
      borderRadius: radii.card,
      padding: "14px 16px",
      textAlign: "center",
    }}
  >
    <div
      style={{
        fontFamily: fonts.serif,
        fontSize: 22,
        fontWeight: 700,
        color: valueColor || colors.goldLight,
        lineHeight: 1.1,
      }}
    >
      {value}
    </div>
    <div style={{ ...styles.label, marginTop: 4, marginBottom: 0 }}>{label}</div>
    {sub && <div style={{ ...styles.subText, marginTop: 2 }}>{sub}</div>}
  </div>
);

// ─── Dependency prompt (used when a week depends on upstream data) ─────────
export const DependencyPrompt = ({ message, action }) => (
  <Card tone="gold">
    <div style={{ color: colors.goldLight, fontSize: 14, fontWeight: 600, marginBottom: 6 }}>
      Upstream data required
    </div>
    <div style={{ color: alpha.whiteA60, fontSize: 13, lineHeight: 1.55 }}>{message}</div>
    {action && <div style={{ marginTop: 10 }}>{action}</div>}
  </Card>
);

// ─── VerdictCard (the big r reveal) ───────────────────────────────────────
// Faithful port from the original Freedom Formula Calculator. Do not change
// without reviewing the lead-magnet deployment first.
export const VerdictCard = ({ r, full = true }) => {
  if (r === null || r === undefined) return null;
  const v = verdict(r);
  return (
    <div
      style={{
        ...styles.card,
        borderColor: v.color + "44",
        background: v.color + "10",
        marginBottom: 0,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div style={{ flex: 1, minWidth: 170 }}>
          <div
            style={{
              fontSize: 10,
              letterSpacing: "0.1em",
              color: v.color,
              fontWeight: 700,
              marginBottom: 4,
            }}
          >
            VERDICT
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: v.color }}>{v.band}</div>
          {full && (
            <div
              style={{
                fontSize: 13,
                color: alpha.whiteA60,
                lineHeight: 1.6,
                marginTop: 6,
              }}
            >
              {v.detail}
            </div>
          )}
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div
            style={{
              fontSize: 40,
              fontWeight: 800,
              color: v.color,
              fontFamily: fonts.serif,
              lineHeight: 1,
            }}
          >
            {fmtPct(r)}
          </div>
          <div
            style={{
              fontSize: 11,
              color: alpha.whiteA40,
              marginTop: 4,
            }}
          >
            required return
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── EXODUS-style primitives — used across all weeks for visual consistency

// Uppercase gold eyebrow above a section. Matches EXODUS step-section headers.
export const SectionEyebrow = ({ children, color = colors.gold, style }) => (
  <div
    style={{
      fontSize: 10,
      letterSpacing: "0.1em",
      color,
      fontWeight: 700,
      textTransform: "uppercase",
      marginBottom: 12,
      ...(style || {}),
    }}
  >
    {children}
  </div>
);

// Big serif number centered, with optional eyebrow label above.
export const HeroNumber = ({ value, label, color = colors.goldLight, size = 44, sub }) => (
  <div style={{ textAlign: "center" }}>
    {label && <SectionEyebrow color={alpha.whiteA40} style={{ marginBottom: 8 }}>{label}</SectionEyebrow>}
    <div
      style={{
        fontSize: size,
        fontWeight: 800,
        color,
        fontFamily: fonts.serif,
        lineHeight: 1,
      }}
    >
      {value}
    </div>
    {sub && (
      <div style={{ fontSize: 12, color: alpha.whiteA40, marginTop: 8 }}>{sub}</div>
    )}
  </div>
);

// Before/after comparison with arrow. Used in REVEAL Effective Rate,
// Step S perspectives, INSULATE score changes, etc.
export const BeforeAfter = ({
  beforeLabel, before,
  afterLabel,  after,
  color = colors.success,
  beforeColor,
}) => (
  <div
    style={{
      display: "grid",
      gridTemplateColumns: "1fr auto 1fr",
      gap: 12,
      alignItems: "center",
    }}
  >
    <div
      style={{
        textAlign: "center",
        padding: "14px 12px",
        background: alpha.blackA20,
        borderRadius: 8,
      }}
    >
      <SectionEyebrow color={alpha.whiteA40} style={{ marginBottom: 4 }}>
        {beforeLabel}
      </SectionEyebrow>
      <div
        style={{
          fontSize: 26,
          fontFamily: fonts.serif,
          fontWeight: 800,
          color: beforeColor || "#fff",
        }}
      >
        {before}
      </div>
    </div>
    <div style={{ fontSize: 20, color }}>→</div>
    <div
      style={{
        textAlign: "center",
        padding: "14px 12px",
        background: color + "10",
        borderRadius: 8,
        border: `1px solid ${color}33`,
      }}
    >
      <SectionEyebrow color={color} style={{ marginBottom: 4 }}>
        {afterLabel}
      </SectionEyebrow>
      <div
        style={{
          fontSize: 26,
          fontFamily: fonts.serif,
          fontWeight: 800,
          color,
        }}
      >
        {after}
      </div>
    </div>
  </div>
);

// Numbered perspective card — used wherever we have sequenced/enumerated
// outputs (ASSESS scenarios, INSULATE recommendations, etc.).
export const PerspectiveCard = ({ num, color, title, subtitle, children }) => (
  <div
    style={{
      background: color + "08",
      border: `1px solid ${color}33`,
      borderRadius: radii.card,
      padding: "20px 22px",
      marginBottom: 16,
    }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: "50%",
          background: color + "20",
          border: `1px solid ${color}44`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 13,
          fontWeight: 800,
          color,
          fontFamily: fonts.serif,
          flexShrink: 0,
        }}
      >
        {num}
      </div>
      <div>
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            color,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}
        >
          {title}
        </div>
        {subtitle && (
          <div style={{ fontSize: 11, color: alpha.whiteA40 }}>{subtitle}</div>
        )}
      </div>
    </div>
    {children}
  </div>
);

// Hero verdict card — colored border + band + big number. Generic version of
// VerdictCard (which is r-specific). Use when a metric belongs in a band.
export const VerdictHero = ({ label, band, value, detail, color, valueSub }) => (
  <div
    style={{
      ...styles.card,
      borderColor: color + "44",
      borderWidth: 2,
      borderStyle: "solid",
      background: color + "08",
      marginBottom: 16,
    }}
  >
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        flexWrap: "wrap",
        gap: 12,
      }}
    >
      <div style={{ flex: 1, minWidth: 170 }}>
        <SectionEyebrow color={color}>{label}</SectionEyebrow>
        {band && (
          <div style={{ fontSize: 15, fontWeight: 700, color, marginBottom: 6 }}>{band}</div>
        )}
        {detail && (
          <div style={{ fontSize: 13, color: alpha.whiteA60, lineHeight: 1.6 }}>
            {detail}
          </div>
        )}
      </div>
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <div
          style={{
            fontSize: 44,
            fontWeight: 800,
            color,
            fontFamily: fonts.serif,
            lineHeight: 1,
          }}
        >
          {value}
        </div>
        {valueSub && (
          <div style={{ fontSize: 11, color: alpha.whiteA40, marginTop: 4 }}>{valueSub}</div>
        )}
      </div>
    </div>
  </div>
);

// ─── Tooltip ───────────────────────────────────────────────────────────────
// Pure-CSS hover tooltip. Used for acronym expansions (FMC, QCD, QSBS, etc.)
// and any concept where we want to show a definition on hover without
// cluttering the main UI. `content` is the hover body, `children` the trigger.
export const Tooltip = ({ content, children, width = 260, placement = "top" }) => {
  if (!content) return children;
  const placementStyle =
    placement === "bottom"
      ? { top: "calc(100% + 8px)", bottom: "auto" }
      : { bottom: "calc(100% + 8px)", top: "auto" };
  return (
    <span
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        borderBottom: `1px dotted ${alpha.goldA30}`,
        cursor: "help",
      }}
      tabIndex={0}
      aria-describedby="tooltip-content"
    >
      {children}
      <span
        className="tooltip-content"
        role="tooltip"
        style={{
          position: "absolute",
          left: "50%",
          transform: "translateX(-50%)",
          width,
          maxWidth: "80vw",
          padding: "10px 12px",
          background: colors.darker,
          border: `1px solid ${alpha.goldA30}`,
          borderRadius: radii.card,
          fontSize: 12,
          lineHeight: 1.55,
          color: alpha.whiteA60,
          fontFamily: fonts.sans,
          fontStyle: "normal",
          fontWeight: 400,
          textAlign: "left",
          textTransform: "none",
          letterSpacing: 0,
          boxShadow: `0 8px 24px ${alpha.blackA40}`,
          zIndex: 40,
          visibility: "hidden",
          opacity: 0,
          pointerEvents: "none",
          transition: "opacity 120ms, visibility 120ms",
          ...placementStyle,
        }}
      >
        {content}
      </span>
      <style>{`
        span[role="tooltip"] { /* targets the content span via parent :hover */ }
        span:hover > .tooltip-content,
        span:focus-within > .tooltip-content { visibility: visible; opacity: 1; }
      `}</style>
    </span>
  );
};

// Quick definitions for common CLEAR acronyms — centralized so we can reuse
// them anywhere in the app without duplicating copy.
export const ACRONYM_DEFINITIONS = {
  FMC: "Family Management Company — a separate pass-through entity (sole prop or partnership) that provides management services to your operating business. Owned by one parent, it employs other family members (including minors) under §3121(b)(3) FICA exemption for under-18 kids in sole-prop or spousal-partnership ownership.",
  QCD: "Qualified Charitable Distribution (§408(d)(8)) — direct transfer from an IRA (owner age 70½+) to a qualified charity. Counts toward RMD but doesn't add to AGI. Up to $108K/year in 2025.",
  QSBS: "Qualified Small Business Stock (§1202) — stock in a domestic C-corp held 5+ years can exclude up to $10M or 10× basis of gain on sale. Excludes most services (legal, health, finance, consulting).",
  NQDC: "Non-Qualified Deferred Compensation — executive arrangement to defer W-2 compensation into future years. Reduces current AGI; income recognized on distribution. Subject to §409A strict timing rules.",
  STR: "Short-Term Rental — a rental property with average guest stay of 7 days or less. Under Temp. Reg. §1.469-1T(e)(3), STR activities with material participation are non-passive and can offset W-2 income.",
  REPS: "Real Estate Professional Status (§469(c)(7)) — 750+ hours/year in real estate activities AND more hours in real estate than any other trade. Converts rental losses from passive to non-passive.",
  IDC: "Intangible Drilling Costs (§263(c)) — first-year expenses of drilling oil & gas wells (labor, fuel, supplies). ~70-85% of direct investment amounts typically deductible first year.",
  "FF&E": "Furniture, Fixtures & Equipment — tangible business property that can be depreciated on an accelerated schedule. Material line item in business-acquisition purchase price allocations.",
  DAF: "Donor-Advised Fund — charitable account at a sponsor (Fidelity Charitable, Schwab Charitable, etc.). Deduction taken on contribution; grants to charities recommended over time.",
  CRT: "Charitable Remainder Trust — splits an asset into an income stream (to you for life/term) and a remainder interest (to charity). Generates partial current deduction; converts appreciated assets without immediate capital gain.",
  HDHP: "High-Deductible Health Plan — health insurance with minimum deductible ($1,650 single / $3,300 family in 2025) and out-of-pocket max below statutory limits. Required to contribute to an HSA.",
  AGI: "Adjusted Gross Income — Form 1040 line 11. The number that gates eligibility for most deductions, credits, and phase-outs.",
  ETR: "Effective Tax Rate — total tax paid ÷ total income. Different from marginal rate (the rate on your last dollar earned).",
  NIIT: "Net Investment Income Tax (§1411) — 3.8% additional tax on net investment income for MAGI over $200K single / $250K MFJ.",
  PMT: "Annual Payment — in the Freedom Formula, the annual dollars contributed to your investments. Usually from tax mitigation or active savings.",
  "§179": "Internal Revenue Code §179 — election to immediately expense (rather than depreciate) qualifying business equipment up to $1.16M (2025), stacked with bonus depreciation.",
};

// ─── Disclaimer ────────────────────────────────────────────────────────────
export const Disclaimer = ({ children }) => (
  <div
    style={{
      marginTop: 24,
      padding: "12px 16px",
      background: alpha.whiteA035,
      border: `1px solid ${alpha.whiteA08}`,
      borderRadius: radii.input,
      fontSize: 11,
      lineHeight: 1.5,
      color: alpha.whiteA40,
      fontStyle: "italic",
    }}
  >
    {children}
  </div>
);
