// ────────────────────────────────────────────────────────────────────────────
// CLEAR Strategy Library — 29 tax strategies organized by the 10 canonical
// categories from Master Documents v3.4. Source: Week 5 LAUNCH lesson plan
// (implementation profiles) + Week 6 INSULATE lesson plan (documentation
// profiles) + CLEAR program program content.
//
// Featured strategies (`featured: true`) sort to the top of any picker
// dropdown — used for headline, program-specific structures the participant
// should evaluate before generic catalog items.
//
// CONSTITUTIONAL GUARDRAILS:
//   - Teaching ≠ Prescription. We don't recommend strategies. We describe
//     what they are, who they fit, and what to ask a CPA.
//   - Typical ranges are "what CPAs validate across client profiles," NOT
//     guaranteed outcomes. Every range ends in "your CPA will validate."
//   - IRS-scrutinized strategies carry a scrutiny flag with clear rationale.
//     Strategies on the IRS abusive-transactions list (syndicated conservation
//     easements, micro-captive insurance, Puerto Rico Act 60 abuse) are
//     EXCLUDED — not flagged, not included.
//
// Categories (10):
//   benefit_optimization_w2   · W-2 employee vehicles
//   benefit_optimization_owner · Business-owner retirement structures
//   entity_structuring         · Entity elections and structures
//   asset_depreciation         · Accelerated or enhanced depreciation
//   charitable                 · Charitable giving with tax benefit
//   event_driven               · Trigger-based / annual-repeatable
//   income_character           · Convert ordinary → favorable treatment
//   income_timing              · When income is recognized
//   loss_based                 · Loss generation, deduction, carryforward
//   credit_based               · Dollar-for-dollar credits
// ────────────────────────────────────────────────────────────────────────────

export const STRATEGY_CATEGORIES = [
  { id: "benefit_optimization_w2",    label: "Benefit Optimization (W-2)",    short: "W-2 Benefits" },
  { id: "benefit_optimization_owner", label: "Benefit Optimization (Owner)",  short: "Owner Benefits" },
  { id: "entity_structuring",         label: "Entity Structuring",            short: "Entity" },
  { id: "asset_depreciation",         label: "Asset Depreciation",            short: "Depreciation" },
  { id: "charitable",                 label: "Charitable",                     short: "Charitable" },
  { id: "event_driven",               label: "Event-Driven",                   short: "Event" },
  { id: "income_character",           label: "Income Character",               short: "Character" },
  { id: "income_timing",              label: "Income Timing",                  short: "Timing" },
  { id: "loss_based",                 label: "Loss-Based",                     short: "Loss" },
  { id: "credit_based",               label: "Credit-Based",                   short: "Credits" },
];

// Scrutiny levels applied to strategies the IRS examines more closely.
// None = standard. Elevated = known audit focus. Heightened = recent IRS
// enforcement actions. Excluded strategies (SCE, micro-captive, PR Act 60
// abuse) do not appear at all.
export const SCRUTINY = {
  NONE:       { level: "none",       label: "",                             color: null },
  ELEVATED:   { level: "elevated",   label: "Elevated IRS scrutiny",        color: "#f59e0b" },
  HEIGHTENED: { level: "heightened", label: "Heightened IRS scrutiny",      color: "#ef4444" },
};

// ────────────────────────────────────────────────────────────────────────────
// The library. Each strategy is a self-contained object consumed by ELIMINATE
// (autocomplete), ASSESS (typical ranges), LAUNCH (implementation roadmap),
// INSULATE (documentation checklist).
// ────────────────────────────────────────────────────────────────────────────

export const STRATEGY_LIBRARY = [
  // ══ BENEFIT OPTIMIZATION — W-2 ═════════════════════════════════════════
  {
    id: "401k_max",
    name: "401(k) / 403(b) Max Contribution",
    category: "benefit_optimization_w2",
    type: "deferral",
    ircSections: ["§401(k)", "§402(g)", "§415"],
    summary: "Max employee deferral to a workplace retirement plan; pre-tax contributions lower current AGI by the contributed amount.",
    whoFor: [
      "Any W-2 employee with a 401(k) or 403(b)",
      "High earners in high state-tax jurisdictions",
      "Anyone whose employer offers a match (don't leave match on the table)",
    ],
    disqualifiers: [
      "No workplace plan available",
      "Already maxing other deferral options (verify annual limit)",
    ],
    typicalSavings: { min: 7500, max: 12000, basis: "on $23,500 deferred at 32–37% marginal" },
    implementation: {
      primaryOwner: "self + payroll",
      leadTimeWeeks: 2,
      steps: [
        "Confirm current year contribution limit with HR / plan docs",
        "Log in to payroll provider → update deferral percentage",
        "Verify match terms (some require minimum employee contribution)",
        "Consider catch-up contributions if age 50+ or 60–63 (SECURE 2.0)",
        "Revisit allocation mix separately (this strategy is about the amount, not the investment mix)",
      ],
      costRange: { min: 0, max: 0, note: "Zero implementation cost" },
    },
    documentation: {
      required: [
        "Form W-2 box 12 code D/E (shows deferral amount)",
        "Plan statements — year-end",
        "Confirm elections are on file with plan administrator",
      ],
      retention: "Keep year-end statements 7 years; plan participation records indefinitely",
      auditTriggers: [
        "Reported deferral exceeds IRS limit (plan should prevent this)",
        "Prior-year over-contributions not withdrawn by April 15",
      ],
    },
    cpaQuestions: [
      "Should I also fund after-tax 401(k) and convert? (Mega Backdoor)",
      "Any HCE limits at my employer that cap my contribution?",
      "Do I qualify for catch-up including ages 60-63 super catch-up?",
    ],
  },

  {
    id: "hsa_max",
    name: "HSA — Max Contribution",
    category: "benefit_optimization_w2",
    type: "reduction",
    ircSections: ["§223"],
    summary: "Triple-tax-advantaged account paired with a high-deductible health plan: deductible going in, tax-free growth, tax-free withdrawals for medical.",
    whoFor: [
      "Anyone enrolled in a qualifying HDHP (High-Deductible Health Plan)",
      "High earners who can pay medical out-of-pocket and let HSA compound",
      "Long-horizon investors (use HSA as a stealth IRA)",
    ],
    disqualifiers: [
      "Not enrolled in an HDHP",
      "Enrolled in Medicare (blocks new contributions)",
      "Claimed as a dependent on someone else's return",
    ],
    typicalSavings: { min: 1500, max: 3500, basis: "on max family contribution at 32–37% marginal" },
    implementation: {
      primaryOwner: "self + HSA custodian",
      leadTimeWeeks: 2,
      steps: [
        "Verify HDHP enrollment (check plan docs for HSA-qualified status)",
        "Open HSA with a low-fee custodian with investment options (not just a spending account)",
        "Set up automatic payroll contributions (saves FICA) or direct contributions",
        "Invest balance above a small cash buffer — let it compound",
        "Save medical receipts; delay reimbursement for decades if cash flow permits",
      ],
      costRange: { min: 0, max: 50, note: "Small monthly fee at some custodians; free at others" },
    },
    documentation: {
      required: [
        "Form 5498-SA (annual contribution statement)",
        "Form 1099-SA (distributions)",
        "All medical receipts — even ones not yet reimbursed",
        "HDHP enrollment confirmation",
      ],
      retention: "Medical receipts permanently — can reimburse decades later",
      auditTriggers: [
        "Non-qualified distributions taken before age 65 (20% penalty + tax)",
        "Contributions in months you were on Medicare",
      ],
    },
    cpaQuestions: [
      "Am I actually in a qualified HDHP, or is it close but not quite?",
      "Can I make a catch-up contribution (age 55+)?",
      "Should I treat this as a stealth retirement account vs. medical spending?",
    ],
  },

  {
    id: "backdoor_roth",
    name: "Backdoor Roth IRA",
    category: "benefit_optimization_w2",
    type: "redirection",
    ircSections: ["§408A", "§408(d)(1)"],
    summary: "Non-deductible traditional IRA contribution, then convert to Roth. Ends up equivalent to a direct Roth contribution for those above the income limits.",
    whoFor: [
      "High earners above Roth IRA income phase-out ($150K single / $236K MFJ 2025)",
      "Those with NO pre-tax IRA balances (or willing to address pro-rata)",
    ],
    disqualifiers: [
      "Existing pre-tax IRA balances (traditional, SEP, SIMPLE) that trigger pro-rata rule",
      "Plan to need the money within 5 years of conversion (conversion 5-year rule)",
    ],
    typicalSavings: { min: 500, max: 2000, basis: "long-term tax-free compounding on $7K/yr; compounds dramatically over decades" },
    implementation: {
      primaryOwner: "self + broker",
      leadTimeWeeks: 1,
      steps: [
        "Open traditional IRA + Roth IRA at same broker if not already",
        "Contribute to traditional IRA (non-deductible) — $7K limit for 2025",
        "Wait 1–2 business days for funds to settle",
        "Convert traditional → Roth (same custodian)",
        "File Form 8606 for every year you do this — tracks basis",
      ],
      costRange: { min: 0, max: 0, note: "Free at major brokers" },
    },
    documentation: {
      required: [
        "Form 8606 filed every year a non-deductible contribution is made",
        "Form 1099-R for the conversion (custodian sends)",
        "Form 5498 showing contribution amount",
      ],
      retention: "Keep Form 8606 indefinitely — establishes basis for future distributions",
      auditTriggers: [
        "Failing to file Form 8606 → IRS assumes all distributions are taxable",
        "Pro-rata rule violations from other pre-tax IRA balances",
        "Step-transaction challenges if 'contribute and convert same day' is aggressive",
      ],
    },
    cpaQuestions: [
      "Do I have any pre-tax IRA money that would trigger pro-rata?",
      "Can I roll existing IRAs into my 401(k) first (to clear the runway)?",
      "Is my 401(k) plan amenable to accepting rollovers from IRAs?",
    ],
    relatedStrategies: ["mega_backdoor_roth"],
  },

  {
    id: "mega_backdoor_roth",
    name: "Mega Backdoor Roth",
    category: "benefit_optimization_w2",
    type: "redirection",
    ircSections: ["§401(k)", "§402A"],
    summary: "After-tax 401(k) contributions above normal deferral limit, then in-plan Roth conversion or in-service withdrawal to Roth IRA. Can add $30K+ per year to Roth.",
    whoFor: [
      "W-2 employees whose plan allows after-tax contributions AND in-plan conversions",
      "High earners who've maxed regular 401(k) deferral",
      "Those with cash flow to fund large after-tax contributions",
    ],
    disqualifiers: [
      "Employer plan doesn't allow after-tax contributions",
      "Plan doesn't allow in-plan Roth conversions or in-service distributions",
      "Already hitting §415 limit ($70K total 2025)",
    ],
    typicalSavings: { min: 5000, max: 15000, basis: "long-term tax-free growth on $30K+/yr after-tax contributions" },
    implementation: {
      primaryOwner: "self + HR / plan administrator",
      leadTimeWeeks: 3,
      steps: [
        "Read plan summary — confirm after-tax contributions + in-plan Roth conversion both allowed",
        "Calculate room: §415 limit ($70K 2025) − employee deferral − employer match = max after-tax",
        "Set up payroll after-tax deferral percentage",
        "Set up auto-conversion each paycheck (if plan offers) to minimize earnings on after-tax funds",
        "Verify 1099-R forms correctly show the conversion",
      ],
      costRange: { min: 0, max: 0, note: "Zero implementation cost" },
    },
    documentation: {
      required: [
        "Plan document or summary plan description confirming feature availability",
        "Payroll stubs showing after-tax deductions",
        "Form 1099-R for each conversion",
        "Year-end plan statement",
      ],
      retention: "Plan docs + conversions: keep 7+ years; basis records indefinitely",
      auditTriggers: [
        "Reported Roth rollover without plan providing required documentation",
        "Excess contributions over §415 limit",
        "Earnings on after-tax funds not properly reported as taxable on conversion",
      ],
    },
    cpaQuestions: [
      "Can I confirm with our benefits team that both features are enabled?",
      "What's my exact §415 limit given our match structure?",
      "Should we do in-plan Roth conversion or in-service withdrawal to external Roth IRA?",
    ],
    relatedStrategies: ["401k_max", "backdoor_roth"],
  },

  // ══ BENEFIT OPTIMIZATION — OWNER ═══════════════════════════════════════
  {
    id: "solo_401k",
    name: "Solo 401(k)",
    category: "benefit_optimization_owner",
    type: "deferral",
    ircSections: ["§401(k)", "§415"],
    summary: "A 401(k) for single-owner businesses (no common-law employees). Same deferral limits as W-2 plans plus a profit-sharing contribution of up to 25% of compensation.",
    whoFor: [
      "Sole proprietors, single-member LLCs, single-shareholder S-Corps",
      "1099 consultants, physicians with side income",
      "Family-unit partner (if any) can also contribute when employed by the business",
    ],
    disqualifiers: [
      "Business has common-law employees outside the owner / family unit (triggers ERISA testing)",
      "Using W-2 401(k) elsewhere — deferral limit is aggregate across all plans",
    ],
    typicalSavings: { min: 15000, max: 25000, basis: "on full ~$70K contribution at 32–37% marginal" },
    implementation: {
      primaryOwner: "TPA + self",
      leadTimeWeeks: 6,
      steps: [
        "Engage a low-cost Solo 401(k) provider (Fidelity, Schwab, Vanguard, or a TPA if you want Roth/mega options)",
        "Complete adoption agreement — must be signed by end of tax year (deferral) or extended deadline (employer contribution)",
        "Open plan trust accounts — often takes 2-3 weeks",
        "Submit EIN on Form 5500-EZ when plan assets exceed $250K",
        "Fund employee deferral by year-end; employer contribution by extended filing deadline",
      ],
      costRange: { min: 0, max: 1500, note: "Free at major brokers; $300–1,500/yr for TPA-run plan with Roth/mega" },
    },
    documentation: {
      required: [
        "Plan adoption agreement (permanent record)",
        "Form 5500-EZ once assets > $250K",
        "Year-end plan statements",
        "Evidence of contribution source (W-2 from S-Corp or K-1/Schedule C)",
      ],
      retention: "Plan docs: permanent. Statements: 7 years minimum.",
      auditTriggers: [
        "Hiring an employee outside the owner / family unit but not amending / replacing the plan",
        "Contributions exceeding earned income or §415 limit",
        "Failure to file Form 5500-EZ when required",
      ],
    },
    cpaQuestions: [
      "S-Corp owner: what reasonable comp supports my maximum contribution?",
      "Does my provider offer Roth and mega backdoor features?",
      "If a family-unit partner is also employed by the business, how do we handle their contribution?",
    ],
    relatedStrategies: ["defined_benefit_plan", "reasonable_comp", "mega_backdoor_roth"],
  },

  {
    id: "defined_benefit_plan",
    name: "Defined Benefit / Cash Balance Plan",
    category: "benefit_optimization_owner",
    type: "deferral",
    ircSections: ["§412", "§401(a)(4)"],
    summary: "Pension-style plan allowing $100K–$300K+ annual tax-deductible contribution based on age and compensation — best for high-earning owners approaching retirement.",
    whoFor: [
      "Business owners age 45+ with consistent high income",
      "Those who've maxed 401(k)/Solo 401(k) and still want more deferral space",
      "Professionals (physicians, attorneys, consultants) with sustainable cash flow",
    ],
    disqualifiers: [
      "Volatile or rapidly growing income (DB contributions must be sustainable; underfunding penalties bite)",
      "Under age 40 (the math favors older owners dramatically)",
      "Large employee base without staff-exclusion design work by an actuary",
    ],
    typicalSavings: { min: 40000, max: 100000, basis: "on $150K+ annual contribution at 32–37% marginal" },
    implementation: {
      primaryOwner: "actuary + TPA + CPA",
      leadTimeWeeks: 8,
      steps: [
        "Engage DB/CB TPA for design study — they model multiple scenarios",
        "CPA validates cash flow sustainability across 5–10 year horizon",
        "Adopt plan by fiscal year-end (with certain extensions available)",
        "Actuary certifies annual contribution requirement",
        "Fund by extended filing deadline; file Form 5500 annually",
      ],
      costRange: { min: 3000, max: 8000, note: "Annual TPA/actuary fees; setup costs $2-5K" },
    },
    documentation: {
      required: [
        "Plan document with actuarial assumptions",
        "Annual actuarial certification (Form Schedule SB)",
        "Form 5500 filed annually",
        "PBGC coverage determination",
        "Audit if >100 participants (rarely applies to solo practices)",
      ],
      retention: "Plan documents permanent; actuarial reports 15+ years",
      auditTriggers: [
        "Underfunded plans (excise tax risk under §4971)",
        "Benefit formula changes without required amendments",
        "Terminating before the three-year sustainability test is met",
      ],
    },
    cpaQuestions: [
      "Can my income sustain this contribution for 5+ years?",
      "What's my actuarial projected benefit vs. lump sum payout at retirement?",
      "Should we pair this with a 401(k) in a combo plan for maximum deferral?",
    ],
    relatedStrategies: ["solo_401k", "reasonable_comp"],
  },

  {
    id: "sep_ira",
    name: "SEP-IRA",
    category: "benefit_optimization_owner",
    type: "deferral",
    ircSections: ["§408(k)"],
    summary: "Simpler owner-only retirement option: up to 25% of compensation (or 20% of net SE earnings) contributed each year. No employee deferral component.",
    whoFor: [
      "Self-employed with variable income — SEP contributions are discretionary",
      "Those who want owner-only contribution without plan complexity",
    ],
    disqualifiers: [
      "Want a Roth option (SEPs are traditional only without 2022 SECURE 2.0 changes)",
      "Pre-existing SEP-IRA blocks Backdoor Roth via pro-rata rule",
    ],
    typicalSavings: { min: 8000, max: 20000, basis: "on 20–25% of net SE earnings at 32–37% marginal" },
    implementation: {
      primaryOwner: "self + broker",
      leadTimeWeeks: 1,
      steps: [
        "Open SEP-IRA at a broker — single form",
        "Calculate contribution: 25% of W-2 comp (S-Corp) or 20% of net SE earnings (Schedule C)",
        "Fund by extended filing deadline",
        "Report contribution on Schedule 1 (above-the-line deduction for self-employed) or skip if S-Corp (treated as employer expense)",
      ],
      costRange: { min: 0, max: 0, note: "Free at major brokers" },
    },
    documentation: {
      required: [
        "Form 5498 (broker reports contribution)",
        "Schedule C or W-2 establishing earned income",
        "SEP-IRA adoption agreement",
      ],
      retention: "7 years for annual filings; adoption documents permanent",
      auditTriggers: [
        "Over-contribution relative to net SE earnings calculation",
        "Contributions for years the business had losses",
      ],
    },
    cpaQuestions: [
      "Should we prefer Solo 401(k) for higher contribution potential (adds deferral on top)?",
      "Does my existing SEP balance block Backdoor Roth?",
      "Should I roll the SEP to my 401(k) to clear pro-rata?",
    ],
    relatedStrategies: ["solo_401k", "backdoor_roth"],
  },

  {
    id: "section_105_plan",
    name: "Section 105 Plan / Family HRA",
    category: "benefit_optimization_owner",
    type: "reduction",
    ircSections: ["§105", "§106", "§125"],
    summary: "Sole-prop or single-LLC owner hires a family-unit member as a bona fide employee and reimburses 100% of family medical expenses (premiums, deductibles, copays, dental, vision, OTC) tax-free through the business — a business deduction that converts personal medical spend into pre-tax dollars.",
    whoFor: [
      "Sole proprietors or single-member LLCs (Schedule C) with an employed family-unit member",
      "Service businesses where the family-unit member can perform real, documentable work",
      "Households with significant out-of-pocket medical spend not absorbed by an HSA or HDHP",
    ],
    disqualifiers: [
      "S-Corp owner-employees (the §1372 / §318 attribution rule disallows reimbursements to >2% shareholders for themselves or attributed family)",
      "No bona fide employee role for a family-unit member (work must be real, hours documented, comp reasonable)",
      "Family unit already covered by another household member's group plan that reimburses these expenses",
    ],
    typicalSavings: { min: 4000, max: 18000, basis: "on $15K–$50K of family medical spend at combined federal + state + SE-tax rates" },
    implementation: {
      primaryOwner: "TPA (specialized — BASE, TASC, etc.) + CPA",
      leadTimeWeeks: 4,
      steps: [
        "Confirm entity type allows §105 — sole prop, single-member LLC, partnership where family-unit partner is W-2 employee. NOT S-Corp owner-employees.",
        "Engage a TPA that administers §105 family HRAs (BASE, TASC, AgriPlan are common providers)",
        "Document the family-unit employee role: written job description, reasonable wage, time records",
        "Adopt the plan document; provide Summary Plan Description to the covered employee",
        "Run reimbursements through the business — keep itemized substantiation for every claim",
        "Coordinate with payroll: wages to the family-unit employee are deductible business expense",
      ],
      costRange: { min: 200, max: 600, note: "Annual TPA admin fee; one-time setup ~$150–$300" },
    },
    documentation: {
      required: [
        "Written §105 plan document and SPD",
        "Employment file for the family-unit employee (job description, time records, payroll registers)",
        "Itemized substantiation for every reimbursed medical expense (receipts, EOBs, mileage logs)",
        "Annual reimbursement summary tied to the business return",
        "Reasonable-compensation analysis for the employed family-unit member",
      ],
      retention: "7 years minimum; employment + plan documents permanently",
      auditTriggers: [
        "Family-unit employee performing no documentable work — IRS recharacterizes wages as gift, disallows deductions",
        "Reimbursements exceeding the employee's reasonable wage",
        "S-Corp shareholder attempting §105 (rules don't permit it for >2% owners)",
        "Missing contemporaneous substantiation for medical claims",
      ],
    },
    cpaQuestions: [
      "Is my entity structure compatible with §105 — and if I'm S-Corp, would converting to single-member LLC make sense?",
      "What's a defensible reasonable wage for the family-unit role given the work performed?",
      "Should I pair this with an ICHRA for higher reimbursement caps?",
    ],
    relatedStrategies: ["ichra", "hsa_max", "qbi_optimization"],
  },

  {
    id: "ichra",
    name: "ICHRA — Individual Coverage HRA",
    category: "benefit_optimization_owner",
    type: "reduction",
    ircSections: ["§105", "§9831", "Notice 2018-88"],
    summary: "Business reimburses each employee for individual-market premiums + qualified medical expenses, tax-free, with employer-set monthly caps that can be class-tiered (full-time, part-time, salaried, hourly, geographic). Pairs especially well with a profitable practice or partnership where the owner is a W-2 employee of the entity.",
    whoFor: [
      "Practices, partnerships, or C-Corps where owners draw W-2 wages from the entity",
      "Owner-physicians who want to escape the cost / structure of a group plan",
      "Businesses with employees across mixed life stages — ICHRA classes let you tailor benefits",
    ],
    disqualifiers: [
      "S-Corp >2% shareholder cannot self-reimburse through ICHRA (same §1372 attribution issue as §105)",
      "Employees enrolled in group health — must offer a true individual-market alternative",
      "Practice unwilling to administer per-class allowance design + monthly substantiation",
    ],
    typicalSavings: { min: 6000, max: 25000, basis: "on $15K–$50K reimbursed at combined federal + state + payroll rates; varies by class structure" },
    implementation: {
      primaryOwner: "ICHRA administrator + benefits counsel + CPA",
      leadTimeWeeks: 8,
      steps: [
        "Decide who's eligible — design classes (full-time, part-time, seasonal, salaried, geographic)",
        "Set monthly allowance per class — IRS affordability safe harbor matters for ACA compliance if you have 50+ FTEs",
        "Engage an ICHRA administrator (Take Command, HealthEquity, Gravie, etc.) for substantiation and compliance",
        "Provide 90-day advance notice to employees; collect proof of individual-market enrollment",
        "Reimburse premiums + qualified medical via payroll-integrated workflow — substantiation captured monthly",
        "File annually: ICHRA reimbursements aren't on W-2; 1095-B/-C reporting still applies if ALE",
      ],
      costRange: { min: 1500, max: 6000, note: "Annual administrator fee + setup; ~$5–$15 per-employee per-month typical" },
    },
    documentation: {
      required: [
        "Written ICHRA plan document with class definitions and allowance schedule",
        "90-day employee notice (initial + annual)",
        "Substantiation of individual-market coverage for each enrolled employee",
        "Monthly reimbursement substantiation (premium invoices, EOBs, receipts)",
        "ALE compliance documentation (Form 1094/1095) if 50+ FTEs",
        "Class definitions + nondiscrimination testing analysis",
      ],
      retention: "7 years for reimbursement records; plan documents permanently",
      auditTriggers: [
        "Class designs that look like cherry-picking (e.g., a class of one that happens to be the owner)",
        "Reimbursements without monthly substantiation",
        "Failure to provide the 90-day notice",
        ">2% S-Corp shareholders self-reimbursing",
        "ALE failing affordability safe harbor — exposes practice to §4980H penalties",
      ],
    },
    cpaQuestions: [
      "Does my entity structure allow me to participate as an employee — or am I an attributed owner who's blocked?",
      "What class design is defensible given my actual workforce composition?",
      "How does ICHRA interact with my state's individual market and any subsidies my employees might lose?",
    ],
    scrutiny: {
      level: "elevated",
      reason: "ICHRA class structures are scrutinized when they look engineered to benefit owners over rank-and-file employees. Defensible designs follow workforce facts, not desired outcomes.",
    },
    relatedStrategies: ["section_105_plan", "hsa_max", "s_corp_election"],
  },

  // ══ ENTITY STRUCTURING ════════════════════════════════════════════════
  {
    id: "s_corp_election",
    name: "S-Corp Election",
    category: "entity_structuring",
    type: "redirection",
    ircSections: ["§1361", "§1362", "Form 2553"],
    summary: "Elect S-corporation status for an LLC or corporation. Splits income into W-2 wages (subject to FICA) and distributions (no SE tax). Works for business owners with $80K+ in profit.",
    whoFor: [
      "Sole proprietors / single-member LLCs clearing ~$80K+ net",
      "Service-based businesses (physicians, attorneys, consultants) without QBI phase-out issues",
      "Owners who can sustain reasonable compensation levels",
    ],
    disqualifiers: [
      "Net profit below $80K — setup costs + ongoing admin exceed savings",
      "Multi-class equity structures (S-Corps allow only one class of stock)",
      "Non-resident alien owners",
      "SSTB at high income (QBI phase-out may wipe the advantage)",
    ],
    typicalSavings: { min: 5000, max: 25000, basis: "saves 15.3% SE tax on income over reasonable comp" },
    implementation: {
      primaryOwner: "cpa + attorney",
      leadTimeWeeks: 4,
      steps: [
        "CPA models whether the election is worth it at your income level",
        "File Form 2553 by the 15th day of 3rd month of tax year (or first 2.5 months of the year)",
        "Run payroll for reasonable compensation (engage a payroll service)",
        "File Form 941 (quarterly payroll) and W-2/W-3 at year-end",
        "File Form 1120-S for the entity; K-1 flows to personal 1040",
      ],
      costRange: { min: 1500, max: 4500, note: "CPA setup + annual incremental payroll/filing costs" },
    },
    documentation: {
      required: [
        "Form 2553 filed and accepted (IRS letter confirming election)",
        "Reasonable compensation study or comparison data (protect against under-paying)",
        "Payroll records (W-2s, 941s)",
        "Corporate minutes (annual meeting, even for single-owner)",
      ],
      retention: "Election letter and reasonable comp support: permanent",
      auditTriggers: [
        "Reasonable compensation too low (IRS reclassifies distributions as wages)",
        "Failure to run payroll when required",
        "Distributions in excess of basis",
      ],
    },
    cpaQuestions: [
      "At my current profit level, does the SE tax savings exceed setup + ongoing costs?",
      "What reasonable comp survives scrutiny for my specialty / region?",
      "Will QBI phase-out eat the SE savings at my income?",
    ],
    relatedStrategies: ["reasonable_comp", "fmc", "solo_401k"],
  },

  {
    id: "fmc",
    name: "FMC (Family Management Company)",
    category: "entity_structuring",
    type: "redirection",
    ircSections: ["§162", "§3121(b)(3)"],
    summary: "A sole proprietorship or partnership owned by one parent that provides management services to the operating business. Pays wages to family members (including minor children) who perform legitimate work.",
    hoverDefinition: "A Family Management Company is a separate pass-through entity (usually sole prop or partnership) that contracts with your operating business to provide management services. Owned by one parent, it can employ other family members — including minor children — and pay FICA-exempt wages to kids under 18 (§3121(b)(3)).",
    type: "redirection",
    whoFor: [
      "Business owners with children who can perform legitimate work",
      "S-Corps where you want to pay kids without the S-Corp losing FICA exemption",
      "Business owners wanting to shift income to lower-bracket family members",
    ],
    disqualifiers: [
      "No legitimate work for family to perform",
      "Not willing to run actual payroll and documentation",
      "Pay rates not supported by market comparison",
    ],
    typicalSavings: { min: 3000, max: 20000, basis: "shifting $15K standard deduction per child to lower brackets + FICA exemption" },
    implementation: {
      primaryOwner: "attorney + cpa",
      leadTimeWeeks: 6,
      steps: [
        "Attorney forms FMC (sole prop or partnership, NOT S-Corp)",
        "FMC signs management services contract with operating business",
        "Operating business pays reasonable management fee to FMC",
        "FMC hires family members with proper job descriptions + time logs",
        "Run payroll; file W-2 for each family employee; file Schedule C or 1065 for FMC",
      ],
      costRange: { min: 2000, max: 5000, note: "Attorney setup + annual filings" },
    },
    documentation: {
      required: [
        "FMC formation documents + EIN",
        "Management services agreement with operating business (signed, dated, updated)",
        "Job descriptions for each family employee",
        "Time logs showing actual work performed (dated, specific tasks)",
        "W-2s, Form 941, I-9 for each employee",
        "Market-comp support for both management fee and wages",
      ],
      retention: "Employment records 4+ years after termination; contracts permanent; time logs 7 years",
      auditTriggers: [
        "Kids too young to plausibly perform described work (IRS has cited 8-year-olds)",
        "Wages exceeding market rate for work performed",
        "No contemporaneous time records — reconstruction after the fact fails",
        "Work product not preserved (take-home tests: does the output exist?)",
      ],
    },
    cpaQuestions: [
      "What's the market management fee between entities in my industry?",
      "What wage rate survives scrutiny for the specific work my kids do?",
      "How many hours per week is defensible given their school schedule?",
    ],
    scrutiny: {
      level: "elevated",
      reason: "Legitimate structure but commonly abused. IRS scrutinizes pay rates, work performed, and age-appropriate tasks. Excellent documentation required.",
    },
    relatedStrategies: ["hire_your_children", "s_corp_election"],
  },

  {
    id: "reasonable_comp",
    name: "Reasonable Compensation Optimization",
    category: "entity_structuring",
    type: "redirection",
    ircSections: ["§162(a)", "§1362", "§3121"],
    summary: "Set S-Corp owner wages at the minimum defensible level. Distributions above wages avoid 15.3% FICA. Under-paying triggers IRS reclassification and penalties.",
    whoFor: [
      "S-Corp owners with net profits above current wage level",
      "Those who've never done a formal reasonable comp study",
      "Business owners with volatile income wanting to de-risk",
    ],
    disqualifiers: [
      "Already paying yourself too little — rebase will feel like a pay cut",
      "Operating business with significant FICA wage base you need to hit (for SS credits)",
    ],
    typicalSavings: { min: 2000, max: 15000, basis: "per $10K of income reclassified from wage → distribution" },
    implementation: {
      primaryOwner: "cpa + reasonable comp specialist",
      leadTimeWeeks: 3,
      steps: [
        "Commission a reasonable compensation study (or use RCReports-style benchmarking)",
        "CPA reviews and stress-tests: would this survive audit?",
        "Adjust payroll for the current year going forward",
        "Document the study conclusions in corporate records",
        "Repeat the study every 2–3 years or on significant business change",
      ],
      costRange: { min: 500, max: 2000, note: "Reasonable comp study" },
    },
    documentation: {
      required: [
        "Reasonable comp study (vendor report or CPA work papers)",
        "Job description with specific tasks and hours",
        "Market comparison data (industry, region, experience)",
        "Annual minutes documenting board approval of comp",
      ],
      retention: "Study + supporting data: permanent",
      auditTriggers: [
        "Zero wages with significant distributions (automatic audit flag)",
        "Wages flat while profits grow 3x+ (updates needed)",
        "Industry comparisons inconsistent with reported comp",
      ],
    },
    cpaQuestions: [
      "Can we run an RCReports analysis or similar benchmark?",
      "What wage level does my specialty + region + experience support?",
      "How often should we refresh the study?",
    ],
    relatedStrategies: ["s_corp_election", "fmc"],
  },

  // ══ ASSET DEPRECIATION ═════════════════════════════════════════════════
  {
    id: "cost_segregation",
    name: "Cost Segregation Study",
    category: "asset_depreciation",
    type: "deferral",
    ircSections: ["§168", "§179", "OBBBA 100% bonus (property placed in service Jan 20, 2025+)"],
    summary: "Reclassify a building's components into shorter MACRS lives (5/7/15 yr) for accelerated depreciation. Can generate large first-year paper losses.",
    whoFor: [
      "Owners of investment real estate (commercial, residential rental)",
      "Real Estate Professionals (REPS) or short-term rental operators with material participation",
      "High current-year income seeking non-cash deductions",
    ],
    disqualifiers: [
      "Primary residence (not deductible)",
      "Held less than 12 months (recapture risk)",
      "Passive investor without REPS / STR material participation (losses trapped)",
    ],
    typicalSavings: { min: 50000, max: 500000, basis: "first-year paper loss per property, at high marginal rates" },
    implementation: {
      primaryOwner: "cpa + cost seg engineer",
      leadTimeWeeks: 6,
      steps: [
        "CPA confirms eligibility + estimated benefit at your bracket",
        "Get 2-3 quotes from qualified cost seg engineers (ASCSP certified)",
        "Engineer performs site visit + study (4-6 weeks)",
        "CPA files Form 3115 (Change in Accounting Method) with current return, or amends",
        "Accelerated deductions claim current year",
      ],
      costRange: { min: 5000, max: 15000, note: "Per property; more for large complex properties" },
    },
    documentation: {
      required: [
        "Cost segregation study report (permanent record)",
        "Closing documents + purchase agreement",
        "Depreciation schedules (Form 4562)",
        "Form 3115 if using change in accounting method",
        "Material participation log if REPS claimed",
        "HOA / property management contracts",
      ],
      retention: "Permanent — cost basis is a lifetime record",
      auditTriggers: [
        "Missing engineering study to support classifications",
        "REPS claimed without hours log",
        "STR claimed as 'short-term' without average-stay documentation (≤7 days)",
        "Recapture on sale not properly computed",
      ],
    },
    cpaQuestions: [
      "Does this property qualify? Is it profitable enough to matter?",
      "Am I REPS, or does my family unit qualify? STR route?",
      "Will this create an NOL I can carry forward?",
      "Which engineer do you recommend?",
    ],
    relatedStrategies: ["str_stack", "reps_material_participation", "179_expensing"],
  },

  {
    id: "str_stack",
    name: "Short-Term Rental (STR) Depreciation Stack",
    category: "asset_depreciation",
    type: "deferral",
    ircSections: ["§469", "§168", "Temp Reg §1.469-1T(e)(3)"],
    summary: "Short-term rentals (average stay ≤7 days) with material participation are NOT passive — losses can offset W-2 income. Combined with cost seg, creates massive first-year deductions.",
    whoFor: [
      "High-income W-2 earners without REPS hours available",
      "Owners of vacation rentals (Airbnb, VRBO) they actively manage",
      "Those with time to meet material participation tests",
    ],
    disqualifiers: [
      "Average stay >7 days (becomes standard passive rental)",
      "No material participation (100+ hours AND more than anyone else, OR 500+ hours, OR one of the other 5 tests)",
      "Rental of personal residence (§280A limits)",
    ],
    typicalSavings: { min: 40000, max: 300000, basis: "first-year bonus depreciation against W-2 via material participation" },
    implementation: {
      primaryOwner: "cpa + cost seg engineer",
      leadTimeWeeks: 10,
      steps: [
        "Confirm the property meets the ≤7-day average-stay test across all bookings",
        "Establish material participation early — maintain a contemporaneous hours log from day 1",
        "Cost seg study as in standard cost seg process",
        "Bonus depreciation taken under OBBBA 100% rules for property placed in service Jan 20, 2025+",
        "Report losses on Schedule E as non-passive — offsets W-2",
      ],
      costRange: { min: 6000, max: 15000, note: "Cost seg study; additional admin cost for participation log" },
    },
    documentation: {
      required: [
        "Booking records proving average stay ≤7 days",
        "Contemporaneous time log (dated, task-specific, per property)",
        "Cost segregation study",
        "Form 4562 depreciation schedules",
        "§1.469-1T(e)(3) election statement",
        "Evidence participation exceeds other parties (cleaners, managers)",
      ],
      retention: "Permanent for study; participation logs 7+ years beyond last loss use",
      auditTriggers: [
        "Claimed STR but average stay exceeds 7 days",
        "Material participation claimed without contemporaneous log",
        "Professional management company does more work than owner",
        "Recapture on conversion to long-term rental not reported",
      ],
    },
    cpaQuestions: [
      "How do we track the 7-day average correctly across short and long stays?",
      "Which material participation test is most defensible for me?",
      "What happens if I convert to long-term rental later?",
    ],
    scrutiny: {
      level: "elevated",
      reason: "IRS has increased audits of STR loss claims — particularly around material participation and 7-day average rule.",
    },
    relatedStrategies: ["cost_segregation", "reps_material_participation"],
  },

  {
    id: "179_expensing",
    name: "§179 Expensing",
    category: "asset_depreciation",
    type: "deferral",
    ircSections: ["§179", "§168(k)"],
    summary: "Immediate expensing of qualifying business equipment (up to $1.16M for 2025) instead of depreciation over years. Stacks with bonus depreciation.",
    whoFor: [
      "Business owners buying equipment, machinery, or qualifying improvements",
      "Those with business income to absorb the deduction (§179 can't create a loss)",
      "Heavy-vehicle users (trucks, SUVs over 6,000 lbs)",
    ],
    disqualifiers: [
      "No business taxable income (§179 is capped at business income)",
      "Non-qualifying property (inventory, land, buildings — though HVAC, roofs, etc. on commercial now qualify)",
      "Asset used <50% for business",
    ],
    typicalSavings: { min: 5000, max: 250000, basis: "marginal rate × expensed amount" },
    implementation: {
      primaryOwner: "cpa",
      leadTimeWeeks: 1,
      steps: [
        "Identify qualifying assets acquired + placed in service during year",
        "Verify business-use percentage ≥ 50%",
        "CPA elects §179 on Form 4562",
        "Document business-use percentage (logs for vehicles, usage records for shared assets)",
      ],
      costRange: { min: 0, max: 0, note: "Included in standard CPA return prep" },
    },
    documentation: {
      required: [
        "Invoices / receipts for each asset",
        "Form 4562 with §179 election",
        "Business-use logs (for vehicles especially)",
        "Purchase date + placed-in-service date records",
      ],
      retention: "Asset records: life of asset + 3 years",
      auditTriggers: [
        "Vehicle §179 claims without contemporaneous mileage log",
        "Assets expensed but used significantly for personal purposes",
        "§179 election in excess of business income",
      ],
    },
    cpaQuestions: [
      "Should I use §179 or bonus depreciation (OBBBA 100% for new; §168(k)(6) phase-out)?",
      "Can we stack this with cost seg on a real estate deal?",
      "Is this asset used enough for business to qualify?",
    ],
    relatedStrategies: ["cost_segregation", "ffe_business_acquisition"],
  },

  {
    id: "ffe_business_acquisition",
    name: "FF&E Depreciation — Business Acquisition",
    category: "loss_based",
    type: "deferral",
    ircSections: ["§168", "§179", "§1060"],
    summary: "Buy a cash-flowing business with an operator in place, allocate purchase price aggressively to FF&E (furniture, fixtures, equipment) — then depreciate via §179 or bonus. Creates large first-year paper loss against W-2 income.",
    whoFor: [
      "High-income W-2 earners / active business owners seeking non-real-estate depreciation",
      "Those willing to buy a cash-flowing business with existing operator",
      "People who want passive income + depreciation combo",
    ],
    disqualifiers: [
      "Business has no meaningful FF&E (e.g., pure services without equipment)",
      "Not willing to do proper §1060 purchase price allocation",
      "Business not cash-flowing (this strategy requires profit to depreciate against or material participation)",
    ],
    typicalSavings: { min: 40000, max: 250000, basis: "first-year §179 + bonus on FF&E portion of purchase price, ~15-30% of most acquisitions" },
    implementation: {
      primaryOwner: "cpa + business broker + attorney",
      leadTimeWeeks: 16,
      steps: [
        "Source acquisition target (business broker, off-market)",
        "Negotiate with operator agreement in place (they continue running it)",
        "Attorney structures asset purchase (not stock) to get cost-basis step-up",
        "Appraiser values FF&E component — allocate per §1060 methodology",
        "CPA elects §179 / bonus depreciation on FF&E; remaining allocated to goodwill (15-year §197)",
      ],
      costRange: { min: 15000, max: 50000, note: "Legal, appraisal, diligence fees" },
    },
    documentation: {
      required: [
        "Asset purchase agreement with allocated §1060 breakout",
        "Independent FF&E appraisal (not just seller's book value)",
        "Form 8594 (Asset Acquisition Statement) filed by both parties",
        "Material participation log if claiming against W-2 directly",
        "Operator agreement / employment contract",
      ],
      retention: "Purchase docs + appraisal: permanent. Annual records: 7 years.",
      auditTriggers: [
        "Aggressive FF&E allocation vs. independent valuation",
        "Seller and buyer filing inconsistent Form 8594",
        "Passive losses used against non-passive income without material participation",
      ],
    },
    cpaQuestions: [
      "Based on comparable transactions, what FF&E allocation is defensible?",
      "Will this be passive (offsetting passive only) or can I materially participate?",
      "What's the structure for §1060 allocation across classes?",
    ],
    scrutiny: {
      level: "elevated",
      reason: "Aggressive FF&E allocations draw IRS scrutiny. Proper third-party appraisal + Form 8594 consistency is non-negotiable.",
    },
    relatedStrategies: ["179_expensing", "cost_segregation"],
  },

  // ══ CHARITABLE ════════════════════════════════════════════════════════
  {
    id: "daf",
    name: "Donor-Advised Fund (DAF)",
    category: "charitable",
    type: "redirection",
    ircSections: ["§170(b)", "§4943"],
    summary: "Fund a DAF in a high-income year; take the deduction now; recommend grants to charities over years. Can contribute appreciated stock for double benefit (deduction + avoid capital gain).",
    whoFor: [
      "High-income years (bonus, exit, large gains) needing deduction acceleration",
      "Donors who want flexibility in timing of gifts to charities",
      "Those with appreciated long-term capital assets",
    ],
    disqualifiers: [
      "Want direct private foundation control (DAF is sponsor-controlled)",
      "Need to fund donor-related businesses (strict self-dealing rules)",
    ],
    typicalSavings: { min: 7000, max: 100000, basis: "deduction × marginal rate; plus capital gains avoided on appreciated stock (upside unbounded for large bunched years)" },
    implementation: {
      primaryOwner: "self + DAF sponsor",
      leadTimeWeeks: 2,
      steps: [
        "Open DAF account with sponsor (Fidelity Charitable, Schwab Charitable, Vanguard Charitable)",
        "Fund with cash OR transfer appreciated stock in-kind (critical: do NOT sell first)",
        "Receive acknowledgment letter for deduction",
        "Recommend grants to qualified charities at leisure (years or decades)",
      ],
      costRange: { min: 0, max: 50, note: "Zero setup fee; small annual admin fee at sponsors" },
    },
    documentation: {
      required: [
        "Acknowledgment letter from DAF sponsor showing contribution",
        "Qualified appraisal for non-cash gifts > $5K (stock is exempted — use market value)",
        "Form 8283 filed if non-cash gifts total > $500",
        "Grant recommendations tracked via sponsor portal",
      ],
      retention: "7 years beyond last use of basis; acknowledgment letters permanent",
      auditTriggers: [
        "Appreciated stock sold first then cashed, losing in-kind benefit",
        "DAF grants to donor-related entities (self-dealing prohibited)",
        "60% AGI cap violations (cash) or 30% cap (appreciated stock)",
      ],
    },
    cpaQuestions: [
      "Should I contribute cash or appreciated stock this year?",
      "What AGI cap applies to my mix?",
      "Can I bunch multiple years of giving to clear the standard deduction hurdle?",
    ],
    relatedStrategies: ["asymmetric_charitable", "qcd"],
  },

  {
    id: "asymmetric_charitable",
    name: "Asymmetric Leveraged Charitable Contribution (Annual)",
    category: "charitable",
    type: "reduction",
    featured: true,
    ircSections: ["§170"],
    summary: "An annual CLEAR-program-vetted structure where $1 of contribution generates approximately $5–$6 of deduction. Leverage rate varies by calendar window.",
    whoFor: [
      "High-income earners with charitable intent + cash flow",
      "Those with AGI capacity to absorb the deduction (60% AGI cap for cash)",
      "Participants prepared to document properly and work with vetted providers only",
    ],
    disqualifiers: [
      "AGI too low to fully use the deduction",
      "Not willing to engage a qualified appraisal (required)",
      "Want to use this retroactively — windows close annually",
    ],
    typicalSavings: { min: 30000, max: 500000, basis: "deduction × marginal rate × leverage ratio" },
    implementation: {
      primaryOwner: "cpa + CLEAR program coordinator",
      leadTimeWeeks: 4,
      steps: [
        "Confirm with CPA that your AGI + other charitable giving support this contribution",
        "Engage CLEAR-vetted program coordinator — these providers change by year",
        "Contribute during the open window (current year: 6:1 through June; 5:1 July–October; closes early-to-mid November)",
        "Obtain qualified appraisal (required for non-cash gifts > $5K)",
        "File Form 8283 with return; retain appraisal + sponsor documentation",
      ],
      costRange: { min: 5000, max: 25000, note: "Cash contribution + appraisal fees" },
    },
    documentation: {
      required: [
        "Qualified appraisal by IRS-qualified appraiser",
        "Acknowledgment letter from qualified charity",
        "Form 8283 filed with return",
        "CLEAR program coordinator's documentation package",
        "Evidence that property donated was held properly (basis + holding period)",
        "AGI-cap calculation work papers",
      ],
      retention: "Permanent for this strategy — the IRS examines historical charitable leverage aggressively",
      auditTriggers: [
        "Appraisals not qualified or inflated valuations",
        "Contemporaneous written acknowledgment missing or defective",
        "Step-transaction treatment (pre-arranged sale)",
        "Any structure resembling syndicated conservation easements (IRS listed transactions)",
      ],
    },
    cpaQuestions: [
      "Does this specific structure differ from IRS listed transactions?",
      "What's my defensible AGI cap and carryforward?",
      "Which timing window optimizes for my income profile this year?",
    ],
    scrutiny: {
      level: "elevated",
      reason: "Leveraged charitable structures broadly have been IRS focus areas. This specific structure has been vetted for CLEAR participants; proper documentation and qualified appraisal are non-negotiable. Do not confuse with syndicated conservation easements, which ARE on the IRS listed-transactions list.",
    },
    relatedStrategies: ["daf"],
  },

  {
    id: "qcd",
    name: "QCD — Qualified Charitable Distribution",
    category: "charitable",
    type: "redirection",
    ircSections: ["§408(d)(8)"],
    summary: "Direct transfer from IRA to a qualified charity — counts toward RMD but isn't included in AGI. Up to $108K/year in 2025.",
    whoFor: [
      "IRA owners age 70½ and up",
      "Those subject to RMDs who also give charitably",
      "High-income retirees where lowering AGI reduces IRMAA / NIIT / other phase-outs",
    ],
    disqualifiers: [
      "Under 70½",
      "Want to give to a DAF (DAFs are not eligible recipients for QCD)",
      "IRA has after-tax basis (QCD is pre-tax only)",
    ],
    typicalSavings: { min: 3000, max: 40000, basis: "avoids AGI addition — triggers range of downstream savings (IRMAA, NIIT, state, etc.)" },
    implementation: {
      primaryOwner: "self + IRA custodian",
      leadTimeWeeks: 2,
      steps: [
        "Confirm age 70½+ in the tax year of the distribution",
        "Identify qualified charity (501(c)(3); NOT a DAF, NOT a private foundation)",
        "Request custodian issue check directly to charity (or transfer to charity account)",
        "Ensure distribution is reported on Form 1099-R; mark QCD on Form 1040",
        "Retain acknowledgment letter from charity",
      ],
      costRange: { min: 0, max: 0, note: "No additional cost" },
    },
    documentation: {
      required: [
        "Form 1099-R showing distribution",
        "Charity acknowledgment letter stating amount and no goods/services received",
        "Form 1040 with QCD notation and reduced taxable amount",
      ],
      retention: "7 years beyond filing",
      auditTriggers: [
        "QCD to ineligible recipient (DAF, private foundation, supporting org)",
        "Distribution not made directly custodian-to-charity",
        "Claiming both QCD + itemized charitable deduction (double-dip)",
      ],
    },
    cpaQuestions: [
      "Will my QCD reduce IRMAA / NIIT / state tax enough to matter?",
      "Should I use QCD or post-retirement itemized gifts?",
      "Can I coordinate with my RMD timing?",
    ],
    relatedStrategies: ["daf"],
  },

  // ══ EVENT-DRIVEN ══════════════════════════════════════════════════════
  {
    id: "augusta_rule",
    name: "Augusta Rule (§280A(g))",
    category: "event_driven",
    type: "redirection",
    ircSections: ["§280A(g)"],
    summary: "Rent your personal residence to your own business up to 14 days per year for legitimate business purposes (board meetings, events) — income is tax-free to you AND deductible to the business.",
    whoFor: [
      "Business owners with a legitimate need for meeting / event space",
      "Those who live in a home that commands fair-market rental rates",
      "Any entity type — sole prop, LLC, S-Corp, C-Corp",
    ],
    disqualifiers: [
      "No legitimate business purpose for the meetings",
      "Using rental rates not supported by fair market comparisons",
      "Over 14 days (becomes rental income, loses §280A(g) protection)",
    ],
    typicalSavings: { min: 1500, max: 10000, basis: "14 days × market rental rate × marginal tax rate" },
    implementation: {
      primaryOwner: "self + cpa",
      leadTimeWeeks: 2,
      steps: [
        "Obtain comparable fair-market rental quotes (3+) for similar event venues in your area",
        "Create rental agreement between you (as homeowner) and your business",
        "Hold actual meetings with agenda, attendees, minutes",
        "Business issues 1099-MISC to homeowner (some CPAs argue none needed under 14-day rule — verify)",
        "Business deducts the rent; homeowner reports nothing (14-day exclusion)",
      ],
      costRange: { min: 0, max: 200, note: "Documentation binder; some recommend event photos" },
    },
    documentation: {
      required: [
        "3+ comparable market rate quotes for venue (dated, from third parties)",
        "Written rental agreement for each use",
        "Meeting agendas + minutes + attendee list",
        "Photos of setup / event",
        "Business expense log with date, rate, purpose",
      ],
      retention: "7 years — this is a frequent audit topic",
      auditTriggers: [
        "Rates far above market comparables",
        "No evidence meetings actually occurred (just agendas)",
        "More than 14 days (disqualifies entirely)",
        "Using for personal events disguised as business",
      ],
    },
    cpaQuestions: [
      "What rental rate is defensible for my area?",
      "Who should pay the rent — and how (check to me personally? Direct deposit?)",
      "Does my business have genuine need for these meetings?",
    ],
    scrutiny: {
      level: "elevated",
      reason: "§280A(g) is legitimate but commonly abused. Recent tax court cases have thrown out aggressive uses. Triple documentation required.",
    },
    relatedStrategies: ["home_office_vehicle_meals"],
  },

  {
    id: "hire_your_children",
    name: "Hire Your Children",
    category: "event_driven",
    type: "redirection",
    ircSections: ["§162", "§3121(b)(3)", "§32"],
    summary: "Pay your minor children for legitimate work in your business. Up to the standard deduction ($15,000 in 2025) is income-tax-free to them. Under 18 + sole prop or family-unit partnership = FICA-exempt.",
    whoFor: [
      "Sole proprietors, family-unit partnerships, single-member LLCs (FICA exemption)",
      "S-Corp owners (use FMC structure — see FMC)",
      "Kids old enough to perform real work",
    ],
    disqualifiers: [
      "No legitimate work for kids to perform",
      "Children too young to plausibly perform the described work",
      "S-Corp directly paying kids (loses FICA exemption; use FMC)",
    ],
    typicalSavings: { min: 3000, max: 8000, basis: "shifting $15K standard deduction per child + FICA savings" },
    implementation: {
      primaryOwner: "self + payroll service",
      leadTimeWeeks: 4,
      steps: [
        "Identify legitimate business work appropriate to age",
        "Create job description with specific tasks + hours",
        "Set up formal payroll (payroll service + I-9 + W-4)",
        "Pay via direct deposit to kid's account (Roth IRA custodial is common)",
        "W-2 issued at year-end; file Form 941 quarterly",
      ],
      costRange: { min: 500, max: 1500, note: "Annual payroll service fees" },
    },
    documentation: {
      required: [
        "Job description signed and dated",
        "Contemporaneous time log per child",
        "W-2, I-9, W-4 on file",
        "Evidence of work product (photos, files, deliverables)",
        "Bank statements showing payments to child's account",
        "Age-appropriate work comparison (market rate + reasonableness)",
      ],
      retention: "Employment records: 4 years beyond last work. Work product: 7 years.",
      auditTriggers: [
        "Kids under 7 claimed to perform complex work",
        "Wages exceeding reasonable rate for work performed",
        "Payments deposited into parents' accounts",
        "No contemporaneous work records or deliverables",
      ],
    },
    cpaQuestions: [
      "My kids are 10 and 13 — what work is age-appropriate?",
      "Is my entity structure eligible for the FICA exemption?",
      "Can we also fund their Roth IRA with the earned income?",
    ],
    scrutiny: {
      level: "elevated",
      reason: "Legitimate and common, but aggressively audited. Age-appropriateness of work, contemporaneous records, and reasonable rates are critical.",
    },
    relatedStrategies: ["fmc"],
  },

  {
    id: "home_office_vehicle_meals",
    name: "Documented Business Deductions (Home Office · Vehicle · Meals)",
    category: "event_driven",
    type: "reduction",
    ircSections: ["§280A(c)", "§179/§168", "§274"],
    summary: "The everyday business deductions that require strong documentation: home office (exclusive business use), vehicle (§179/actual vs. mileage), business meals (50% under current rules).",
    whoFor: [
      "All business owners with home-based work, business travel, or client entertainment",
      "Those underdeducting because documentation feels burdensome",
    ],
    disqualifiers: [
      "Home office not used exclusively / regularly for business",
      "Vehicle under 50% business use (mileage only)",
      "Meals without business purpose documentation",
    ],
    typicalSavings: { min: 2000, max: 15000, basis: "varies — home office $1-3K, vehicle $5-10K+, meals $500-3K" },
    implementation: {
      primaryOwner: "self + cpa",
      leadTimeWeeks: 1,
      steps: [
        "Home office: measure square footage, establish exclusive-use area, photograph",
        "Vehicle: choose method (standard mileage OR actual expenses) and commit (switching has limits)",
        "Implement a mileage/time tracking app (MileIQ, QuickBooks, Expensify)",
        "Meals: track purpose, attendees, business topic on every receipt",
        "Reconcile monthly — don't wait until year-end",
      ],
      costRange: { min: 0, max: 200, note: "Tracking app subscription" },
    },
    documentation: {
      required: [
        "Home office: photos, sq ft calculation, exclusivity proof (not shared/dual use)",
        "Vehicle: contemporaneous mileage log with dates, destinations, purposes",
        "Meals: receipts with attendees, business purpose, amount",
        "Log entries dated within days — not months — of the expense",
      ],
      retention: "7 years beyond claim; log entries permanently if generated by app",
      auditTriggers: [
        "Home office with shared / non-business use (homework, leisure, household)",
        "100% vehicle business use without commute exceptions",
        "Meals without attendee names or business topic",
        "Reconstructed logs (dated all at tax time)",
      ],
    },
    cpaQuestions: [
      "Standard mileage vs. actual vehicle method — which is better for my profile?",
      "Simplified vs. actual home office calculation?",
      "Where's the line between 'entertainment' (non-deductible) and 'business meal' (50%)?",
    ],
    relatedStrategies: ["augusta_rule", "179_expensing"],
  },

  // ══ INCOME CHARACTER ══════════════════════════════════════════════════
  {
    id: "qsbs",
    name: "QSBS — Qualified Small Business Stock (§1202)",
    category: "income_character",
    type: "reduction",
    ircSections: ["§1202", "§1045"],
    summary: "Excludes up to $10M (or 10× basis) of capital gain on sale of qualified small business stock held >5 years. Can eliminate federal tax on business exits.",
    whoFor: [
      "Founders of C-corp startups (NOT S-Corps, LLCs, partnerships)",
      "Angel / seed investors in qualifying C-corps",
      "Those who can hold shares for 5+ years",
    ],
    disqualifiers: [
      "Company is an S-Corp or LLC",
      "Company was a 'qualified trade or business' when stock issued — excludes many services (legal, health, finance, consulting)",
      "Gross assets > $50M at issuance",
      "Held less than 5 years (rollover via §1045 if needed)",
    ],
    typicalSavings: { min: 50000, max: 2400000, basis: "23.8% federal (LTCG + NIIT) × up to $10M excluded" },
    implementation: {
      primaryOwner: "attorney + cpa",
      leadTimeWeeks: 12,
      steps: [
        "At formation / investment: document QSBS eligibility (issuer is domestic C-corp, qualified trade, etc.)",
        "Get corporate certificate with dated issuance and valuation",
        "Hold 5+ years from original issuance",
        "At sale: file Form 8949 and Schedule D with §1202 exclusion election",
        "If under 5 years but ≥6 months, §1045 rollover to new QSBS",
      ],
      costRange: { min: 2000, max: 10000, note: "Attorney fees for formation / documentation" },
    },
    documentation: {
      required: [
        "Certificate of original issuance with date",
        "Corporate articles confirming C-corp status + domestic domicile",
        "Gross asset records at time of issuance (< $50M test)",
        "Qualified trade certification from counsel",
        "Form 8949 / Schedule D at sale",
      ],
      retention: "Permanent — QSBS status established at issuance, proven at sale",
      auditTriggers: [
        "Company pivoted from qualified to excluded trade during holding period",
        "Redemption transactions in lookback/lookforward periods",
        "Aggregation across related parties exceeding limits",
      ],
    },
    cpaQuestions: [
      "At formation, is this C-corp actually qualified?",
      "What's my basis and when did it start?",
      "Can we stack: §1202 + §1045 rollovers + state non-conformity concerns?",
    ],
    relatedStrategies: ["installment_sales_1031"],
  },

  {
    id: "installment_sales_1031",
    name: "§1031 Like-Kind Exchange",
    category: "income_character",
    type: "deferral",
    ircSections: ["§1031"],
    summary: "Defer capital gains on sale of investment real estate by exchanging into 'like-kind' investment real estate. Personal property no longer qualifies (TCJA).",
    whoFor: [
      "Real estate investors selling an appreciated property",
      "Those planning to stay in real estate long-term",
      "Family wealth transfer plans using stepped-up basis at death",
    ],
    disqualifiers: [
      "Primary residence (§121 exclusion applies instead)",
      "Flip property / inventory (dealer-held — ordinary income)",
      "Mixed-use without proper allocation",
      "Strict 45-day identification + 180-day closing requirements not feasible",
    ],
    typicalSavings: { min: 30000, max: 800000, basis: "deferred federal + state capital gain at ~23.8% × gain" },
    implementation: {
      primaryOwner: "qualified intermediary + attorney + cpa",
      leadTimeWeeks: 12,
      steps: [
        "Engage Qualified Intermediary (QI) BEFORE closing on relinquished property",
        "Close on relinquished property — proceeds go to QI, NOT to you (constructive receipt = disqualified)",
        "Identify replacement property within 45 days in writing",
        "Close on replacement within 180 days",
        "File Form 8824 with that year's return",
      ],
      costRange: { min: 1500, max: 5000, note: "QI fees + legal + accounting" },
    },
    documentation: {
      required: [
        "QI exchange agreement (signed BEFORE relinquished closing)",
        "45-day ID letter (signed, dated, delivered to QI)",
        "Closing statements for both legs",
        "Form 8824 filed with return",
        "Proof QI held all funds (never pass through your account)",
      ],
      retention: "Permanent — basis in replacement property depends on this history",
      auditTriggers: [
        "Constructive receipt of proceeds (money touched taxpayer's account)",
        "ID deadline missed",
        "Replacement not 'like-kind' (must be investment real estate)",
        "Related-party exchange not holding 2 years",
      ],
    },
    cpaQuestions: [
      "Am I better served by §1031 or paying the tax + simpler life?",
      "Can I split this into multiple replacement properties?",
      "How does this interact with my eventual estate plan (stepped-up basis)?",
    ],
  },

  // ══ INCOME TIMING ═════════════════════════════════════════════════════
  {
    id: "nqdc",
    name: "NQDC — Non-Qualified Deferred Compensation",
    category: "income_timing",
    type: "deferral",
    ircSections: ["§409A", "§451"],
    summary: "Defer W-2 compensation (typically for executives) into future years — reduces current-year AGI, income recognized when distributed per election.",
    whoFor: [
      "Executives / high-earners with employer NQDC plan (supplemental executive retirement, stock-based deferred comp)",
      "Those who expect lower marginal rates in retirement / payout years",
      "Physicians / attorneys at large groups that offer NQDC",
    ],
    disqualifiers: [
      "Employer doesn't offer NQDC",
      "Employer financial strength concerns (NQDC is unsecured — if employer bankrupts, you're creditor)",
      "Need the money sooner than election allows",
    ],
    typicalSavings: { min: 10000, max: 100000, basis: "current deferral × marginal rate delta vs. distribution year rate" },
    implementation: {
      primaryOwner: "hr / employer + self",
      leadTimeWeeks: 4,
      steps: [
        "Review employer NQDC plan offering",
        "Make deferral election BEFORE start of service year (§409A strict timing)",
        "Select distribution schedule (lump sum, 5-year installments, etc.)",
        "Monitor employer financial health annually (NQDC is unsecured)",
        "Plan state-of-residence at distribution (some states recognize deferral, others don't)",
      ],
      costRange: { min: 0, max: 0, note: "Typically employer-administered" },
    },
    documentation: {
      required: [
        "Deferral election form (signed before service year)",
        "Distribution schedule election",
        "Annual plan statements showing vested balance",
        "W-2 at distribution shows taxable amount",
      ],
      retention: "Elections permanent until distributions complete",
      auditTriggers: [
        "Elections changed outside §409A permitted windows",
        "Acceleration of distributions (§409A 20% penalty)",
        "State-residence change not properly handled (source rules)",
      ],
    },
    cpaQuestions: [
      "My employer offers this — what's my total participation limit?",
      "What happens if I leave for another state or retire abroad?",
      "How financially strong is my employer? Should I limit exposure?",
    ],
  },

  // ══ LOSS-BASED ═══════════════════════════════════════════════════════
  {
    id: "reps_material_participation",
    name: "REPS + Material Participation",
    category: "loss_based",
    type: "redirection",
    ircSections: ["§469(c)(7)"],
    summary: "Real Estate Professional Status (REPS) converts rental losses from passive to non-passive — enabling them to offset W-2 income. Requires 750+ hours in real estate + more than any other trade/business.",
    whoFor: [
      "Those with significant real estate activity + W-2 income to offset",
      "Family units where one partner doesn't have W-2 income and can qualify on hours",
      "Physicians / professionals with part-time medical + growing real estate portfolio",
    ],
    disqualifiers: [
      "W-2 employee in non-real-estate field (750 hours + more than W-2 is nearly impossible)",
      "Passive property management only — don't personally participate",
      "Not willing to keep contemporaneous logs",
    ],
    typicalSavings: { min: 30000, max: 400000, basis: "marginal rate × real estate losses that would otherwise be trapped" },
    implementation: {
      primaryOwner: "cpa + self",
      leadTimeWeeks: 52,
      steps: [
        "From Day 1: track hours in real estate activities (daily, task-specific)",
        "Verify 750+ hours in real estate AND >50% of personal services in real estate",
        "Materially participate in each property (500+ hours per property, OR aggregate election)",
        "File aggregation election if grouping multiple properties",
        "Report losses on Schedule E as non-passive",
      ],
      costRange: { min: 0, max: 500, note: "Time-tracking app subscription; additional CPA time for aggregation election" },
    },
    documentation: {
      required: [
        "Contemporaneous time log: date, property, activity, hours, business purpose",
        "§469(c)(7)(A) election for aggregation",
        "Evidence W-2 hours are less than RE hours (if applicable)",
        "Evidence of active participation (not just passive investment)",
        "Employment / income statements showing primary activity",
      ],
      retention: "Permanent while claiming; 7 years beyond last loss use",
      auditTriggers: [
        "W-2 job with 2,080+ hours claiming 2,100+ real estate hours (physically implausible)",
        "Logs created at tax time (reconstructed records)",
        "Activities claimed that aren't 'real estate' per §469 regs",
        "Property manager doing more work than owner",
      ],
    },
    cpaQuestions: [
      "Can I actually meet the 750-hour + 50% tests given my W-2 job?",
      "Could a family-unit partner qualify on hours instead of me?",
      "Should we aggregate properties or participate in each separately?",
    ],
    scrutiny: {
      level: "heightened",
      reason: "REPS is one of the most audited real estate strategies. Contemporaneous records are essential — reconstructed logs fail in tax court. IRS now uses data analytics to identify implausible claims.",
    },
    relatedStrategies: ["cost_segregation", "str_stack"],
  },

  // ══ CREDIT-BASED ══════════════════════════════════════════════════════
  {
    id: "rd_credit",
    name: "R&D Tax Credit (§41)",
    category: "credit_based",
    type: "reduction",
    ircSections: ["§41", "§174"],
    summary: "Federal credit for qualified research expenditures — ~10% of qualified costs. Applicable to far more businesses than commonly realized (software development, engineering, formulation work).",
    whoFor: [
      "Businesses developing new or improved products, processes, software",
      "Software companies with genuine technical uncertainty in development",
      "Manufacturers with process improvements",
      "Biotech, food, chemical formulation businesses",
    ],
    disqualifiers: [
      "Research primarily social science / management / aesthetic",
      "Routine improvement / reverse engineering (no technical uncertainty)",
      "Funded research (someone else paying for it + retaining rights)",
      "Research outside the US",
    ],
    typicalSavings: { min: 10000, max: 500000, basis: "~10% of qualified research expenditures (QREs)" },
    implementation: {
      primaryOwner: "cpa + r&d study specialist",
      leadTimeWeeks: 12,
      steps: [
        "Identify projects meeting 4-part test: permitted purpose, technical uncertainty, process of experimentation, technological in nature",
        "Engage R&D credit specialist (AVOID 'contingency-fee refund mills' — these are IRS red flag)",
        "Gather wages, supplies, contract research, cloud costs for QREs",
        "File Form 6765 with return (or amend prior 3 years)",
        "Retain detailed study with technical documentation per project",
      ],
      costRange: { min: 5000, max: 25000, note: "Credit specialist fees; avoid pure-contingency engagements" },
    },
    documentation: {
      required: [
        "Project documentation for each QRE project: hypothesis, experiments, uncertainty, results",
        "Wage allocation studies (what % of each employee's time was QRE)",
        "Supplies + cloud invoices tied to projects",
        "Form 6765 + required supporting schedules",
        "Qualifying activities narrative",
      ],
      retention: "Permanent — IRS often examines R&D credits on multi-year basis",
      auditTriggers: [
        "'Contingency fee refund mill' R&D firm signatures",
        "Wages claimed > employee actually worked on R&D",
        "Routine work misclassified as R&D",
        "Lack of technical documentation of uncertainty + experimentation",
      ],
    },
    cpaQuestions: [
      "Which of our projects truly meet the 4-part test?",
      "Should we use the alternative simplified credit method?",
      "Can we offset payroll taxes (QSBC election) vs. income tax?",
    ],
    scrutiny: {
      level: "elevated",
      reason: "IRS has issued warnings about aggressive R&D credit promotions. Legitimate credits are valuable, but schemes with 'contingency-fee refund mills' are flagged. ERC abuse is on the 2025 Dirty Dozen; R&D credit abuse is its close cousin.",
    },
    relatedStrategies: [],
  },

  {
    id: "oil_gas_idc",
    name: "Oil & Gas IDC (Intangible Drilling Costs)",
    category: "credit_based",
    type: "reduction",
    ircSections: ["§263(c)", "§57(a)(2)"],
    summary: "Direct investment in US oil & gas drilling generates ~70-85% first-year deductions for intangible drilling costs — a rare immediate-expense deduction for high earners.",
    whoFor: [
      "High-income earners with risk tolerance for O&G exposure",
      "Those seeking first-year deductions (IDCs don't depreciate — they expense)",
      "Accredited investors comfortable with illiquid, volatile assets",
    ],
    disqualifiers: [
      "Not an accredited investor (usually required for direct programs)",
      "Can't afford volatility (well performance varies wildly)",
      "AMT exposure (IDC can be AMT preference item)",
    ],
    typicalSavings: { min: 35000, max: 185000, basis: "on $100K invested × 70-85% IDC × 37% marginal" },
    implementation: {
      primaryOwner: "cpa + o&g sponsor",
      leadTimeWeeks: 8,
      steps: [
        "Vet sponsor: track record, reserve reports, geologist reports, operator quality",
        "Review PPM (Private Placement Memorandum) with attorney",
        "Confirm accredited investor status",
        "Fund subscription before year-end for current-year deduction",
        "CPA allocates IDC vs. tangible (≥10% must be tangible per §263(c))",
        "K-1 received next year — report on Schedule E",
      ],
      costRange: { min: 50000, max: 500000, note: "Typical minimum subscription; may be much larger" },
    },
    documentation: {
      required: [
        "Subscription agreement + PPM",
        "Capital contribution evidence (bank records)",
        "K-1 annually",
        "Geologist / engineering reports for reserve estimates",
        "Sponsor's AFE (Authorization for Expenditure) breakout: tangible vs. intangible",
        "AMT calculation worksheets if triggered",
      ],
      retention: "Permanent for basis tracking; 7 years for annual K-1s",
      auditTriggers: [
        "IDC allocation exceeding what engineering reports support",
        "Passive loss rules violated (O&G working interest exception)",
        "Sponsor later determined to have misrepresented projects",
      ],
    },
    cpaQuestions: [
      "Will this trigger AMT for me?",
      "Am I investing as a working interest (non-passive) or limited partner (passive)?",
      "What's the sponsor's reputation and track record?",
    ],
  },

  {
    id: "solar_ev_credits",
    name: "Solar & EV Credits",
    category: "credit_based",
    type: "reduction",
    ircSections: ["§25D", "§30D", "§45W", "§48"],
    summary: "Residential solar (30% through 2032), clean vehicle credits ($3,750-$7,500), commercial clean vehicle (§45W up to $40K for heavy vehicles).",
    whoFor: [
      "Homeowners adding solar / battery / geothermal",
      "EV buyers (personal §30D or commercial §45W)",
      "Businesses adding clean vehicle fleets",
    ],
    disqualifiers: [
      "AGI > $300K MFJ / $150K single for clean vehicle credit (§30D)",
      "Vehicle doesn't meet sourcing requirements",
      "Solar on rental property (§25D applies to residence — use §48 for commercial)",
    ],
    typicalSavings: { min: 3750, max: 50000, basis: "credit amount varies by product and use" },
    implementation: {
      primaryOwner: "self + cpa",
      leadTimeWeeks: 2,
      steps: [
        "Confirm product eligibility via IRS / DOE lists",
        "Purchase before year-end for current-year credit (§30D can be taken at point-of-sale since 2024)",
        "Retain purchase documentation + VIN (for vehicles)",
        "File Form 5695 (residential energy) or Form 8936 (clean vehicles)",
        "Verify AGI doesn't disqualify after year-end",
      ],
      costRange: { min: 0, max: 0, note: "No implementation cost beyond the purchase" },
    },
    documentation: {
      required: [
        "Purchase documentation + invoice",
        "VIN for clean vehicle credit",
        "Manufacturer certification (solar) / eligibility letter",
        "Form 5695 or 8936 filed with return",
        "Income documentation showing AGI at or below phase-out",
      ],
      retention: "7 years; installations documented permanently for basis",
      auditTriggers: [
        "Point-of-sale transfer then AGI exceeds cap (credit must be repaid)",
        "Vehicle VIN doesn't appear on IRS approved list",
        "Solar on property that isn't primary residence",
      ],
    },
    cpaQuestions: [
      "Will my AGI qualify? Should I defer the purchase to a lower-income year?",
      "Point-of-sale or claim on return — which is better?",
      "Can I also claim state credit stack?",
    ],
  },
];

// ────────────────────────────────────────────────────────────────────────────
// UTILITIES
// ────────────────────────────────────────────────────────────────────────────

export const strategyById = (id) => STRATEGY_LIBRARY.find((s) => s.id === id) || null;

export const strategiesByCategory = (catId) =>
  STRATEGY_LIBRARY.filter((s) => s.category === catId);

// Fuzzy-ish search: matches name, id, IRC sections, or category.
// Featured strategies always sort to the top of the result list — this is the
// shelf placement for headline, program-specific structures (e.g. the
// asymmetric charitable contribution that drives material savings for high-AGI
// participants). Within featured / non-featured groups, original library order
// is preserved.
export const searchStrategies = (q) => {
  const matches = !q
    ? STRATEGY_LIBRARY.slice()
    : (() => {
        const needle = q.toLowerCase().trim();
        return STRATEGY_LIBRARY.filter((s) =>
          s.name.toLowerCase().includes(needle) ||
          s.id.toLowerCase().includes(needle) ||
          s.category.toLowerCase().includes(needle) ||
          (s.ircSections || []).some((ir) => ir.toLowerCase().includes(needle))
        );
      })();
  // Stable sort: featured first, original order within each group.
  return matches
    .map((s, i) => ({ s, i }))
    .sort((a, b) => {
      const af = a.s.featured ? 0 : 1;
      const bf = b.s.featured ? 0 : 1;
      if (af !== bf) return af - bf;
      return a.i - b.i;
    })
    .map(({ s }) => s);
};

// Format a typical savings range for display. Teaching-≠-prescription framing.
export const formatTypicalSavings = (range) => {
  if (!range) return null;
  const fmt = (n) => n >= 1e6 ? `$${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `$${Math.round(n / 1000)}K` : `$${n}`;
  return {
    range: `${fmt(range.min)} – ${fmt(range.max)}`,
    basis: range.basis,
    disclaimer: "Typical range across client profiles. Your CPA will validate.",
  };
};

// Common disclaimer for any UI that surfaces strategy content.
export const STRATEGY_DISCLAIMER =
  "Strategy information is educational framework only — not tax, legal, or investment advice. Always confirm with a qualified CPA before implementing. IRS rules change; verify current-year application. This library excludes strategies the IRS has designated as listed / abusive transactions (syndicated conservation easements, micro-captive insurance, Puerto Rico Act 60 abuse).";
