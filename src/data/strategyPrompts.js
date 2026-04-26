// ────────────────────────────────────────────────────────────────────────────
// Reusable LLM prompt templates for strategies not in the library.
// Users copy the prompt, customize the [brackets], and paste into ChatGPT /
// Claude / Gemini / etc. Output becomes input for their CPA conversation.
//
// Per-tab variants because the JOB at each tab is different:
//   ELIMINATE — evaluate fit (7-test filter)
//   ASSESS    — estimate savings impact
//   LAUNCH    — build implementation plan
//   INSULATE  — build documentation defensibility
// ────────────────────────────────────────────────────────────────────────────

export const STRATEGY_PROMPTS = {
  eliminate: {
    title: "Evaluate a Strategy Not Listed Here",
    subtitle: "Copy this prompt, fill in the brackets, paste into any AI tool.",
    body: `I'm evaluating whether [STRATEGY NAME] is a fit for my situation. Please help me run a 7-test filter:

MY CONTEXT:
- Filing status: [single / MFJ / MFS]
- W-2 income: $[amount]
- Business income / entity type: [S-Corp / LLC / sole prop / none]
- State of residence: [state]
- Age: [age]
- Family: [# of dependents, ages]
- Existing investments / real estate: [brief summary]
- Biggest tax concern right now: [concern]

THE STRATEGY:
[STRATEGY NAME] — what I think it does: [one sentence]

PLEASE TELL ME:
1. What the strategy actually is (in 2–3 sentences, cite IRC sections)
2. Test 1 — Do I qualify? (Any disqualifiers I trigger?)
3. Test 2 — Do I have the underlying conditions? (E.g., own rentals for cost seg, have children of working age for FMC, etc.)
4. Test 3 — Is the savings meaningful vs. cost + complexity at my income level?
5. Test 4 — Is it compatible with my other strategies or does it conflict?
6. Test 5 — Can I realistically execute the implementation (time, cash flow, discipline)?
7. Test 6 — Is this on the IRS Dirty Dozen or abusive-transactions list? Any recent enforcement activity?
8. Test 7 — What's the worst-case scenario if audited and the IRS wins?

Tell me to KEEP, EXCLUDE, ROUTE (to CPA/attorney for deeper review), or PARK (not now, but revisit if ___).

Do NOT give me tax advice. Give me what I need to have an informed conversation with my CPA.`,
  },

  assess: {
    title: "Estimate Savings Impact for a Strategy Not Listed Here",
    subtitle: "Copy this prompt, fill in the brackets, paste into any AI tool.",
    body: `I want to estimate the savings impact of [STRATEGY NAME] on my Freedom Formula.

MY CONTEXT:
- Current Present Value (PV): $[amount from EXODUS]
- Target Future Value (FV): $[amount from EXODUS]
- Timeline (n): [years from EXODUS]
- Current required return (r): [% from EXODUS]
- Marginal federal tax rate: [e.g. 32-37%]
- State marginal rate: [%]

THE STRATEGY:
[STRATEGY NAME] — what it does: [2-3 sentences]

PLEASE ESTIMATE:
1. Typical annual tax savings range for a taxpayer like me (low, middle, high end). Explain the drivers.
2. How stable are these savings year-over-year? (One-time vs. recurring vs. phased?)
3. Implementation + ongoing costs to net against the savings.
4. Is this deferral (pay later) vs. reduction (save for good) vs. redirection (change character)?
5. Given my Freedom Formula, if I treated the savings as annual PMT back into the engine:
   - How much sooner could I arrive at my FV?
   - Or how much bigger could my FV be at the same timeline?
   - Or how much lower could my required r be?
6. What's the probability-weighted expected savings, not just the optimistic number?

Do NOT give me tax advice. Give me math my CPA can stress-test.`,
  },

  launch: {
    title: "Build an Implementation Plan for a Strategy Not Listed Here",
    subtitle: "Copy this prompt, fill in the brackets, paste into any AI tool.",
    body: `I've decided to implement [STRATEGY NAME]. Help me build an execution plan.

MY CONTEXT:
- Entity structure: [S-Corp / LLC / sole prop / C-Corp / W-2 only]
- Professional team: [CPA on retainer? Attorney? Financial advisor?]
- Cash available for implementation: $[amount]
- Target activation: [current year / by year-end / next tax year]

THE STRATEGY:
[STRATEGY NAME]

PLEASE BUILD:
1. Step-by-step implementation plan in chronological order.
2. For each step: who owns it (me? CPA? attorney? TPA? vendor?), estimated time, estimated cost.
3. Critical deadlines — IRS elections, safe-harbor dates, quarter-end cutoffs, plan adoption dates.
4. Dependencies — what must be in place before each step (entity election, plan adopted, etc.).
5. Risks during implementation — what commonly goes wrong, and how to prevent it.
6. How to verify each step completed correctly before moving on.
7. Ongoing annual activities after the initial setup.

Format as a checklist I can hand to my CPA / attorney / team.

Do NOT give me tax advice — give me an execution roadmap my CPA can validate and own.`,
  },

  insulate: {
    title: "Build a Documentation System for a Strategy Not Listed Here",
    subtitle: "Copy this prompt, fill in the brackets, paste into any AI tool.",
    body: `I've implemented [STRATEGY NAME] and need to build an audit-ready documentation system.

THE STRATEGY:
[STRATEGY NAME]
IRC sections involved: [e.g. §1031, §469, §280A — if known]

PLEASE BUILD:
1. Complete list of documents I must keep — name, format, when to collect, where to store.
2. Contemporaneous records needed — what must be dated AT THE TIME of the event (can't be reconstructed).
3. Retention period for each item (year of claim? plus N years? permanent?).
4. Common IRS audit triggers for this strategy — and the specific evidence that rebuts each one.
5. Annual maintenance activities — logs, worksheets, review items.
6. Red flags that would make this strategy's documentation 'Fragile' or 'Exposed' at audit.
7. What a 'Audit-Ready' file looks like for this strategy — the gold standard.

Format as a defensibility checklist my CPA can review and sign off on.

Do NOT give me tax advice — give me the documentation map.`,
  },
};
