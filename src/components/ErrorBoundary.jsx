import { Component } from "react";
import { colors, alpha, fonts } from "../lib/theme";

// Error boundary around each week's content so a bug in one week doesn't
// blank the whole app. Shows a contained fallback with reload option.
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error("Week render error", { error, info });
  }
  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: "28px 24px",
            border: `1px solid ${alpha.redBorder}`,
            background: alpha.redSoft,
            borderRadius: 10,
            color: alpha.whiteA60,
            maxWidth: 640,
          }}
        >
          <div
            style={{
              color: colors.danger,
              fontSize: 12,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              fontWeight: 700,
              marginBottom: 8,
            }}
          >
            Something went wrong in {this.props.weekLabel || "this tab"}
          </div>
          <div style={{ fontSize: 13, lineHeight: 1.6, marginBottom: 12, fontFamily: fonts.sans }}>
            Your saved data is fine — this is a display error. Try reloading the page. If it persists, let Sam know what you were doing right before it happened.
          </div>
          {this.state.error?.message && (
            <div
              style={{
                fontSize: 11,
                color: alpha.whiteA40,
                fontFamily: "monospace",
                background: alpha.blackA30,
                padding: "6px 10px",
                borderRadius: 4,
                marginBottom: 12,
                wordBreak: "break-word",
              }}
            >
              {String(this.state.error.message)}
            </div>
          )}
          <button
            onClick={() => window.location.reload()}
            style={{
              background: colors.gold,
              color: colors.green,
              border: "none",
              borderRadius: 6,
              padding: "8px 16px",
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              cursor: "pointer",
              fontFamily: fonts.sans,
            }}
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
