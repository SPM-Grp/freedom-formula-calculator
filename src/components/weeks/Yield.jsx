import { useMemo, useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { LIFESTYLE_KEYS, BLS_CPI_URL } from "../../constants";
import {
  solveR,
  lifestyleToFV,
  breakEven as computeBreakEven,
  recalibrateFV,
  fmt,
  fmtPct,
  parseMoney,
} from "../../lib/math";
import { colors, alpha, fonts, styles } from "../../lib/theme";
import { useField, usePersistence, useFreedomLog } from "../../hooks/usePersistence";
// useField used for programStartYear; usePersistence for cross-tab reads;
// useFreedomLog for the append-only log.
import { supabaseConfigured } from "../../lib/supabase";
import {
  PageHeader,
  Card,
  Label,
  SubText,
  MoneyInput,
  PercentInput,
  NumberInput,
  TextInput,
  Button,
  Callout,
  SectionEyebrow,
} from "../ui";
import { useState as useReactState } from "react";

// YIELD — YIELD (Week 8)
// Sub-tab: Track Your Freedom. NEVER LOCKS.

// Classify annual recalibration into one of 4 spec outcomes.
const classifyRecalibration = (prev, next) => {
  if (!prev || !next) return null;
  const nDrop = (prev.n_remaining || 0) - (next.n_remaining || 0);
  if (Math.abs(nDrop - 1) > 0.5) {
    return {
      label: "n recalibration warranted",
      tone: "warn",
      body:
        "Your timeline shifted by more than a year. Either the Foundation is approaching Threshold 1 early, or an income disruption has extended n. Adjust n in EXODUS to reflect current reality; r recalculates automatically.",
    };
  }
  const rPrev = prev.r_required;
  const rNext = next.r_required;
  if (rPrev == null || rNext == null) return null;
  const delta = (rNext - rPrev) * 100;
  if (delta < -0.25) {
    return {
      label: "r has decreased — you're ahead of pace",
      tone: "success",
      body: "PV grew faster than the FV target re-inflated. Maintain the strategy stack; continue compounding.",
    };
  }
  if (delta > 0.25) {
    return {
      label: "r has increased — there's a gap to close",
      tone: "warn",
      body:
        "PV decreased or FV grew faster than PV. Recalibrate levers: Can n extend? Can FV adjust? Does the strategy stack need more?",
    };
  }
  return {
    label: "r is unchanged — strategies are implementation-stage",
    tone: "gold",
    body:
      "PV hasn't moved yet — strategies take time to produce savings. Confirm team and timeline from LAUNCH; check-in at the next annual CPA meeting.",
  };
};

export const Yield = ({ auth }) => {
  const { get } = usePersistence();
  const user = auth?.user;

  // EXODUS baseline inputs
  const pv = get("exodus", "root", "pv", "");
  const n = get("exodus", "root", "n", "10");
  const inflation = get("exodus", "root", "inflation", "3");
  const yieldRate = get("exodus", "root", "yield_rate", "0.07");
  const etr = get("exodus", "root", "effective_tax_rate", "35");
  const vals = (() => {
    try { return JSON.parse(get("exodus", "root", "lifestyle_vals", "{}") || "{}"); } catch { return {}; }
  })();

  const pvVal = parseMoney(pv);
  const nVal = parseFloat(n) || 10;
  const infPct = parseFloat(inflation) || 0;
  const yVal = parseFloat(yieldRate) || 0.07;
  const etrPct = parseFloat(etr) || 35;

  const { fv: fvBase } = useMemo(
    () => lifestyleToFV({
      monthlyVals: vals, categoryKeys: LIFESTYLE_KEYS, inflationPct: infPct, yieldRate: yVal, nYears: nVal,
    }),
    [vals, infPct, yVal, nVal]
  );
  const r1Base = solveR(pvVal, fvBase, nVal);
  const beBase = computeBreakEven(infPct, etrPct);

  // Program start year — persistent. First-time users land at current year.
  const [programStartYear, setProgramStartYear] = useField(
    "yield", "track_your_freedom", "program_start_year", String(new Date().getFullYear())
  );
  useEffect(() => {
    // Ensure we have a persisted start year ASAP.
    if (!programStartYear) setProgramStartYear(String(new Date().getFullYear()));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const startYear = parseInt(programStartYear, 10) || new Date().getFullYear();

  const { rows: serverRows, append, updateNotes } = useFreedomLog(user);
  const [localRows, setLocalRows] = useState([]);
  const persistedRows = (user ? serverRows : localRows).slice().sort((a, b) => (a.year || 0) - (b.year || 0));

  // Synthetic Row 1 baseline derived from EXODUS, keyed to programStartYear.
  const row1 = useMemo(() => {
    if (!pvVal || !fvBase || !r1Base) return null;
    return {
      id: "row1",
      year: startYear,
      pv: pvVal,
      fv_adjusted: fvBase,
      r_required: r1Base,
      r_breakeven: beBase,
      effective_tax_rate: etrPct / 100,
      cpi_used: infPct / 100,
      n_remaining: nVal,
      strategy_summary: "Freedom Formula baseline (from EXODUS)",
      notes: "Program start — captured from EXODUS.",
      readonly: true,
    };
  }, [pvVal, fvBase, r1Base, beBase, etrPct, infPct, nVal, startYear]);

  // Combine + dedupe (if a persisted row has the same year as startYear, show it instead of synthetic baseline).
  const allRows = useMemo(() => {
    const hasPersistedForStart = persistedRows.some((r) => r.year === startYear);
    const base = !hasPersistedForStart && row1 ? [row1] : [];
    return [...base, ...persistedRows];
  }, [row1, persistedRows, startYear]);

  // Add-row form
  const initialNextYear = () => {
    if (persistedRows.length > 0) {
      return Math.max(...persistedRows.map((r) => r.year || 0)) + 1;
    }
    return startYear + 1;
  };
  const [formYear, setFormYear] = useState(initialNextYear);
  const [formPV, setFormPV] = useState("");
  const [formCPI, setFormCPI] = useState("3");
  const [formETR, setFormETR] = useState(String(etrPct || 35));
  const [formStrategy, setFormStrategy] = useState("");
  const [formNotes, setFormNotes] = useState("");

  useEffect(() => {
    setFormYear(initialNextYear());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [persistedRows.length, startYear]);

  const yearAlreadyLogged = persistedRows.some((r) => r.year === formYear);

  const handleAdd = async () => {
    if (!row1) return;
    const yearsElapsed = Math.max(0, formYear - startYear);
    const nRem = Math.max(0, nVal - yearsElapsed);
    const pvNew = parseMoney(formPV);
    const cpiPct = parseFloat(formCPI) || 0;
    const etrNew = parseFloat(formETR) || etrPct;

    const fvAdjusted = recalibrateFV({ fvOriginal: fvBase, cpiPct, nRemaining: nRem });
    const rRequired = pvNew > 0 && fvAdjusted > 0 && nRem > 0 ? solveR(pvNew, fvAdjusted, nRem) : null;
    const rBreakeven = computeBreakEven(cpiPct, etrNew);

    const payload = {
      year: formYear,
      pv: pvNew,
      fv_adjusted: fvAdjusted,
      r_required: rRequired,
      r_breakeven: rBreakeven,
      effective_tax_rate: etrNew / 100,
      cpi_used: cpiPct / 100,
      n_remaining: nRem,
      strategy_summary: formStrategy,
      notes: formNotes,
    };

    if (user) {
      const res = await append(payload);
      if (res?.error) return;
    } else {
      setLocalRows((rs) => [...rs, { ...payload, id: `local_${rs.length}_${formYear}` }]);
    }

    // Advance form to next year, reset inputs.
    setFormYear(formYear + 1);
    setFormPV("");
    setFormStrategy("");
    setFormNotes("");
  };

  // CSV export — RFC 4180 compliant (CRLF, double-escape internal quotes).
  const csvEscape = (v) => {
    if (v === null || v === undefined) return "";
    const s = String(v);
    return `"${s.replace(/"/g, '""')}"`;
  };
  const exportCSV = () => {
    const headers = [
      "Year", "PV", "FV (inflation-adjusted)", "r required", "r break-even",
      "Effective Tax Rate", "CPI used", "n remaining", "Strategy summary", "Notes",
    ];
    const rows = allRows.map((r) => [
      r.year,
      r.pv,
      r.fv_adjusted,
      r.r_required != null ? (r.r_required * 100).toFixed(2) + "%" : "",
      r.r_breakeven != null ? (r.r_breakeven * 100).toFixed(2) + "%" : "",
      r.effective_tax_rate != null ? (r.effective_tax_rate * 100).toFixed(2) + "%" : "",
      r.cpi_used != null ? (r.cpi_used * 100).toFixed(2) + "%" : "",
      r.n_remaining ?? "",
      r.strategy_summary ?? "",
      r.notes ?? "",
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map(csvEscape).join(","))
      .join("\r\n");
    // UTF-8 BOM helps Excel detect encoding
    const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const email = (user?.email || "guest").replace(/[^a-z0-9_.-]/gi, "_");
    const date = new Date().toISOString().slice(0, 10);
    a.download = `CLEAR_Freedom_Log_${email}_${date}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Chart data
  const chartData = allRows.map((r) => ({
    year: r.year,
    pv: Math.round(r.pv || 0),
    fv: Math.round(r.fv_adjusted || 0),
    rRequired: r.r_required != null ? +(r.r_required * 100).toFixed(2) : null,
    rBreakeven: r.r_breakeven != null ? +(r.r_breakeven * 100).toFixed(2) : null,
  }));

  const latest = allRows[allRows.length - 1];
  const baseline = allRows[0];
  const showBeforeAfter = allRows.length >= 2;

  // Classify the most recent year vs. the prior year.
  const latestClassification = useMemo(() => {
    if (allRows.length < 2) return null;
    return classifyRecalibration(allRows[allRows.length - 2], latest);
  }, [allRows, latest]);

  return (
    <div>
      <PageHeader
        title="YIELD — Track Your Freedom"
        subtitle="Your living record. One row per year, forever. Add a row every year. Enter the prior year's CPI. Watch r decline as PV grows. In year ten, ten rows are the proof."
      />

      {!user && !auth?.configured && (
        <Callout tone="gold">
          <strong>You're viewing the YIELD tab as a visitor.</strong> Your baseline row comes from your EXODUS inputs on this device. To save additional rows permanently year over year, sign in with Google. This record grows with you — whether or not you're in the program.
        </Callout>
      )}

      {!row1 && (
        <Callout tone="warn">
          Complete EXODUS Steps 1 and 2 first. Your baseline row populates from those inputs.
        </Callout>
      )}

      {latestClassification && (
        <Callout tone={latestClassification.tone} title={`Most recent recalibration — ${latestClassification.label}`}>
          {latestClassification.body}
        </Callout>
      )}

      {showBeforeAfter && (
        <Card tone="gold">
          <Label>Before / After</Label>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 8 }}>
              <thead>
                <tr>
                  <th style={th}></th>
                  <th style={{ ...th, textAlign: "right" }}>When You Started</th>
                  <th style={{ ...th, textAlign: "right" }}>Today</th>
                  <th style={{ ...th, textAlign: "right" }}>Δ</th>
                </tr>
              </thead>
              <tbody>
                <BARow label="Year" before={baseline.year} after={latest.year} />
                <BARow label="PV" before={fmt(baseline.pv)} after={fmt(latest.pv)} delta={fmt((latest.pv || 0) - (baseline.pv || 0))} />
                <BARow label="FV Target" before={fmt(baseline.fv_adjusted)} after={fmt(latest.fv_adjusted)} />
                <BARow label="Required r" before={fmtPct(baseline.r_required)} after={fmtPct(latest.r_required)} />
                <BARow label="Break-even r" before={fmtPct(baseline.r_breakeven)} after={fmtPct(latest.r_breakeven)} />
                <BARow label="Effective Tax Rate" before={fmtPct(baseline.effective_tax_rate)} after={fmtPct(latest.effective_tax_rate)} />
                <BARow label="Years Remaining" before={baseline.n_remaining} after={latest.n_remaining} />
              </tbody>
            </table>
          </div>
          <SubText style={{ marginTop: 8, fontStyle: "italic" }}>
            That gap is the system working. Add a row every year.
          </SubText>
        </Card>
      )}

      {chartData.length >= 2 && (
        <>
          <Card>
            <Label>PV vs. FV target (inflation-adjusted)</Label>
            <div style={{ height: 260, marginTop: 12 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid stroke={alpha.goldA12} strokeDasharray="3 3" />
                  <XAxis dataKey="year" stroke={alpha.whiteA40} tick={{ fontSize: 11 }} />
                  <YAxis stroke={alpha.whiteA40} tick={{ fontSize: 11 }} tickFormatter={(v) => (v >= 1e6 ? `$${(v / 1e6).toFixed(1)}M` : `$${Math.round(v / 1000)}K`)} />
                  <Tooltip
                    contentStyle={{ background: colors.darker, border: `1px solid ${alpha.goldA30}`, borderRadius: 6 }}
                    formatter={(v) => fmt(v)}
                  />
                  <Legend wrapperStyle={{ fontSize: 11, color: alpha.whiteA60 }} />
                  <Line type="monotone" dataKey="pv" name="PV (actual)" stroke={colors.success} strokeWidth={2.5} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="fv" name="FV target" stroke={colors.gold} strokeWidth={2} strokeDasharray="5 3" dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
          <Card>
            <Label>r trend</Label>
            <div style={{ height: 220, marginTop: 12 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid stroke={alpha.goldA12} strokeDasharray="3 3" />
                  <XAxis dataKey="year" stroke={alpha.whiteA40} tick={{ fontSize: 11 }} />
                  <YAxis stroke={alpha.whiteA40} tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
                  <Tooltip
                    contentStyle={{ background: colors.darker, border: `1px solid ${alpha.goldA30}`, borderRadius: 6 }}
                    formatter={(v) => `${v}%`}
                  />
                  <Legend wrapperStyle={{ fontSize: 11, color: alpha.whiteA60 }} />
                  <Line type="monotone" dataKey="rRequired" name="Required r" stroke={colors.goldLight} strokeWidth={2.5} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="rBreakeven" name="Break-even r" stroke={colors.danger} strokeWidth={2} strokeDasharray="5 3" dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </>
      )}

      <Card>
        <Label>Your Log</Label>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 8 }}>
            <thead>
              <tr>
                <th style={th}>Year</th>
                <th style={{ ...th, textAlign: "right" }}>PV</th>
                <th style={{ ...th, textAlign: "right" }}>FV adj.</th>
                <th style={{ ...th, textAlign: "right" }}>r req.</th>
                <th style={{ ...th, textAlign: "right" }}>Break-even</th>
                <th style={{ ...th, textAlign: "right" }}>ETR</th>
                <th style={{ ...th, textAlign: "right" }}>CPI</th>
                <th style={{ ...th, textAlign: "right" }}>n left</th>
                <th style={th}>Notes</th>
              </tr>
            </thead>
            <tbody>
              {allRows.map((r) => (
                <tr key={r.id}>
                  <td style={tdCell}>
                    {r.year}
                    {r.readonly && <div style={{ fontSize: 9, color: alpha.whiteA40, letterSpacing: "0.08em", textTransform: "uppercase", marginTop: 2 }}>baseline</div>}
                  </td>
                  <td style={tdCellR}>{fmt(r.pv)}</td>
                  <td style={tdCellR}>{fmt(r.fv_adjusted)}</td>
                  <td style={tdCellR}>{fmtPct(r.r_required)}</td>
                  <td style={tdCellR}>{fmtPct(r.r_breakeven)}</td>
                  <td style={tdCellR}>{fmtPct(r.effective_tax_rate)}</td>
                  <td style={tdCellR}>{fmtPct(r.cpi_used)}</td>
                  <td style={tdCellR}>{r.n_remaining}</td>
                  <td style={tdCell}>
                    {r.readonly ? (
                      <span style={{ color: alpha.whiteA40, fontStyle: "italic" }}>{r.notes}</span>
                    ) : user ? (
                      <TextInput
                        value={r.notes || ""}
                        onChange={(v) => updateNotes(r.id, v)}
                        placeholder="…"
                      />
                    ) : (
                      <span>{r.notes}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <SubText style={{ marginTop: 8 }}>
          Rows are append-only. Notes can be updated; other fields are permanent once saved.
        </SubText>
      </Card>

      {row1 && (
        <Card tone="gold">
          <Label>Add This Year's Entry</Label>
          <SubText style={{ marginBottom: 10 }}>
            Go to <a href={BLS_CPI_URL} target="_blank" rel="noopener noreferrer" style={{ color: colors.goldLight }}>bls.gov/cpi</a> → CPI → CPI for All Urban Consumers (CPI-U) → find the prior year's 12-month percentage change for December. Enter that number below as CPI.
          </SubText>
          {yearAlreadyLogged && (
            <SubText style={{ color: colors.warn, marginBottom: 10 }}>
              You already have a row for {formYear}. Rows cannot be overwritten — change the year or update notes on the existing row.
            </SubText>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
            <div>
              <Label>Year</Label>
              <NumberInput value={formYear} onChange={(v) => setFormYear(parseInt(v, 10) || formYear)} min={2020} max={2100} />
            </div>
            <div>
              <Label>Current PV</Label>
              <MoneyInput value={formPV} onChange={setFormPV} placeholder="$0" />
            </div>
            <div>
              <Label>Prior Year CPI (%)</Label>
              <PercentInput value={formCPI} onChange={setFormCPI} step="0.1" min={-5} max={15} />
            </div>
            <div>
              <Label>Effective tax rate (%)</Label>
              <PercentInput value={formETR} onChange={setFormETR} step="0.5" min={0} max={60} />
            </div>
          </div>
          <div style={{ marginTop: 10 }}>
            <Label>Strategy summary (one sentence)</Label>
            <TextInput value={formStrategy} onChange={setFormStrategy} placeholder="Activated cost seg; added backdoor Roth; retired SALT cap planning." />
          </div>
          <div style={{ marginTop: 10 }}>
            <Label>Notes</Label>
            <TextInput value={formNotes} onChange={setFormNotes} placeholder="…" multiline rows={2} />
          </div>
          <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <Button onClick={handleAdd} disabled={!parseMoney(formPV) || yearAlreadyLogged}>
              Add Row
            </Button>
            <Button variant="ghost" onClick={exportCSV}>Export Log (CSV)</Button>
            {!user && supabaseConfigured && (
              <span style={{ color: alpha.whiteA40, fontSize: 12 }}>
                Sign in to save rows permanently.
              </span>
            )}
          </div>
        </Card>
      )}

      <Callout tone="gold" title="FV Recalibration">
        <code style={{ fontFamily: fonts.serif, color: colors.goldLight, fontSize: 14 }}>
          FV_adjusted = FV_original × (1 + CPI%)^n_remaining
        </code>
        <div style={{ marginTop: 6 }}>
          Each new row recalibrates your FV target against the prior year's CPI. Your required r recalculates automatically against the new PV / FV / n_remaining.
        </div>
      </Callout>

      {/* Annual Law Review Prompt — copy-to-clipboard artifact (Week 8 canonical) */}
      <AnnualLawReviewPrompt />

      {/* Permanent Operating Calendar */}
      <OperatingCalendar />

      {/* Annual CPA Meeting Agenda */}
      <CPAMeetingAgenda />

      {/* Event Trigger List */}
      <EventTriggerList />
    </div>
  );
};

// ─── Annual Law Review Prompt ─────────────────────────────────────────────
const ANNUAL_LAW_REVIEW = `I am a high-income W-2 earner / business owner with the following active tax strategies:

[LIST YOUR STRATEGIES HERE — one per line. Pull from your LAUNCH Implementation Timeline.]

Please summarize any changes in U.S. tax law from the past 12 months that may affect these specific strategies. For each strategy affected, describe:
1. What changed
2. How it affects my strategy (stronger, weaker, or eliminated)
3. What question I should bring to my CPA

Focus only on changes relevant to my strategy list. Skip everything else.`;

const AnnualLawReviewPrompt = () => {
  const [copied, setCopied] = useReactState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(ANNUAL_LAW_REVIEW);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };
  return (
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 10 }}>
        <div>
          <SectionEyebrow>ANNUAL LAW REVIEW PROMPT</SectionEyebrow>
          <SubText style={{ marginBottom: 0 }}>
            Run this once per year (January is ideal) against any AI tool. Output goes to your annual CPA meeting.
          </SubText>
        </div>
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
          }}
        >
          {copied ? "✓ Copied" : "📋 Copy Prompt"}
        </button>
      </div>
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
          maxHeight: 300,
          overflowY: "auto",
        }}
      >
        {ANNUAL_LAW_REVIEW}
      </pre>
    </Card>
  );
};

// ─── Permanent Operating Calendar (Week 8 canonical) ───────────────────────
const CALENDAR_ITEMS = [
  { when: "January",   what: "New retirement plan limits published. Run the Annual Law Review prompt.",                 cadence: "Annual" },
  { when: "February",  what: "Verify HSA contribution windows are open with your custodian.",                           cadence: "Annual" },
  { when: "Q1",        what: "Annual CPA meeting (use the 8-item agenda below). Add this year's YIELD row.",          cadence: "Annual" },
  { when: "April",     what: "Confirm tax filing complete; deferred contributions made if extension was used.",        cadence: "Annual" },
  { when: "May",       what: "Charitable capacity check post-AGI: how much room is left at 60% AGI cap?",              cadence: "Annual" },
  { when: "November",  what: "Year-end tax actions window opens. Asymmetric charitable contribution closes early-mid month.", cadence: "Annual" },
  { when: "Dec 31",    what: "All current-year actions must be complete (most contributions, sales, conversions).",   cadence: "Annual" },
  { when: "Every event", what: "Trigger the event protocol — see list below.",                                          cadence: "Event-based" },
];

const OperatingCalendar = () => (
  <Card>
    <SectionEyebrow>PERMANENT OPERATING CALENDAR</SectionEyebrow>
    <SubText style={{ marginBottom: 12 }}>
      The rhythm that keeps the system running once the program ends. Add these to your actual calendar.
    </SubText>
    <div style={{ display: "grid", gap: 6 }}>
      {CALENDAR_ITEMS.map((item, i) => (
        <div
          key={i}
          style={{
            display: "grid",
            gridTemplateColumns: "120px 1fr 110px",
            gap: 12,
            padding: "8px 12px",
            background: alpha.whiteA04,
            borderRadius: 6,
            borderLeft: `3px solid ${colors.gold}`,
            fontSize: 12,
          }}
        >
          <div style={{ fontFamily: fonts.serif, fontWeight: 700, color: colors.goldLight }}>{item.when}</div>
          <div style={{ color: alpha.whiteA60, lineHeight: 1.5 }}>{item.what}</div>
          <div style={{ fontSize: 10, color: alpha.whiteA40, letterSpacing: "0.05em", textTransform: "uppercase", textAlign: "right" }}>
            {item.cadence}
          </div>
        </div>
      ))}
    </div>
  </Card>
);

// ─── Annual CPA Meeting Agenda — 8 items, ~70 minutes (Week 8 canonical) ───
const CPA_AGENDA = [
  { item: "Track Your Freedom — new YIELD row",        minutes: 10, why: "Walk the CPA through this year's row. Show the chart." },
  { item: "Deferred tax inventory review",              minutes: 10, why: "Every deferred dollar is a future liability. Track the running total." },
  { item: "Strategy stack audit",                       minutes: 15, why: "For each active strategy: still in place? Still defensible? Still optimal?" },
  { item: "Strategy offboarding",                       minutes: 5,  why: "Are there strategies I'm no longer running that I can retire from the stack?" },
  { item: "AGI review (vs. thresholds)",                minutes: 10, why: "Where did AGI land? Which gates did we cross or stay below?" },
  { item: "Year-end actions",                           minutes: 10, why: "What must close by Dec 31 vs. what can extend? Bunching opportunities?" },
  { item: "Next year posture",                          minutes: 5,  why: "Anything in the income picture that would change strategy stack next year?" },
  { item: "Trigger event review",                       minutes: 5,  why: "Did any trigger events happen this year that we need to retroactively address?" },
];

const CPAMeetingAgenda = () => {
  const total = CPA_AGENDA.reduce((s, a) => s + a.minutes, 0);
  return (
    <Card>
      <SectionEyebrow>ANNUAL CPA MEETING AGENDA — {total} minutes</SectionEyebrow>
      <SubText style={{ marginBottom: 12 }}>
        Your meeting is structured. Hand this to your CPA in advance. Block the full {total} minutes.
      </SubText>
      <div style={{ display: "grid", gap: 6 }}>
        {CPA_AGENDA.map((a, i) => (
          <div
            key={i}
            style={{
              display: "grid",
              gridTemplateColumns: "32px 1fr 50px",
              gap: 12,
              padding: "8px 12px",
              background: alpha.whiteA04,
              borderRadius: 6,
              alignItems: "start",
            }}
          >
            <div style={{ fontFamily: fonts.serif, fontWeight: 800, color: colors.gold, fontSize: 14 }}>
              {i + 1}.
            </div>
            <div>
              <div style={{ color: "#fff", fontSize: 12, fontWeight: 700 }}>{a.item}</div>
              <div style={{ color: alpha.whiteA60, fontSize: 11, marginTop: 3, lineHeight: 1.5 }}>{a.why}</div>
            </div>
            <div style={{ fontFamily: fonts.serif, color: colors.goldLight, fontSize: 12, fontWeight: 700, textAlign: "right" }}>
              {a.minutes}m
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

// ─── Event Trigger List — 12 events × 3-tier protocol (Week 8 canonical) ───
const EVENT_TRIGGERS = [
  { event: "Marriage / partnership change",     tier: "Tier 1", why: "Filing status, AGI thresholds, beneficiaries, strategy eligibility shift." },
  { event: "Birth / adoption",                   tier: "Tier 1", why: "Dependents, FMC potential, education, tax credits." },
  { event: "Divorce / separation",               tier: "Tier 1", why: "Filing status, retirement splits, basis transfers, residence rules." },
  { event: "Death of a family-unit member",      tier: "Tier 1", why: "Stepped-up basis, beneficiary designations, estate planning." },
  { event: "Job change / new W-2 employer",      tier: "Tier 2", why: "401(k) rollover, NQDC review, benefit re-elections." },
  { event: "Business sale / acquisition",        tier: "Tier 1", why: "QSBS check, §1031, installment sale, allocation per §1060." },
  { event: "Real estate purchase / sale",        tier: "Tier 2", why: "Cost seg potential, §1031 timing, REPS hours plan." },
  { event: "Major liquidity event (RSU, IPO, K-1 distribution)", tier: "Tier 1", why: "Charitable acceleration, NQDC election, tax bunching." },
  { event: "Inheritance received",               tier: "Tier 1", why: "Stepped-up basis, holding period, IRA inherited rules." },
  { event: "Move to a different state",          tier: "Tier 2", why: "State tax exposure, residency rules, NQDC sourcing, Roth conversion timing." },
  { event: "Retirement / work optional",         tier: "Tier 1", why: "Roth conversion ladder, ACA premium subsidy planning, Social Security claiming." },
  { event: "Health event affecting work",        tier: "Tier 2", why: "Disability income, HSA distributions, ACA, withdrawal sequencing." },
];

const EventTriggerList = () => {
  const [filter, setFilter] = useReactState("all");
  const filtered = filter === "all" ? EVENT_TRIGGERS : EVENT_TRIGGERS.filter((e) => e.tier === filter);
  return (
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8 }}>
        <SectionEyebrow>EVENT TRIGGER LIST — recalibrate when life changes</SectionEyebrow>
        <div style={{ display: "flex", gap: 6 }}>
          {[
            { v: "all",    label: "All" },
            { v: "Tier 1", label: "Tier 1 (immediate)" },
            { v: "Tier 2", label: "Tier 2 (within 60d)" },
          ].map((opt) => (
            <button
              key={opt.v}
              onClick={() => setFilter(opt.v)}
              style={{
                background: filter === opt.v ? colors.gold : "transparent",
                color: filter === opt.v ? colors.green : alpha.whiteA60,
                border: `1px solid ${filter === opt.v ? colors.gold : alpha.whiteA12}`,
                borderRadius: 6,
                padding: "5px 10px",
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: fonts.sans,
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      <SubText style={{ marginBottom: 12 }}>
        These 12 events are triggers for an out-of-cycle CPA conversation. Tier 1 = within 30 days. Tier 2 = within 60 days. Don't wait for the annual meeting.
      </SubText>
      <div style={{ display: "grid", gap: 6 }}>
        {filtered.map((e, i) => (
          <div
            key={i}
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 80px",
              gap: 12,
              padding: "8px 12px",
              background: alpha.whiteA04,
              borderRadius: 6,
              borderLeft: `3px solid ${e.tier === "Tier 1" ? colors.danger : colors.warn}`,
            }}
          >
            <div>
              <div style={{ color: "#fff", fontSize: 12, fontWeight: 700 }}>{e.event}</div>
              <div style={{ color: alpha.whiteA60, fontSize: 11, marginTop: 3, lineHeight: 1.5 }}>{e.why}</div>
            </div>
            <div
              style={{
                fontSize: 10,
                color: e.tier === "Tier 1" ? colors.danger : colors.warn,
                letterSpacing: "0.06em",
                fontWeight: 700,
                textTransform: "uppercase",
                textAlign: "right",
              }}
            >
              {e.tier}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

const BARow = ({ label, before, after, delta }) => (
  <tr>
    <td style={{ padding: "8px 0", color: alpha.whiteA60, fontSize: 13 }}>{label}</td>
    <td style={{ padding: "8px 0", textAlign: "right", fontFamily: fonts.serif, color: alpha.whiteA60, fontSize: 14 }}>{before}</td>
    <td style={{ padding: "8px 0", textAlign: "right", fontFamily: fonts.serif, color: "#fff", fontWeight: 700, fontSize: 14 }}>{after}</td>
    <td style={{ padding: "8px 0", textAlign: "right", fontFamily: fonts.serif, color: colors.success, fontSize: 13 }}>{delta || ""}</td>
  </tr>
);

const th = {
  textAlign: "left",
  padding: "8px 10px",
  fontSize: 10,
  letterSpacing: "0.06em",
  color: alpha.whiteA40,
  textTransform: "uppercase",
  fontWeight: 700,
  borderBottom: `1px solid ${alpha.goldA18}`,
};
const tdCell = { padding: "10px 10px", borderBottom: `1px solid ${alpha.goldA12}`, color: alpha.whiteA60, fontSize: 12 };
const tdCellR = { ...tdCell, textAlign: "right", fontFamily: fonts.serif, color: "#fff", fontWeight: 600 };
