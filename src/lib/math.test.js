import { describe, it, expect } from "vitest";
import {
  fmt,
  fmtPct,
  parseMoney,
  num,
  solveR,
  solveRWithContrib,
  solveNWithContrib,
  calcFVWithContrib,
  breakEven,
  verdict,
  annualFromMonthly,
  lifestyleToFV,
  auditExposure,
  defensibilityScore,
  defensibilityBand,
  blendedReturn,
  foundationCoverage,
  timeToThreshold,
  recalibrateFV,
  LIFESTYLE_BUFFER_PCT,
} from "./math";

// ─── Formatters ───────────────────────────────────────────────────────────
describe("fmt", () => {
  it("abbreviates millions", () => {
    expect(fmt(1_500_000)).toBe("$1.50M");
    expect(fmt(10_370_000)).toBe("$10.37M");
  });
  it("formats thousands with commas", () => {
    expect(fmt(500_000)).toBe("$500,000");
    expect(fmt(1_234)).toBe("$1,234");
  });
  it("handles null / invalid", () => {
    expect(fmt(null)).toBe("—");
    expect(fmt(undefined)).toBe("—");
    expect(fmt(NaN)).toBe("—");
    expect(fmt(Infinity)).toBe("—");
  });
});

describe("fmtPct", () => {
  it("formats decimals as percent to 1 decimal", () => {
    expect(fmtPct(0.07)).toBe("7.0%");
    expect(fmtPct(0.123)).toBe("12.3%");
    expect(fmtPct(0)).toBe("0.0%");
  });
  it("handles null and non-finite", () => {
    expect(fmtPct(null)).toBe("—");
    expect(fmtPct(undefined)).toBe("—");
    expect(fmtPct(NaN)).toBe("—");
  });
});

describe("parseMoney", () => {
  it("parses plain numbers and numeric strings", () => {
    expect(parseMoney(500000)).toBe(500000);
    expect(parseMoney("500000")).toBe(500000);
  });
  it("strips $ and commas", () => {
    expect(parseMoney("$500,000")).toBe(500000);
    expect(parseMoney("$1,234,567.89")).toBeCloseTo(1234567.89);
  });
  it("handles empty / null / invalid", () => {
    expect(parseMoney("")).toBe(0);
    expect(parseMoney(null)).toBe(0);
    expect(parseMoney(undefined)).toBe(0);
    expect(parseMoney("abc")).toBe(0);
  });
});

describe("num", () => {
  it("preserves zero (unlike parseFloat || fallback)", () => {
    expect(num(0)).toBe(0);
    expect(num("0")).toBe(0);
    expect(num("0", 99)).toBe(0);
  });
  it("falls back only when truly undefined/empty/invalid", () => {
    expect(num("", 5)).toBe(5);
    expect(num(null, 5)).toBe(5);
    expect(num("abc", 5)).toBe(5);
  });
});

// ─── Core solvers ─────────────────────────────────────────────────────────
describe("solveR (closed-form required return)", () => {
  it("solves r for a known PV, FV, n", () => {
    // $1 → $2 over 10 years = 7.177% CAGR
    const r = solveR(1, 2, 10);
    expect(r).toBeCloseTo(0.07177, 3);
  });
  it("handles PV=FV as zero return", () => {
    expect(solveR(100, 100, 10)).toBe(0);
  });
  it("returns null on invalid inputs", () => {
    expect(solveR(0, 1000, 10)).toBe(null);
    expect(solveR(-100, 1000, 10)).toBe(null);
    expect(solveR(100, 0, 10)).toBe(null);
    expect(solveR(100, 1000, 0)).toBe(null);
  });
});

describe("calcFVWithContrib", () => {
  it("computes FV with zero contribution as pure compounding", () => {
    // $1000 at 10% for 5 years = $1000 * 1.61051
    expect(calcFVWithContrib(1000, 0.10, 5, 0)).toBeCloseTo(1610.51, 1);
  });
  it("computes FV with contribution (ordinary annuity)", () => {
    // $1000 PV + $100/yr at 10% for 5 years
    // = 1000 * 1.61051 + 100 * (1.61051 - 1) / 0.10
    // = 1610.51 + 610.51 = 2221.02
    expect(calcFVWithContrib(1000, 0.10, 5, 100)).toBeCloseTo(2221.02, 1);
  });
  it("handles zero rate correctly (avoids divide-by-zero)", () => {
    // At r=0, FV = PV + contrib * n
    expect(calcFVWithContrib(1000, 0, 5, 100)).toBe(1500);
  });
});

describe("solveRWithContrib", () => {
  it("converges within $1 of target FV", () => {
    const target = 1_000_000;
    const r = solveRWithContrib(100_000, target, 20, 10_000);
    const computed = calcFVWithContrib(100_000, r, 20, 10_000);
    expect(Math.abs(computed - target)).toBeLessThan(1);
  });
  it("falls back to simple solveR when no contribution", () => {
    const withContrib = solveRWithContrib(1, 2, 10, 0);
    const closed = solveR(1, 2, 10);
    expect(withContrib).toBeCloseTo(closed, 5);
  });
  it("returns 0 when contribution alone exceeds FV at r=0", () => {
    // PV + contrib * n already >= FV
    const r = solveRWithContrib(1000, 1500, 5, 200);
    expect(r).toBe(0);
  });
});

describe("solveNWithContrib", () => {
  it("converges within $1 of target FV at given r", () => {
    const n = solveNWithContrib(100_000, 500_000, 0.08, 10_000);
    const computed = calcFVWithContrib(100_000, 0.08, n, 10_000);
    expect(Math.abs(computed - 500_000)).toBeLessThan(1);
  });
  it("falls back to closed-form when no contribution", () => {
    const n = solveNWithContrib(1, 2, 0.07, 0);
    // ln(2) / ln(1.07) ≈ 10.24 years
    expect(n).toBeCloseTo(10.24, 1);
  });
  it("returns null when FV < PV with no contributions", () => {
    expect(solveNWithContrib(1000, 500, 0.07, 0)).toBe(null);
  });
});

// ─── Break-even + verdict ────────────────────────────────────────────────
describe("breakEven", () => {
  it("computes inflation / (1 - ETR)", () => {
    // 3% / (1 - 0.35) = 0.0461
    expect(breakEven(3, 35)).toBeCloseTo(0.0462, 3);
  });
  it("returns null when ETR >= 100", () => {
    expect(breakEven(3, 100)).toBe(null);
    expect(breakEven(3, 150)).toBe(null);
  });
  it("handles zero inflation", () => {
    expect(breakEven(0, 35)).toBe(0);
  });
});

describe("verdict", () => {
  it("green for r < 7%", () => {
    expect(verdict(0.05).band).toBe("Conservative path viable");
    expect(verdict(0.069).band).toBe("Conservative path viable");
  });
  it("gold for 7% <= r <= 12%", () => {
    expect(verdict(0.07).band).toBe("Deliberate decisions required");
    expect(verdict(0.12).band).toBe("Deliberate decisions required");
  });
  it("red for r > 12%", () => {
    expect(verdict(0.125).band).toBe("A lever needs to move");
    expect(verdict(0.25).band).toBe("A lever needs to move");
  });
  it("returns empty band for null", () => {
    expect(verdict(null).band).toBe("");
  });
});

// ─── Lifestyle → FV ──────────────────────────────────────────────────────
describe("annualFromMonthly", () => {
  it("sums 9 categories × 12 months", () => {
    const vals = { housing: "1000", food: "500" };
    const keys = ["housing", "food"];
    expect(annualFromMonthly(vals, keys)).toBe((1000 + 500) * 12);
  });
  it("tolerates $-formatted strings (the autoformat bug fix)", () => {
    const vals = { housing: "$3,500" };
    const keys = ["housing"];
    expect(annualFromMonthly(vals, keys)).toBe(3500 * 12);
  });
  it("treats missing keys as zero", () => {
    const vals = {};
    const keys = ["housing", "food"];
    expect(annualFromMonthly(vals, keys)).toBe(0);
  });
});

describe("lifestyleToFV", () => {
  it("applies 12.5% buffer constitutional constant", () => {
    expect(LIFESTYLE_BUFFER_PCT).toBe(0.125);
  });
  it("computes FV = annualFuture / yieldRate with buffer applied", () => {
    const result = lifestyleToFV({
      monthlyVals: { housing: "1000" },
      categoryKeys: ["housing"],
      inflationPct: 3,
      yieldRate: 0.07,
      nYears: 10,
    });
    // subtotal = 12000, buffer = 1500, annualToday = 13500
    expect(result.subtotal).toBe(12000);
    expect(result.buffer).toBe(1500);
    expect(result.annualToday).toBe(13500);
    // annualFuture = 13500 * 1.03^10 = 18,142.87
    expect(result.annualFuture).toBeCloseTo(18142.87, 0);
    // fv = 18142.87 / 0.07 = 259,183.87
    expect(result.fv).toBeCloseTo(259183.87, -1);
  });
});

// ─── Defensibility ──────────────────────────────────────────────────────
describe("auditExposure", () => {
  it("computes savings × n × (1 - doc/5)", () => {
    // $50K savings × 10 yrs × (1 - 3/5) = 50000 * 10 * 0.4 = 200000
    expect(auditExposure({ annualSavings: 50000, nYears: 10, docScore: 3 })).toBe(200000);
  });
  it("zero exposure at max doc score", () => {
    expect(auditExposure({ annualSavings: 50000, nYears: 10, docScore: 5 })).toBe(0);
  });
  it("full exposure at zero doc score", () => {
    expect(auditExposure({ annualSavings: 50000, nYears: 10, docScore: 0 })).toBe(500000);
  });
});

describe("defensibilityScore", () => {
  it("returns null for empty list", () => {
    expect(defensibilityScore([])).toBe(null);
    expect(defensibilityScore([{ annualSavings: 0 }])).toBe(null);
  });
  it("weights by annual savings", () => {
    // 2 strategies: one perfect (90 + 10 CPA = 100), one minimal (doc 1 = 18, no CPA = 0)
    // with equal savings, avg = 59
    const score = defensibilityScore([
      { annualSavings: 10000, docScore: 5, cpaConfirmed: "yes" },
      { annualSavings: 10000, docScore: 1, cpaConfirmed: "no" },
    ]);
    expect(score).toBeGreaterThan(40);
    expect(score).toBeLessThan(70);
  });
  it("caps individual strategy score at 100", () => {
    const score = defensibilityScore([
      { annualSavings: 10000, docScore: 5, cpaConfirmed: "yes" },
    ]);
    expect(score).toBeLessThanOrEqual(100);
  });
});

describe("defensibilityBand", () => {
  it("maps 85+ to Audit-Ready", () => {
    expect(defensibilityBand(100).label).toBe("Audit-Ready");
    expect(defensibilityBand(85).label).toBe("Audit-Ready");
  });
  it("maps 70-84 to Strong", () => {
    expect(defensibilityBand(84).label).toBe("Strong");
    expect(defensibilityBand(70).label).toBe("Strong");
  });
  it("maps 50-69 to Functional", () => {
    expect(defensibilityBand(69).label).toBe("Functional");
    expect(defensibilityBand(50).label).toBe("Functional");
  });
  it("maps <50 to Action Required", () => {
    expect(defensibilityBand(49).label).toBe("Action Required");
    expect(defensibilityBand(0).label).toBe("Action Required");
  });
  it("handles null", () => {
    expect(defensibilityBand(null).label).toBe("—");
  });
});

// ─── Capital placement ───────────────────────────────────────────────────
describe("blendedReturn", () => {
  it("computes weighted average correctly", () => {
    // $1M foundation at 6% + $1M swing at 15% = 10.5% blended
    const r = blendedReturn({
      foundation$: 1_000_000,
      foundationYield: 6,
      swing$: 1_000_000,
      swingReturn: 15,
    });
    expect(r).toBeCloseTo(0.105, 4);
  });
  it("handles foundation-only", () => {
    const r = blendedReturn({
      foundation$: 1_000_000,
      foundationYield: 6,
      swing$: 0,
      swingReturn: 15,
    });
    expect(r).toBeCloseTo(0.06, 4);
  });
  it("returns null when no deployed capital", () => {
    expect(blendedReturn({ foundation$: 0, swing$: 0 })).toBe(null);
  });
});

describe("foundationCoverage", () => {
  it("computes income / threshold", () => {
    const cov = foundationCoverage({
      foundation$: 1_000_000,
      foundationYield: 6,
      lifestyleThreshold: 60_000,
    });
    expect(cov.income).toBe(60_000);
    expect(cov.ratio).toBe(1);
  });
  it("returns null when threshold is 0", () => {
    expect(foundationCoverage({ foundation$: 1_000_000, foundationYield: 6, lifestyleThreshold: 0 })).toBe(null);
  });
});

describe("timeToThreshold", () => {
  it("finds year Foundation hits threshold", () => {
    // $500K at 6% reaches $1M income threshold ($16.67M needed) with $50K/yr additions
    const years = timeToThreshold({
      foundation$: 5_000_000,
      foundationYield: 6,
      lifestyleThreshold: 360_000, // $6M Foundation at 6%
      annualAddition: 0,
    });
    // need Foundation × 6% >= 360K, i.e. Foundation >= 6M. Starting at 5M, 6% growth.
    // year 1: 5.3M × 6% = 318K. year 2: 5.618M × 6% = 337K. etc.
    expect(years).toBeGreaterThan(0);
    expect(years).toBeLessThan(10);
  });
  it("returns null when unreachable at yield rate", () => {
    expect(
      timeToThreshold({
        foundation$: 1000,
        foundationYield: 0,
        lifestyleThreshold: 100_000,
        annualAddition: 0,
      })
    ).toBe(null);
  });
});

// ─── YIELD recalibration ─────────────────────────────────────────────────
describe("recalibrateFV", () => {
  it("compounds FV by (1 + CPI)^n_remaining", () => {
    // $5M × 1.03^9 ≈ $6,523,865.92
    const result = recalibrateFV({ fvOriginal: 5_000_000, cpiPct: 3, nRemaining: 9 });
    expect(result).toBeCloseTo(6523865.92, -1);
  });
  it("returns fvOriginal at nRemaining=0", () => {
    expect(recalibrateFV({ fvOriginal: 1_000_000, cpiPct: 3, nRemaining: 0 })).toBe(1_000_000);
  });
  it("handles zero inflation as no change", () => {
    expect(recalibrateFV({ fvOriginal: 1_000_000, cpiPct: 0, nRemaining: 10 })).toBe(1_000_000);
  });
});
