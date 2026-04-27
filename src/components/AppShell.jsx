import { useState, useMemo, useEffect } from "react";
import { WEEKS, WEEK_BY_SLUG } from "../constants";
import { colors, alpha, fonts, gradients } from "../lib/theme";
import { LeftNav } from "./LeftNav";
import { SubTabs } from "./SubTabs";
import { LockedPreview } from "./LockedPreview";
import { SaveIndicator } from "./SaveIndicator";
import { ErrorBoundary } from "./ErrorBoundary";
import { AskDelphi } from "./AskDelphi";
import { usePersistence } from "../hooks/usePersistence";
import { useViewport } from "../hooks/useViewport";
import { supabase } from "../lib/supabase";

import { StartHere } from "./weeks/StartHere";
import { Exodus } from "./weeks/Exodus";
import { Reveal } from "./weeks/Reveal";
import { Eliminate } from "./weeks/Eliminate";
import { Assess } from "./weeks/Assess";
import { Launch } from "./weeks/Launch";
import { Insulate } from "./weeks/Insulate";
import { Target } from "./weeks/Target";
import { Yield as YieldWeek } from "./weeks/Yield";

const WEEK_COMPONENTS = {
  start_here: StartHere,
  exodus: Exodus,
  reveal: Reveal,
  eliminate: Eliminate,
  assess: Assess,
  launch: Launch,
  insulate: Insulate,
  target: Target,
  yield: YieldWeek,
};

export const AppShell = ({ auth, enrollment }) => {
  const { user, signInWithGoogle, signOut, userRow } = auth;
  const { isUnlocked, previewAll } = enrollment;
  const { loaded } = usePersistence();
  const { isMobile } = useViewport();
  const [navOpen, setNavOpen] = useState(false);

  // Admin helper — `?set_weeks=N` sets the current user's enrolled_weeks and
  // reloads. Only effective when Supabase is connected + signed in.
  useEffect(() => {
    if (!user || !supabase) return;
    const setWeeks = new URLSearchParams(window.location.search).get("set_weeks");
    if (setWeeks === null) return;
    const n = parseInt(setWeeks, 10);
    if (!isFinite(n) || n < 0 || n > 8) return;
    (async () => {
      await supabase.from("users").update({ enrolled_weeks: n }).eq("id", user.id);
      const url = new URL(window.location.href);
      url.searchParams.delete("set_weeks");
      window.location.replace(url.toString());
    })();
  }, [user]);

  // Active slug: read from hash, keep in sync with hashchange.
  const readHash = () => {
    if (typeof window === "undefined") return "exodus";
    const hash = window.location.hash.replace("#", "");
    return WEEK_BY_SLUG[hash] ? hash : "exodus";
  };
  const [activeSlug, setActiveSlug] = useState(readHash);
  useEffect(() => {
    const handler = () => setActiveSlug(readHash());
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, []);

  const selectWeek = (slug) => {
    setActiveSlug(slug);
    if (typeof window !== "undefined") window.location.hash = slug;
    // On mobile, picking a week auto-closes the drawer so users see the page.
    setNavOpen(false);
  };

  // Deep-link helper — jump to a slug AND a specific sub-tab in one call.
  // Used by Start Here's "How to use it" cards to drop visitors straight
  // into the relevant EXODUS step.
  const navigate = (slug, sub) => {
    setActiveSlug(slug);
    if (typeof window !== "undefined") window.location.hash = slug;
    if (sub) setSubActive((s) => ({ ...s, [slug]: sub }));
  };

  // Per-week sub-tab. Initialize Start Here based on auth state, but allow
  // toggling so previewAll / authed users can inspect the visitor variant.
  const [subActive, setSubActive] = useState({});
  useEffect(() => {
    setSubActive((s) => {
      if (s.start_here) return s;
      return { ...s, start_here: user ? "For Participants" : "For Visitors" };
    });
  }, [user]);

  const activeWeek = WEEK_BY_SLUG[activeSlug];
  const activeSub = subActive[activeSlug] || activeWeek?.subtabs?.[0] || null;
  const setActiveSub = (tab) => setSubActive((s) => ({ ...s, [activeSlug]: tab }));

  const unlocked = isUnlocked(activeSlug);
  const WeekComponent = WEEK_COMPONENTS[activeSlug];

  const suppressBanner = activeSlug === "yield" || activeSlug === "start_here";

  // Shared inner content (sub-tabs + week panel or locked preview).
  const innerContent = (
    <>
      <SaveIndicator />

      {!user && !suppressBanner && (
        <SignInBanner onSignIn={signInWithGoogle} activeSlug={activeSlug} />
      )}

      {unlocked ? (
        <>
          {!activeWeek.hasOwnSubNav && (
            <SubTabs tabs={activeWeek.subtabs} active={activeSub} onChange={setActiveSub} />
          )}
          {WeekComponent ? (
            <ErrorBoundary weekLabel={activeWeek.title}>
              {!loaded ? (
                <LoadingState />
              ) : (
                <WeekComponent
                  activeSub={activeSub}
                  setActiveSub={setActiveSub}
                  auth={auth}
                  enrollment={enrollment}
                  setActiveSlug={selectWeek}
                  navigate={navigate}
                />
              )}
            </ErrorBoundary>
          ) : (
            <div style={{ color: alpha.whiteA60 }}>Not yet built.</div>
          )}
        </>
      ) : (
        <LockedPreview slug={activeSlug} />
      )}
    </>
  );

  // ─── MOBILE SHELL ───────────────────────────────────────────────────────
  // Top bar with brand + hamburger; LeftNav becomes a slide-in drawer
  // overlaid above main, with a dimming backdrop. Clicking a week auto-
  // closes the drawer (handled in selectWeek above).
  if (isMobile) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: gradients.appBackground,
          fontFamily: fonts.sans,
          color: colors.white,
        }}
      >
        {/* Top bar — sticky */}
        <div
          style={{
            position: "sticky",
            top: 0,
            zIndex: 40,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "10px 14px",
            background: gradients.appBackground,
            borderBottom: `1px solid ${alpha.goldA18}`,
          }}
        >
          <button
            onClick={() => setNavOpen(true)}
            aria-label="Open navigation"
            style={{
              background: "transparent",
              border: `1px solid ${alpha.goldA30}`,
              color: colors.goldLight,
              borderRadius: 6,
              padding: "8px 10px",
              cursor: "pointer",
              fontFamily: fonts.sans,
              fontSize: 14,
              fontWeight: 700,
              lineHeight: 1,
              minWidth: 38,
            }}
          >
            ☰
          </button>
          <div
            style={{
              fontFamily: fonts.serif,
              color: colors.goldLight,
              fontSize: 15,
              fontWeight: 700,
              letterSpacing: "-0.01em",
              textAlign: "center",
              flex: 1,
              padding: "0 8px",
            }}
          >
            {activeWeek?.nav || "CLEAR"}
          </div>
          {/* Right-side spacer to keep the title centered */}
          <div style={{ minWidth: 38 }} aria-hidden="true" />
        </div>

        {/* Drawer + backdrop */}
        {navOpen && (
          <>
            <div
              onClick={() => setNavOpen(false)}
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.5)",
                zIndex: 50,
              }}
            />
            <div
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                bottom: 0,
                width: "min(85vw, 300px)",
                zIndex: 60,
                boxShadow: "4px 0 24px rgba(0,0,0,0.5)",
                overflowY: "auto",
              }}
            >
              <LeftNav
                activeSlug={activeSlug}
                onSelect={selectWeek}
                isUnlocked={isUnlocked}
                previewAll={previewAll}
                user={user}
                userRow={userRow}
                onSignIn={signInWithGoogle}
                onSignOut={signOut}
                mobile
                onClose={() => setNavOpen(false)}
              />
            </div>
          </>
        )}

        <main
          style={{
            padding: "16px 14px 60px",
            color: colors.white,
            minWidth: 0,
            position: "relative",
          }}
        >
          {innerContent}
        </main>

        <AskDelphi />
      </div>
    );
  }

  // ─── DESKTOP SHELL (unchanged behavior) ─────────────────────────────────
  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: gradients.appBackground,
        fontFamily: fonts.sans,
      }}
    >
      <LeftNav
        activeSlug={activeSlug}
        onSelect={selectWeek}
        isUnlocked={isUnlocked}
        previewAll={previewAll}
        user={user}
        userRow={userRow}
        onSignIn={signInWithGoogle}
        onSignOut={signOut}
      />

      <main
        style={{
          flex: 1,
          padding: "32px 44px 60px",
          overflowY: "auto",
          color: colors.white,
          minWidth: 0,
          position: "relative",
        }}
      >
        {innerContent}
      </main>

      {/* Floating Ask Delphi button — always available */}
      <AskDelphi />
    </div>
  );
};

const LoadingState = () => (
  <div
    style={{
      color: alpha.whiteA40,
      fontSize: 13,
      padding: "40px 0",
      textAlign: "center",
      fontStyle: "italic",
    }}
  >
    Restoring your numbers…
  </div>
);

const SignInBanner = ({ onSignIn, activeSlug }) => (
  <div
    style={{
      background: alpha.goldA06,
      border: `1px solid ${alpha.goldA30}`,
      borderRadius: 10,
      padding: "12px 18px",
      marginBottom: 24,
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 20,
      flexWrap: "wrap",
    }}
  >
    <div>
      <div
        style={{
          color: colors.goldLight,
          fontSize: 13,
          fontWeight: 700,
          letterSpacing: "0.05em",
          textTransform: "uppercase",
          marginBottom: 2,
        }}
      >
        Save your progress
      </div>
      <div style={{ color: alpha.whiteA60, fontSize: 13 }}>
        Sign in with Google to save your numbers and return to them later.
      </div>
      <div style={{ color: alpha.whiteA40, fontSize: 11, marginTop: 4 }}>
        Signing in adds you to our email list. Occasional updates only — unsubscribe anytime.
      </div>
    </div>
    <button
      onClick={onSignIn}
      style={{
        background: colors.gold,
        color: colors.green,
        border: "none",
        borderRadius: 6,
        padding: "10px 18px",
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: "0.05em",
        textTransform: "uppercase",
        cursor: "pointer",
      }}
    >
      Sign in with Google
    </button>
  </div>
);
