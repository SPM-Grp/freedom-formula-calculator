import { useMemo } from "react";
import {
  LIFESTYLE_KEYS,
  AGI_THRESHOLDS_2025,
  CHARITABLE_CASH_CAP_RATE,
  DISCLAIMER_TAX_LANDSCAPE,
} from "../../constants";
import {
  solveR,
  solveRWithContrib,
  lifestyleToFV,
  breakEven as computeBreakEven,
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
  Select,
  Callout,
  Disclaimer,
  KPI,
  SectionEyebrow,
  HeroNumber,
  BeforeAfter,
  VerdictHero,
} from "../ui";

// REVEAL — REVEAL (Week 2)
// Sub-tabs: Effective Rate · Tax Landscape

export const Reveal = ({ activeSub }) => {
  if (activeSub === "Tax Landscape") return <TaxLandscape />;
  return <EffectiveRate />;
};

// ─── EFFECTIVE RATE ────────────────────────────────────────────────────────
// Two-scenario Freedom Formula at different effective tax rates.
// Teaching moment: when tax mitigation redirects freed capital into the engine
// as contributions, required r drops. That's the tax efficiency lever.

const EffectiveRate = () => {
  const { get } = usePersistence();

  // Read EXODUS
  const pv = get("exodus", "root", "pv", "");
  const n = get("exodus", "root", "n", "10");
  const inflation = get("exodus", "root", "inflation", "3");
  const yieldRate = get("exodus", "root", "yield_rate", "0.07");
  const vals = (() => {
    try { return JSON.parse(get("exodus", "root", "lifestyle_vals", "{}") || "{}"); } catch { return {}; }
  })();
  const exodusETR = get("exodus", "root", "effective_tax_rate", "35");

  // Read Tax Landscape for a real income base (falls back to a sensible estimate)
  const agi = parseMoney(get("reveal", "tax_landscape", "agi", ""));
  const grossW2 = parseMoney(get("reveal", "tax_landscape", "gross_income", ""));
  const otherIncome = parseMoney(get("reveal", "tax_landscape", "other_income", ""));

  const pvVal = parseMoney(pv);
  const nVal = parseFloat(n) || 10;
  const infPct = parseFloat(inflation) || 0;
  const yVal = parseFloat(yieldRate) || 0.07;

  const [currentETR, setCurrentETR] = useField("reveal", "effective_rate", "current_etr", exodusETR);
  const [targetETR, setTargetETR]   = useField(
    "reveal", "effective_rate", "target_etr",
    String(Math.max(10, (parseFloat(exodusETR) || 35) - 5))
  );

  const currentPct = parseFloat(currentETR) || 0;
  const targetPct = parseFloat(targetETR) || 0;
  const deltaEtr = Math.max(0, currentPct - targetPct);

  const { fv, annualToday: lifestyleTotal } = useMemo(
    () => lifestyleToFV({
      monthlyVals: vals, categoryKeys: LIFESTYLE_KEYS, inflationPct: infPct, yieldRate: yVal, nYears: nVal,
    }),
    [vals, infPct, yVal, nVal]
  );

  const r1 = solveR(pvVal, fv, nVal);
  const beCurrent = computeBreakEven(infPct, currentPct);
  const beTarget  = computeBreakEven(infPct, targetPct);

  // Income base for the "annual tax savings" estimate.
  //   Prefer AGI (from Tax Landscape) → then gross W-2 + other → then imputed
  //   from lifestyle / (1 - current ETR) (solves for the gross that, post-tax,
  //   leaves lifestyle_total).
  const incomeBase = useMemo(() => {
    if (agi > 0) return { val: agi, source: "your AGI" };
    if (grossW2 + otherIncome > 0) return { val: grossW2 + otherIncome, source: "your gross income" };
    if (lifestyleTotal > 0 && currentPct < 99) {
      return {
        val: lifestyleTotal / (1 - currentPct / 100),
        source: "estimated gross (lifestyle ÷ (1 − current ETR))",
      };
    }
    return { val: 0, source: "" };
  }, [agi, grossW2, otherIncome, lifestyleTotal, currentPct]);

  // Annual dollars freed by the ETR delta — base × delta_pp / 100.
  const annualSavings = Math.max(0, incomeBase.val * (deltaEtr / 100));

  // If those savings are redirected into the engine as a contribution, r drops
  // to solveRWithContrib. That's the spec's "required return reduces by X%".
  const rWithRedirect = annualSavings > 0 && pvVal > 0 && fv > 0 && nVal > 0
    ? solveRWithContrib(pvVal, fv, nVal, annualSavings)
    : r1;
  const rDelta = r1 !== null && rWithRedirect !== null ? (r1 - rWithRedirect) * 100 : 0;

  // Compound wealth impact: annualSavings × ((1+r)^n - 1) / r
  // (Future value of an ordinary annuity)
  const compoundImpact =
    r1 !== null && r1 > 0 && annualSavings > 0 && nVal > 0
      ? (annualSavings * (Math.pow(1 + r1, nVal) - 1)) / r1
      : 0;

  if (pvVal <= 0 || fv <= 0) {
    return (
      <div>
        <PageHeader title="REVEAL — Effective Rate" />
        <Card tone="gold">
          <div style={{ color: colors.goldLight, fontSize: 14, fontWeight: 700, marginBottom: 6 }}>
            Complete your Freedom Formula first
          </div>
          <SubText>
            This tab runs scenarios against your EXODUS PV, FV, and timeline. Head to EXODUS and complete Steps 1 and 2.
          </SubText>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="REVEAL — Effective Rate"
        subtitle="In the REVEAL lesson, you learned that your effective tax rate directly affects your required return. A lower rate redirects freed capital into the engine as annual contributions — which means a lower r to hit the same FV."
      />

      <Card>
        <SubText style={{ marginBottom: 14 }}>
          Enter your current effective rate (from EXODUS) and a target rate — what your rate could look like with strategies in place. See what happens to r, to your break-even floor, and to the compound wealth opportunity.
        </SubText>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <Label>Current Effective Tax Rate (%)</Label>
            <PercentInput value={currentETR} onChange={setCurrentETR} step="0.5" min={0} max={60} />
          </div>
          <div>
            <Label>Target Effective Tax Rate (%)</Label>
            <PercentInput value={targetETR} onChange={setTargetETR} step="0.5" min={0} max={60} />
            <SubText style={{ marginTop: 6 }}>
              Don't have a target yet? Use 5 points below your current rate as a starting estimate. Your CPA will refine this once strategies are selected in ASSESS.
            </SubText>
          </div>
        </div>
        {incomeBase.val > 0 && (
          <SubText style={{ marginTop: 10 }}>
            Income base for the savings estimate: <strong>{fmt(incomeBase.val)}</strong> ({incomeBase.source}). You can refine this in the Tax Landscape tab.
          </SubText>
        )}
      </Card>

      <Card tone="gold">
        <Label>Scenario Comparison</Label>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 10 }}>
            <thead>
              <tr>
                <th style={th}>Metric</th>
                <th style={th}>Current Rate</th>
                <th style={th}>Target Rate</th>
                <th style={th}>Difference</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={td}>Effective Tax Rate</td>
                <td style={tdR}>{currentPct.toFixed(1)}%</td>
                <td style={tdR}>{targetPct.toFixed(1)}%</td>
                <td style={{ ...tdR, color: deltaEtr > 0 ? colors.success : alpha.whiteA40 }}>
                  {deltaEtr > 0 ? `−${deltaEtr.toFixed(1)}%` : "—"}
                </td>
              </tr>
              <tr>
                <td style={td}>Annual savings freed</td>
                <td style={tdR}>—</td>
                <td style={tdR}>{fmt(annualSavings)}</td>
                <td style={{ ...tdR, color: colors.success }}>{annualSavings > 0 ? `+${fmt(annualSavings)}/yr` : "—"}</td>
              </tr>
              <tr>
                <td style={td}>Required return (r)</td>
                <td style={tdR}>{fmtPct(r1)}</td>
                <td style={tdR}>{fmtPct(rWithRedirect)}</td>
                <td style={{ ...tdR, color: rDelta > 0 ? colors.success : alpha.whiteA40 }}>
                  {rDelta > 0 ? `−${rDelta.toFixed(2)}%` : "—"}
                </td>
              </tr>
              <tr>
                <td style={td}>Break-even return</td>
                <td style={tdR}>{fmtPct(beCurrent)}</td>
                <td style={tdR}>{fmtPct(beTarget)}</td>
                <td style={{ ...tdR, color: colors.success }}>
                  {beCurrent !== null && beTarget !== null ? `−${((beCurrent - beTarget) * 100).toFixed(2)}%` : "—"}
                </td>
              </tr>
              <tr>
                <td style={td}>r − break-even buffer</td>
                <td style={tdR}>{r1 !== null && beCurrent !== null ? fmtPct(r1 - beCurrent) : "—"}</td>
                <td style={tdR}>{rWithRedirect !== null && beTarget !== null ? fmtPct(rWithRedirect - beTarget) : "—"}</td>
                <td style={{ ...tdR, color: colors.success }}>
                  {r1 !== null && beCurrent !== null && rWithRedirect !== null && beTarget !== null
                    ? `+${(((rWithRedirect - beTarget) - (r1 - beCurrent)) * 100).toFixed(2)}%`
                    : "—"}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <SubText style={{ marginTop: 10, fontStyle: "italic" }}>
          Required r drops because the tax capital you stop paying becomes contribution capital inside the machine. Break-even drops because less of each dollar of return is eroded by taxes. Both effects compound.
        </SubText>
      </Card>

      {deltaEtr > 0 && compoundImpact > 0 && (
        <>
          <div
            style={{
              ...styles.card,
              borderColor: colors.success + "55",
              background: colors.success + "08",
              textAlign: "center",
              padding: 28,
            }}
          >
            <SectionEyebrow color={colors.success}>
              THE TAX EFFICIENCY OPPORTUNITY
            </SectionEyebrow>
            <HeroNumber
              value={`≈ ${fmt(compoundImpact)}`}
              color={colors.success}
              size={52}
              sub={`additional wealth over ${nVal} years`}
            />
            <div
              style={{
                color: alpha.whiteA60,
                fontSize: 13,
                lineHeight: 1.6,
                marginTop: 16,
                maxWidth: 620,
                margin: "16px auto 0",
              }}
            >
              A <strong style={{ color: colors.success }}>{deltaEtr.toFixed(1)}-point</strong> ETR reduction lowers your required return by about{" "}
              <strong style={{ color: colors.success }}>{rDelta.toFixed(2)}%</strong>.
              On a <strong>{fmt(pvVal)}</strong> machine over <strong>{nVal} years</strong>,
              that difference compounds to approximately <strong style={{ color: colors.success }}>{fmt(compoundImpact)}</strong> in additional wealth.
            </div>
          </div>
        </>
      )}

      <Disclaimer>
        The income base and savings estimate are illustrative. Actual tax savings depend on strategy selection, implementation quality, and CPA validation. This is not a guarantee, not a tax projection, and not a recommendation.
      </Disclaimer>
    </div>
  );
};

const th = {
  textAlign: "left",
  padding: "8px 10px",
  fontSize: 10,
  letterSpacing: "0.08em",
  color: alpha.whiteA40,
  textTransform: "uppercase",
  fontWeight: 700,
  borderBottom: `1px solid ${alpha.goldA18}`,
};
const td = {
  padding: "10px 10px",
  borderBottom: `1px solid ${alpha.goldA12}`,
  color: alpha.whiteA60,
  fontSize: 13,
};
const tdR = { ...td, textAlign: "right", fontFamily: fonts.serif, fontWeight: 700, color: "#fff" };

// ─── TAX LANDSCAPE ─────────────────────────────────────────────────────────

const TaxLandscape = () => {
  const [filingStatus, setFilingStatus]     = useField("reveal", "tax_landscape", "filing_status", "single");
  const [grossIncome, setGrossIncome]       = useField("reveal", "tax_landscape", "gross_income", "");
  const [otherIncome, setOtherIncome]       = useField("reveal", "tax_landscape", "other_income", "");
  const [ltcg, setLtcg]                     = useField("reveal", "tax_landscape", "ltcg", "");
  const [stcg, setStcg]                     = useField("reveal", "tax_landscape", "stcg", "");
  const [agi, setAgi]                       = useField("reveal", "tax_landscape", "agi", "");

  const [federalTax, setFederalTax]         = useField("reveal", "tax_landscape", "federal_tax", "");
  const [etrOverride, setEtrOverride]       = useField("reveal", "tax_landscape", "etr_override", "");
  const [stateTax, setStateTax]             = useField("reveal", "tax_landscape", "state_tax", "");
  const [ficaTax, setFicaTax]               = useField("reveal", "tax_landscape", "fica_tax", "");

  const [deductionType, setDeductionType]   = useField("reveal", "tax_landscape", "deduction_type", "standard");
  const [deductionAmount, setDeductionAmount] = useField("reveal", "tax_landscape", "deduction_amount", "");
  const [aboveLine, setAboveLine]           = useField("reveal", "tax_landscape", "above_line", "");

  const [notes, setNotes]                   = useField("reveal", "tax_landscape", "notes", "");

  const grossVal = parseMoney(grossIncome);
  const fedVal = parseMoney(federalTax);
  const autoETR = grossVal > 0 ? (fedVal / grossVal) * 100 : null;
  const shownETR = etrOverride !== "" ? etrOverride : (autoETR !== null ? autoETR.toFixed(2) : "");
  const agiVal = parseMoney(agi);

  return (
    <div>
      <PageHeader
        title="REVEAL — Tax Landscape"
        subtitle="Pull out your most recent tax return. Enter your actual numbers below. These aren't estimates — they're your real starting point. The program builds from here."
      />

      <Card>
        <Label>Filing Status</Label>
        <Select
          value={filingStatus}
          onChange={setFilingStatus}
          options={[
            { value: "single", label: "Single / Head of Household" },
            { value: "mfj", label: "Married Filing Jointly" },
            { value: "mfs", label: "Married Filing Separately" },
          ]}
        />
      </Card>

      <Card>
        <SectionEyebrow>Income</SectionEyebrow>
        <Row label="Gross income (W-2 box 1)" sub="Primary W-2 income">
          <MoneyInput value={grossIncome} onChange={setGrossIncome} placeholder="$0" />
        </Row>
        <Row label="Other ordinary income" sub="Side income, rental income, K-1 ordinary">
          <MoneyInput value={otherIncome} onChange={setOtherIncome} placeholder="$0" />
        </Row>
        <Row label="Capital gains (long-term)" sub="Schedule D">
          <MoneyInput value={ltcg} onChange={setLtcg} placeholder="$0" />
        </Row>
        <Row label="Capital gains (short-term)" sub="Schedule D">
          <MoneyInput value={stcg} onChange={setStcg} placeholder="$0" />
        </Row>
        <Row label="AGI" sub="Line 11 of Form 1040 — the number that gates everything">
          <MoneyInput value={agi} onChange={setAgi} placeholder="$0" />
        </Row>
      </Card>

      <Card>
        <SectionEyebrow>Tax Paid</SectionEyebrow>
        <Row label="Federal income tax" sub="Line 24 of Form 1040">
          <MoneyInput value={federalTax} onChange={setFederalTax} placeholder="$0" />
        </Row>
        <Row
          label="Effective federal tax rate (%)"
          sub={`Auto-calculated from gross + federal${autoETR !== null ? ` (currently ${autoETR.toFixed(2)}%)` : ""}. Override below if your CPA uses a different denominator.`}
        >
          <PercentInput
            value={shownETR}
            onChange={(v) => setEtrOverride(v)}
            step="0.01"
          />
          {etrOverride !== "" && (
            <button
              onClick={() => setEtrOverride("")}
              style={{
                background: "transparent",
                border: `1px solid ${alpha.whiteA12}`,
                color: alpha.whiteA40,
                fontSize: 11,
                padding: "4px 10px",
                borderRadius: 4,
                cursor: "pointer",
                marginTop: 6,
                fontFamily: fonts.sans,
              }}
            >
              Revert to auto-calc
            </button>
          )}
        </Row>
        <Row label="State income tax" sub="Optional">
          <MoneyInput value={stateTax} onChange={setStateTax} placeholder="$0" />
        </Row>
        <Row label="FICA / SE tax" sub="Optional">
          <MoneyInput value={ficaTax} onChange={setFicaTax} placeholder="$0" />
        </Row>
      </Card>

      <Card>
        <SectionEyebrow>Deductions</SectionEyebrow>
        <Row label="Standard or itemized?">
          <Select
            value={deductionType}
            onChange={setDeductionType}
            options={[
              { value: "standard", label: "Standard" },
              { value: "itemized", label: "Itemized" },
            ]}
          />
        </Row>
        <Row label="Deduction amount" sub="Standard deduction or Schedule A total">
          <MoneyInput value={deductionAmount} onChange={setDeductionAmount} placeholder="$0" />
        </Row>
        <Row label="Above-the-line deductions" sub="Retirement contributions, HSA, SE health insurance, etc.">
          <MoneyInput value={aboveLine} onChange={setAboveLine} placeholder="$0" />
        </Row>
      </Card>

      {agiVal > 0 && (
        <Card tone="gold">
          <Label>AGI Gatekeeper — impact flags</Label>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 8 }}>
              <thead>
                <tr>
                  <th style={th}>Threshold</th>
                  <th style={th}>2025 Level</th>
                  <th style={{ ...th, textAlign: "right" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {AGI_THRESHOLDS_2025.map((t) => {
                  const limit = filingStatus === "mfj" ? t.mfj : t.single;
                  const above = agiVal > limit;
                  return (
                    <tr key={t.key}>
                      <td style={td}>
                        {t.label}
                        <div style={{ fontSize: 10, color: alpha.whiteA40, marginTop: 2 }}>{t.note}</div>
                      </td>
                      <td style={tdR}>${limit.toLocaleString()}</td>
                      <td
                        style={{
                          ...tdR,
                          color: above ? colors.warn : colors.success,
                        }}
                      >
                        {above ? "⚠ Above threshold" : "✓ Below threshold"}
                      </td>
                    </tr>
                  );
                })}
                <tr>
                  <td style={td}>Charitable deduction cap (60% AGI cash)</td>
                  <td style={tdR}>60% × AGI</td>
                  <td style={tdR}>${Math.round(agiVal * CHARITABLE_CASH_CAP_RATE).toLocaleString()} max</td>
                </tr>
              </tbody>
            </table>
          </div>
          <SubText style={{ marginTop: 10 }}>
            2025 figures. Your CPA confirms current-year amounts and whether any threshold applies to your specific situation.
          </SubText>
        </Card>
      )}

      <Card>
        <Label>Notes</Label>
        <SubText style={{ marginBottom: 8 }}>
          Anything unusual about this year's return? Large capital event, job change, one-time income? This note carries into YIELD's annual log.
        </SubText>
        <TextInput value={notes} onChange={setNotes} placeholder="…" multiline rows={3} />
      </Card>

      <Disclaimer>{DISCLAIMER_TAX_LANDSCAPE}</Disclaimer>
    </div>
  );
};

const Row = ({ label, sub, children }) => (
  <div style={{ display: "grid", gridTemplateColumns: "1fr 220px", gap: 16, alignItems: "start", marginBottom: 12 }}>
    <div>
      <Label>{label}</Label>
      {sub && <SubText style={{ marginTop: 2 }}>{sub}</SubText>}
    </div>
    <div>{children}</div>
  </div>
);
