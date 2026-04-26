import { useMemo, useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import {
  STRATEGY_CATEGORIES,
  IMPLEMENTATION_OWNERS,
  STRATEGY_STATUS,
  DISCLAIMER_IMPLEMENTATION,
} from "../../constants";
import { fmt, parseMoney } from "../../lib/math";
import { colors, alpha, fonts, styles } from "../../lib/theme";
import { useJSONField, usePersistence } from "../../hooks/usePersistence";
import {
  PageHeader,
  Card,
  Label,
  SubText,
  MoneyInput,
  TextInput,
  Select,
  Button,
  Callout,
  Disclaimer,
  KPI,
} from "../ui";
import {
  StrategyPicker,
  StrategyRoadmap,
  StrategyNotHere,
} from "../StrategyComponents";
import { strategyById } from "../../data/strategies";

// LAUNCH — LAUNCH (Week 5)
// Sub-tab: Implementation Timeline

// Helpers — month/year selector support
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const currentMonthLabel = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

const parseMonthLabel = (label) => {
  // "2026-06" → { year: 2026, month: 6 }
  if (!label || typeof label !== "string") return null;
  const m = label.match(/^(\d{4})-(\d{2})$/);
  if (!m) return null;
  return { year: parseInt(m[1], 10), month: parseInt(m[2], 10) };
};

// Months between a label (e.g. "2026-06") and today. Negative if in the past.
const monthsFromToday = (label) => {
  const parsed = parseMonthLabel(label);
  if (!parsed) return 0;
  const now = new Date();
  return (parsed.year - now.getFullYear()) * 12 + (parsed.month - (now.getMonth() + 1));
};

// Stable ID for a seeded row (deterministic — survives re-seeding before flush)
const seedId = (idx, name) =>
  `seed_${idx}_${(name || "").slice(0, 24).replace(/[^\w]+/g, "_")}`;

export const Launch = () => {
  const { get } = usePersistence();

  const pmtTarget = parseFloat(get("assess", "strategy_impact", "pmt", "0")) || 0;

  const keepRows = useMemo(() => {
    try { return JSON.parse(get("eliminate", "strategy_filter", "keep_rows", "[]") || "[]"); } catch { return []; }
  }, [get]);

  const [strategies, setStrategies] = useJSONField("launch", "implementation_timeline", "strategies", []);
  // Track which ELIMINATE Keep rows have been seeded — by their __id. This
  // lets us continuously sync new Keep entries forward, without re-seeding
  // ones the user has explicitly deleted or that are already present.
  const [seededKeepIds, setSeededKeepIds] = useJSONField("launch", "implementation_timeline", "seeded_keep_ids", []);

  useEffect(() => {
    if (keepRows.length === 0) return;
    const currentSeeded = new Set(seededKeepIds || []);
    const newKeepEntries = keepRows.filter((k) => k.__id && !currentSeeded.has(k.__id));
    if (newKeepEntries.length === 0) return;

    // Cap total LAUNCH rows at 10
    const room = Math.max(0, 10 - strategies.length);
    const toAdd = newKeepEntries.slice(0, room);
    if (toAdd.length === 0) {
      // No room — still mark all as seeded so they don't keep queuing
      setSeededKeepIds([...currentSeeded, ...newKeepEntries.map((k) => k.__id)]);
      return;
    }

    const seeded = toAdd.map((k, idx) => ({
      __id: seedId(strategies.length + idx, k.strategy),
      name: k.strategy || "",
      // Carry forward the library strategy id if the user picked one in ELIMINATE
      strategyId: k.__strategyId || "",
      category: "reduction",
      annualSavings: "",
      owner: "cpa",
      activationMonth: currentMonthLabel(),
      status: "planned",
      fromEliminate: true,
    }));
    setStrategies([...strategies, ...seeded]);
    setSeededKeepIds([...currentSeeded, ...newKeepEntries.map((k) => k.__id)]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keepRows]);

  const add = () => {
    if (strategies.length >= 10) return;
    setStrategies([
      ...strategies,
      {
        __id: `row_${Date.now()}_${strategies.length}`,
        name: "",
        category: "reduction",
        annualSavings: "",
        owner: "cpa",
        activationMonth: currentMonthLabel(),
        status: "planned",
      },
    ]);
  };

  const update = (id, field, value) => {
    setStrategies(strategies.map((s) => {
      if (s.__id !== id) return s;
      const patch = { [field]: value };
      // Clear the "pre-populated from ELIMINATE" hint once the participant touches the row
      if (s.fromEliminate && (field === "name" || field === "annualSavings")) {
        patch.fromEliminate = false;
      }
      return { ...s, ...patch };
    }));
  };
  const remove = (id) => setStrategies(strategies.filter((s) => s.__id !== id));
  const move = (id, delta) => {
    const idx = strategies.findIndex((s) => s.__id === id);
    if (idx < 0) return;
    const next = [...strategies];
    const target = idx + delta;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    setStrategies(next);
  };

  // Totals
  const totalActive = strategies
    .filter((s) => s.status === "active")
    .reduce((sum, s) => sum + (parseMoney(s.annualSavings) || 0), 0);
  const totalAll = strategies.reduce((sum, s) => sum + (parseMoney(s.annualSavings) || 0), 0);
  const selfOwnedRows = strategies.filter((s) => s.owner === "self");
  const selfOwnedAmount = selfOwnedRows.reduce((sum, s) => sum + (parseMoney(s.annualSavings) || 0), 0);
  const professionalRows = strategies.filter((s) => s.owner !== "self");
  const professionalAmount = professionalRows.reduce((sum, s) => sum + (parseMoney(s.annualSavings) || 0), 0);

  // Latest activation among entered strategies (for "full run rate" KPI)
  const latestActivation = useMemo(() => {
    let best = null;
    strategies.forEach((s) => {
      const parsed = parseMonthLabel(s.activationMonth);
      if (!parsed) return;
      const key = parsed.year * 12 + parsed.month;
      if (!best || key > best.key) best = { key, label: `${MONTH_NAMES[parsed.month - 1]} ${parsed.year}` };
    });
    return best?.label || "—";
  }, [strategies]);

  // Chart data — rolling 36 month window starting from today.
  // X-axis shows month offset 0..35; labels render as "MMM 'YY".
  const chartData = useMemo(() => {
    const months = 36;
    const now = new Date();
    const data = [];
    for (let m = 0; m < months; m++) {
      const d = new Date(now.getFullYear(), now.getMonth() + m, 1);
      const row = {
        month: m,
        label: `${MONTH_NAMES[d.getMonth()].slice(0, 3)} '${String(d.getFullYear()).slice(2)}`,
      };
      strategies.forEach((s, i) => {
        const savings = parseMoney(s.annualSavings) || 0;
        const offset = Math.max(0, monthsFromToday(s.activationMonth));
        row[`s_${i}`] = m >= offset ? savings : 0;
      });
      data.push(row);
    }
    return data;
  }, [strategies]);

  const stripeColors = [
    colors.gold, colors.goldLight, colors.success, colors.purple,
    "#60a5fa", "#f472b6", "#34d399", "#a78bfa", "#fb923c", "#22d3ee",
  ];

  // Over/under uses ACTIVE strategies only (per v2.0 LAUNCH spec).
  const overUnder = totalActive - pmtTarget;
  const overUnderBand = Math.abs(overUnder) < Math.max(1000, pmtTarget * 0.05); // dead-zone to avoid flutter

  // Years for activation-year selector — today through today + 5 years.
  const yearOptions = useMemo(() => {
    const y = new Date().getFullYear();
    return Array.from({ length: 6 }, (_, i) => y + i);
  }, []);

  const anySeeded = strategies.some((s) => s.fromEliminate);

  return (
    <div>
      <PageHeader
        title="LAUNCH — Implementation Timeline"
        subtitle="Convert your strategy short list into a timeline. Who executes what, when it activates, what it's worth annually."
      />

      {anySeeded && (
        <Callout tone="success">
          {keepRows.length} {keepRows.length === 1 ? "strategy" : "strategies"} pre-populated from your ELIMINATE Keep list. Fill in the implementation details below — this hint disappears once you start editing.
        </Callout>
      )}

      <Card>
        {strategies.length === 0 ? (
          <div
            style={{
              padding: "30px 20px",
              background: alpha.whiteA04,
              borderRadius: 8,
              border: `1px dashed ${alpha.goldA18}`,
              textAlign: "center",
              fontSize: 13,
              color: alpha.whiteA40,
            }}
          >
            No strategies yet. Click <strong>Add Strategy</strong> to start your implementation plan (up to 10).
          </div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {strategies.map((s, idx) => (
              <StrategyRow
                key={s.__id}
                strategy={s}
                color={stripeColors[idx % stripeColors.length]}
                yearOptions={yearOptions}
                onChange={(field, value) => update(s.__id, field, value)}
                onRemove={() => remove(s.__id)}
                onMoveUp={idx > 0 ? () => move(s.__id, -1) : null}
                onMoveDown={idx < strategies.length - 1 ? () => move(s.__id, 1) : null}
              />
            ))}
          </div>
        )}
        <div style={{ marginTop: 14 }}>
          <Button variant="ghost" onClick={add} disabled={strategies.length >= 10}>
            + Add Strategy {strategies.length >= 10 ? "(max reached)" : `(${strategies.length}/10)`}
          </Button>
        </div>
      </Card>

      {strategies.length > 0 && (
        <>
          <Card>
            <Label>Cumulative Annual Savings — rolling 36-month window</Label>
            <div style={{ height: 300, marginTop: 12 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <CartesianGrid stroke={alpha.goldA12} strokeDasharray="3 3" />
                  <XAxis
                    dataKey="label"
                    stroke={alpha.whiteA40}
                    tick={{ fontSize: 10 }}
                    interval={2}
                  />
                  <YAxis
                    stroke={alpha.whiteA40}
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) => (v >= 1e6 ? `$${(v / 1e6).toFixed(1)}M` : `$${Math.round(v / 1000)}K`)}
                  />
                  <Tooltip
                    contentStyle={{ background: colors.darker, border: `1px solid ${alpha.goldA30}`, borderRadius: 6 }}
                    formatter={(v, name) => [fmt(v), strategies[parseInt(name.split("_")[1], 10)]?.name || "Strategy"]}
                    labelFormatter={(l) => l}
                  />
                  {pmtTarget > 0 && (
                    <ReferenceLine
                      y={pmtTarget}
                      stroke={colors.gold}
                      strokeDasharray="6 4"
                      label={{
                        value: `Your ASSESS PMT target: $${Math.round(pmtTarget).toLocaleString()}/yr`,
                        fill: colors.gold,
                        fontSize: 11,
                        position: "insideTopRight",
                      }}
                    />
                  )}
                  {strategies.map((s, i) => (
                    <Area
                      key={s.__id}
                      type="step"
                      dataKey={`s_${i}`}
                      stackId="1"
                      stroke={stripeColors[i % stripeColors.length]}
                      fill={stripeColors[i % stripeColors.length]}
                      fillOpacity={0.55}
                      isAnimationActive={false}
                    />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <SubText>
              Each colored band is one strategy, starting at its activation month. The dashed gold line is your ASSESS PMT target. As strategies activate, the gap to target closes.
            </SubText>
          </Card>

          <Card tone="gold">
            <Label>Summary</Label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginTop: 10 }}>
              <KPI label="Total annual savings (all)" value={fmt(totalAll)} sub={`${strategies.length} row${strategies.length === 1 ? "" : "s"}`} />
              <KPI label="Active strategies, full run rate" value={fmt(totalActive)} sub={`${strategies.filter((s) => s.status === "active").length} active`} />
              <KPI label="Self-executable" value={fmt(selfOwnedAmount)} sub={`${selfOwnedRows.length} row${selfOwnedRows.length === 1 ? "" : "s"}`} />
              <KPI label="Estimated full run-rate by" value={latestActivation} />
            </div>
          </Card>

          {pmtTarget > 0 && !overUnderBand && (
            overUnder > 0 ? (
              <Callout tone="success">
                Your active strategies generate <strong>{fmt(overUnder)}</strong> more than your ASSESS PMT target. That's excess capital — revisit the Capital Placement Allocator in TARGET to put it to work.
              </Callout>
            ) : (
              <Callout tone="warn">
                Your current <em>active</em> strategies fall short of your ASSESS PMT target by <strong>{fmt(Math.abs(overUnder))}/yr</strong>. Consider whether additional strategies from your ELIMINATE Keep list are worth activating — or adjust your PMT target in ASSESS.
              </Callout>
            )
          )}

          {pmtTarget > 0 && overUnderBand && (
            <Callout tone="gold">
              Your active strategies are within ±5% of your ASSESS PMT target ({fmt(totalActive)} vs. {fmt(pmtTarget)}). That's alignment.
            </Callout>
          )}
        </>
      )}

      <Disclaimer>{DISCLAIMER_IMPLEMENTATION}</Disclaimer>

      <StrategyNotHere tab="launch" />
    </div>
  );
};

const StrategyRow = ({
  strategy, color, yearOptions, onChange, onRemove, onMoveUp, onMoveDown,
}) => {
  const parsed = parseMonthLabel(strategy.activationMonth) || { year: new Date().getFullYear(), month: new Date().getMonth() + 1 };
  const [roadmapOpen, setRoadmapOpen] = useState(false);
  const libStrategy = strategy.strategyId ? strategyById(strategy.strategyId) : null;

  const onMonthChange = (m) => {
    const mm = String(parseInt(m, 10)).padStart(2, "0");
    onChange("activationMonth", `${parsed.year}-${mm}`);
  };
  const onYearChange = (y) => {
    const mm = String(parsed.month).padStart(2, "0");
    onChange("activationMonth", `${y}-${mm}`);
  };

  return (
    <div
      style={{
        padding: "12px 14px",
        background: alpha.whiteA04,
        border: `1px solid ${alpha.goldA12}`,
        borderRadius: 8,
        borderLeft: `4px solid ${color}`,
        position: "relative",
      }}
    >
      <div style={{ position: "absolute", top: 8, right: 8, display: "flex", gap: 4 }}>
        {libStrategy && (
          <IconBtn
            onClick={() => setRoadmapOpen((o) => !o)}
            label={roadmapOpen ? "▲" : "📋"}
            title={roadmapOpen ? "Hide roadmap" : "Show implementation roadmap"}
          />
        )}
        {onMoveUp && <IconBtn onClick={onMoveUp} label="↑" title="Move up" />}
        {onMoveDown && <IconBtn onClick={onMoveDown} label="↓" title="Move down" />}
        <IconBtn onClick={onRemove} label="×" title="Remove" />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 0.8fr 0.8fr", gap: 10, paddingRight: 120 }}>
        <div>
          <Label>Strategy name</Label>
          <StrategyPicker
            value={strategy.name}
            onChange={(v) => {
              onChange("name", v);
              if (strategy.strategyId) onChange("strategyId", "");
            }}
            onSelect={(s) => {
              onChange("name", s.name);
              onChange("strategyId", s.id);
            }}
          />
        </div>
        <div>
          <Label>Category</Label>
          <Select
            value={strategy.category}
            onChange={(v) => onChange("category", v)}
            options={STRATEGY_CATEGORIES.map((c) => ({ value: c.key, label: c.label }))}
          />
        </div>
        <div>
          <Label>Annual savings</Label>
          <MoneyInput value={strategy.annualSavings} onChange={(v) => onChange("annualSavings", v)} placeholder="$0" />
        </div>
        <div>
          <Label>Owner</Label>
          <Select
            value={strategy.owner}
            onChange={(v) => onChange("owner", v)}
            options={IMPLEMENTATION_OWNERS.map((o) => ({ value: o.key, label: o.label }))}
          />
        </div>
        <div>
          <Label>Status</Label>
          <Select
            value={strategy.status}
            onChange={(v) => onChange("status", v)}
            options={STRATEGY_STATUS.map((s) => ({ value: s.key, label: s.label }))}
          />
        </div>
        <div>
          <Label>Month</Label>
          <Select
            value={String(parsed.month)}
            onChange={onMonthChange}
            options={MONTH_NAMES.map((n, i) => ({ value: String(i + 1), label: n }))}
          />
        </div>
        <div>
          <Label>Year</Label>
          <Select
            value={String(parsed.year)}
            onChange={onYearChange}
            options={yearOptions.map((y) => ({ value: String(y), label: String(y) }))}
          />
        </div>
      </div>
      {roadmapOpen && libStrategy && <StrategyRoadmap strategy={libStrategy} />}
    </div>
  );
};

const IconBtn = ({ onClick, label, title }) => (
  <button
    onClick={onClick}
    aria-label={title || label}
    title={title || label}
    style={{
      width: 24, height: 24,
      background: "transparent",
      border: `1px solid ${alpha.whiteA12}`,
      color: alpha.whiteA60,
      borderRadius: 4,
      cursor: "pointer",
      fontSize: 13,
      lineHeight: 1,
      display: "grid",
      placeItems: "center",
      fontFamily: "inherit",
    }}
  >
    {label}
  </button>
);
