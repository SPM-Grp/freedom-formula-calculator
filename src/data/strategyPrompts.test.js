import { describe, it, expect } from "vitest";
import { STRATEGY_PROMPTS } from "./strategyPrompts";

describe("STRATEGY_PROMPTS", () => {
  it("defines prompts for all four relevant tabs", () => {
    expect(STRATEGY_PROMPTS.eliminate).toBeTruthy();
    expect(STRATEGY_PROMPTS.assess).toBeTruthy();
    expect(STRATEGY_PROMPTS.launch).toBeTruthy();
    expect(STRATEGY_PROMPTS.insulate).toBeTruthy();
  });

  it("each prompt has title, subtitle, body", () => {
    for (const tab of ["eliminate", "assess", "launch", "insulate"]) {
      const p = STRATEGY_PROMPTS[tab];
      expect(p.title).toBeTruthy();
      expect(p.subtitle).toBeTruthy();
      expect(p.body).toBeTruthy();
      expect(p.body.length).toBeGreaterThan(200);
    }
  });

  it("every prompt includes a [STRATEGY NAME] placeholder", () => {
    for (const tab of ["eliminate", "assess", "launch", "insulate"]) {
      expect(STRATEGY_PROMPTS[tab].body).toContain("[STRATEGY NAME]");
    }
  });

  it("every prompt tells the AI not to give tax advice", () => {
    for (const tab of ["eliminate", "assess", "launch", "insulate"]) {
      expect(STRATEGY_PROMPTS[tab].body.toLowerCase()).toMatch(/do not.*(tax advice|advice)/);
    }
  });

  it("eliminate prompt runs the 7-test filter", () => {
    const body = STRATEGY_PROMPTS.eliminate.body;
    expect(body).toContain("Test 1");
    expect(body).toContain("Test 7");
  });

  it("assess prompt references Freedom Formula variables", () => {
    const body = STRATEGY_PROMPTS.assess.body;
    expect(body).toContain("PV");
    expect(body).toContain("FV");
    expect(body).toContain("required return");
  });

  it("launch prompt asks for chronological execution plan", () => {
    const body = STRATEGY_PROMPTS.launch.body;
    expect(body.toLowerCase()).toContain("chronological");
    expect(body.toLowerCase()).toContain("deadline");
  });

  it("insulate prompt asks about audit triggers", () => {
    const body = STRATEGY_PROMPTS.insulate.body;
    expect(body.toLowerCase()).toContain("audit");
    expect(body.toLowerCase()).toContain("retention");
  });
});
