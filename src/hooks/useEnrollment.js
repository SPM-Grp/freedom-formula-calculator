import { useMemo } from "react";
import { WEEKS } from "../constants";

// Enrollment → unlock state.
//
// Rules from v2.1 spec:
//   - Unenrolled (no user): only EXODUS + Start Here + YIELD (never locks)
//   - Enrolled: weeks unlock sequentially as users.enrolled_weeks increases
//     (enrolled_weeks = N means weeks 1..N are unlocked)
//   - Admin preview override: `?preview=all` query string unlocks everything
//
// Returns { isEnrolled, enrolledWeeks, isUnlocked(slug), previewAll }

export const useEnrollment = (userRow) => {
  const previewAll = typeof window !== "undefined"
    ? new URLSearchParams(window.location.search).get("preview") === "all"
    : false;

  return useMemo(() => {
    const enrolledWeeks = Math.max(0, parseInt(userRow?.enrolled_weeks ?? 0, 10) || 0);
    const isEnrolled = enrolledWeeks >= 1;

    const isUnlocked = (slug) => {
      if (previewAll) return true;
      const week = WEEKS.find((w) => w.slug === slug);
      if (!week) return false;
      if (week.alwaysUnlocked || week.neverLocks) return true;
      return enrolledWeeks >= week.weekNumber;
    };

    return { isEnrolled, enrolledWeeks, isUnlocked, previewAll };
  }, [userRow?.enrolled_weeks, previewAll]);
};
