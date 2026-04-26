import { useMemo, useEffect, useState } from "react";
import { DISCLAIMER_DEFENSIBILITY } from "../../constants";
import {
  auditExposure,
  defensibilityScore,
  defensibilityBand,
  fmt,
  parseMoney,
} from "../../lib/math";
import { colors, alpha, fonts, styles } from "../../lib/theme";
import { useJSONField, usePersistence } from "../../hooks/usePersistence";
import {
  PageHeader,
  Card,
  Label,
  SubText,
  Select,
  Callout,
  Disclaimer,
  KPI,
  DependencyPrompt,
  SectionEyebrow,
  VerdictHero,
} from "../ui";
import { StrategyChecklist, StrategyNotHere } from "../StrategyComponents";
import { strategyById } from "../../data/strategies";

// INSULATE — INSULATE (Week 6) · Sub-tab: Defensibility Score
// Each LAUNCH strategy is a scored row. Library-linked strategies get an
// expandable checklist; check items off → auto-computed doc score (1-5).
// Free-text strategies fall back to manual doc-score dropdown.

const DOC_SCORE_OPTIONS = [
  { value: "1", label: "1 — None (no documentation yet)" },
  { value: "2", label: "2 — Partial (material gaps)" },
  { value: "3", label: "3 — Functional (core docs in place)" },
  { value: "4", label: "4 — Strong (organized, accessible)" },
  { value: "5", label: "5 — Audit-Ready (indexed, CPA-reviewed)" },
];

const DOC_LABEL_BY_SCORE = {
  1: { label: "None",        color: colors.danger },
  2: { label: "Partial",     color: colors.warn },
  3: { label: "Functional",  color: colors.goldLight },
  4: { label: "Strong",      color: colors.success },
  5: { label: "Audit-Ready", color: colors.success },
};

const docLabel = (score) => {
  const d = Math.max(1, Math.min(5, parseInt(score, 10) || 1));
  return DOC_LABEL_BY_SCORE[d];
};

const CPA_OPTIONS = [
  { value: "yes",     label: "Yes" },
  { value: "partial", label: "Partial" },
  { value: "no",      label: "No" },
];

// Map a checklist completion percentage → 1-5 doc score. Thresholds chosen
// so partial documentation registers meaningful progress without letting
// a half-complete checklist reach Audit-Ready.
const checklistScoreToDocScore = (pctComplete) => {
  if (pctComplete >= 1.0) return "5";
  if (pctComplete >= 0.8) return "4";
  if (pctComplete >= 0.5) return "3";
  if (pctComplete >= 0.2) return "2";
  return "1";
};

export const Insulate = () => {
  const { get } = usePersistence();

  const launchStrategies = useMemo(() => {
    try { return JSON.parse(get("launch", "implementation_timeline", "strategies", "[]") || "[]"); } catch { return []; }
  }, [get]);

  const nVal = parseFloat(get("exodus", "root", "n", "10")) || 10;

  // Per-strategy scoring metadata: { [rowId]: { docScore, cpaConfirmed } }
  const [scores, setScores] = useJSONField("insulate", "defensibility_score", "scores", {});
  // Per-strategy checklist state: { [rowId]: { [itemIdx]: true } }
  const [checklists, setChecklists] = useJSONField("insulate", "defensibility_score", "checklists", {});

  // Seed scores when new LAUNCH strategies appear
  useEffect(() => {
    const next = { ...scores };
    let changed = false;
    launchStrategies.forEach((s) => {
      if (!next[s.__id]) {
        next[s.__id] = { docScore: "1", cpaConfirmed: "no" };
        changed = true;
      }
    });
    if (changed) setScores(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [launchStrategies.map((s) => s.__id).join("|")]);

  const updateScore = (id, field, value) =>
    setScores({ ...scores, [id]: { ...(scores[id] || {}), [field]: value } });

  const toggleChecklistItem = (rowId, itemIdx) => {
    const current = checklists[rowId] || {};
    setChecklists({
      ...checklists,
      [rowId]: { ...current, [itemIdx]: !current[itemIdx] },
    });
  };

  if (launchStrategies.length === 0) {
    return (
      <div>
        <PageHeader title="INSULATE — Defensibility Score" />
        <DependencyPrompt message="Add your strategies in LAUNCH first — this tab scores the defensibility of that list." />
        <StrategyNotHere tab="insulate" />
      </div>
    );
  }

  // Merge LAUNCH rows with scores + checklist-derived doc scores
  const merged = launchStrategies.map((s) => {
    const libStrategy = s.strategyId ? strategyById(s.strategyId) : null;
    const manualScore = scores[s.__id]?.docScore || "1";
    const cpaConfirmed = scores[s.__id]?.cpaConfirmed || "no";
    const checklistState = checklists[s.__id] || {};

    // If we have a library strategy with a doc checklist, auto-compute doc score
    let docScore = manualScore;
    let checklistPct = null;
    let checkedCount = 0;
    let requiredCount = 0;
    if (libStrategy?.documentation?.required) {
      requiredCount = libStrategy.documentation.required.length;
      checkedCount = libStrategy.documentation.required.filter((_, i) => checklistState[i]).length;
      checklistPct = requiredCount > 0 ? checkedCount / requiredCount : 0;
      docScore = checklistScoreToDocScore(checklistPct);
    }

    return {
      ...s,
      libStrategy,
      docScore,
      manualScore,
      cpaConfirmed,
      savingsNumeric: parseMoney(s.annualSavings) || 0,
      checklistState,
      checkedCount,
      requiredCount,
      checklistPct,
    };
  });

  const withExposure = merged.map((s) => ({
    ...s,
    exposure: auditExposure({
      annualSavings: s.savingsNumeric,
      nYears: nVal,
      docScore: s.docScore,
    }),
  }));
  const totalExposure = withExposure.reduce((sum, s) => sum + s.exposure, 0);

  const score = defensibilityScore(
    merged.map((s) => ({
      annualSavings: s.savingsNumeric,
      docScore: s.docScore,
      cpaConfirmed: s.cpaConfirmed,
    }))
  );
  const band = defensibilityBand(score);

  const actionNeeded = withExposure
    .filter((s) => parseInt(s.docScore, 10) <= 2)
    .sort((a, b) => b.exposure - a.exposure);

  return (
    <div>
      <PageHeader
        title="INSULATE — Defensibility Score"
        subtitle="Your strategies from LAUNCH, each graded on documentation + CPA confirmation. Library-linked strategies auto-compute their doc score from a checklist. The Score is your posture; the Exposure is what's at risk if documentation fails."
      />

      <VerdictHero
        label="YOUR DEFENSIBILITY SCORE"
        band={band.label}
        value={score !== null ? score : "—"}
        valueSub="weighted by annual savings"
        color={band.color}
        detail="Each strategy contributes base = (doc/5) × 90, plus up to +10 for CPA confirmation. Bands: 85+ Audit-Ready · 70–84 Strong · 50–69 Functional · <50 Action Required."
      />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Card tone="gold" style={{ marginBottom: 0 }}>
          <Label>Total Estimated Audit Exposure</Label>
          <div style={{ fontFamily: fonts.serif, fontSize: 32, color: colors.danger, fontWeight: 700, marginTop: 4 }}>
            {fmt(totalExposure)}
          </div>
          <SubText>
            Sum across all strategies. Formula per strategy: <strong>savings × n × (1 − doc/5)</strong>. The amount at risk if positions fail audit scrutiny due to documentation weakness.
          </SubText>
        </Card>

        <Card tone={actionNeeded.length > 0 ? "danger" : "success"} style={{ marginBottom: 0 }}>
          <Label>Strategies Needing Immediate Attention</Label>
          <div style={{ fontFamily: fonts.serif, fontSize: 32, color: actionNeeded.length > 0 ? colors.danger : colors.success, fontWeight: 700, marginTop: 4 }}>
            {actionNeeded.length}
          </div>
          <SubText>
            Strategies with Documentation Score ≤ 2. {actionNeeded.length > 0 ? "Ranked by exposure below — start with the one at the top." : "All strategies have functional documentation or better."}
          </SubText>
        </Card>
      </div>

      {/* Per-strategy expandable grading cards */}
      <Card>
        <SectionEyebrow>PER-STRATEGY GRADING</SectionEyebrow>
        <SubText style={{ marginBottom: 12 }}>
          Click any strategy to expand its documentation checklist. Library-linked strategies auto-score from the checklist; free-text strategies use the manual dropdown.
        </SubText>

        <div style={{ display: "grid", gap: 10 }}>
          {withExposure.map((s) => (
            <StrategyGradingRow
              key={s.__id}
              strategy={s}
              onToggleChecklist={(idx) => toggleChecklistItem(s.__id, idx)}
              onChangeManualScore={(v) => updateScore(s.__id, "docScore", v)}
              onChangeCpa={(v) => updateScore(s.__id, "cpaConfirmed", v)}
            />
          ))}
        </div>
      </Card>

      {/* Action priority list */}
      {actionNeeded.length > 0 && (
        <Card tone="warn">
          <Label>Action Priority — Document These First</Label>
          <SubText style={{ marginBottom: 10 }}>
            Prioritize documentation by exposure, not by how easy it is to document. The highest-exposure gap goes first.
          </SubText>
          <div style={{ display: "grid", gap: 8 }}>
            {actionNeeded.map((s, i) => (
              <div
                key={s.__id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "32px 1fr auto",
                  alignItems: "center",
                  gap: 12,
                  padding: "10px 12px",
                  background: alpha.whiteA04,
                  borderRadius: 6,
                  border: `1px solid ${alpha.goldA12}`,
                }}
              >
                <div style={{ fontFamily: fonts.serif, fontSize: 18, color: colors.warn, fontWeight: 700 }}>
                  #{i + 1}
                </div>
                <div>
                  <div style={{ color: "#fff", fontSize: 13, fontWeight: 600 }}>{s.name || "(unnamed)"}</div>
                  <div style={{ fontSize: 11, color: alpha.whiteA40, marginTop: 2 }}>
                    Doc: {docLabel(s.docScore).label} ({s.docScore}/5) · CPA: {s.cpaConfirmed}
                    {s.libStrategy && s.requiredCount > 0 && ` · Checklist: ${s.checkedCount}/${s.requiredCount}`}
                  </div>
                </div>
                <div style={{ fontFamily: fonts.serif, fontWeight: 700, color: colors.danger, fontSize: 16 }}>
                  {fmt(s.exposure)}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Callout tone="gold">
        "Defensibility is right documents + right content + right maintenance + right time." A qualified CPA determines whether your documentation is legally sufficient for your specific situation.
      </Callout>

      {/* Statute of limitations reference (Week 6 lesson plan canonical) */}
      <Card>
        <SectionEyebrow>STATUTE OF LIMITATIONS — how long IRS can examine</SectionEyebrow>
        <SubText style={{ marginBottom: 10 }}>
          The IRS's window to assess additional tax depends on the facts. Documentation must outlive the longest applicable window.
        </SubText>
        <div style={{ display: "grid", gap: 6 }}>
          {[
            { window: "3 years", trigger: "Standard returns filed on time, no major omission",   keep: "Most strategy support" },
            { window: "6 years", trigger: "Income omission of more than 25% of gross",           keep: "Income source records, basis docs" },
            { window: "Forever", trigger: "Fraud (civil) or no return filed",                    keep: "Anything that could indicate intent" },
            { window: "6 years post-sale", trigger: "Property cost basis after disposition",     keep: "Closing docs, improvements, depreciation" },
            { window: "Permanently", trigger: "REPS / reasonable comp / cost seg study / entity docs / qualified plan docs", keep: "Originals + supporting analyses" },
          ].map((row, i) => (
            <div
              key={i}
              style={{
                display: "grid",
                gridTemplateColumns: "120px 1fr 1fr",
                gap: 12,
                padding: "8px 12px",
                background: alpha.whiteA04,
                borderRadius: 6,
                borderLeft: `3px solid ${row.window === "Forever" ? colors.danger : row.window === "Permanently" ? colors.danger : colors.goldLight}`,
                fontSize: 12,
              }}
            >
              <div style={{ fontFamily: fonts.serif, fontWeight: 700, color: row.window === "Forever" || row.window === "Permanently" ? colors.danger : colors.goldLight }}>
                {row.window}
              </div>
              <div style={{ color: alpha.whiteA60, lineHeight: 1.5 }}>{row.trigger}</div>
              <div style={{ color: alpha.whiteA60, lineHeight: 1.5 }}>{row.keep}</div>
            </div>
          ))}
        </div>
        <SubText style={{ marginTop: 10, fontStyle: "italic" }}>
          Practical rule: when unsure, keep 7 years. For anything that establishes basis or a permanent election, keep forever.
        </SubText>
      </Card>

      {/* AI enforcement reality callout */}
      <Callout tone="warn" title="The audit landscape has changed">
        100+ active IRS AI projects are in production. AI-selected audits have a <strong>lower no-change rate</strong> than human-selected audits — meaning when AI flags you, the IRS is more often right. Correspondence exams (the most common audit type) are increasingly automated. Documentation is no longer "just in case" — it's the difference between a 30-day reply and a multi-year battle.
      </Callout>

      <Disclaimer>{DISCLAIMER_DEFENSIBILITY}</Disclaimer>

      <StrategyNotHere tab="insulate" />
    </div>
  );
};

// Expandable grading row. Shows summary when collapsed; checklist when expanded.
const StrategyGradingRow = ({ strategy: s, onToggleChecklist, onChangeManualScore, onChangeCpa }) => {
  const [expanded, setExpanded] = useState(false);
  const label = docLabel(s.docScore);
  const hasLibrary = !!s.libStrategy;

  return (
    <div
      style={{
        background: alpha.whiteA04,
        border: `1px solid ${alpha.goldA12}`,
        borderRadius: 8,
        overflow: "hidden",
      }}
    >
      {/* Header row — always visible */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto auto auto auto 28px",
          gap: 12,
          alignItems: "center",
          padding: "12px 14px",
          cursor: "pointer",
        }}
        onClick={() => setExpanded((e) => !e)}
      >
        <div>
          <div style={{ color: "#fff", fontSize: 13, fontWeight: 700 }}>{s.name || "—"}</div>
          <div style={{ fontSize: 10, color: alpha.whiteA40, textTransform: "uppercase", letterSpacing: "0.05em", marginTop: 2 }}>
            {s.category} {hasLibrary ? "· library-linked" : "· free-text"}
          </div>
        </div>

        <div style={{ textAlign: "right", minWidth: 90 }}>
          <div style={{ fontSize: 10, color: alpha.whiteA40, letterSpacing: "0.05em" }}>SAVINGS</div>
          <div style={{ fontFamily: fonts.serif, fontWeight: 700, color: "#fff", fontSize: 13 }}>
            {fmt(s.savingsNumeric)}
          </div>
        </div>

        <div style={{ textAlign: "right", minWidth: 110 }}>
          <div style={{ fontSize: 10, color: alpha.whiteA40, letterSpacing: "0.05em" }}>DOCUMENTATION</div>
          <div style={{ fontSize: 12, color: label.color, fontWeight: 700, marginTop: 2 }}>
            {label.label} ({s.docScore}/5)
          </div>
          {hasLibrary && s.requiredCount > 0 && (
            <div style={{ fontSize: 10, color: alpha.whiteA40, marginTop: 2 }}>
              {s.checkedCount}/{s.requiredCount} checked
            </div>
          )}
        </div>

        <div style={{ textAlign: "right", minWidth: 90 }}>
          <div style={{ fontSize: 10, color: alpha.whiteA40, letterSpacing: "0.05em" }}>CPA</div>
          <div
            style={{
              fontSize: 12,
              color: s.cpaConfirmed === "yes" ? colors.success : s.cpaConfirmed === "partial" ? colors.warn : alpha.whiteA60,
              fontWeight: 700,
              marginTop: 2,
              textTransform: "capitalize",
            }}
          >
            {s.cpaConfirmed}
          </div>
        </div>

        <div style={{ textAlign: "right", minWidth: 80 }}>
          <div style={{ fontSize: 10, color: alpha.whiteA40, letterSpacing: "0.05em" }}>EXPOSURE</div>
          <div
            style={{
              fontFamily: fonts.serif,
              fontWeight: 700,
              color: s.exposure > 0 ? colors.danger : alpha.whiteA40,
              fontSize: 13,
            }}
          >
            {fmt(s.exposure)}
          </div>
        </div>

        <div
          style={{
            fontSize: 14,
            color: alpha.whiteA40,
            transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 120ms",
          }}
        >
          ▾
        </div>
      </div>

      {/* Expanded panel */}
      {expanded && (
        <div style={{ padding: "0 14px 14px", borderTop: `1px solid ${alpha.whiteA08}` }}>
          {/* CPA confirmation — applies to both library + free-text rows */}
          <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <Label>CPA Confirmation</Label>
              <Select
                value={s.cpaConfirmed}
                onChange={onChangeCpa}
                options={CPA_OPTIONS}
              />
              <SubText style={{ marginTop: 6 }}>
                Has a qualified CPA reviewed and confirmed this position is supportable?
              </SubText>
            </div>
            {!hasLibrary && (
              <div>
                <Label>Documentation Score (manual)</Label>
                <Select
                  value={s.manualScore}
                  onChange={onChangeManualScore}
                  options={DOC_SCORE_OPTIONS}
                />
                <SubText style={{ marginTop: 6 }}>
                  Free-text strategy — score manually using the 5-level scale.
                </SubText>
              </div>
            )}
          </div>

          {/* Library-linked checklist */}
          {hasLibrary && (
            <StrategyChecklist
              strategy={s.libStrategy}
              checked={s.checklistState}
              onToggle={onToggleChecklist}
            />
          )}

          {/* Free-text guidance — direct users to the "not here?" prompt */}
          {!hasLibrary && (
            <div
              style={{
                marginTop: 12,
                padding: "12px 14px",
                background: alpha.blackA20,
                borderRadius: 6,
                fontSize: 12,
                color: alpha.whiteA60,
                lineHeight: 1.6,
              }}
            >
              No library checklist for <strong>{s.name}</strong> — this strategy was free-typed in LAUNCH.
              Score it manually above, or scroll to "Strategy not in the library?" at the bottom of the page
              to get a documentation map for any strategy.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
