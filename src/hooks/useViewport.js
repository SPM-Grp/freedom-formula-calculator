import { useEffect, useState } from "react";

// useViewport — minimal responsive hook.
// Returns { isMobile } based on a media query that matches typical
// portrait-phone viewports (≤720px). The threshold is intentionally generous
// so the drawer also fires on narrow tablet portrait orientations.
//
// Implemented with matchMedia so it doesn't fire on every scroll/resize —
// only when the breakpoint actually crosses.

const QUERY = "(max-width: 720px)";

export const useViewport = () => {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(QUERY).matches;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia(QUERY);
    const handler = (e) => setIsMobile(e.matches);
    // Modern API
    if (mql.addEventListener) {
      mql.addEventListener("change", handler);
      return () => mql.removeEventListener("change", handler);
    }
    // Safari < 14 fallback
    mql.addListener(handler);
    return () => mql.removeListener(handler);
  }, []);

  return { isMobile };
};
