import { useEffect, useState, useCallback } from "react";
import { supabase, supabaseConfigured, ensureUserRow } from "../lib/supabase";

// Auth state + Google OAuth flow.
// Returns { session, user, userRow, loading, signInWithGoogle, signOut }.
// If Supabase isn't configured, returns an always-null/guest state and a
// stub signInWithGoogle that shows an alert — the app still renders the
// unenrolled EXODUS experience for unauthenticated visitors.
//
// Loading semantics: `loading` flips to false as soon as we know whether a
// session exists. Fetching the `users` row happens in the background and
// must NEVER block the loading flag — if RLS, network, or a missing trigger
// hangs ensureUserRow, the app should still render (the user just won't have
// enrollment metadata until that resolves). A 4-second hard timeout is the
// last-resort safety net.
export const useAuth = () => {
  const [session, setSession] = useState(null);
  const [userRow, setUserRow] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    let mounted = true;

    // Hard safety net — if anything below hangs, force loading=false after 4s.
    // This guarantees the app always renders, even if Supabase auth or the
    // users-row fetch is unreachable.
    const safetyTimer = setTimeout(() => {
      if (mounted) {
        // eslint-disable-next-line no-console
        console.warn("[useAuth] safety timeout fired — forcing loading=false");
        setLoading(false);
      }
    }, 4000);

    // Fetch session, then immediately flip loading=false. Do NOT await the
    // users-row lookup before clearing loading — that's the bug we're avoiding.
    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!mounted) return;
        if (error) console.warn("[useAuth] getSession error", error);
        const sess = data?.session ?? null;
        setSession(sess);
        setLoading(false);
        clearTimeout(safetyTimer);
        // Background — fetch userRow without blocking render.
        if (sess?.user) {
          ensureUserRow(sess.user)
            .then((row) => { if (mounted) setUserRow(row); })
            .catch((err) => console.warn("[useAuth] ensureUserRow failed", err));
        }
      })
      .catch((err) => {
        console.warn("[useAuth] getSession threw", err);
        if (mounted) {
          setLoading(false);
          clearTimeout(safetyTimer);
        }
      });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      if (!mounted) return;
      setSession(sess ?? null);
      if (sess?.user) {
        ensureUserRow(sess.user)
          .then((row) => { if (mounted) setUserRow(row); })
          .catch((err) => console.warn("[useAuth] ensureUserRow failed", err));
      } else {
        setUserRow(null);
      }
    });
    return () => {
      mounted = false;
      clearTimeout(safetyTimer);
      sub.subscription.unsubscribe();
    };
  }, []);

  const signInWithGoogle = useCallback(async () => {
    // eslint-disable-next-line no-console
    console.log("[useAuth] signInWithGoogle clicked", {
      configured: supabaseConfigured,
      origin: typeof window !== "undefined" ? window.location.origin : null,
    });
    if (!supabaseConfigured) {
      alert(
        "Supabase is not configured yet. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local, then refresh."
      );
      return;
    }
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin,
          queryParams: { access_type: "offline", prompt: "consent" },
        },
      });
      // eslint-disable-next-line no-console
      console.log("[useAuth] signInWithOAuth returned", { data, error });
      if (error) {
        alert(`Sign-in failed: ${error.message}`);
        return;
      }
      // Belt-and-suspenders: in some SDK builds the auto-redirect is gated on
      // detectSessionInUrl; if data.url is present and we're still on the page
      // 100ms later, navigate manually.
      if (data?.url) {
        setTimeout(() => {
          if (typeof window !== "undefined" && !window.location.href.startsWith(data.url)) {
            window.location.href = data.url;
          }
        }, 100);
      }
    } catch (err) {
      console.error("[useAuth] signInWithOAuth threw", err);
      alert(`Sign-in error: ${err?.message || err}`);
    }
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  }, []);

  return {
    session,
    user: session?.user ?? null,
    userRow,
    loading,
    signInWithGoogle,
    signOut,
    configured: supabaseConfigured,
  };
};
