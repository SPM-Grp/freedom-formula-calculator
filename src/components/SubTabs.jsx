import { colors, alpha, fonts } from "../lib/theme";

// Top bar sub-tab navigation (horizontal) — per-week tabs.
// Subtabs list comes from WEEKS config.

export const SubTabs = ({ tabs, active, onChange }) => {
  if (!tabs || tabs.length <= 1) return null;
  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        borderBottom: `1px solid ${alpha.goldA18}`,
        paddingBottom: 0,
        marginBottom: 28,
        flexWrap: "wrap",
      }}
    >
      {tabs.map((t) => {
        const isActive = t === active;
        return (
          <button
            key={t}
            onClick={() => onChange(t)}
            style={{
              background: "transparent",
              border: "none",
              borderBottom: `2px solid ${isActive ? colors.gold : "transparent"}`,
              color: isActive ? colors.goldLight : alpha.whiteA60,
              padding: "10px 16px",
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              fontFamily: fonts.sans,
              cursor: "pointer",
              transition: "color 120ms, border-color 120ms",
            }}
            onMouseEnter={(e) => {
              if (!isActive) e.currentTarget.style.color = colors.goldLight;
            }}
            onMouseLeave={(e) => {
              if (!isActive) e.currentTarget.style.color = alpha.whiteA60;
            }}
          >
            {t}
          </button>
        );
      })}
    </div>
  );
};
