import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import { LIFESTYLE_KEYS, DISCLAIMER_STRATEGY_IMPACT } from "../../constants";
import {
  solveR,
  solveRWithContrib,
  solveNWithContrib,
  calcFVWithContrib,
  lifestyleToFV,
  verdict,
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
  Slider,
  KPI,
  Callout,
  Disclaimer,
  DependencyPrompt,
  SectionEyebrow,
  HeroNumber,
  PerspectiveCard,
} from "../ui";
import { StrategyNotHere } from "../StrategyComponents";
import { strategyById, formatTypicalSavings } from "../../data/strategies";

// ASSESS — ASSESS (Week 4)
// Sub-tab: Strategy Impact

export const Assess = () => {
  const { get } = usePersistence();

  // Read EXODUS
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

  const { fv } = useMemo(
    () => lifestyleToFV({
      monthlyVals: vals, categoryKeys: LIFESTYLE_KEYS, inflationPct: infPct, yieldRate: yVal, nYears: nVal,
    }),
    [vals, infPct, yVal, nVal]
  );
  const r1 = solveR(pvVal, fv, nVal);

  // PMT input — lives in ASSESS scope
  const [pmtStr, setPmtStr] = useField("assess", "strategy_impact", "pmt", "0");
  const pmt = parseFloat(pmtStr) || 0;

  // ELIMINATE Keep list count
  const keepRows = (() => {
    try { return JSON.parse(get("eliminate", "strategy_filter", "keep_rows", "[]") || "[]"); } catch { return []; }
  })();

  // All hooks must be called before any early return. Gate the math on valid
  // upstream data, but compute the memo unconditionally.
  const hasBase = pvVal > 0 && fv > 0 && r1 !== null;

  // Three scenarios (safe when hasBase === false; returns sane fallbacks)
  const newR = hasBase && pmt > 0 ? solveRWithContrib(pvVal, fv, nVal, pmt) : r1;
  const newN = hasBase && pmt > 0 ? solveNWithContrib(pvVal, fv, r1, pmt) : nVal;
  const biggerFV = hasBase && pmt > 0 ? calcFVWithContrib(pvVal, r1, nVal, pmt) : fv;

  const deltaRPct = hasBase && newR !== null ? (r1 - newR) * 100 : 0;
  const deltaNMonths = hasBase && newN !== null && nVal > 0 ? Math.round((nVal - newN) * 12) : 0;
  const deltaYears = Math.floor(deltaNMonths / 12);
  const deltaRemMonths = deltaNMonths % 12;
  const fvExcess = biggerFV - fv;

  // Chart data — cumulative FV over years, with and without PMT.
  // Must be called before any conditional return (rules of hooks).
  const fvSeries = useMemo(() => {
    if (!hasBase) return [];
    const pts = [];
    for (let y = 0; y <= nVal; y++) {
      pts.push({
        year: y,
        baseline: Math.round(calcFVWithContrib(pvVal, r1, y, 0)),
        withPmt: Math.round(calcFVWithContrib(pvVal, r1, y, pmt)),
      });
    }
    return pts;
  }, [hasBase, pvVal, r1, nVal, pmt]);

  if (!hasBase) {
    return (
      <div>
        <PageHeader title="ASSESS — Strategy Impact" />
        <DependencyPrompt message="Complete your Freedom Formula in EXODUS first — this tab builds on your PV, FV, timeline, and required return." />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="ASSESS — Strategy Impact"
        subtitle="Your CPA validates the dollar number. This tab shows what that number does to your Freedom Formula — three ways."
      />

      {keepRows.length > 0 ? (
        <Callout tone="success">
          You have <strong>{keepRows.length}</strong> {keepRows.length === 1 ? "strategy" : "strategies"} on your Keep list from ELIMINATE. Use your CPA's estimated annual savings across those strategies below.
        </Callout>
      ) : (
        <Callout tone="warn">
          Your Keep list is empty. You can still use this tab by entering a total estimated savings number below — but running ELIMINATE first identifies which strategies belong in this calculation.
        </Callout>
      )}

      {/* Library reference — typical savings ranges for Keep-list library strategies */}
      {keepRows.filter((k) => k.__strategyId && strategyById(k.__strategyId)?.typicalSavings).length > 0 && (
        <Card tone="gold">
          <SectionEyebrow>LIBRARY REFERENCE — typical savings ranges</SectionEyebrow>
          <SubText style={{ marginBottom: 10 }}>
            For each Keep-list strategy linked to the library, here's the typical range CPAs validate across client profiles. Sum the ranges that apply to you for a PMT estimate grounded in data.
          </SubText>
          <div style={{ display: "grid", gap: 8 }}>
            {keepRows
              .filter((k) => k.__strategyId)
              .map((k) => {
                const lib = strategyById(k.__strategyId);
                if (!lib?.typicalSavings) return null;
                const range = formatTypicalSavings(lib.typicalSavings);
                return (
                  <div
                    key={k.__id || lib.id}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 12,
                      padding: "10px 12px",
                      background: alpha.blackA20,
                      borderRadius: 6,
                      borderLeft: `3px solid ${colors.goldLight}`,
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 13, color: colors.goldLight, fontWeight: 700 }}>
                        {lib.name}
                      </div>
                      <div style={{ fontSize: 11, color: alpha.whiteA40, marginTop: 2 }}>
                        {lib.type?.toUpperCase()} · {lib.ircSections?.join(" · ")}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontFamily: fonts.serif, fontSize: 15, color: colors.goldLight, fontWeight: 700 }}>
                        {range.range}
                      </div>
                      <div style={{ fontSize: 10, color: alpha.whiteA40, marginTop: 2, lineHeight: 1.4 }}>
                        {range.basis}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
          <SubText style={{ marginTop: 10, fontStyle: "italic" }}>
            We don't compute — your CPA will validate. These ranges are what CPAs see across client profiles, not a guarantee of your specific savings.
          </SubText>
        </Card>
      )}

      <Card>
        <Slider
          label="Estimated Annual Tax Savings from Strategies"
          value={pmt}
          onChange={(v) => setPmtStr(String(v))}
          min={0}
          max={200000}
          step={5000}
          display={`${fmt(pmt)}/yr`}
          sub="Your CPA validates the number. This shows what it does to your Freedom Formula."
        />
      </Card>

      <div style={{ textAlign: "center", margin: "20px 0 16px" }}>
        <SectionEyebrow color={alpha.whiteA40}>
          THREE WAYS THE SAME LEVER CHANGES YOUR EQUATION
        </SectionEyebrow>
      </div>

      <PerspectiveCard
        num="1"
        color={colors.success}
        title="Easier Path — Lower r"
        subtitle="Same goal, same timeline — but the mountain shrinks"
      >
        <div style={{ textAlign: "center", padding: "4px 0" }}>
          <div style={{ fontFamily: fonts.serif, fontSize: 36, fontWeight: 800, color: colors.success, lineHeight: 1 }}>
            {fmtPct(newR)}
          </div>
          <div style={{ color: alpha.whiteA60, fontSize: 12, marginTop: 8, lineHeight: 1.5 }}>
            <strong style={{ color: colors.success }}>{deltaRPct.toFixed(1)}%</strong> lower required return — hold n and FV, solve for new r.
          </div>
        </div>
      </PerspectiveCard>

      <PerspectiveCard
        num="2"
        color={colors.gold}
        title="Sooner Freedom — Shorter n"
        subtitle="Same return, same goal — arrive earlier"
      >
        <div style={{ textAlign: "center", padding: "4px 0" }}>
          <div style={{ fontFamily: fonts.serif, fontSize: 36, fontWeight: 800, color: colors.gold, lineHeight: 1 }}>
            {deltaNMonths > 0 ? `${deltaYears}y ${deltaRemMonths}m sooner` : "—"}
          </div>
          <div style={{ color: alpha.whiteA60, fontSize: 12, marginTop: 8, lineHeight: 1.5 }}>
            Hold r and FV; solve for shorter n. Freedom arrives{" "}
            {deltaNMonths > 0 && <strong style={{ color: colors.gold }}>{deltaYears} years, {deltaRemMonths} months</strong>}{" "}earlier.
          </div>
        </div>
      </PerspectiveCard>

      <PerspectiveCard
        num="3"
        color={colors.purple}
        title="Bigger Machine — Larger FV"
        subtitle="Same return, same timeline — your machine just gets bigger"
      >
        <div style={{ textAlign: "center", padding: "4px 0" }}>
          <div style={{ fontFamily: fonts.serif, fontSize: 36, fontWeight: 800, color: colors.purple, lineHeight: 1 }}>
            +{fmt(fvExcess)}
          </div>
          <div style={{ color: alpha.whiteA60, fontSize: 12, marginTop: 8, lineHeight: 1.5 }}>
            Hold r and n; calculate bigger FV. Your machine exceeds target by <strong style={{ color: colors.purple }}>{fmt(fvExcess)}</strong>.
          </div>
        </div>
      </PerspectiveCard>

      <Card>
        <Label>Cumulative FV over time</Label>
        <div style={{ height: 300, marginTop: 12 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={fvSeries}>
              <CartesianGrid stroke={alpha.goldA12} strokeDasharray="3 3" />
              <XAxis dataKey="year" stroke={alpha.whiteA40} tick={{ fontSize: 11 }} label={{ value: "Years", position: "insideBottom", offset: -4, fill: alpha.whiteA40, fontSize: 11 }} />
              <YAxis stroke={alpha.whiteA40} tick={{ fontSize: 11 }} tickFormatter={(v) => (v >= 1e6 ? `$${(v / 1e6).toFixed(1)}M` : `$${Math.round(v / 1000)}K`)} />
              <Tooltip
                contentStyle={{ background: colors.darker, border: `1px solid ${alpha.goldA30}`, borderRadius: 6 }}
                formatter={(v) => fmt(v)}
                labelFormatter={(l) => `Year ${l}`}
              />
              <ReferenceLine y={fv} stroke={colors.gold} strokeDasharray="4 4" label={{ value: `FV target ${fmt(fv)}`, fill: colors.gold, fontSize: 10, position: "insideTopRight" }} />
              <Line type="monotone" dataKey="baseline" stroke={alpha.whiteA40} strokeWidth={2} dot={false} name="Baseline (no PMT)" />
              <Line type="monotone" dataKey="withPmt" stroke={colors.success} strokeWidth={2.5} dot={false} name={`With $${pmt.toLocaleString()}/yr`} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card>
        <Label>r Comparison</Label>
        <div style={{ height: 180, marginTop: 12 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={[
                { label: "Without PMT", r: (r1 * 100).toFixed(2), color: verdict(r1).color },
                { label: "With PMT", r: (newR * 100).toFixed(2), color: verdict(newR).color },
              ]}
              layout="vertical"
            >
              <CartesianGrid stroke={alpha.goldA12} strokeDasharray="3 3" />
              <XAxis type="number" stroke={alpha.whiteA40} tick={{ fontSize: 11 }} unit="%" />
              <YAxis type="category" dataKey="label" stroke={alpha.whiteA40} tick={{ fontSize: 12 }} width={110} />
              <Tooltip
                contentStyle={{ background: colors.darker, border: `1px solid ${alpha.goldA30}`, borderRadius: 6 }}
                formatter={(v) => `${v}%`}
              />
              <Bar dataKey="r">
                <Cell fill={verdict(r1).color} />
                <Cell fill={verdict(newR).color} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Callout tone="gold">
        At <strong>{fmt(pmt)}/yr</strong> in recovered tax capital — contributed over {nVal} years — you can arrive{" "}
        <strong>{deltaYears}y {deltaRemMonths}m sooner</strong>, build a machine <strong>{fmt(fvExcess)}</strong> larger, or need{" "}
        <strong>{deltaRPct.toFixed(1)}%</strong> less annual return. In practice, you blend all three. The point is: the lever is real and the math proves it.
      </Callout>

      <Disclaimer>{DISCLAIMER_STRATEGY_IMPACT}</Disclaimer>

      <StrategyNotHere tab="assess" />
    </div>
  );
};
