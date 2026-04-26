import { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { LIFESTYLE_KEYS, DISCLAIMER_CAPITAL } from "../../constants";
import {
  solveR,
  lifestyleToFV,
  blendedReturn,
  foundationCoverage,
  timeToThreshold,
  fmt,
  fmtPct,
  parseMoney,
} from "../../lib/math";
import { colors, alpha, fonts, styles } from "../../lib/theme";
import { useField, usePersistence } from "../../hooks/usePersistence";
import {
  PageHeader,
  Card,
  Label,
  SubText,
  MoneyInput,
  PercentInput,
  TextInput,
  KPI,
  Callout,
  Disclaimer,
  DependencyPrompt,
  SectionEyebrow,
  VerdictHero,
  BeforeAfter,
} from "../ui";

// TARGET — TARGET (Week 7)
// Sub-tab: Capital Placement (Foundation / Swing / Liquidity)

export const Target = () => {
  const { get } = usePersistence();

  // EXODUS base inputs
  const pv = get("exodus", "root", "pv", "");
  const n = get("exodus", "root", "n", "10");
  const inflation = get("exodus", "root", "inflation", "3");
  const yieldRate = get("exodus", "root", "yield_rate", "0.07");
  const vals = (() => {
    try { return JSON.parse(get("exodus", "root", "lifestyle_vals", "{}") || "{}"); } catch { return {}; }
  })();
  const pvVal = parseMoney(pv);
  const nVal = parseFloat(n) || 10;
  const infPct = parseFloat(inflation) || 0;
  const yVal = parseFloat(yieldRate) || 0.07;

  const { fv, annualToday: lifestyleTotal } = useMemo(
    () => lifestyleToFV({
      monthlyVals: vals, categoryKeys: LIFESTYLE_KEYS, inflationPct: infPct, yieldRate: yVal, nYears: nVal,
    }),
    [vals, infPct, yVal, nVal]
  );
  const r1 = solveR(pvVal, fv, nVal);

  // LAUNCH freed capital estimate — sum of ACTIVE strategy savings × nVal.
  // Per v2.0 spec: "Total estimated annual savings (all active strategies at
  // full run rate)". Using all statuses would overstate pre-fill.
  const launchStrategies = (() => {
    try { return JSON.parse(get("launch", "implementation_timeline", "strategies", "[]") || "[]"); } catch { return []; }
  })();
  const annualSavings = launchStrategies
    .filter((x) => x.status === "active")
    .reduce((s, x) => s + (parseMoney(x.annualSavings) || 0), 0);
  const freedCapitalEstimate = Math.round(annualSavings * nVal);

  // Allocation inputs
  const [totalCapital, setTotalCapital] = useField(
    "target", "capital_placement", "total_capital",
    freedCapitalEstimate > 0 ? `$${freedCapitalEstimate.toLocaleString()}` : ""
  );
  const liqDefault = lifestyleTotal > 0 ? Math.round((lifestyleTotal / 12) * 4) : 0;
  const [liquidity, setLiquidity] = useField(
    "target", "capital_placement", "liquidity",
    liqDefault > 0 ? `$${liqDefault.toLocaleString()}` : ""
  );
  const [foundation, setFoundation] = useField("target", "capital_placement", "foundation", "");
  const [foundationYield, setFoundationYield] = useField("target", "capital_placement", "foundation_yield", "6");
  const [swingReturn, setSwingReturn] = useField("target", "capital_placement", "swing_return", "15");
  const [threshold, setThreshold] = useField(
    "target", "capital_placement", "lifestyle_threshold",
    lifestyleTotal > 0 ? `$${Math.round(lifestyleTotal).toLocaleString()}` : ""
  );

  const total = parseMoney(totalCapital);
  const liq = parseMoney(liquidity);
  const fnd = parseMoney(foundation);
  const swing = Math.max(0, total - liq - fnd);
  const deployed = total - liq;

  const fyPct = parseFloat(foundationYield) || 0;
  const syPct = parseFloat(swingReturn) || 0;
  const thr = parseMoney(threshold);

  const blendedR = blendedReturn({
    foundation$: fnd, foundationYield: fyPct, swing$: swing, swingReturn: syPct,
  });
  const blendedVsR = blendedR !== null && r1 !== null ? blendedR - r1 : null;
  const coverage = foundationCoverage({
    foundation$: fnd, foundationYield: fyPct, lifestyleThreshold: thr,
  });
  const coverageRatio = coverage?.ratio ?? null;

  const coverageBand = useMemo(() => {
    if (coverageRatio === null) return { label: "—", color: alpha.whiteA40 };
    if (coverageRatio >= 1) return { label: "Threshold 1 reached — work optional", color: colors.success };
    if (coverageRatio >= 0.75) return { label: "Approaching threshold — within range", color: colors.goldLight };
    if (coverageRatio >= 0.5) return { label: "Building — Foundation is the priority", color: colors.warn };
    return { label: "Early stage — continue compounding", color: colors.danger };
  }, [coverageRatio]);

  const yearsToThreshold = timeToThreshold({
    foundation$: fnd,
    foundationYield: fyPct,
    lifestyleThreshold: thr,
    annualAddition: annualSavings,
  });

  if (pvVal <= 0 || !r1) {
    return (
      <div>
        <PageHeader title="TARGET — Capital Placement" />
        <DependencyPrompt message="Complete your Freedom Formula in EXODUS first — this tab compares your allocation's blended return against your required r." />
      </div>
    );
  }

  // Donut segment colors per v2.0 spec: Liquidity = gray, Foundation =
  // dark green #1A3C2E, Swing = gold #C4A265.
  const donutData = [
    { name: "Liquidity Reserve", value: liq,   color: "#6b6b6b" },
    { name: "Foundation",        value: fnd,   color: colors.green },
    { name: "Swing",             value: swing, color: colors.gold },
  ].filter((d) => d.value > 0);

  return (
    <div>
      <PageHeader
        title="TARGET — Capital Placement"
        subtitle="Allocate your freed capital into Foundation, Swing, and Liquidity. See whether the blended return clears your required r, and how close you are to Threshold 1."
      />

      <Card>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <Label>Total Available Capital</Label>
            <MoneyInput value={totalCapital} onChange={setTotalCapital} placeholder="$0" />
            {freedCapitalEstimate > 0 && (
              <SubText style={{ marginTop: 4 }}>
                Pre-filled from LAUNCH: {fmt(annualSavings)}/yr × {nVal} yrs ≈ {fmt(freedCapitalEstimate)}. Override with your actual number.
              </SubText>
            )}
          </div>
          <div>
            <Label>Liquidity Reserve</Label>
            <MoneyInput value={liquidity} onChange={setLiquidity} placeholder="$0" />
            <SubText style={{ marginTop: 4 }}>
              How much cash do you need accessible at all times? Typically 3–6 months of lifestyle expenses. Non-negotiable; funded before any capital deploys.
            </SubText>
          </div>
        </div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Card style={{ marginBottom: 0, borderLeft: `4px solid ${colors.green}` }}>
          <Label>Foundation (Layer 1 — sustain)</Label>
          <SubText style={{ marginBottom: 10 }}>
            Income-generating base — dividend portfolios, RE cash flow, private credit. Its job is to sustain your life indefinitely.
          </SubText>
          <Label>Foundation capital</Label>
          <MoneyInput value={foundation} onChange={setFoundation} placeholder="$0" />
          <div style={{ marginTop: 12 }}>
            <Label>Expected Foundation yield (%)</Label>
            <PercentInput value={foundationYield} onChange={setFoundationYield} step="0.25" min={0} max={20} />
            <SubText style={{ marginTop: 4 }}>Conservative Foundation vehicles typically yield 4–8%. Use your actual allocation mix — not an aspiration.</SubText>
          </div>
        </Card>

        <Card style={{ marginBottom: 0, borderLeft: `4px solid ${colors.gold}` }}>
          <Label>Swing (Layer 2 — asymmetric)</Label>
          <SubText style={{ marginBottom: 10 }}>
            Every dollar above lifestyle need. Job is asymmetric — early-stage PE, self-directed Roth, direct business investment.
          </SubText>
          <Label>Swing capital (remainder)</Label>
          <div
            style={{
              ...styles.input,
              background: alpha.whiteA04,
              color: colors.gold,
              fontWeight: 700,
            }}
          >
            {fmt(swing)}
          </div>
          <div style={{ marginTop: 12 }}>
            <Label>Expected Swing return (%)</Label>
            <PercentInput value={swingReturn} onChange={setSwingReturn} step="0.5" min={0} max={50} />
            <SubText style={{ marginTop: 4 }}>
              Swing capital targets asymmetric returns — 15%+ for PE/private credit, higher for early-stage. Use a conservative blended estimate across your actual positions.
            </SubText>
          </div>
        </Card>
      </div>

      <Card>
        <Label>Foundation Lifestyle Threshold (Threshold 1)</Label>
        <MoneyInput value={threshold} onChange={setThreshold} placeholder="$0" />
        <SubText style={{ marginTop: 4 }}>
          Pre-filled from your EXODUS lifestyle total ({fmt(lifestyleTotal)}). This is the annual income the Foundation must produce to make work optional.
        </SubText>
      </Card>

      {/* Coverage — VerdictHero style */}
      <VerdictHero
        label="FOUNDATION COVERAGE"
        band={coverageBand.label}
        value={coverageRatio !== null ? `${Math.round(coverageRatio * 100)}%` : "—"}
        valueSub="of Threshold 1"
        color={coverageBand.color}
        detail={`Foundation annual income: ${fmt(coverage?.income ?? 0)} · Lifestyle threshold: ${fmt(thr)}`}
      />

      {/* Blended r vs. required r — BeforeAfter comparison */}
      <Card>
        <SectionEyebrow>BLENDED r vs. REQUIRED r</SectionEyebrow>
        <BeforeAfter
          beforeLabel="Required (EXODUS)"
          before={fmtPct(r1)}
          afterLabel="Your Allocation"
          after={fmtPct(blendedR)}
          color={blendedVsR !== null && blendedVsR > 0 ? colors.success : colors.danger}
          beforeColor={colors.goldLight}
        />
        {blendedVsR !== null && (
          <div
            style={{
              textAlign: "center",
              marginTop: 12,
              fontFamily: fonts.serif,
              fontSize: 20,
              fontWeight: 800,
              color: blendedVsR > 0 ? colors.success : colors.danger,
            }}
          >
            {blendedVsR > 0 ? "+" : ""}{(blendedVsR * 100).toFixed(2)}% {blendedVsR > 0 ? "surplus" : "gap"}
          </div>
        )}
        <SubText style={{ marginTop: 10, textAlign: "center" }}>
          r is the floor, not the target. Precisely at r leaves no margin. A sound deployment strategy targets meaningfully above r.
        </SubText>
      </Card>

      <Card>
        <Label>Allocation Donut</Label>
        <div style={{ height: 260, marginTop: 12 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={donutData.length > 0 ? donutData : [{ name: "—", value: 1, color: alpha.whiteA12 }]}
                innerRadius={70}
                outerRadius={110}
                paddingAngle={2}
                dataKey="value"
                label={(d) => (deployed > 0 ? `${d.name} — ${Math.round((d.value / Math.max(total, 1)) * 100)}%` : "")}
                labelLine={false}
              >
                {(donutData.length > 0 ? donutData : [{ color: alpha.whiteA12 }]).map((entry, idx) => (
                  <Cell key={idx} fill={entry.color} stroke={colors.dark} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: colors.darker, border: `1px solid ${alpha.goldA30}`, borderRadius: 6 }}
                formatter={(v) => fmt(v)}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {yearsToThreshold !== null && yearsToThreshold > 0 && (
        <Callout tone="gold" title="Time to Threshold 1">
          At this allocation, your Foundation covers your lifestyle in <strong>Year {yearsToThreshold}</strong> (
          {new Date().getFullYear() + yearsToThreshold}).
        </Callout>
      )}

      {coverageRatio !== null && coverageRatio >= 0.5 && (
        <Callout tone="success" title="The Infinity Loop is running">
          Your Foundation is generating meaningful passive income. Every dollar it produces is a dollar that compresses your required W-2 income — which compresses your tax liability — which frees more capital to compound. The Infinity Loop is running.
        </Callout>
      )}

      {/* Threshold 2 — abundant optionality (lesson plan canonical) */}
      {coverageRatio !== null && (
        <Card tone="gold">
          <SectionEyebrow>THRESHOLD 1 vs THRESHOLD 2</SectionEyebrow>
          <SubText style={{ marginBottom: 12 }}>
            <strong>Threshold 1</strong> = Foundation income equals lifestyle. Work becomes optional.
            {" "}
            <strong>Threshold 2</strong> = Foundation income equals 2× lifestyle. Permanent surplus, self-sustaining swing capital.
          </SubText>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div
              style={{
                padding: "12px 14px",
                background: alpha.blackA20,
                borderRadius: 6,
                borderLeft: `3px solid ${coverageBand.color}`,
              }}
            >
              <div style={{ fontSize: 10, color: alpha.whiteA40, letterSpacing: "0.06em" }}>THRESHOLD 1 COVERAGE</div>
              <div style={{ fontFamily: fonts.serif, fontSize: 24, color: coverageBand.color, fontWeight: 800, marginTop: 4 }}>
                {Math.round(coverageRatio * 100)}%
              </div>
              <div style={{ fontSize: 11, color: alpha.whiteA60, marginTop: 4 }}>
                {coverageRatio >= 1
                  ? "Reached. Work is optional."
                  : `Need ${fmt(thr - (coverage?.income ?? 0))}/yr more Foundation income.`}
              </div>
            </div>
            <div
              style={{
                padding: "12px 14px",
                background: alpha.blackA20,
                borderRadius: 6,
                borderLeft: `3px solid ${coverageRatio >= 2 ? colors.success : alpha.whiteA40}`,
              }}
            >
              <div style={{ fontSize: 10, color: alpha.whiteA40, letterSpacing: "0.06em" }}>THRESHOLD 2 COVERAGE</div>
              <div
                style={{
                  fontFamily: fonts.serif,
                  fontSize: 24,
                  color: coverageRatio >= 2 ? colors.success : alpha.whiteA60,
                  fontWeight: 800,
                  marginTop: 4,
                }}
              >
                {Math.round((coverageRatio / 2) * 100)}%
              </div>
              <div style={{ fontSize: 11, color: alpha.whiteA60, marginTop: 4 }}>
                {coverageRatio >= 2
                  ? "Reached. Permanent surplus."
                  : `Need ${fmt(2 * thr - (coverage?.income ?? 0))}/yr Foundation income to reach 2×.`}
              </div>
            </div>
          </div>
        </Card>
      )}

      <CapitalDeploymentRules />

      <Disclaimer>{DISCLAIMER_CAPITAL}</Disclaimer>
    </div>
  );
};

// Capital Deployment Rules — 5 user-authored rules per Week 7 lesson plan.
// Persisted free-text fields. Helper-text gives the rule's purpose; user
// writes the rule in their own words.
const RULES = [
  {
    key: "foundation_threshold",
    label: "1. Foundation Threshold Rule",
    helper: "What % of total assets goes to Foundation before any Swing deployment?",
    placeholder: "e.g. Foundation reaches Threshold 1 (full lifestyle coverage) before Swing receives any new capital.",
  },
  {
    key: "liquidity",
    label: "2. Liquidity Rule",
    helper: "How much liquid reserve do you keep, and what events can it cover?",
    placeholder: "e.g. 6 months of family-unit lifestyle expenses + 3 months of vehicle-specific reserves, in HYSA / Treasuries.",
  },
  {
    key: "bucket_order",
    label: "3. Bucket Order Rule",
    helper: "What's the priority order for filling tax-advantaged space each year?",
    placeholder: "e.g. Match → HSA → 401(k) → Backdoor Roth → Mega Backdoor → Solo 401(k) / DB Plan.",
  },
  {
    key: "guardrail",
    label: "4. Guardrail Rule",
    helper: "What single trade or position can you NOT take, regardless of opportunity?",
    placeholder: "e.g. No single position above 10% of net worth. No HELOC for investment capital. No syndication unless I've personally met the operator.",
  },
  {
    key: "confirmation",
    label: "5. Confirmation Rule",
    helper: "What sign-offs are required before deploying significant capital?",
    placeholder: "e.g. Any deployment above $100K requires CPA sign-off + 48hr cooling-off period + spouse/family-unit awareness.",
  },
];

const CapitalDeploymentRules = () => (
  <Card>
    <SectionEyebrow>5 CAPITAL DEPLOYMENT RULES (your operating constitution)</SectionEyebrow>
    <SubText style={{ marginBottom: 14 }}>
      Per the Week 7 lesson, your deployment system needs five rules — written in <em>your</em> words. They're the filter every future capital decision passes through. Saved automatically.
    </SubText>
    <div style={{ display: "grid", gap: 10 }}>
      {RULES.map((r) => <RuleField key={r.key} rule={r} />)}
    </div>
    <SubText style={{ marginTop: 10, fontStyle: "italic" }}>
      Revisit annually in Week 8 (YIELD). Rules update only when reality changes.
    </SubText>
  </Card>
);

const RuleField = ({ rule }) => {
  const [value, setValue] = useField("target", "capital_placement", `rule_${rule.key}`, "");
  return (
    <div
      style={{
        padding: "10px 12px",
        background: alpha.whiteA04,
        border: `1px solid ${alpha.goldA12}`,
        borderRadius: 6,
        borderLeft: `3px solid ${colors.gold}`,
      }}
    >
      <Label>{rule.label}</Label>
      <SubText style={{ marginBottom: 6, fontSize: 11 }}>{rule.helper}</SubText>
      <TextInput
        value={value}
        onChange={setValue}
        placeholder={rule.placeholder}
        multiline
        rows={2}
      />
    </div>
  );
};

const tdLeft = {
  padding: "8px 0",
  color: alpha.whiteA60,
  fontSize: 13,
  borderBottom: `1px solid ${alpha.goldA12}`,
};
const tdRight = {
  padding: "8px 0",
  textAlign: "right",
  fontFamily: fonts.serif,
  fontWeight: 700,
  color: "#fff",
  fontSize: 15,
  borderBottom: `1px solid ${alpha.goldA12}`,
};
