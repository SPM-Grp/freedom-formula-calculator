// Supabase client. Reads credentials from Vite env vars. If env vars are
// missing (e.g. local dev without .env.local), the app falls back to an
// in-memory persistence shim — EXODUS still works, nothing crashes.
import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseConfigured = Boolean(url && anonKey);

if (!supabaseConfigured && typeof window !== "undefined") {
  // eslint-disable-next-line no-console
  console.warn(
    "[CLEAR Command Center] Supabase env vars missing (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY). " +
    "Running in guest mode — inputs will not persist across refresh. See SUPABASE_SETUP.md."
  );
}

export const supabase = supabaseConfigured
  ? createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

export const signInWithGoogle = async () => {
  if (!supabase) throw new Error("Supabase not configured");
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: window.location.origin,
      queryParams: { access_type: "offline", prompt: "consent" },
    },
  });
  if (error) throw error;
};

export const signOut = async () => {
  if (!supabase) return;
  await supabase.auth.signOut();
};

// Ensure a `users` row exists for the signed-in auth user.
// Idempotent — preserves cohort + enrolled_weeks on subsequent sign-ins.
// If the row doesn't exist, the DB default of enrolled_weeks=1 applies.
export const ensureUserRow = async (authUser) => {
  if (!supabase || !authUser) return null;

  // Try to read an existing row first — preserves cohort + enrolled_weeks.
  const existing = await supabase
    .from("users")
    .select("*")
    .eq("id", authUser.id)
    .maybeSingle();

  if (existing.data) {
    // Refresh email/name if they've changed in the Google profile.
    const newName = authUser.user_metadata?.full_name || authUser.user_metadata?.name || null;
    const patch = {};
    if (authUser.email && existing.data.email !== authUser.email) patch.email = authUser.email;
    if (newName && existing.data.name !== newName) patch.name = newName;
    if (Object.keys(patch).length === 0) return existing.data;
    const { data, error } = await supabase
      .from("users")
      .update(patch)
      .eq("id", authUser.id)
      .select()
      .single();
    if (error) {
      console.warn("ensureUserRow update error", error);
      return existing.data;
    }
    return data;
  }

  // First sign-in — create the row. enrolled_weeks defaults to 1 via DB default.
  const { data, error } = await supabase
    .from("users")
    .insert({
      id: authUser.id,
      email: authUser.email,
      name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || null,
    })
    .select()
    .single();
  if (error) {
    console.warn("ensureUserRow insert error", error);
    return null;
  }
  return data;
};
