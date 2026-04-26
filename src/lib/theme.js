// CLEAR brand theme — extracted from the original FreedomFormulaCalculator.jsx
// Do not change color values without a brand review. Dark green, gold, off-white
// are constitutional brand colors per 00-governance/CLEAR_Brand_Voice_Guide.pdf.

export const colors = {
  gold:       "#C4A265",
  goldLight:  "#D4B47A",
  green:      "#1A3C2E",
  dark:       "#0F2019",
  darker:     "#091410",
  offWhite:   "#F9F7F4",
  success:    "#22c55e",
  danger:     "#ef4444",
  warn:       "#f59e0b",
  purple:     "#8b5cf6",
  white:      "#fff",

  // Print-verdict palette (higher contrast for paper; do not unify with on-screen)
  printVerdictGreen: "#16a34a",
  printVerdictGold:  "#92740a",
  printVerdictRed:   "#dc2626",
  printBrandGreen:   "#1A3C2E",
};

export const alpha = {
  whiteA035: "rgba(255,255,255,0.035)",
  whiteA04:  "rgba(255,255,255,0.04)",
  whiteA06:  "rgba(255,255,255,0.06)",
  whiteA08:  "rgba(255,255,255,0.08)",
  whiteA12:  "rgba(255,255,255,0.12)",
  whiteA40:  "rgba(255,255,255,0.4)",
  whiteA60:  "rgba(255,255,255,0.6)",
  goldA05:   "rgba(196,162,101,0.05)",
  goldA06:   "rgba(196,162,101,0.06)",
  goldA07:   "rgba(196,162,101,0.07)",
  goldA12:   "rgba(196,162,101,0.12)",
  goldA18:   "rgba(196,162,101,0.18)",
  goldA30:   "rgba(196,162,101,0.3)",
  blackA20:  "rgba(0,0,0,0.2)",
  blackA25:  "rgba(0,0,0,0.25)",
  blackA30:  "rgba(0,0,0,0.3)",
  blackA40:  "rgba(0,0,0,0.4)",
  redSoft:   "rgba(239,68,68,0.04)",
  redBorder: "rgba(239,68,68,0.2)",
  greenSoft: "rgba(34,197,94,0.04)",
  greenBorder: "rgba(34,197,94,0.4)",
  purpleSoft: "rgba(139,92,246,0.06)",
  purpleBorder: "rgba(139,92,246,0.4)",
};

export const fonts = {
  serif: "Georgia, serif",
  sans:  "'Helvetica Neue', system-ui, -apple-system, sans-serif",
  printSans: "'Helvetica Neue', Helvetica, Arial, sans-serif",
};

export const gradients = {
  appBackground: "linear-gradient(170deg, #091410 0%, #1A3C2E 50%, #0F2019 100%)",
};

export const radii = {
  card: 10,
  input: 6,
  button: 6,
  buttonLg: 8,
  pill: "999px",
};

// Reusable style primitives (spread into JSX style props)
export const styles = {
  card: {
    background: alpha.whiteA035,
    border: `1px solid ${alpha.goldA18}`,
    borderRadius: radii.card,
    padding: "20px 22px",
    marginBottom: 16,
  },
  cardLight: {
    background: alpha.whiteA04,
    border: `1px solid ${alpha.goldA12}`,
    borderRadius: radii.card,
    padding: "16px 18px",
    marginBottom: 12,
  },
  input: {
    background: alpha.blackA30,
    border: `1px solid ${alpha.goldA30}`,
    borderRadius: radii.input,
    color: colors.white,
    fontSize: 15,
    fontWeight: 600,
    padding: "10px 14px",
    width: "100%",
    outline: "none",
    boxSizing: "border-box",
    fontFamily: fonts.serif,
  },
  label: {
    color: colors.goldLight,
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    marginBottom: 6,
    display: "block",
  },
  subText: {
    color: alpha.whiteA40,
    fontSize: 11,
    lineHeight: 1.5,
  },
  button: {
    background: colors.gold,
    color: colors.green,
    border: "none",
    borderRadius: radii.button,
    padding: "10px 18px",
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: "0.05em",
    textTransform: "uppercase",
    cursor: "pointer",
    fontFamily: fonts.sans,
  },
  buttonGhost: {
    background: "transparent",
    color: colors.goldLight,
    border: `1px solid ${alpha.goldA30}`,
    borderRadius: radii.button,
    padding: "10px 18px",
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: "0.05em",
    textTransform: "uppercase",
    cursor: "pointer",
    fontFamily: fonts.sans,
  },
};
