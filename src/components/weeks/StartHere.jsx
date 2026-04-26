import { WEEKS, ENROLLMENT_URL, SKOOL_COMMUNITY_URL, BOOK_URL, DELPHI_URL } from "../../constants";
import { colors, alpha, fonts, radii, styles } from "../../lib/theme";
import { PageHeader, Card } from "../ui";

// Start Here — two sub-tab variants.
//   - For Visitors: how to use the Freedom Formula Calculator + what the
//     locked weeks contain. Real teaching value, not a pure CTA.
//   - For Participants: orientation on the Command Center for enrolled users.

export const StartHere = ({ activeSub, setActiveSlug, navigate }) => {
  if (activeSub === "For Participants") return <ForParticipants setActiveSlug={setActiveSlug} />;
  return <ForVisitors setActiveSlug={setActiveSlug} navigate={navigate} />;
};

// ─── FOR VISITORS ─────────────────────────────────────────────────────────
// Brand shortcuts (match EXODUS's inline style vocabulary)
const GOLD = colors.gold;
const GOLD_L = colors.goldLight;
const GREEN = colors.success;
const RED = colors.danger;
const DARK = colors.dark;

const STEP_HOW_TO = [
  {
    letter: "E",
    title: "Expose",
    do: "Enter your deployable capital today and how many years you have until work becomes optional.",
    see: "A starting-position card showing PV + timeline.",
  },
  {
    letter: "X",
    title: "The Missing Variable",
    do: "Design the life you actually want. Enter monthly amounts across nine lifestyle categories.",
    see: "Your FV — the size of the wealth machine your dream requires.",
  },
  {
    letter: "O",
    title: "Outpace Erosion",
    do: "Add your inflation outlook and effective tax rate. We'll compute your break-even.",
    see: "The floor below which your wealth erodes even when the account balance grows.",
  },
  {
    letter: "D",
    title: "Decode Your Number",
    do: "Nothing to enter — we solve for r from your PV, FV, and timeline.",
    see: "Your required return with a verdict: green, gold, or red.",
  },
  {
    letter: "U",
    title: "Unlock the Levers",
    do: "Move four sliders: scale PV, adjust timeline, reshape lifestyle, add annual contributions.",
    see: "A live compounding curve that flattens when the levers help, steepens when they don't.",
  },
  {
    letter: "S",
    title: "Supercharge",
    do: "Drag the tax-recovery slider to see what mitigation would unlock.",
    see: "Three curves overlaid: easier path, sooner freedom, bigger machine.",
  },
];

const VERDICT_BANDS = [
  {
    range: "< 7%",
    band: "Conservative path viable",
    color: GREEN,
    detail: "Well-managed conventional investing gets you there. Discipline required — but the path exists.",
  },
  {
    range: "7% – 12%",
    band: "Deliberate decisions required",
    color: GOLD,
    detail: "Achievable but not automatic. Tax strategies and asset allocation matter significantly.",
  },
  {
    range: "> 12%",
    band: "A lever needs to move",
    color: RED,
    detail: "Not a failure — information. More capital, more time, different lifestyle, or better vehicles.",
  },
];

const ForVisitors = ({ setActiveSlug, navigate }) => {
  const jumpToStep = (letter) => {
    if (navigate) navigate("exodus", letter);
    else setActiveSlug("exodus");
  };

  const lockedWeeks = WEEKS.filter((w) => w.weekNumber >= 2 && w.weekNumber <= 8);

  return (
    <div>
      <PageHeader
        title="Welcome to the Freedom Formula Calculator."
        subtitle="Six steps. Ten minutes. A number most people never see — your required annual return."
      />

      {/* What's free, right now */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 12,
          marginBottom: 20,
        }}
      >
        <div
          style={{
            padding: "14px 18px",
            background: alpha.goldA06,
            border: `1px solid ${alpha.goldA30}`,
            borderRadius: radii.card,
          }}
        >
          <div style={{ fontSize: 10, letterSpacing: "0.1em", color: GOLD, fontWeight: 700 }}>
            FREE · NO SIGN-IN NEEDED
          </div>
          <div style={{ fontFamily: fonts.serif, fontSize: 15, color: GOLD_L, fontWeight: 700, marginTop: 4 }}>
            EXODUS · The Freedom Formula
          </div>
          <div style={{ fontSize: 12, color: alpha.whiteA60, marginTop: 4, lineHeight: 1.5 }}>
            Six-step calculator. Run it as many times as you want. Download a PDF for your CPA.
          </div>
        </div>
        <div
          style={{
            padding: "14px 18px",
            background: alpha.goldA06,
            border: `1px solid ${alpha.goldA30}`,
            borderRadius: radii.card,
          }}
        >
          <div style={{ fontSize: 10, letterSpacing: "0.1em", color: GOLD, fontWeight: 700 }}>
            FREE · SIGN IN TO KEEP YOUR ANNUAL LOG
          </div>
          <div style={{ fontFamily: fonts.serif, fontSize: 15, color: GOLD_L, fontWeight: 700, marginTop: 4 }}>
            YIELD · Track Your Freedom
          </div>
          <div style={{ fontSize: 12, color: alpha.whiteA60, marginTop: 4, lineHeight: 1.5 }}>
            One row per year, forever. Your PV, your r, your CPI — saved to your Google account so your history is yours to keep. Works whether or not you join the program.
          </div>
        </div>
      </div>

      {/* Section 1 — What it is */}
      <div
        style={{
          background: alpha.whiteA035,
          border: `1px solid ${alpha.goldA30}`,
          borderRadius: radii.card,
          padding: "28px 24px",
          marginBottom: 20,
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: 10,
            letterSpacing: "0.15em",
            color: GOLD,
            fontWeight: 700,
            marginBottom: 10,
          }}
        >
          THE FREEDOM FORMULA
        </div>
        <div
          style={{
            fontFamily: fonts.serif,
            fontSize: 44,
            fontWeight: 800,
            color: GOLD_L,
            lineHeight: 1,
            marginBottom: 18,
            letterSpacing: "0.02em",
          }}
        >
          FV = PV(1+r)<sup style={{ fontSize: 26 }}>n</sup>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: 14,
            marginBottom: 18,
            textAlign: "left",
            maxWidth: 760,
            margin: "0 auto 18px",
          }}
        >
          {[
            { k: "PV", l: "Present Value",     v: "Your deployable capital today" },
            { k: "FV", l: "Future Value",       v: "The machine your life requires" },
            { k: "n",  l: "Timeline",           v: "Years until work is optional" },
            { k: "r",  l: "Required return",    v: "The verdict — not the goal" },
          ].map((d) => (
            <div
              key={d.k}
              style={{
                padding: "10px 14px",
                background: alpha.blackA20,
                borderRadius: 6,
                borderLeft: `3px solid ${GOLD}`,
              }}
            >
              <div style={{ fontFamily: fonts.serif, fontSize: 22, fontWeight: 800, color: GOLD }}>
                {d.k}
              </div>
              <div style={{ fontSize: 10, color: GOLD_L, letterSpacing: "0.05em", textTransform: "uppercase", fontWeight: 700, marginTop: 2 }}>
                {d.l}
              </div>
              <div style={{ fontSize: 12, color: alpha.whiteA60, marginTop: 4, lineHeight: 1.4 }}>
                {d.v}
              </div>
            </div>
          ))}
        </div>
        <p
          style={{
            color: alpha.whiteA60,
            fontSize: 14,
            lineHeight: 1.6,
            maxWidth: 640,
            margin: "0 auto",
          }}
        >
          Most wealth advice tells you to chase a higher <strong style={{ color: GOLD_L }}>r</strong>.
          The Freedom Formula flips it: work <strong>PV</strong>, <strong>FV</strong>, and <strong>n</strong> first —
          then <strong style={{ color: GOLD_L }}>r</strong> tells you the truth about what's actually required.
        </p>
      </div>

      {/* Section 2 — How to use it */}
      <div style={{ marginBottom: 24 }}>
        <div
          style={{
            fontSize: 10,
            letterSpacing: "0.15em",
            color: GOLD,
            fontWeight: 700,
            marginBottom: 4,
          }}
        >
          HOW TO USE IT
        </div>
        <div
          style={{
            fontFamily: fonts.serif,
            fontSize: 22,
            color: "#fff",
            fontWeight: 700,
            marginBottom: 14,
          }}
        >
          Six steps. Click any to jump straight in.
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: 12,
          }}
        >
          {STEP_HOW_TO.map((s) => (
            <button
              key={s.letter}
              onClick={() => jumpToStep(s.letter)}
              style={{
                background: alpha.whiteA035,
                border: `1px solid ${alpha.goldA18}`,
                borderRadius: radii.card,
                padding: "16px 18px",
                textAlign: "left",
                cursor: "pointer",
                fontFamily: "inherit",
                color: "inherit",
                display: "grid",
                gridTemplateColumns: "36px 1fr",
                gap: 14,
                alignItems: "start",
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
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: GOLD,
                  fontSize: 18,
                  fontWeight: 800,
                  color: DARK,
                  fontFamily: fonts.serif,
                }}
              >
                {s.letter}
              </span>
              <div>
                <div style={{ fontFamily: fonts.serif, fontSize: 16, color: GOLD_L, fontWeight: 700 }}>
                  {s.title}
                </div>
                <div style={{ fontSize: 12, color: alpha.whiteA60, lineHeight: 1.5, marginTop: 6 }}>
                  <strong style={{ color: GOLD_L }}>Do:</strong> {s.do}
                </div>
                <div style={{ fontSize: 12, color: alpha.whiteA60, lineHeight: 1.5, marginTop: 4 }}>
                  <strong style={{ color: GOLD_L }}>See:</strong> {s.see}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: GOLD,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    fontWeight: 700,
                    marginTop: 8,
                  }}
                >
                  Jump to Step {s.letter} →
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Section 3 — Verdict bands */}
      <div style={{ marginBottom: 24 }}>
        <div
          style={{
            fontSize: 10,
            letterSpacing: "0.15em",
            color: GOLD,
            fontWeight: 700,
            marginBottom: 4,
          }}
        >
          WHAT YOUR NUMBER MEANS
        </div>
        <div
          style={{
            fontFamily: fonts.serif,
            fontSize: 22,
            color: "#fff",
            fontWeight: 700,
            marginBottom: 14,
          }}
        >
          r is a verdict, not just a percentage.
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
          {VERDICT_BANDS.map((b) => (
            <div
              key={b.band}
              style={{
                padding: "18px 20px",
                background: b.color + "10",
                border: `1px solid ${b.color}44`,
                borderRadius: radii.card,
              }}
            >
              <div
                style={{
                  fontFamily: fonts.serif,
                  fontSize: 22,
                  fontWeight: 800,
                  color: b.color,
                  marginBottom: 4,
                }}
              >
                {b.range}
              </div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: b.color,
                  letterSpacing: "0.02em",
                  marginBottom: 8,
                }}
              >
                {b.band}
              </div>
              <div style={{ fontSize: 12, color: alpha.whiteA60, lineHeight: 1.55 }}>
                {b.detail}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 4 — After EXODUS */}
      <div style={{ marginBottom: 20 }}>
        <div
          style={{
            fontSize: 10,
            letterSpacing: "0.15em",
            color: GOLD,
            fontWeight: 700,
            marginBottom: 4,
          }}
        >
          AFTER EXODUS
        </div>
        <div
          style={{
            fontFamily: fonts.serif,
            fontSize: 22,
            color: "#fff",
            fontWeight: 700,
            marginBottom: 6,
          }}
        >
          Your number is the beginning, not the end.
        </div>
        <div style={{ color: alpha.whiteA60, fontSize: 13, marginBottom: 14, maxWidth: 680, lineHeight: 1.5 }}>
          EXODUS gives you a <em>required return</em>. The seven locked weeks in the left nav are the system that actually pursues it — tax strategy, documentation, capital deployment, and a permanent annual rhythm. One tool. One login. Everything you build stays here.
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 8 }}>
          {lockedWeeks.map((w) => (
            <button
              key={w.slug}
              onClick={() => setActiveSlug(w.slug)}
              style={{
                textAlign: "left",
                background: alpha.whiteA035,
                border: `1px solid ${alpha.goldA12}`,
                borderRadius: radii.card,
                padding: "12px 16px",
                cursor: "pointer",
                color: "inherit",
                fontFamily: "inherit",
                display: "grid",
                gridTemplateColumns: "100px 1fr 20px",
                alignItems: "center",
                gap: 16,
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = alpha.goldA06;
                e.currentTarget.style.borderColor = alpha.goldA30;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = alpha.whiteA035;
                e.currentTarget.style.borderColor = alpha.goldA12;
              }}
            >
              <div style={{ fontFamily: fonts.serif, color: GOLD_L, fontSize: 14, fontWeight: 700 }}>
                {w.title}
              </div>
              <div style={{ color: alpha.whiteA60, fontSize: 12, lineHeight: 1.45 }}>
                {w.description}
              </div>
              <div style={{ fontSize: 14, opacity: 0.5, textAlign: "right" }}>🔒</div>
            </button>
          ))}
        </div>
      </div>

      {/* Hero CTA — main headline */}
      <div
        style={{
          background: `linear-gradient(135deg, ${alpha.goldA12} 0%, ${alpha.goldA06} 100%)`,
          border: `1px solid ${GOLD}`,
          borderRadius: radii.card,
          padding: "28px 28px",
          textAlign: "center",
          marginTop: 20,
          marginBottom: 14,
        }}
      >
        <div
          style={{
            fontFamily: fonts.serif,
            fontSize: 32,
            color: GOLD_L,
            fontWeight: 800,
            lineHeight: 1.1,
            marginBottom: 8,
            letterSpacing: "-0.01em",
          }}
        >
          Earn more. Keep more. Live more.
        </div>
        <div
          style={{
            color: alpha.whiteA60,
            fontSize: 14,
            lineHeight: 1.6,
            maxWidth: 560,
            margin: "0 auto 20px",
          }}
        >
          You worked for it. Stop handing half of it to the IRS. CLEAR is the eight-week system that turns your required return into a plan — with CPA-defensible strategies, not stock tips.
        </div>
        <a
          href={ENROLLMENT_URL}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            ...styles.button,
            display: "inline-block",
            textDecoration: "none",
            padding: "14px 28px",
            fontSize: 14,
            letterSpacing: "0.06em",
          }}
        >
          Join the CLEAR Program →
        </a>
      </div>

      {/* Two-path secondary CTAs: Book (for not-ready buyers) + Start EXODUS */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 12,
          marginBottom: 14,
        }}
      >
        <a
          href={BOOK_URL}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "block",
            textDecoration: "none",
            color: "inherit",
            fontFamily: "inherit",
            background: alpha.whiteA035,
            border: `1px solid ${alpha.goldA18}`,
            borderRadius: radii.card,
            padding: "18px 20px",
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
              fontSize: 10,
              letterSpacing: "0.15em",
              color: GOLD,
              fontWeight: 700,
              marginBottom: 6,
            }}
          >
            📕 NOT READY FOR THE PROGRAM?
          </div>
          <div style={{ fontFamily: fonts.serif, fontSize: 17, color: GOLD_L, fontWeight: 700, marginBottom: 4 }}>
            Start with the book.
          </div>
          <div style={{ fontSize: 13, color: alpha.whiteA60, lineHeight: 1.5, marginBottom: 8 }}>
            <strong>Rich But Broke MD</strong> — the manifesto behind CLEAR. Why high earners feel broke, and the framework that fixes it.
          </div>
          <div
            style={{
              fontSize: 11,
              color: GOLD,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              fontWeight: 700,
            }}
          >
            Get the book →
          </div>
        </a>

        <button
          onClick={() => jumpToStep("E")}
          style={{
            display: "block",
            textAlign: "left",
            background: alpha.whiteA035,
            border: `1px solid ${alpha.goldA18}`,
            borderRadius: radii.card,
            padding: "18px 20px",
            cursor: "pointer",
            color: "inherit",
            fontFamily: "inherit",
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
              fontSize: 10,
              letterSpacing: "0.15em",
              color: GOLD,
              fontWeight: 700,
              marginBottom: 6,
            }}
          >
            🧮 OR JUST RUN YOUR NUMBERS
          </div>
          <div style={{ fontFamily: fonts.serif, fontSize: 17, color: GOLD_L, fontWeight: 700, marginBottom: 4 }}>
            Start the Freedom Formula now.
          </div>
          <div style={{ fontSize: 13, color: alpha.whiteA60, lineHeight: 1.5, marginBottom: 8 }}>
            Six steps. Your PV, your lifestyle, your timeline. Your required return with a verdict. No sign-in needed.
          </div>
          <div
            style={{
              fontSize: 11,
              color: GOLD,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              fontWeight: 700,
            }}
          >
            Go to Step E →
          </div>
        </button>
      </div>

      {/* Ask Sam — inline help footer */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 10,
          padding: "14px 18px",
          background: alpha.blackA20,
          borderRadius: radii.card,
          border: `1px solid ${alpha.whiteA08}`,
          flexWrap: "wrap",
          color: alpha.whiteA60,
          fontSize: 12,
          lineHeight: 1.5,
        }}
      >
        <span>Stuck on a concept or want to go deeper?</span>
        <a
          href={DELPHI_URL}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: GOLD_L,
            fontWeight: 700,
            textDecoration: "none",
            borderBottom: `1px solid ${alpha.goldA30}`,
            paddingBottom: 2,
          }}
        >
          💬 Ask Sam Anything — trained on every framework and answer →
        </a>
      </div>
    </div>
  );
};

// ─── FOR PARTICIPANTS ──────────────────────────────────────────────────────
const ForParticipants = ({ setActiveSlug }) => {
  const capture = [
    { week: "EXODUS",    text: "Your Freedom Formula — PV, FV, n, r, lifestyle, effective tax rate" },
    { week: "REVEAL",    text: "Your actual tax landscape — AGI, rate scenarios, reference inputs" },
    { week: "ELIMINATE", text: "Your strategy filter results — Keep, Exclude, Route, Park" },
    { week: "ASSESS",    text: "Your estimated annual tax savings and the impact on your Freedom Formula" },
    { week: "LAUNCH",    text: "Your implementation timeline — strategies, owners, activation dates" },
    { week: "INSULATE",  text: "Your defensibility grades — documentation status per strategy" },
    { week: "TARGET",    text: "Your capital allocation — Foundation, Swing, Liquidity Reserve" },
    { week: "YIELD",     text: "Your annual log — one row per year, forever" },
  ];

  return (
    <div>
      <PageHeader
        title="Welcome to your CLEAR Command Center."
        subtitle="This is the one tool that follows you through all eight weeks. Everything you build here is saved, connected, and cumulative. Your numbers from Week 1 feed into Week 2, which feeds into Week 3, and so on — until Week 8, where you see everything in one place."
      />

      <Card>
        <div style={{ ...styles.label, color: colors.goldLight }}>How to use it</div>
        <ul style={{ margin: "8px 0 0", paddingLeft: 18, color: alpha.whiteA60, fontSize: 13, lineHeight: 1.7 }}>
          <li>Work through each week's lesson first — then return here to capture your outputs</li>
          <li>Your data saves automatically every time you make a change</li>
          <li>The left nav shows your progress — locked weeks unlock as you advance</li>
          <li>
            The <em>Track Your Freedom</em> tab in YIELD is your permanent living record — you'll use it for years after the program ends
          </li>
        </ul>
      </Card>

      <div style={{ ...styles.label, marginTop: 28, color: colors.goldLight, fontSize: 13 }}>
        What each week captures
      </div>

      <Card style={{ padding: 0, overflow: "hidden" }}>
        {capture.map((c, i) => (
          <button
            key={c.week}
            onClick={() => setActiveSlug(c.week.toLowerCase())}
            style={{
              display: "grid",
              gridTemplateColumns: "120px 1fr",
              alignItems: "center",
              gap: 18,
              padding: "12px 18px",
              background: "transparent",
              border: "none",
              borderTop: i > 0 ? `1px solid ${alpha.goldA12}` : "none",
              cursor: "pointer",
              textAlign: "left",
              color: "inherit",
              fontFamily: "inherit",
              width: "100%",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = alpha.whiteA04)}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <div style={{ fontFamily: fonts.serif, color: colors.goldLight, fontSize: 14, fontWeight: 700 }}>
              {c.week}
            </div>
            <div style={{ color: alpha.whiteA60, fontSize: 13, lineHeight: 1.5 }}>{c.text}</div>
          </button>
        ))}
      </Card>

      {/* The book — softer, secondary callout for participants. Members
          frequently share / gift the book to colleagues considering CLEAR. */}
      <a
        href={BOOK_URL}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: "block",
          textDecoration: "none",
          color: "inherit",
          fontFamily: "inherit",
          marginTop: 24,
          background: alpha.whiteA035,
          border: `1px solid ${alpha.goldA18}`,
          borderRadius: radii.card,
          padding: "14px 18px",
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
            gap: 14,
            flexWrap: "wrap",
          }}
        >
          <div style={{ flex: "1 1 auto", minWidth: 0 }}>
            <div
              style={{
                fontSize: 10,
                letterSpacing: "0.12em",
                color: colors.gold,
                fontWeight: 700,
                marginBottom: 3,
                textTransform: "uppercase",
              }}
            >
              📕 The book behind CLEAR
            </div>
            <div style={{ fontFamily: fonts.serif, fontSize: 15, color: colors.goldLight, fontWeight: 700, marginBottom: 2 }}>
              Rich But Broke MD
            </div>
            <div style={{ fontSize: 12, color: alpha.whiteA60, lineHeight: 1.5 }}>
              The manifesto. Useful to gift to a colleague who's curious about the program — or to re-read between weeks.
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

      <div style={{ marginTop: 16, textAlign: "center" }}>
        <a
          href={SKOOL_COMMUNITY_URL}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: colors.goldLight,
            textDecoration: "none",
            fontSize: 13,
            borderBottom: `1px solid ${alpha.goldA30}`,
            paddingBottom: 2,
          }}
        >
          Questions about the program? Visit the Skool community →
        </a>
      </div>
    </div>
  );
};
