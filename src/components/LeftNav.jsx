import { WEEKS } from "../constants";
import { colors, alpha, fonts, gradients, radii } from "../lib/theme";

// Left navigation spine of the app.
//   - Always-visible list of Start Here + all 8 weeks
//   - Week name never obscured by lock state (per v2.1 spec)
//   - Lock icon + click → preview card (handled by parent)
//   - Active week highlighted

export const LeftNav = ({
  activeSlug,
  onSelect,
  isUnlocked,
  previewAll,
  user,
  onSignIn,
  onSignOut,
  mobile = false,
  onClose,
}) => {
  // In mobile drawer mode the parent positions and sizes us — we just render
  // the same content with the drawer-friendly chrome (full-height, no
  // sticky positioning, no fixed width).
  return (
    <nav
      data-role="left-nav"
      style={{
        background: gradients.appBackground,
        borderRight: mobile ? "none" : `1px solid ${alpha.goldA18}`,
        width: mobile ? "100%" : 240,
        minWidth: mobile ? 0 : 240,
        height: mobile ? "100%" : "100vh",
        minHeight: mobile ? "100vh" : undefined,
        padding: "24px 0",
        display: "flex",
        flexDirection: "column",
        position: mobile ? "static" : "sticky",
        top: mobile ? "auto" : 0,
        overflowY: "auto",
      }}
    >
      <div style={{ padding: "0 22px 20px", borderBottom: `1px solid ${alpha.goldA12}`, position: "relative" }}>
        {mobile && onClose && (
          <button
            onClick={onClose}
            aria-label="Close navigation"
            style={{
              position: "absolute",
              top: -6,
              right: 14,
              background: "transparent",
              border: "none",
              color: alpha.whiteA60,
              fontSize: 22,
              cursor: "pointer",
              lineHeight: 1,
              padding: 4,
            }}
          >
            ×
          </button>
        )}
        <div
          style={{
            fontFamily: fonts.serif,
            color: colors.goldLight,
            fontSize: 18,
            fontWeight: 700,
            lineHeight: 1.2,
          }}
        >
          CLEAR
        </div>
        <div
          style={{
            fontFamily: fonts.serif,
            color: colors.goldLight,
            fontSize: 18,
            fontWeight: 700,
            lineHeight: 1.2,
          }}
        >
          Command Center
        </div>
        {previewAll && (
          <div
            style={{
              marginTop: 8,
              fontSize: 9,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: colors.warn,
              fontWeight: 700,
            }}
          >
            ⚙ Preview · all weeks unlocked
          </div>
        )}
      </div>

      <div style={{ padding: "16px 0", flex: 1 }}>
        {WEEKS.map((w) => {
          const unlocked = isUnlocked(w.slug);
          const isActive = activeSlug === w.slug;
          return (
            <button
              key={w.slug}
              onClick={() => onSelect(w.slug)}
              style={{
                background: isActive ? alpha.goldA12 : "transparent",
                border: "none",
                borderLeft: `3px solid ${isActive ? colors.gold : "transparent"}`,
                color: unlocked ? (isActive ? colors.goldLight : "#fff") : alpha.whiteA40,
                padding: "10px 22px 10px 19px",
                width: "100%",
                textAlign: "left",
                cursor: "pointer",
                fontFamily: fonts.sans,
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: w.slug === "start_here" ? "0.02em" : "0.08em",
                textTransform: w.slug === "start_here" ? "none" : "uppercase",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                transition: "background 120ms",
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.background = alpha.whiteA04;
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.background = "transparent";
              }}
            >
              <span>{w.nav}</span>
              <span style={{ fontSize: 10, letterSpacing: "0.05em", color: alpha.whiteA40 }}>
                {!unlocked && "🔒 "}
                {w.weekNumber > 0 ? `W${w.weekNumber}` : ""}
              </span>
            </button>
          );
        })}
      </div>

      <div style={{ padding: "16px 22px", borderTop: `1px solid ${alpha.goldA12}` }}>
        {user ? (
          <>
            <div style={{ fontSize: 11, color: alpha.whiteA60, marginBottom: 4, wordBreak: "break-word" }}>
              {user.email}
            </div>
            <button
              onClick={onSignOut}
              style={{
                background: "transparent",
                color: alpha.whiteA40,
                border: `1px solid ${alpha.whiteA12}`,
                borderRadius: radii.button,
                padding: "6px 12px",
                fontSize: 11,
                cursor: "pointer",
                fontFamily: fonts.sans,
                width: "100%",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
              }}
            >
              Sign Out
            </button>
          </>
        ) : (
          <>
            <button
              onClick={onSignIn}
              style={{
                background: colors.gold,
                color: colors.green,
                border: "none",
                borderRadius: radii.button,
                padding: "10px 14px",
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                cursor: "pointer",
                fontFamily: fonts.sans,
                width: "100%",
              }}
            >
              Sign In With Google
            </button>
            <div
              style={{
                marginTop: 8,
                fontSize: 10,
                color: alpha.whiteA40,
                lineHeight: 1.5,
              }}
            >
              By signing in you'll also be added to our email list. Occasional updates about the program — unsubscribe anytime.
            </div>
          </>
        )}
      </div>
    </nav>
  );
};
