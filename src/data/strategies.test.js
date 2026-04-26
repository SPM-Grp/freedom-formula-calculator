import { describe, it, expect } from "vitest";
import {
  STRATEGY_LIBRARY,
  STRATEGY_CATEGORIES,
  SCRUTINY,
  strategyById,
  strategiesByCategory,
  searchStrategies,
  formatTypicalSavings,
  STRATEGY_DISCLAIMER,
} from "./strategies";

// ─── Library integrity (every strategy has required fields) ──────────────
describe("STRATEGY_LIBRARY", () => {
  it("contains 29 strategies", () => {
    expect(STRATEGY_LIBRARY.length).toBe(29);
  });

  it("every strategy has required top-level fields", () => {
    for (const s of STRATEGY_LIBRARY) {
      expect(s.id, `strategy missing id: ${JSON.stringify(s)}`).toBeTruthy();
      expect(s.name, `strategy ${s.id} missing name`).toBeTruthy();
      expect(s.category, `strategy ${s.id} missing category`).toBeTruthy();
      expect(s.summary, `strategy ${s.id} missing summary`).toBeTruthy();
      expect(s.whoFor, `strategy ${s.id} missing whoFor`).toBeInstanceOf(Array);
      expect(s.disqualifiers, `strategy ${s.id} missing disqualifiers`).toBeInstanceOf(Array);
      expect(s.ircSections, `strategy ${s.id} missing ircSections`).toBeInstanceOf(Array);
      expect(s.implementation, `strategy ${s.id} missing implementation`).toBeTruthy();
      expect(s.documentation, `strategy ${s.id} missing documentation`).toBeTruthy();
      expect(s.cpaQuestions, `strategy ${s.id} missing cpaQuestions`).toBeInstanceOf(Array);
    }
  });

  it("every strategy has a known category", () => {
    const categoryIds = STRATEGY_CATEGORIES.map((c) => c.id);
    for (const s of STRATEGY_LIBRARY) {
      expect(categoryIds, `strategy ${s.id} has unknown category ${s.category}`).toContain(s.category);
    }
  });

  it("all strategy ids are unique", () => {
    const ids = STRATEGY_LIBRARY.map((s) => s.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it("every implementation has steps and owner", () => {
    for (const s of STRATEGY_LIBRARY) {
      expect(s.implementation.steps.length, `${s.id} has no steps`).toBeGreaterThan(0);
      expect(s.implementation.primaryOwner, `${s.id} missing primaryOwner`).toBeTruthy();
      expect(typeof s.implementation.leadTimeWeeks).toBe("number");
    }
  });

  it("every documentation has required items + retention + auditTriggers", () => {
    for (const s of STRATEGY_LIBRARY) {
      expect(s.documentation.required.length, `${s.id} has no required docs`).toBeGreaterThan(0);
      expect(s.documentation.retention, `${s.id} missing retention`).toBeTruthy();
      expect(s.documentation.auditTriggers, `${s.id} missing auditTriggers`).toBeInstanceOf(Array);
    }
  });

  it("every typicalSavings range has min <= max", () => {
    for (const s of STRATEGY_LIBRARY) {
      if (s.typicalSavings) {
        expect(s.typicalSavings.min).toBeLessThanOrEqual(s.typicalSavings.max);
        expect(s.typicalSavings.basis).toBeTruthy();
      }
    }
  });

  it("scrutiny-flagged strategies have a valid level and reason", () => {
    const validLevels = ["none", "elevated", "heightened"];
    for (const s of STRATEGY_LIBRARY) {
      if (s.scrutiny) {
        expect(validLevels).toContain(s.scrutiny.level);
        expect(s.scrutiny.reason).toBeTruthy();
      }
    }
  });

  it("excluded abusive strategies are NOT in library", () => {
    const excluded = [
      "syndicated_conservation",
      "conservation_easement",
      "micro_captive",
      "puerto_rico_act_60",
    ];
    const ids = STRATEGY_LIBRARY.map((s) => s.id.toLowerCase());
    const names = STRATEGY_LIBRARY.map((s) => s.name.toLowerCase());
    for (const banned of excluded) {
      expect(ids.some((i) => i.includes(banned))).toBe(false);
      expect(names.some((n) => n.includes(banned.replace(/_/g, " ")))).toBe(false);
    }
  });

  it("includes the key strategies Sam called out explicitly", () => {
    const mustHave = [
      "fmc",
      "asymmetric_charitable",
      "ffe_business_acquisition",
      "rd_credit",
      "oil_gas_idc",
      "solar_ev_credits",
      // Account-Based Plans / HRAs — Sam explicitly called these out as
      // missing-but-required. Section 105 is the family-HRA play for sole
      // props; ICHRA is the multi-employee account-based plan.
      "section_105_plan",
      "ichra",
    ];
    const ids = STRATEGY_LIBRARY.map((s) => s.id);
    for (const required of mustHave) {
      expect(ids, `missing required strategy: ${required}`).toContain(required);
    }
  });

  it("asymmetric charitable is featured (top of strategy picker)", () => {
    const s = strategyById("asymmetric_charitable");
    expect(s).toBeTruthy();
    expect(s.featured).toBe(true);
  });

  it("featured strategies sort to the top of searchStrategies results", () => {
    // Empty query — featured should be first
    const all = searchStrategies("");
    expect(all[0].featured).toBe(true);
    expect(all[0].id).toBe("asymmetric_charitable");
    // Charitable-category query — asymmetric should still lead the charitable group
    const charitable = searchStrategies("charitable");
    const featuredFirstInResult = charitable.findIndex((s) => s.featured);
    expect(featuredFirstInResult).toBe(0);
  });

  it("HRA strategies live in benefit_optimization_owner and reference §105", () => {
    const s105 = strategyById("section_105_plan");
    const ichra = strategyById("ichra");
    expect(s105.category).toBe("benefit_optimization_owner");
    expect(ichra.category).toBe("benefit_optimization_owner");
    expect(s105.ircSections.some((c) => c.includes("§105"))).toBe(true);
    expect(ichra.ircSections.some((c) => c.includes("§105"))).toBe(true);
  });

  it("asymmetric charitable references the 6:1 / 5:1 window", () => {
    const s = strategyById("asymmetric_charitable");
    expect(s).toBeTruthy();
    const allText = JSON.stringify(s).toLowerCase();
    expect(allText).toContain("6:1");
    expect(allText).toContain("5:1");
  });

  it("R&D credit has elevated scrutiny flag", () => {
    const rd = strategyById("rd_credit");
    expect(rd.scrutiny).toBeTruthy();
    expect(rd.scrutiny.level).toBe("elevated");
  });

  it("Opportunity Zones are NOT present (Sam's explicit removal)", () => {
    const ids = STRATEGY_LIBRARY.map((s) => s.id);
    expect(ids).not.toContain("opportunity_zones");
    const names = STRATEGY_LIBRARY.map((s) => s.name.toLowerCase());
    expect(names.some((n) => n.includes("opportunity zone"))).toBe(false);
  });
});

// ─── Utilities ────────────────────────────────────────────────────────────
describe("strategyById", () => {
  it("finds strategies", () => {
    const s = strategyById("cost_segregation");
    expect(s).toBeTruthy();
    expect(s.name).toBe("Cost Segregation Study");
  });
  it("returns null for unknown id", () => {
    expect(strategyById("not_a_real_strategy")).toBe(null);
  });
});

describe("strategiesByCategory", () => {
  it("returns all strategies in a category", () => {
    const charitable = strategiesByCategory("charitable");
    expect(charitable.length).toBeGreaterThan(0);
    for (const s of charitable) {
      expect(s.category).toBe("charitable");
    }
  });
  it("returns empty for unknown category", () => {
    expect(strategiesByCategory("not_a_category")).toEqual([]);
  });
});

describe("searchStrategies", () => {
  it("returns all strategies for empty query", () => {
    expect(searchStrategies("").length).toBe(STRATEGY_LIBRARY.length);
  });
  it("matches by name (case-insensitive)", () => {
    const results = searchStrategies("roth");
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((s) => s.id === "backdoor_roth")).toBe(true);
    expect(results.some((s) => s.id === "mega_backdoor_roth")).toBe(true);
  });
  it("matches by IRC section", () => {
    const results = searchStrategies("§1202");
    expect(results.some((s) => s.id === "qsbs")).toBe(true);
  });
  it("matches by category", () => {
    const results = searchStrategies("charitable");
    expect(results.length).toBeGreaterThan(0);
  });
});

describe("formatTypicalSavings", () => {
  it("formats ranges with K/M suffixes", () => {
    const r = formatTypicalSavings({ min: 5000, max: 50000, basis: "test" });
    expect(r.range).toContain("$5K");
    expect(r.range).toContain("$50K");
  });
  it("formats millions", () => {
    const r = formatTypicalSavings({ min: 1_500_000, max: 3_000_000, basis: "test" });
    expect(r.range).toContain("M");
  });
  it("includes disclaimer", () => {
    const r = formatTypicalSavings({ min: 100, max: 200, basis: "test" });
    expect(r.disclaimer).toContain("CPA");
  });
  it("returns null for falsy input", () => {
    expect(formatTypicalSavings(null)).toBe(null);
    expect(formatTypicalSavings(undefined)).toBe(null);
  });
});

describe("STRATEGY_DISCLAIMER", () => {
  it("mentions excluded listed transactions", () => {
    expect(STRATEGY_DISCLAIMER).toContain("conservation easements");
    expect(STRATEGY_DISCLAIMER).toContain("micro-captive");
    expect(STRATEGY_DISCLAIMER).toContain("Puerto Rico");
  });
  it("frames as educational, not advice", () => {
    expect(STRATEGY_DISCLAIMER.toLowerCase()).toContain("educational");
    expect(STRATEGY_DISCLAIMER.toLowerCase()).toContain("not tax");
  });
});

// ─── Constitutional language compliance ──────────────────────────────────
describe("constitutional language compliance", () => {
  // Master Doc rule: never assume "spouse," "family," or traditional household
  // structures. Use "family unit" / "partner" inclusive language.
  it("no 'spouse' / 'husband' / 'wife' references in user-facing strategy fields", () => {
    const userFacingFields = [
      "name", "summary", "whoFor", "disqualifiers", "cpaQuestions",
    ];
    const blocked = /\b(spouse|spousal|husband|wife)\b/i;
    const violations = [];
    for (const s of STRATEGY_LIBRARY) {
      for (const field of userFacingFields) {
        const value = s[field];
        if (Array.isArray(value)) {
          value.forEach((v, i) => {
            if (typeof v === "string" && blocked.test(v)) {
              violations.push(`${s.id}.${field}[${i}]: "${v}"`);
            }
          });
        } else if (typeof value === "string" && blocked.test(value)) {
          violations.push(`${s.id}.${field}: "${value}"`);
        }
      }
      // implementation steps + documentation items
      if (s.implementation?.steps) {
        s.implementation.steps.forEach((v, i) => {
          if (blocked.test(v)) violations.push(`${s.id}.implementation.steps[${i}]: "${v}"`);
        });
      }
      if (s.documentation?.required) {
        s.documentation.required.forEach((v, i) => {
          if (blocked.test(v)) violations.push(`${s.id}.documentation.required[${i}]: "${v}"`);
        });
      }
      if (s.documentation?.auditTriggers) {
        s.documentation.auditTriggers.forEach((v, i) => {
          if (blocked.test(v)) violations.push(`${s.id}.documentation.auditTriggers[${i}]: "${v}"`);
        });
      }
    }
    expect(violations, `Family-unit language violations:\n${violations.join("\n")}`).toEqual([]);
  });

  // Master Doc rule: "Redirection" not "Redirect" for the strategy taxonomy.
  it("uses 'Redirection' not 'Redirect' as a strategy type", () => {
    for (const s of STRATEGY_LIBRARY) {
      expect(s.type, `${s.id} has invalid type "${s.type}"`).toMatch(/^(reduction|deferral|redirection)$/);
    }
  });

  // Master Doc rule: never include "founder", "CEO", "licensed CPA" public language.
  it("no 'founder' / 'CEO' / 'licensed CPA' public-facing claims", () => {
    const blocked = /\b(founder|chief executive|ceo|licensed cpa)\b/i;
    const violations = [];
    for (const s of STRATEGY_LIBRARY) {
      const allText = JSON.stringify(s);
      if (blocked.test(allText)) {
        violations.push(s.id);
      }
    }
    expect(violations, `Authority/title violations:\n${violations.join("\n")}`).toEqual([]);
  });
});

describe("STRATEGY_CATEGORIES", () => {
  it("has exactly 10 categories (Master Doc constitutional)", () => {
    expect(STRATEGY_CATEGORIES.length).toBe(10);
  });
  it("all categories have id, label, short", () => {
    for (const c of STRATEGY_CATEGORIES) {
      expect(c.id).toBeTruthy();
      expect(c.label).toBeTruthy();
      expect(c.short).toBeTruthy();
    }
  });
  it("category ids are unique", () => {
    const ids = STRATEGY_CATEGORIES.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("SCRUTINY", () => {
  it("defines three levels", () => {
    expect(SCRUTINY.NONE).toBeTruthy();
    expect(SCRUTINY.ELEVATED).toBeTruthy();
    expect(SCRUTINY.HEIGHTENED).toBeTruthy();
  });
  it("each level has level, label, color", () => {
    for (const k of ["NONE", "ELEVATED", "HEIGHTENED"]) {
      const s = SCRUTINY[k];
      expect(s.level).toBeTruthy();
      // label and color can be null/empty for NONE
      expect("label" in s).toBe(true);
      expect("color" in s).toBe(true);
    }
  });
});
