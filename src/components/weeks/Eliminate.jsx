import { ELIMINATE_BUCKETS } from "../../constants";
import { colors, alpha, fonts, styles, radii } from "../../lib/theme";
import { useJSONField } from "../../hooks/usePersistence";
import {
  PageHeader,
  Card,
  Label,
  SubText,
  TextInput,
  Select,
  Button,
  KPI,
  Callout,
} from "../ui";
import {
  StrategyPicker,
  StrategyInfoCard,
  StrategyNotHere,
} from "../StrategyComponents";
import { strategyById } from "../../data/strategies";

// ELIMINATE — ELIMINATE (Week 3)
// Sub-tab: Strategy Filter (four buckets)

export const Eliminate = () => {
  return (
    <div>
      <PageHeader
        title="ELIMINATE — Strategy Filter"
        subtitle="You've walked the forest. Now log what you found. For each strategy category you evaluated, record your result. Use the four buckets. Be specific about your reasoning — especially for exclusions. The reason matters more than the result."
      />

      <TopSummary />

      {ELIMINATE_BUCKETS.map((bucket) => (
        <Bucket key={bucket.key} bucket={bucket} />
      ))}

      <Summary />

      <SevenTestReference />

      <StrategyNotHere tab="eliminate" />
    </div>
  );
};

// 7-Test Filter reference (Master Doc canonical) — visible reminder of what
// the 7 tests are, since "Test N" in the Exclude bucket only makes sense if
// users can see the full ladder.
const SevenTestReference = () => {
  const tests = [
    { n: 1, name: "Real & substantive",         q: "Does the activity actually exist for me, with economic substance — not a paper structure?" },
    { n: 2, name: "Underlying conditions",      q: "Do I have what's needed to qualify (own real estate, run a business, family of working age, etc.)?" },
    { n: 3, name: "Net of cost & complexity",   q: "Does the benefit at my income level exceed the implementation + ongoing admin friction?" },
    { n: 4, name: "Compatible with other strategies", q: "Does this conflict with my other strategies, or stack cleanly?" },
    { n: 5, name: "Executable for me",          q: "Do I have the time, cash flow, and discipline to actually execute and maintain it?" },
    { n: 6, name: "IRS posture acceptable",     q: "Is this on the IRS Dirty Dozen or abusive-transactions list? Recent enforcement focus?" },
    { n: 7, name: "Worst-case tolerable",       q: "If this fails audit, can I survive the worst-case outcome (back tax, penalties, time)?" },
  ];
  return (
    <Card>
      <div style={{ fontSize: 10, letterSpacing: "0.1em", color: colors.gold, fontWeight: 700, marginBottom: 6, textTransform: "uppercase" }}>
        THE 7-TEST FILTER · reference
      </div>
      <SubText style={{ marginBottom: 12 }}>
        Each strategy walks through these seven tests. A failure on any one routes the strategy to Exclude (with the failing test logged) or Route (if the test needs a professional answer).
      </SubText>
      <div style={{ display: "grid", gap: 6 }}>
        {tests.map((t) => (
          <div
            key={t.n}
            style={{
              display: "grid",
              gridTemplateColumns: "32px 1fr",
              gap: 12,
              padding: "8px 12px",
              background: alpha.whiteA04,
              borderRadius: 6,
              borderLeft: `3px solid ${colors.goldLight}`,
            }}
          >
            <div style={{ fontFamily: fonts.serif, fontWeight: 800, color: colors.gold, fontSize: 16 }}>
              {t.n}
            </div>
            <div>
              <div style={{ color: colors.goldLight, fontSize: 12, fontWeight: 700 }}>
                {t.name}
              </div>
              <div style={{ color: alpha.whiteA60, fontSize: 11, marginTop: 3, lineHeight: 1.5 }}>{t.q}</div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

// Top summary — live KPI strip showing counts as user fills buckets
const TopSummary = () => {
  const [keep]    = useJSONField("eliminate", "strategy_filter", "keep_rows", []);
  const [exclude] = useJSONField("eliminate", "strategy_filter", "exclude_rows", []);
  const [route]   = useJSONField("eliminate", "strategy_filter", "route_rows", []);
  const [park]    = useJSONField("eliminate", "strategy_filter", "park_rows", []);
  const total = keep.length + exclude.length + route.length + park.length;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: 10,
        marginBottom: 20,
      }}
    >
      {[
        { k: "Keep",    n: keep.length,    c: colors.success },
        { k: "Exclude", n: exclude.length, c: colors.danger },
        { k: "Route",   n: route.length,   c: colors.goldLight },
        { k: "Park",    n: park.length,    c: colors.purple },
      ].map((b) => (
        <div
          key={b.k}
          style={{
            padding: "14px 18px",
            borderRadius: radii.card,
            borderLeft: `4px solid ${b.c}`,
            background: b.c + "08",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: 10,
              letterSpacing: "0.1em",
              color: b.c,
              fontWeight: 700,
              textTransform: "uppercase",
            }}
          >
            {b.k}
          </div>
          <div
            style={{
              fontFamily: fonts.serif,
              fontSize: 28,
              fontWeight: 800,
              color: b.c,
              lineHeight: 1,
              marginTop: 4,
            }}
          >
            {b.n}
          </div>
          {total > 0 && (
            <div style={{ fontSize: 10, color: alpha.whiteA40, marginTop: 4 }}>
              {Math.round((b.n / total) * 100)}% of list
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// ─── Bucket (renders one of the four lists) ───────────────────────────────
const Bucket = ({ bucket }) => {
  const [rows, setRows] = useJSONField("eliminate", "strategy_filter", `${bucket.key}_rows`, []);

  const add = () => {
    const blank = Object.fromEntries(
      bucket.fields.map((f) => [f.key, f.type === "select" ? f.options[0] : ""])
    );
    blank.__id = Math.random().toString(36).slice(2, 10);
    setRows([...rows, blank]);
  };

  const updateRow = (id, field, value) => {
    setRows(rows.map((r) => (r.__id === id ? { ...r, [field]: value } : r)));
  };

  const removeRow = (id) => setRows(rows.filter((r) => r.__id !== id));

  const bucketColor = {
    keep: colors.success,
    exclude: colors.danger,
    route: colors.goldLight,
    park: colors.purple,
  }[bucket.key];

  return (
    <Card
      style={{
        borderLeft: `4px solid ${bucketColor}`,
      }}
    >
      <div style={{ ...styles.label, color: bucketColor, fontSize: 12, marginBottom: 4 }}>
        {bucket.label}
      </div>
      <SubText style={{ marginBottom: 14 }}>{bucket.blurb}</SubText>

      {rows.length === 0 ? (
        <div
          style={{
            padding: "20px",
            background: alpha.whiteA04,
            borderRadius: 8,
            border: `1px dashed ${alpha.goldA18}`,
            textAlign: "center",
            fontSize: 13,
            color: alpha.whiteA40,
          }}
        >
          No entries yet. Click below to add one.
        </div>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {rows.map((row, idx) => (
            <RowEditor
              key={row.__id || idx}
              row={row}
              fields={bucket.fields}
              onChange={(field, value) => updateRow(row.__id, field, value)}
              onRemove={() => removeRow(row.__id)}
            />
          ))}
        </div>
      )}

      <div style={{ marginTop: 14 }}>
        <Button variant="ghost" onClick={add}>
          + {bucket.addLabel}
        </Button>
      </div>
    </Card>
  );
};

const RowEditor = ({ row, fields, onChange, onRemove }) => {
  // First field is always "strategy" — attach StrategyPicker instead of plain text input
  const selectedStrategy = row.__strategyId ? strategyById(row.__strategyId) : null;

  return (
    <div
      style={{
        padding: "12px 14px",
        background: alpha.whiteA04,
        border: `1px solid ${alpha.goldA12}`,
        borderRadius: 8,
        position: "relative",
      }}
    >
      <button
        onClick={onRemove}
        style={{
          position: "absolute",
          top: 8,
          right: 8,
          background: "transparent",
          border: "none",
          color: alpha.whiteA40,
          fontSize: 16,
          cursor: "pointer",
          lineHeight: 1,
        }}
        aria-label="Remove"
      >
        ×
      </button>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: fields.length === 2 ? "1fr 1fr" : fields.length === 3 ? "2fr 1fr 1fr" : "2fr 1fr 1fr 1fr",
          gap: 12,
          paddingRight: 20,
        }}
      >
        {fields.map((f, idx) => (
          <div key={f.key}>
            <Label>{f.label}</Label>
            {idx === 0 && f.key === "strategy" ? (
              <StrategyPicker
                value={row[f.key] || ""}
                onChange={(v) => {
                  onChange(f.key, v);
                  // clear strategyId if user is free-typing
                  if (row.__strategyId) onChange("__strategyId", "");
                }}
                onSelect={(s) => {
                  onChange(f.key, s.name);
                  onChange("__strategyId", s.id);
                }}
              />
            ) : f.type === "textarea" ? (
              <TextInput
                value={row[f.key] || ""}
                onChange={(v) => onChange(f.key, v)}
                multiline
                rows={2}
                placeholder="…"
              />
            ) : f.type === "select" ? (
              <Select
                value={row[f.key] || f.options[0]}
                onChange={(v) => onChange(f.key, v)}
                options={f.options}
              />
            ) : (
              <TextInput
                value={row[f.key] || ""}
                onChange={(v) => onChange(f.key, v)}
                placeholder="…"
              />
            )}
          </div>
        ))}
      </div>
      {selectedStrategy && <StrategyInfoCard strategy={selectedStrategy} />}
    </div>
  );
};

// ─── Summary card (reads from persistence directly) ───────────────────────
const Summary = () => {
  const [keep]    = useJSONField("eliminate", "strategy_filter", "keep_rows", []);
  const [exclude] = useJSONField("eliminate", "strategy_filter", "exclude_rows", []);
  const [route]   = useJSONField("eliminate", "strategy_filter", "route_rows", []);
  const [park]    = useJSONField("eliminate", "strategy_filter", "park_rows", []);

  return (
    <>
      <Card tone="gold">
        <Label>Your Filter Summary</Label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginTop: 10 }}>
          <KPI label="Keep" value={keep.length} valueColor={colors.success} />
          <KPI label="Exclude" value={exclude.length} valueColor={colors.danger} />
          <KPI label="Route" value={route.length} valueColor={colors.goldLight} />
          <KPI label="Park" value={park.length} valueColor={colors.purple} />
        </div>
      </Card>

      <Callout tone="gold">
        Your <strong>Keep</strong> list feeds ASSESS. Your <strong>Route</strong> list drives professional conversations. Your <strong>Exclude</strong> list protects your attention. Your <strong>Park</strong> list is your future optionality.
      </Callout>
    </>
  );
};
