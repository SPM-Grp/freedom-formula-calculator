import { useState, useMemo, useRef, useEffect } from "react";
import {
  STRATEGY_LIBRARY,
  STRATEGY_CATEGORIES,
  searchStrategies,
  strategyById,
  formatTypicalSavings,
  SCRUTINY,
} from "../data/strategies";
import { STRATEGY_PROMPTS } from "../data/strategyPrompts";
import { colors, alpha, fonts, radii, styles } from "../lib/theme";
import { SectionEyebrow, Tooltip, ACRONYM_DEFINITIONS } from "./ui";

// Wrap any acronym in the strategy name with a hover tooltip that expands it.
// Matches known acronyms from ACRONYM_DEFINITIONS and wraps only the first
// occurrence so the string stays readable.
const withAcronymTooltips = (name) => {
  if (!name) return name;
  // Find all acronyms that appear in this name
  const parts = [];
  let remaining = name;
  const acronyms = Object.keys(ACRONYM_DEFINITIONS).sort((a, b) => b.length - a.length);
  let guard = 0;
  while (remaining && guard < 20) {
    guard++;
    let matched = null;
    let earliestIdx = Infinity;
    for (const acr of acronyms) {
      // Word-boundary match, case-sensitive
      const re = new RegExp(`\\b${acr.replace(/[$§()]/g, "\\$&")}\\b`);
      const m = re.exec(remaining);
      if (m && m.index < earliestIdx) {
        earliestIdx = m.index;
        matched = { acr, start: m.index, end: m.index + m[0].length };
      }
    }
    if (!matched) {
      parts.push(remaining);
      break;
    }
    if (matched.start > 0) parts.push(remaining.slice(0, matched.start));
    parts.push(
      <Tooltip key={`${matched.acr}-${parts.length}`} content={ACRONYM_DEFINITIONS[matched.acr]} width={300}>
        {remaining.slice(matched.start, matched.end)}
      </Tooltip>
    );
    remaining = remaining.slice(matched.end);
  }
  return parts;
};

// ────────────────────────────────────────────────────────────────────────────
// StrategyPicker — autocomplete input for picking from the 25-strategy library.
// Dropdown renders on focus, filters as user types. Picking an entry calls
// onSelect with the full strategy object.
// ────────────────────────────────────────────────────────────────────────────
export const StrategyPicker = ({
  value,
  onChange,
  onSelect,
  placeholder = "Start typing… or browse the library",
  style,
}) => {
  const [focused, setFocused] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const wrapRef = useRef(null);

  // Show all matches — the dropdown scrolls. No artificial cap.
  const results = useMemo(() => searchStrategies(value), [value]);

  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setFocused(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const pick = (strategy) => {
    onChange(strategy.name);
    if (onSelect) onSelect(strategy);
    setFocused(false);
  };

  const onKeyDown = (e) => {
    if (!focused || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(results.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      pick(results[activeIdx]);
    } else if (e.key === "Escape") {
      setFocused(false);
    }
  };

  return (
    <div ref={wrapRef} style={{ position: "relative", ...(style || {}) }}>
      <input
        type="text"
        value={value || ""}
        placeholder={placeholder}
        onChange={(e) => {
          onChange(e.target.value);
          setActiveIdx(0);
        }}
        onFocus={() => setFocused(true)}
        onKeyDown={onKeyDown}
        style={{
          ...styles.input,
          fontFamily: fonts.sans,
          fontSize: 13,
          fontWeight: 500,
        }}
      />
      {focused && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            zIndex: 30,
            background: colors.darker,
            border: `1px solid ${alpha.goldA30}`,
            borderRadius: radii.card,
            boxShadow: `0 6px 24px ${alpha.blackA40}`,
            maxHeight: 360,
            overflowY: "auto",
          }}
        >
          <div
            style={{
              padding: "8px 12px",
              borderBottom: `1px solid ${alpha.goldA12}`,
              fontSize: 10,
              letterSpacing: "0.1em",
              color: alpha.whiteA40,
              fontWeight: 700,
              textTransform: "uppercase",
            }}
          >
            {value && value.trim()
              ? `${results.length} ${results.length === 1 ? "match" : "matches"} for "${value}"`
              : `Browse all ${STRATEGY_LIBRARY.length} strategies · type to filter`}
          </div>
          {results.map((s, idx) => {
            const cat = STRATEGY_CATEGORIES.find((c) => c.id === s.category);
            const isActive = idx === activeIdx;
            return (
              <button
                key={s.id}
                onClick={() => pick(s)}
                onMouseEnter={() => setActiveIdx(idx)}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  padding: "10px 12px",
                  background: isActive ? alpha.goldA06 : "transparent",
                  border: "none",
                  borderTop: idx > 0 ? `1px solid ${alpha.whiteA04}` : "none",
                  cursor: "pointer",
                  color: "inherit",
                  fontFamily: "inherit",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: colors.goldLight, display: "inline-flex", alignItems: "center", gap: 6 }}>
                    {s.featured && (
                      <span
                        style={{
                          background: colors.gold,
                          color: colors.green,
                          fontSize: 9,
                          fontWeight: 800,
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                          padding: "2px 6px",
                          borderRadius: 3,
                          lineHeight: 1,
                        }}
                      >
                        ★ Featured
                      </span>
                    )}
                    {s.name}
                  </span>
                  <span style={{ fontSize: 10, color: alpha.whiteA40, letterSpacing: "0.04em", whiteSpace: "nowrap" }}>
                    {cat?.short}
                  </span>
                </div>
                <div style={{ fontSize: 11, color: alpha.whiteA60, lineHeight: 1.4, marginTop: 3 }}>
                  {s.summary}
                </div>
                {s.scrutiny && (
                  <div
                    style={{
                      fontSize: 10,
                      color: SCRUTINY[s.scrutiny.level.toUpperCase()]?.color || colors.warn,
                      marginTop: 4,
                      fontWeight: 600,
                    }}
                  >
                    ⚠ {SCRUTINY[s.scrutiny.level.toUpperCase()]?.label}
                  </div>
                )}
              </button>
            );
          })}
          {results.length === 0 && (
            <div style={{ padding: 16, fontSize: 12, color: alpha.whiteA40, textAlign: "center" }}>
              No matches. Use the "Strategy not here?" prompt below.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ────────────────────────────────────────────────────────────────────────────
// StrategyInfoCard — compact info readout when a strategy is selected.
// Shows summary, IRC sections, type, scrutiny flag if present.
// ────────────────────────────────────────────────────────────────────────────
export const StrategyInfoCard = ({ strategy }) => {
  if (!strategy) return null;
  const cat = STRATEGY_CATEGORIES.find((c) => c.id === strategy.category);
  const scrutiny = strategy.scrutiny ? SCRUTINY[strategy.scrutiny.level.toUpperCase()] : null;
  const range = formatTypicalSavings(strategy.typicalSavings);

  return (
    <div
      style={{
        background: alpha.goldA06,
        border: `1px solid ${alpha.goldA30}`,
        borderRadius: radii.card,
        padding: "14px 16px",
        marginTop: 10,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontFamily: fonts.serif, fontSize: 15, color: colors.goldLight, fontWeight: 700 }}>
            {withAcronymTooltips(strategy.name)}
          </div>
          <div style={{ fontSize: 10, color: alpha.whiteA40, letterSpacing: "0.04em", marginTop: 2 }}>
            {cat?.label} · {strategy.type?.toUpperCase()} · {strategy.ircSections?.join(" · ")}
          </div>
        </div>
        {scrutiny && (
          <div
            style={{
              fontSize: 10,
              color: scrutiny.color,
              letterSpacing: "0.04em",
              fontWeight: 700,
              textTransform: "uppercase",
              background: scrutiny.color + "18",
              border: `1px solid ${scrutiny.color}66`,
              padding: "3px 8px",
              borderRadius: 999,
            }}
          >
            ⚠ {scrutiny.label}
          </div>
        )}
      </div>
      <div style={{ fontSize: 12, color: alpha.whiteA60, lineHeight: 1.55, marginTop: 8 }}>
        {strategy.summary}
      </div>
      {range && (
        <div style={{ fontSize: 11, color: alpha.whiteA60, marginTop: 8, lineHeight: 1.5 }}>
          <strong style={{ color: colors.goldLight }}>Typical savings:</strong> {range.range} — {range.basis}.{" "}
          <em style={{ color: alpha.whiteA40 }}>{range.disclaimer}</em>
        </div>
      )}
      {strategy.scrutiny && (
        <div
          style={{
            fontSize: 11,
            color: alpha.whiteA60,
            marginTop: 8,
            padding: "8px 10px",
            background: (scrutiny?.color || colors.warn) + "0a",
            borderLeft: `2px solid ${scrutiny?.color || colors.warn}`,
            borderRadius: 3,
            lineHeight: 1.5,
          }}
        >
          <strong style={{ color: scrutiny?.color || colors.warn }}>Why flagged:</strong>{" "}
          {strategy.scrutiny.reason}
        </div>
      )}
    </div>
  );
};

// ────────────────────────────────────────────────────────────────────────────
// StrategyRoadmap — implementation plan panel. Shows steps, owner, cost, etc.
// Consumed by LAUNCH when user picks a row's strategy.
// ────────────────────────────────────────────────────────────────────────────
export const StrategyRoadmap = ({ strategy }) => {
  if (!strategy || !strategy.implementation) return null;
  const impl = strategy.implementation;
  const fmt = (n) => n >= 1000 ? `$${Math.round(n / 1000)}K` : `$${n}`;

  return (
    <div
      style={{
        background: alpha.whiteA035,
        border: `1px solid ${alpha.goldA18}`,
        borderRadius: radii.card,
        padding: "16px 18px",
        marginTop: 10,
      }}
    >
      <SectionEyebrow>IMPLEMENTATION ROADMAP — {strategy.name}</SectionEyebrow>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
          gap: 10,
          marginBottom: 14,
        }}
      >
        <div>
          <div style={{ fontSize: 10, color: alpha.whiteA40, letterSpacing: "0.06em" }}>PRIMARY OWNER</div>
          <div style={{ fontSize: 13, color: colors.goldLight, fontWeight: 600, marginTop: 2 }}>
            {impl.primaryOwner}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: alpha.whiteA40, letterSpacing: "0.06em" }}>LEAD TIME</div>
          <div style={{ fontSize: 13, color: colors.goldLight, fontWeight: 600, marginTop: 2 }}>
            ~{impl.leadTimeWeeks} weeks
          </div>
        </div>
        {impl.costRange && (
          <div>
            <div style={{ fontSize: 10, color: alpha.whiteA40, letterSpacing: "0.06em" }}>TYPICAL COST</div>
            <div style={{ fontSize: 13, color: colors.goldLight, fontWeight: 600, marginTop: 2 }}>
              {impl.costRange.min === 0 && impl.costRange.max === 0
                ? "Free"
                : `${fmt(impl.costRange.min)} – ${fmt(impl.costRange.max)}`}
            </div>
            {impl.costRange.note && (
              <div style={{ fontSize: 10, color: alpha.whiteA40, marginTop: 2 }}>{impl.costRange.note}</div>
            )}
          </div>
        )}
      </div>

      <div style={{ fontSize: 10, letterSpacing: "0.08em", color: alpha.whiteA40, fontWeight: 700, marginBottom: 8, textTransform: "uppercase" }}>
        Steps
      </div>
      <div style={{ display: "grid", gap: 8 }}>
        {impl.steps.map((step, i) => (
          <div
            key={i}
            style={{
              display: "grid",
              gridTemplateColumns: "26px 1fr",
              gap: 10,
              alignItems: "start",
              padding: "8px 10px",
              background: alpha.blackA20,
              borderRadius: 6,
            }}
          >
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: "50%",
                background: colors.gold + "22",
                border: `1px solid ${colors.gold}66`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 10,
                fontWeight: 800,
                color: colors.gold,
                fontFamily: fonts.serif,
              }}
            >
              {i + 1}
            </div>
            <div style={{ fontSize: 12, color: alpha.whiteA60, lineHeight: 1.5 }}>{step}</div>
          </div>
        ))}
      </div>

      {impl.annualActivities && impl.annualActivities.length > 0 && (
        <>
          <div style={{ fontSize: 10, letterSpacing: "0.08em", color: alpha.whiteA40, fontWeight: 700, margin: "14px 0 8px", textTransform: "uppercase" }}>
            Annual Maintenance
          </div>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: alpha.whiteA60, lineHeight: 1.6 }}>
            {impl.annualActivities.map((a, i) => <li key={i}>{a}</li>)}
          </ul>
        </>
      )}

      {strategy.cpaQuestions && strategy.cpaQuestions.length > 0 && (
        <>
          <div style={{ fontSize: 10, letterSpacing: "0.08em", color: alpha.whiteA40, fontWeight: 700, margin: "14px 0 8px", textTransform: "uppercase" }}>
            Ask Your CPA
          </div>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: alpha.whiteA60, lineHeight: 1.6 }}>
            {strategy.cpaQuestions.map((q, i) => <li key={i}>{q}</li>)}
          </ul>
        </>
      )}
    </div>
  );
};

// ────────────────────────────────────────────────────────────────────────────
// StrategyChecklist — documentation requirements panel. Users check items off.
// Consumed by INSULATE per strategy.
// ────────────────────────────────────────────────────────────────────────────
export const StrategyChecklist = ({ strategy, checked = {}, onToggle }) => {
  if (!strategy || !strategy.documentation) return null;
  const doc = strategy.documentation;
  const requiredCount = doc.required.length;
  const checkedCount = doc.required.filter((_, i) => checked[i]).length;

  return (
    <div
      style={{
        background: alpha.whiteA035,
        border: `1px solid ${alpha.goldA18}`,
        borderRadius: radii.card,
        padding: "16px 18px",
        marginTop: 10,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8 }}>
        <SectionEyebrow>DOCUMENTATION CHECKLIST — {strategy.name}</SectionEyebrow>
        <div
          style={{
            fontSize: 11,
            color: checkedCount === requiredCount ? colors.success : colors.goldLight,
            fontWeight: 700,
          }}
        >
          {checkedCount} of {requiredCount} complete
        </div>
      </div>

      <div style={{ display: "grid", gap: 6, marginTop: 8 }}>
        {doc.required.map((item, i) => (
          <label
            key={i}
            style={{
              display: "grid",
              gridTemplateColumns: "20px 1fr",
              gap: 10,
              alignItems: "start",
              padding: "8px 10px",
              background: checked[i] ? colors.success + "08" : alpha.blackA20,
              borderRadius: 6,
              cursor: "pointer",
              border: `1px solid ${checked[i] ? colors.success + "33" : "transparent"}`,
            }}
          >
            <input
              type="checkbox"
              checked={!!checked[i]}
              onChange={() => onToggle && onToggle(i)}
              style={{ marginTop: 2, accentColor: colors.success, cursor: "pointer" }}
            />
            <div
              style={{
                fontSize: 12,
                color: checked[i] ? alpha.whiteA60 : "#fff",
                lineHeight: 1.5,
                textDecoration: checked[i] ? "line-through" : "none",
              }}
            >
              {item}
            </div>
          </label>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 14 }}>
        <div
          style={{
            padding: "10px 12px",
            background: alpha.blackA20,
            borderRadius: 6,
            borderLeft: `3px solid ${colors.goldLight}`,
          }}
        >
          <div style={{ fontSize: 10, color: alpha.whiteA40, letterSpacing: "0.06em", marginBottom: 4 }}>RETENTION</div>
          <div style={{ fontSize: 12, color: alpha.whiteA60, lineHeight: 1.5 }}>{doc.retention}</div>
        </div>
        <div
          style={{
            padding: "10px 12px",
            background: alpha.blackA20,
            borderRadius: 6,
            borderLeft: `3px solid ${colors.danger}`,
          }}
        >
          <div style={{ fontSize: 10, color: alpha.whiteA40, letterSpacing: "0.06em", marginBottom: 4 }}>AUDIT TRIGGERS</div>
          <ul style={{ margin: 0, paddingLeft: 14, fontSize: 11, color: alpha.whiteA60, lineHeight: 1.5 }}>
            {doc.auditTriggers.map((t, i) => <li key={i}>{t}</li>)}
          </ul>
        </div>
      </div>
    </div>
  );
};

// ────────────────────────────────────────────────────────────────────────────
// StrategyNotHere — copy-paste-to-AI prompt card. One variant per tab.
// Used when a user's strategy isn't in the library.
// ────────────────────────────────────────────────────────────────────────────
export const StrategyNotHere = ({ tab = "eliminate" }) => {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const prompt = STRATEGY_PROMPTS[tab];
  if (!prompt) return null;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(prompt.body);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback — select the textarea
    }
  };

  return (
    <div
      style={{
        background: alpha.whiteA035,
        border: `1px solid ${alpha.goldA30}`,
        borderRadius: radii.card,
        padding: "16px 20px",
        marginTop: 20,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
        <div>
          <SectionEyebrow>STRATEGY NOT IN THE LIBRARY?</SectionEyebrow>
          <div style={{ fontFamily: fonts.serif, fontSize: 16, color: colors.goldLight, fontWeight: 700 }}>
            {prompt.title}
          </div>
          <div style={{ fontSize: 12, color: alpha.whiteA60, marginTop: 4, lineHeight: 1.5 }}>
            {prompt.subtitle}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={copy}
            style={{
              background: copied ? colors.success : colors.gold,
              color: colors.green,
              border: "none",
              borderRadius: 6,
              padding: "8px 14px",
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.04em",
              cursor: "pointer",
              fontFamily: fonts.sans,
              textTransform: "uppercase",
              whiteSpace: "nowrap",
              transition: "background 120ms",
            }}
          >
            {copied ? "✓ Copied" : "📋 Copy Prompt"}
          </button>
          <button
            onClick={() => setExpanded((x) => !x)}
            style={{
              background: "transparent",
              color: alpha.whiteA60,
              border: `1px solid ${alpha.whiteA12}`,
              borderRadius: 6,
              padding: "8px 12px",
              fontSize: 11,
              cursor: "pointer",
              fontFamily: fonts.sans,
            }}
          >
            {expanded ? "Hide" : "Preview"}
          </button>
        </div>
      </div>

      {expanded && (
        <pre
          style={{
            marginTop: 12,
            padding: "12px 14px",
            background: colors.darker,
            border: `1px solid ${alpha.whiteA08}`,
            borderRadius: 6,
            fontSize: 11,
            lineHeight: 1.6,
            color: alpha.whiteA60,
            fontFamily: "ui-monospace, Menlo, Monaco, monospace",
            whiteSpace: "pre-wrap",
            maxHeight: 360,
            overflowY: "auto",
          }}
        >
          {prompt.body}
        </pre>
      )}
    </div>
  );
};
