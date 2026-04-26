import {
  useEffect, useRef, useState, useCallback, createContext, useContext, useMemo,
  createElement,
} from "react";
import { supabase } from "../lib/supabase";

// ────────────────────────────────────────────────────────────────────────────
// Command Center persistence.
//
// Schema (see migrations/001_initial.sql):
//   users(id, email, name, cohort, enrolled_weeks, created_at)
//   command_center_data(user_id, week_slug, subtab_slug, field_key, value)
//   freedom_log (append-only, only notes editable)
//
// UI helpers:
//   usePersistenceScope(week, subtab)  → { get, set, loaded }
//   useField(week, subtab, field, def)  → [value, setValue]
//   useJSONField(week, subtab, field, def) → [value, setValue]
//   useFreedomLog(user) → { rows, loaded, append, updateNotes, reload }
//
// Save semantics:
//   Changes go into a pending map keyed by `${week}/${subtab}/${field}`.
//   A 500ms debounced flush writes all pending items as a batched upsert.
//   On flush success, pending entries are removed ONLY if their value hasn't
//     been overwritten during flight (last-write-wins).
//   On flush error, pending entries remain — retry on next change or on
//     beforeunload flush.
//   saveStatus + lastSavedAt are exposed via context for the top-bar indicator.
// ────────────────────────────────────────────────────────────────────────────

const PersistenceCtx = createContext(null);

export const PersistenceProvider = ({ user, children }) => {
  const [cache, setCache] = useState({}); // `${week}/${subtab}/${field}` → value
  const [loaded, setLoaded] = useState(false);
  const [saveStatus, setSaveStatus] = useState("idle"); // idle|saving|saved|error
  const [lastSavedAt, setLastSavedAt] = useState(null);

  const pendingWrites = useRef(new Map()); // key → { week, subtab, field, value }
  const flushTimer = useRef(null);
  const savedTimer = useRef(null);
  const flushing = useRef(false);

  // Load all rows on user change.
  // Safety timeout: if the query hangs (RLS, network, missing table), force
  // loaded=true after 4 seconds so the app still renders. The user just won't
  // see prior values until the next successful load.
  useEffect(() => {
    let active = true;
    if (!supabase || !user) {
      setCache({});
      setLoaded(true);
      return () => { active = false; };
    }
    setLoaded(false);
    const safety = setTimeout(() => {
      if (active) {
        // eslint-disable-next-line no-console
        console.warn("[Persistence] load safety timeout fired — forcing loaded=true");
        setLoaded(true);
      }
    }, 4000);
    supabase
      .from("command_center_data")
      .select("week_slug, subtab_slug, field_key, value")
      .eq("user_id", user.id)
      .then(({ data, error }) => {
        if (!active) return;
        clearTimeout(safety);
        if (error) {
          console.warn("Load command_center_data error", error);
          setCache({});
        } else {
          const next = {};
          (data || []).forEach((r) => {
            next[`${r.week_slug}/${r.subtab_slug}/${r.field_key}`] = r.value;
          });
          setCache(next);
        }
        setLoaded(true);
      }, (err) => {
        if (!active) return;
        clearTimeout(safety);
        console.warn("Load command_center_data threw", err);
        setCache({});
        setLoaded(true);
      });
    return () => { active = false; clearTimeout(safety); };
  }, [user?.id]);

  const flush = useCallback(async () => {
    if (!supabase || !user) {
      pendingWrites.current.clear();
      return;
    }
    if (flushing.current) return; // serialize flushes
    if (pendingWrites.current.size === 0) return;

    // Snapshot so late-arriving edits during flight don't get clobbered.
    const snapshot = Array.from(pendingWrites.current.values());
    flushing.current = true;
    setSaveStatus("saving");

    const rows = snapshot.map((b) => ({
      user_id: user.id,
      week_slug: b.week,
      subtab_slug: b.subtab,
      field_key: b.field,
      value: b.value ?? "",
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase
      .from("command_center_data")
      .upsert(rows, { onConflict: "user_id,week_slug,subtab_slug,field_key" });

    flushing.current = false;

    if (error) {
      console.warn("Persistence flush error — will retry", error);
      setSaveStatus("error");
      // Schedule a retry in 3 seconds
      if (flushTimer.current) clearTimeout(flushTimer.current);
      flushTimer.current = setTimeout(() => flush(), 3000);
      return;
    }

    // Success — remove only entries whose value hasn't changed during flight
    snapshot.forEach((b) => {
      const key = `${b.week}/${b.subtab}/${b.field}`;
      const current = pendingWrites.current.get(key);
      if (current && current.value === b.value) {
        pendingWrites.current.delete(key);
      }
    });
    setSaveStatus("saved");
    setLastSavedAt(Date.now());
    // Auto-fade back to idle after 2s
    if (savedTimer.current) clearTimeout(savedTimer.current);
    savedTimer.current = setTimeout(() => setSaveStatus("idle"), 2000);

    // If new writes arrived during flush, schedule another flush
    if (pendingWrites.current.size > 0) {
      if (flushTimer.current) clearTimeout(flushTimer.current);
      flushTimer.current = setTimeout(() => flush(), 500);
    }
  }, [user?.id]);

  const scheduleFlush = useCallback(() => {
    if (flushTimer.current) clearTimeout(flushTimer.current);
    flushTimer.current = setTimeout(() => flush(), 500);
  }, [flush]);

  const get = useCallback(
    (week, subtab, field, defaultValue = "") => {
      const v = cache[`${week}/${subtab}/${field}`];
      return v === undefined ? defaultValue : v;
    },
    [cache]
  );

  const set = useCallback(
    (week, subtab, field, value) => {
      const key = `${week}/${subtab}/${field}`;
      setCache((c) => ({ ...c, [key]: value }));
      pendingWrites.current.set(key, { week, subtab, field, value });
      scheduleFlush();
    },
    [scheduleFlush]
  );

  // Flush pending on unload
  useEffect(() => {
    const handler = () => {
      if (flushTimer.current) clearTimeout(flushTimer.current);
      flush();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [flush]);

  const value = useMemo(
    () => ({ cache, get, set, loaded, flush, saveStatus, lastSavedAt }),
    [cache, get, set, loaded, flush, saveStatus, lastSavedAt]
  );
  // No JSX here on purpose — this file is `.js`, and Vite's esbuild pre-pass
  // only parses JSX in `.jsx/.tsx`. createElement sidesteps that entirely.
  return createElement(PersistenceCtx.Provider, { value }, children);
};

export const usePersistence = () => {
  const ctx = useContext(PersistenceCtx);
  if (!ctx) throw new Error("usePersistence must be inside <PersistenceProvider>");
  return ctx;
};

export const usePersistenceScope = (weekSlug, subtabSlug) => {
  const { get, set, loaded } = usePersistence();
  return {
    loaded,
    get: (field, def = "") => get(weekSlug, subtabSlug, field, def),
    set: (field, value) => set(weekSlug, subtabSlug, field, value),
  };
};

// Scalar field — reads/writes through persistence, rehydrates on load.
// NOTE: reads the cache object directly (not via get()) because `get` has a
// default-parameter value "" that JS substitutes when caller passes literal
// undefined — which would make "never set" indistinguishable from "empty
// string." Direct cache access preserves that distinction so defaultValue fires.
export const useField = (weekSlug, subtabSlug, field, defaultValue = "") => {
  const { set, loaded, cache } = usePersistence();
  const cacheKey = `${weekSlug}/${subtabSlug}/${field}`;
  const stored = cache[cacheKey];
  const [value, setValue] = useState(stored === undefined ? defaultValue : stored);

  // Rehydrate whenever the cache value for this field changes.
  useEffect(() => {
    if (!loaded) return;
    const latest = cache[cacheKey];
    if (latest !== undefined && latest !== value) setValue(latest);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, cache[cacheKey]]);

  const update = useCallback(
    (next) => {
      const resolved = typeof next === "function" ? next(value) : next;
      setValue(resolved);
      set(weekSlug, subtabSlug, field, typeof resolved === "string" ? resolved : String(resolved));
    },
    [set, weekSlug, subtabSlug, field, value]
  );

  return [value, update];
};

// JSON field — for arrays/objects. Same direct-cache fix as useField.
export const useJSONField = (weekSlug, subtabSlug, field, defaultValue) => {
  const { set, loaded, cache } = usePersistence();
  const cacheKey = `${weekSlug}/${subtabSlug}/${field}`;
  const parse = (raw) => {
    if (raw === undefined || raw === null || raw === "") return defaultValue;
    try { return JSON.parse(raw); } catch { return defaultValue; }
  };
  const [value, setValue] = useState(parse(cache[cacheKey]));

  useEffect(() => {
    if (!loaded) return;
    setValue(parse(cache[cacheKey]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, cache[cacheKey]]);

  const update = useCallback(
    (next) => {
      const resolved = typeof next === "function" ? next(value) : next;
      setValue(resolved);
      set(weekSlug, subtabSlug, field, JSON.stringify(resolved));
    },
    [set, weekSlug, subtabSlug, field, value]
  );

  return [value, update];
};

// ────────────────────────────────────────────────────────────────────────────
// freedom_log — append-only annual rows for YIELD.
// ────────────────────────────────────────────────────────────────────────────

export const useFreedomLog = (user) => {
  const [rows, setRows] = useState([]);
  const [loaded, setLoaded] = useState(false);

  const reload = useCallback(async () => {
    if (!supabase || !user) {
      setRows([]);
      setLoaded(true);
      return;
    }
    setLoaded(false);
    const { data, error } = await supabase
      .from("freedom_log")
      .select("*")
      .eq("user_id", user.id)
      .order("year", { ascending: true });
    if (error) {
      console.warn("freedom_log load error", error);
      setRows([]);
    } else {
      setRows(data || []);
    }
    setLoaded(true);
  }, [user?.id]);

  useEffect(() => { reload(); }, [reload]);

  const append = useCallback(
    async (row) => {
      if (!supabase || !user) return { error: "not_authed" };
      const payload = { ...row, user_id: user.id };
      const { data, error } = await supabase
        .from("freedom_log")
        .insert(payload)
        .select()
        .single();
      if (error) {
        console.warn("freedom_log append error", error);
        return { error };
      }
      setRows((r) => [...r, data].sort((a, b) => (a.year || 0) - (b.year || 0)));
      return { data };
    },
    [user?.id]
  );

  const updateNotes = useCallback(
    async (rowId, notes) => {
      if (!supabase) return;
      const { data, error } = await supabase
        .from("freedom_log")
        .update({ notes })
        .eq("id", rowId)
        .select()
        .single();
      if (error) {
        console.warn("freedom_log updateNotes error", error);
        return;
      }
      setRows((r) => r.map((row) => (row.id === rowId ? data : row)));
    },
    []
  );

  return { rows, loaded, append, updateNotes, reload };
};
