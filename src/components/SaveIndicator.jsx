import { usePersistence } from "../hooks/usePersistence";
import { colors, alpha, fonts } from "../lib/theme";

// Small status chip in the top-right of the content area. States:
//   idle   → nothing shown (doesn't clutter when nothing is happening)
//   saving → "Saving…"
//   saved  → "Saved · HH:MM" for ~2 seconds then fades
//   error  → "Save failed — retrying" in red
export const SaveIndicator = () => {
  const { saveStatus, lastSavedAt } = usePersistence();

  if (!saveStatus || saveStatus === "idle") return null;

  const chip = (bg, border, color, label) => (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: "absolute",
        top: 14,
        right: 20,
        background: bg,
        border: `1px solid ${border}`,
        color,
        padding: "4px 12px",
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: "0.03em",
        fontFamily: fonts.sans,
        pointerEvents: "none",
        zIndex: 10,
      }}
    >
      {label}
    </div>
  );

  if (saveStatus === "saving") {
    return chip(alpha.whiteA06, alpha.whiteA12, alpha.whiteA60, "Saving…");
  }
  if (saveStatus === "saved") {
    const ts = lastSavedAt ? new Date(lastSavedAt) : new Date();
    const time = `${String(ts.getHours()).padStart(2, "0")}:${String(ts.getMinutes()).padStart(2, "0")}`;
    return chip(alpha.greenSoft, alpha.greenBorder, colors.success, `Saved · ${time}`);
  }
  if (saveStatus === "error") {
    return chip(alpha.redSoft, alpha.redBorder, colors.danger, "Save failed — will retry");
  }
  return null;
};
