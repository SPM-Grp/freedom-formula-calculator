import { colors, alpha, fonts, radii, styles } from "../lib/theme";
import { WEEK_BY_SLUG, ENROLLMENT_URL, BOOK_URL } from "../constants";

// Locked preview card — shown when an unenrolled visitor clicks a locked
// week in the left nav. Intentionally rich: teaser bullets, a mock-visual
// of the tool inside, and the CTA. The goal is to sell curiosity.

// Per-week teaser copy. Keep tight — one sentence per bullet.
const WEEK_TEASERS = {
  reveal: {
    tagline: "Understand exactly what you're paying in taxes — and why.",
    bullets: [
      "Run two Freedom Formulas side-by-side at different effective tax rates",
      "Capture your actual AGI, deductions, and gatekeeper thresholds",
      "See which IRS thresholds you've crossed and which you're approaching",
    ],
    mock: "two-scenario-table",
    tool: "Effective Rate · Tax Landscape",
  },
  eliminate: {
    tagline: "Walk the full tax strategy universe. Emerge with a short list.",
    bullets: [
      "Four buckets: Keep, Exclude, Route, Park — every strategy goes somewhere",
      "Log the reason for each exclusion so you never re-litigate it",
      "Your Keep list auto-populates ASSESS and LAUNCH downstream",
    ],
    mock: "four-buckets",
    tool: "Strategy Filter",
  },
  assess: {
    tagline: "Score every surviving strategy against your Freedom Formula.",
    bullets: [
      "Enter estimated annual tax savings → see 3 effects in real time",
      "Shorter timeline, bigger machine, or easier required return",
      "Live compounding chart shows the gap closing as PMT rises",
    ],
    mock: "three-scenarios",
    tool: "Strategy Impact",
  },
  launch: {
    tagline: "Build your implementation plan — who does what, when.",
    bullets: [
      "One row per strategy: owner, activation month, projected savings",
      "36-month stacked area chart — watch the gap to your PMT target close",
      "Pre-populates from your ELIMINATE Keep list automatically",
    ],
    mock: "timeline-stack",
    tool: "Implementation Timeline",
  },
  insulate: {
    tagline: "Grade your documentation. See audit exposure in dollars.",
    bullets: [
      "Score each strategy 1–5 on documentation + CPA confirmation",
      "Formula: Savings × n × (1 − doc/5) → exposure in real dollars",
      "Priority list ranks by exposure, not by how easy it is to document",
    ],
    mock: "defensibility-meter",
    tool: "Defensibility Score",
  },
  target: {
    tagline: "Deploy freed capital across Foundation, Swing, and Liquidity.",
    bullets: [
      "Blended r compared head-to-head against your required r",
      "Foundation coverage indicator shows % toward Threshold 1",
      "Donut + time-to-threshold projection — when work becomes optional",
    ],
    mock: "allocation-donut",
    tool: "Capital Placement",
  },
  yield: {
    tagline: "Your living record. One row per year, forever.",
    bullets: [
      "Before/After snapshot anchors program start vs. today",
      "CPI helper recalibrates FV each year; r trend chart stays live",
      "Append-only — cannot be deleted; CSV export for annual CPA review",
    ],
    mock: "annual-log",
    tool: "Track Your Freedom",
  },
};

export const LockedPreview = ({ slug }) => {
  const week = WEEK_BY_SLUG[slug];
  const teaser = WEEK_TEASERS[slug];
  if (!week) return null;

  return (
    <div style={{ maxWidth: 760, margin: "20px auto 0" }}>
      {/* Lock badge + week meta */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 18,
          paddingBottom: 14,
          borderBottom: `1px solid ${alpha.goldA18}`,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 10,
              letterSpacing: "0.2em",
              color: alpha.whiteA40,
              fontWeight: 700,
              textTransform: "uppercase",
              marginBottom: 4,
            }}
          >
            🔒 Week {week.weekNumber} · Locked
          </div>
          <h1
            style={{
              fontFamily: fonts.serif,
              fontSize: 32,
              color: colors.goldLight,
              margin: 0,
              fontWeight: 700,
              letterSpacing: "-0.01em",
            }}
          >
            {week.title}
          </h1>
          {teaser && (
            <div
              style={{
                color: alpha.whiteA60,
                fontSize: 14,
                marginTop: 6,
                lineHeight: 1.5,
              }}
            >
              {teaser.tagline}
            </div>
          )}
        </div>
        <div
          style={{
            padding: "4px 10px",
            borderRadius: 999,
            background: alpha.goldA06,
            border: `1px solid ${alpha.goldA30}`,
            fontSize: 11,
            color: colors.goldLight,
            fontWeight: 600,
            letterSpacing: "0.04em",
          }}
        >
          Tool: {teaser?.tool || week.nav}
        </div>
      </div>

      {/* Grid: left = bullets, right = mock visual */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 20,
          marginBottom: 24,
        }}
      >
        {/* Left — what's inside */}
        <div
          style={{
            background: alpha.whiteA035,
            border: `1px solid ${alpha.goldA18}`,
            borderRadius: radii.card,
            padding: "20px 22px",
          }}
        >
          <div
            style={{
              fontSize: 10,
              letterSpacing: "0.1em",
              color: colors.gold,
              fontWeight: 700,
              marginBottom: 12,
            }}
          >
            WHAT'S INSIDE
          </div>
          {teaser ? (
            <ul
              style={{
                margin: 0,
                paddingLeft: 0,
                listStyle: "none",
                color: alpha.whiteA60,
                fontSize: 13,
                lineHeight: 1.7,
              }}
            >
              {teaser.bullets.map((b, i) => (
                <li
                  key={i}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "18px 1fr",
                    gap: 8,
                    marginBottom: 10,
                    alignItems: "start",
                  }}
                >
                  <span style={{ color: colors.gold, fontWeight: 700, marginTop: 1 }}>
                    →
                  </span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div style={{ color: alpha.whiteA60, fontSize: 13 }}>{week.description}</div>
          )}
        </div>

        {/* Right — mock visual */}
        <div
          style={{
            background: alpha.whiteA04,
            border: `1px solid ${alpha.goldA12}`,
            borderRadius: radii.card,
            padding: 16,
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: `linear-gradient(to bottom, transparent 50%, ${colors.dark}aa 95%)`,
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              fontSize: 10,
              letterSpacing: "0.1em",
              color: alpha.whiteA40,
              fontWeight: 700,
              marginBottom: 10,
            }}
          >
            PREVIEW OF THE TOOL
          </div>
          <MockVisual kind={teaser?.mock} />
        </div>
      </div>

      {/* CTA card */}
      <div
        style={{
          background: alpha.goldA06,
          border: `1px solid ${alpha.goldA30}`,
          borderRadius: radii.card,
          padding: "20px 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div>
          <div
            style={{
              fontFamily: fonts.serif,
              fontSize: 18,
              color: colors.goldLight,
              fontWeight: 700,
              marginBottom: 4,
            }}
          >
            This unlocks in the CLEAR Program.
          </div>
          <div style={{ color: alpha.whiteA60, fontSize: 13, lineHeight: 1.5 }}>
            Eight weeks. One tool. Everything you build inside stays with you — forever.
          </div>
        </div>
        <a
          href={ENROLLMENT_URL}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            ...styles.button,
            display: "inline-block",
            textDecoration: "none",
            padding: "12px 22px",
            fontSize: 13,
            whiteSpace: "nowrap",
          }}
        >
          Learn About CLEAR →
        </a>
      </div>

      {/* Secondary path: the book — for visitors not ready for the full program */}
      <a
        href={BOOK_URL}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: "block",
          textDecoration: "none",
          color: "inherit",
          fontFamily: "inherit",
          marginTop: 14,
          background: alpha.whiteA035,
          border: `1px solid ${alpha.goldA18}`,
          borderRadius: radii.card,
          padding: "16px 20px",
          transition: "all 0.15s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = alpha.goldA06;
          e.currentTarget.style.borderColor = alpha.goldA30;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = alpha.whiteA035;
          e.currentTarget.style.borderColor = alpha.goldA18;
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div style={{ flex: "1 1 auto", minWidth: 0 }}>
            <div
              style={{
                fontSize: 10,
                letterSpacing: "0.15em",
                color: colors.gold,
                fontWeight: 700,
                marginBottom: 4,
              }}
            >
              📕 NOT READY FOR THE PROGRAM?
            </div>
            <div
              style={{
                fontFamily: fonts.serif,
                fontSize: 16,
                color: colors.goldLight,
                fontWeight: 700,
                marginBottom: 2,
              }}
            >
              Start with the book.
            </div>
            <div style={{ fontSize: 12, color: alpha.whiteA60, lineHeight: 1.5 }}>
              <strong>Rich But Broke MD</strong> — the manifesto behind CLEAR. Read it first; come back when you're ready.
            </div>
          </div>
          <div
            style={{
              fontSize: 11,
              color: colors.gold,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              fontWeight: 700,
              whiteSpace: "nowrap",
            }}
          >
            Get the book →
          </div>
        </div>
      </a>

      {/* Footer hint */}
      <div
        style={{
          textAlign: "center",
          marginTop: 16,
          fontSize: 11,
          color: alpha.whiteA40,
          lineHeight: 1.5,
        }}
      >
        Already enrolled? Sign in with the email you used to register — this week will unlock once you're marked active.
      </div>
    </div>
  );
};

// ─── Mock visuals (pure CSS — no data, no logic) ──────────────────────────
// These are purely decorative teasers that hint at what the real tool looks
// like. Each is specific to the week it represents.

const MockVisual = ({ kind }) => {
  const common = {
    height: 160,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: alpha.whiteA40,
    fontSize: 11,
  };

  if (kind === "two-scenario-table") {
    return (
      <div style={{ display: "grid", gap: 4 }}>
        {[
          ["ETR",        "35%",     "30%"],
          ["r required", "8.2%",    "7.4%"],
          ["Break-even", "4.6%",    "4.3%"],
          ["Buffer",     "+3.6%",   "+3.1%"],
        ].map((row, i) => (
          <div
            key={i}
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              padding: "6px 10px",
              background: i === 0 ? alpha.goldA06 : alpha.blackA20,
              borderRadius: 4,
              fontSize: 11,
              color: i === 0 ? colors.goldLight : alpha.whiteA60,
              fontWeight: i === 0 ? 700 : 500,
              fontFamily: fonts.serif,
            }}
          >
            <span>{row[0]}</span>
            <span style={{ textAlign: "right" }}>{row[1]}</span>
            <span style={{ textAlign: "right", color: i > 0 ? colors.success : colors.goldLight }}>{row[2]}</span>
          </div>
        ))}
      </div>
    );
  }

  if (kind === "four-buckets") {
    const buckets = [
      { label: "KEEP",    count: 4, color: colors.success },
      { label: "EXCLUDE", count: 7, color: colors.danger },
      { label: "ROUTE",   count: 3, color: colors.goldLight },
      { label: "PARK",    count: 2, color: colors.purple },
    ];
    return (
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {buckets.map((b) => (
          <div
            key={b.label}
            style={{
              borderLeft: `3px solid ${b.color}`,
              padding: "8px 10px",
              background: alpha.blackA20,
              borderRadius: 4,
            }}
          >
            <div style={{ fontSize: 9, letterSpacing: "0.1em", color: b.color, fontWeight: 700 }}>
              {b.label}
            </div>
            <div style={{ fontSize: 18, fontFamily: fonts.serif, color: "#fff", fontWeight: 700, marginTop: 2 }}>
              {b.count}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (kind === "three-scenarios") {
    return (
      <div style={{ display: "grid", gap: 6 }}>
        {[
          { l: "Sooner Freedom",  v: "2y 4m sooner",   c: colors.gold },
          { l: "Bigger Machine",  v: "+$412K",         c: colors.purple },
          { l: "Lower r",         v: "−1.8%",          c: colors.success },
        ].map((s) => (
          <div
            key={s.l}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "8px 12px",
              background: `${s.c}10`,
              border: `1px solid ${s.c}33`,
              borderRadius: 4,
            }}
          >
            <span style={{ fontSize: 10, color: s.c, fontWeight: 700, letterSpacing: "0.04em" }}>
              {s.l}
            </span>
            <span style={{ fontFamily: fonts.serif, fontSize: 14, color: s.c, fontWeight: 700 }}>
              {s.v}
            </span>
          </div>
        ))}
      </div>
    );
  }

  if (kind === "timeline-stack") {
    return (
      <svg width="100%" height="140" viewBox="0 0 200 100" preserveAspectRatio="none">
        <defs>
          <linearGradient id="lg1" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={colors.gold} stopOpacity="0.6" />
            <stop offset="100%" stopColor={colors.gold} stopOpacity="0.1" />
          </linearGradient>
          <linearGradient id="lg2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={colors.success} stopOpacity="0.6" />
            <stop offset="100%" stopColor={colors.success} stopOpacity="0.1" />
          </linearGradient>
          <linearGradient id="lg3" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={colors.purple} stopOpacity="0.6" />
            <stop offset="100%" stopColor={colors.purple} stopOpacity="0.1" />
          </linearGradient>
        </defs>
        <path d="M0,100 L0,75 L60,75 L60,55 L120,55 L120,35 L200,35 L200,100 Z" fill="url(#lg1)" stroke={colors.gold} strokeWidth="1" />
        <path d="M0,100 L0,85 L40,85 L40,70 L100,70 L100,55 L200,55 L200,100 Z" fill="url(#lg2)" stroke={colors.success} strokeWidth="1" />
        <path d="M0,100 L0,95 L80,95 L80,85 L160,85 L160,75 L200,75 L200,100 Z" fill="url(#lg3)" stroke={colors.purple} strokeWidth="1" />
        <line x1="0" y1="25" x2="200" y2="25" stroke={colors.gold} strokeDasharray="4 3" strokeWidth="1" />
      </svg>
    );
  }

  if (kind === "defensibility-meter") {
    return (
      <div>
        <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              style={{
                flex: 1,
                height: 6,
                background: i <= 3 ? colors.goldLight : alpha.whiteA12,
                borderRadius: 3,
              }}
            />
          ))}
        </div>
        <div style={{ fontSize: 10, color: alpha.whiteA40, marginBottom: 10 }}>
          Doc Score: 3 / 5 · CPA: Partial
        </div>
        <div
          style={{
            background: alpha.redSoft,
            border: `1px solid ${alpha.redBorder}`,
            borderRadius: 4,
            padding: "8px 10px",
          }}
        >
          <div style={{ fontSize: 9, letterSpacing: "0.1em", color: colors.danger, fontWeight: 700 }}>
            AUDIT EXPOSURE
          </div>
          <div style={{ fontFamily: fonts.serif, fontSize: 18, color: colors.danger, fontWeight: 700 }}>
            $180K
          </div>
          <div style={{ fontSize: 10, color: alpha.whiteA40, marginTop: 2 }}>
            Savings × n × (1 − doc/5)
          </div>
        </div>
      </div>
    );
  }

  if (kind === "allocation-donut") {
    const cx = 70, cy = 70, r = 48, sw = 18;
    const c = 2 * Math.PI * r;
    return (
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <svg width="140" height="140" viewBox="0 0 140 140">
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#6b6b6b" strokeWidth={sw} strokeDasharray={`${c * 0.15} ${c}`} />
          <circle cx={cx} cy={cy} r={r} fill="none" stroke={colors.green} strokeWidth={sw} strokeDasharray={`${c * 0.55} ${c}`} strokeDashoffset={-c * 0.15} />
          <circle cx={cx} cy={cy} r={r} fill="none" stroke={colors.gold} strokeWidth={sw} strokeDasharray={`${c * 0.3} ${c}`} strokeDashoffset={-c * 0.70} />
          <text x={cx} y={cy - 4} textAnchor="middle" fontSize="11" fill={alpha.whiteA60} fontFamily={fonts.sans}>Blended r</text>
          <text x={cx} y={cy + 12} textAnchor="middle" fontSize="16" fill={colors.goldLight} fontWeight="700" fontFamily={fonts.serif}>9.8%</text>
        </svg>
        <div style={{ fontSize: 10, lineHeight: 1.7 }}>
          <div style={{ color: "#6b6b6b" }}>▮ Liquidity</div>
          <div style={{ color: colors.green }}>▮ Foundation</div>
          <div style={{ color: colors.gold }}>▮ Swing</div>
        </div>
      </div>
    );
  }

  if (kind === "annual-log") {
    return (
      <div style={{ display: "grid", gap: 3, fontSize: 10, fontFamily: fonts.serif }}>
        <div style={{ display: "grid", gridTemplateColumns: "40px 1fr 1fr 1fr", gap: 6, color: alpha.whiteA40, padding: "4px 6px", fontSize: 9, letterSpacing: "0.05em", fontFamily: fonts.sans, textTransform: "uppercase" }}>
          <span>Year</span><span style={{ textAlign: "right" }}>PV</span><span style={{ textAlign: "right" }}>r</span><span style={{ textAlign: "right" }}>CPI</span>
        </div>
        {[
          ["2026", "$500K",  "8.2%", "3.0%", true],
          ["2027", "$612K",  "7.5%", "2.8%", false],
          ["2028", "$748K",  "6.6%", "3.1%", false],
          ["2029", "$901K",  "5.8%", "2.4%", false],
        ].map(([y, pv, r, cpi, base]) => (
          <div
            key={y}
            style={{
              display: "grid",
              gridTemplateColumns: "40px 1fr 1fr 1fr",
              gap: 6,
              padding: "4px 6px",
              background: base ? alpha.goldA06 : alpha.blackA20,
              borderRadius: 3,
              color: base ? colors.goldLight : "#fff",
              fontWeight: base ? 700 : 500,
            }}
          >
            <span>{y}</span>
            <span style={{ textAlign: "right" }}>{pv}</span>
            <span style={{ textAlign: "right" }}>{r}</span>
            <span style={{ textAlign: "right" }}>{cpi}</span>
          </div>
        ))}
      </div>
    );
  }

  return <div style={common}>Preview</div>;
};
