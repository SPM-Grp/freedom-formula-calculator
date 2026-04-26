import { DELPHI_URL } from "../constants";
import { colors, alpha, fonts } from "../lib/theme";

// Floating "Ask Sam" button — always visible, bottom-right.
// Opens Sam's Delphi digital mind (AI trained on his content) in a new tab.
// Personal-brand framing converts much better than platform-brand ("Delphi").
export const AskDelphi = () => (
  <a
    href={DELPHI_URL}
    target="_blank"
    rel="noopener noreferrer"
    aria-label="Ask Sam Anything — real-time answers from Sam's digital mind"
    title="Ask Sam Anything — trained on years of Sam's frameworks, client questions, and program content"
    style={{
      position: "fixed",
      bottom: 20,
      right: 20,
      zIndex: 50,
      background: colors.gold,
      color: colors.green,
      borderRadius: 999,
      padding: "12px 20px",
      fontSize: 13,
      fontWeight: 700,
      letterSpacing: "0.04em",
      textTransform: "uppercase",
      textDecoration: "none",
      fontFamily: fonts.sans,
      display: "inline-flex",
      alignItems: "center",
      gap: 10,
      boxShadow: `0 6px 24px ${alpha.blackA40}, 0 2px 6px ${alpha.blackA30}`,
      border: `1px solid ${colors.goldLight}`,
      cursor: "pointer",
      transition: "transform 120ms, box-shadow 120ms",
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = "translateY(-2px)";
      e.currentTarget.style.boxShadow = `0 10px 30px ${alpha.blackA40}, 0 4px 10px ${alpha.blackA30}`;
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = "translateY(0)";
      e.currentTarget.style.boxShadow = `0 6px 24px ${alpha.blackA40}, 0 2px 6px ${alpha.blackA30}`;
    }}
  >
    <span style={{ fontSize: 16 }}>💬</span>
    <span>Ask Sam</span>
  </a>
);

// Inline "Need help? Ask Sam" text link — drop into any step's footer.
export const AskDelphiInline = ({ prompt = "Need help with this step?" }) => (
  <a
    href={DELPHI_URL}
    target="_blank"
    rel="noopener noreferrer"
    style={{
      color: colors.goldLight,
      fontSize: 12,
      textDecoration: "none",
      borderBottom: `1px solid ${alpha.goldA30}`,
      paddingBottom: 2,
      fontFamily: fonts.sans,
    }}
  >
    {prompt} <strong>Ask Sam →</strong>
  </a>
);
