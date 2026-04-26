// Program constants — categories, yields, week metadata, AGI thresholds.
// Single source of truth. If any of these change, the lesson plans and
// Master Documents v3.4 must also change.

// ─── 9 LIFESTYLE CATEGORIES (EXODUS) ───────────────────────────────────────
// Constitutional guardrails:
//   - HOA is separate from Housing (never collapse)
//   - Hobbies & Activities is separate from Giving & Charity (never collapse)
//   - Exactly 9 categories — not 8, not 10
export const LIFESTYLE_CATEGORIES = [
  { key: "housing",   label: "Housing",              sub: "Mortgage/rent, property taxes, insurance, maintenance, utilities", icon: "🏠" },
  { key: "hoa",       label: "HOA / Property Fees",  sub: "HOA dues, condo fees, special assessments — NOT in Housing",      icon: "🏢" },
  { key: "transport", label: "Transportation",       sub: "Vehicle payments, insurance, fuel, maintenance, registration",    icon: "🚗" },
  { key: "food",      label: "Food & Dining",        sub: "Groceries, restaurants, delivery — honest numbers, not aspirational", icon: "🍽️" },
  { key: "health",    label: "Health & Wellness",    sub: "Insurance, medical, prescriptions, fitness",                       icon: "⚕️" },
  { key: "family",    label: "Family & Dependents",  sub: "Dependents, childcare, education, college savings",               icon: "👨‍👩‍👧" },
  { key: "giving",    label: "Giving & Charity",     sub: "Tithes, charitable donations, gifts",                              icon: "💝" },
  { key: "hobbies",   label: "Hobbies & Activities", sub: "Travel, sports, entertainment, subscriptions, gear, experiences", icon: "✈️" },
  { key: "personal",  label: "Personal & Misc",      sub: "Clothing, personal care, unexpected expenses — the catch-all",    icon: "👤" },
];

export const LIFESTYLE_KEYS = LIFESTYLE_CATEGORIES.map((c) => c.key);

// ─── 6 YIELD OPTIONS (EXODUS Step X) ───────────────────────────────────────
// Moderate MUST be 7% (not 5%, not 8%). Constitutional guardrail.
export const YIELD_OPTIONS = [
  { label: "4%",  cat: "Conservative",     value: 0.04, desc: "Savings, CDs, bonds" },
  { label: "5%",  cat: "Conservative+",    value: 0.05, desc: "Treasuries, dividend stocks" },
  { label: "7%",  cat: "Moderate",         value: 0.07, desc: "Index funds, DRIPs" },
  { label: "8%",  cat: "Moderate+",        value: 0.08, desc: "Diversified portfolio" },
  { label: "10%", cat: "Aggressive",       value: 0.10, desc: "Real estate, active investing" },
  { label: "12%", cat: "Very Aggressive",  value: 0.12, desc: "Leveraged RE, active mgmt" },
];

// ─── WEEKS (nav structure + metadata) ──────────────────────────────────────
// `slug` → key used in command_center_data.week_slug and routing
// `nav` → single-word all-caps label for left nav
// `title` → full title with "The" for headers, previews, marketing
// `subtabs` → each week's sub-tabs; empty [] for weeks with no inner tabs
export const WEEKS = [
  { slug: "start_here", nav: "Start Here",  title: "Start Here",            weekNumber: 0, alwaysUnlocked: true, subtabs: ["For Visitors", "For Participants"] },
  { slug: "exodus",     nav: "EXODUS",      title: "The EXODUS Method",     weekNumber: 1, alwaysUnlocked: true, subtabs: ["E", "X", "O", "D", "U", "S"], hasOwnSubNav: true,
    description: "Your Freedom Formula — PV, FV, n, r, lifestyle, effective tax rate" },
  { slug: "reveal",     nav: "REVEAL",      title: "REVEAL",                 weekNumber: 2, subtabs: ["Effective Rate", "Tax Landscape"],
    description: "Understand exactly what you're paying in taxes and why — and what's actually controlling it" },
  { slug: "eliminate",  nav: "ELIMINATE",   title: "ELIMINATE",              weekNumber: 3, subtabs: ["Strategy Filter"],
    description: "Walk the entire tax strategy universe and emerge with a short list of exactly what applies to you" },
  { slug: "assess",     nav: "ASSESS",      title: "ASSESS",                 weekNumber: 4, subtabs: ["Strategy Impact"],
    description: "Score every strategy by its impact on your required return, its risk profile, and its real cost" },
  { slug: "launch",     nav: "LAUNCH",      title: "LAUNCH",                 weekNumber: 5, subtabs: ["Implementation Timeline"],
    description: "Build your implementation plan — who does what, when it happens, what documentation it requires" },
  { slug: "insulate",   nav: "INSULATE",    title: "INSULATE",               weekNumber: 6, subtabs: ["Defensibility Score"],
    description: "Build the documentation system that makes every strategy audit-proof" },
  { slug: "target",     nav: "TARGET",      title: "TARGET",                 weekNumber: 7, subtabs: ["Capital Placement"],
    description: "Deploy freed capital into a Foundation and Swing architecture aligned to your required return" },
  { slug: "yield",      nav: "YIELD",       title: "YIELD",                  weekNumber: 8, alwaysUnlocked: true, neverLocks: true, subtabs: ["Track Your Freedom"],
    description: "Build the permanent operating rhythm that keeps the system running without you pushing it" },
];

export const WEEK_BY_SLUG = Object.fromEntries(WEEKS.map((w) => [w.slug, w]));

// ─── AGI GATEKEEPER THRESHOLDS (2025) ──────────────────────────────────────
// REVEAL → Tax Landscape flags these against participant AGI.
// Amounts are 2025 levels — update annually or confirm with CPA per lesson plan.
export const AGI_THRESHOLDS_2025 = [
  { key: "niit",      label: "NIIT exposure (3.8% on investment income)",    single: 200000, mfj: 250000,  note: "Net investment income tax — Form 8960" },
  { key: "qbi",       label: "QBI deduction phase-out begins",               single: 197300, mfj: 394600,  note: "§199A — SSTBs fully phased out at +$50K single / +$100K MFJ" },
  { key: "roth",      label: "Roth IRA contribution phase-out begins",       single: 150000, mfj: 236000,  note: "Complete phase-out at $165K single / $246K MFJ (2025)" },
  { key: "studentLoan", label: "Student loan interest deduction phase-out",  single: 80000,  mfj: 165000,  note: "Fully phased out at $95K single / $195K MFJ" },
];

// Charitable deduction cap — computed from AGI input
// Cash to public charities = 60% of AGI; stock/non-cash/private foundation are lower tiers
export const CHARITABLE_CASH_CAP_RATE = 0.60;

// ─── STRATEGY TAXONOMY ─────────────────────────────────────────────────────
// Three canonical strategy types per Master Documents v3.4: Reduction,
// Deferral, and Redirection. "Redirection" (with the "-ion" form) is
// constitutional — never "Redirect".
// "Inaction" is never an option in the implementation plan.
export const STRATEGY_CATEGORIES = [
  { key: "reduction",   label: "Reduction" },
  { key: "deferral",    label: "Deferral" },
  { key: "redirection", label: "Redirection (Strategic or Structural)" },
];

export const IMPLEMENTATION_OWNERS = [
  { key: "self",        label: "Self" },
  { key: "cpa",         label: "CPA" },
  { key: "attorney",    label: "Attorney" },
  { key: "cpa_attorney",label: "CPA + Attorney" },
  { key: "advisor",     label: "Fee-Only Advisor" },
  { key: "tpa",         label: "TPA" },
  { key: "other",       label: "Other" },
];

export const STRATEGY_STATUS = [
  { key: "planned",    label: "Planned" },
  { key: "in_progress",label: "In Progress" },
  { key: "active",     label: "Active" },
];

// ─── ELIMINATE — bucket schemas ───────────────────────────────────────────
export const ELIMINATE_BUCKETS = [
  {
    key: "keep",
    label: "KEEP — Strategies on Your Short List",
    blurb: "These survived all seven tests. They belong in ASSESS.",
    fields: [
      { key: "strategy",  label: "Strategy category", type: "text" },
      { key: "reason",    label: "Why it survived",    type: "textarea" },
      { key: "priority",  label: "Priority",           type: "select", options: ["High", "Medium", "Low"] },
    ],
    addLabel: "Add to Keep List",
  },
  {
    key: "exclude",
    label: "EXCLUDE — Strategies Removed",
    blurb: "These failed one or more tests. Log the reason — it protects you from revisiting the same decision every time someone pitches you.",
    fields: [
      { key: "strategy",  label: "Strategy category",       type: "text" },
      { key: "reason",    label: "Reason for exclusion",    type: "textarea" },
      { key: "testFailed",label: "Which test failed",       type: "select", options: [
        "Test 1 — Real & substantive (does the activity actually exist?)",
        "Test 2 — Underlying conditions present (do I have what's needed to qualify?)",
        "Test 3 — Net of cost & complexity (does benefit exceed friction?)",
        "Test 4 — Compatible with other strategies (no double-counting / conflict)",
        "Test 5 — Executable for me (time, cash, discipline available)",
        "Test 6 — IRS posture acceptable (not on Dirty Dozen / abusive list)",
        "Test 7 — Worst-case tolerable (audit-failure scenario survivable)",
        "Multiple",
      ] },
    ],
    addLabel: "Add to Exclude List",
  },
  {
    key: "route",
    label: "ROUTE — Strategies Sent to a Professional",
    blurb: "These require a specialist before you can evaluate them. Log who owns the question.",
    fields: [
      { key: "strategy",    label: "Strategy category",  type: "text" },
      { key: "professional",label: "Which professional", type: "select", options: ["CPA", "Attorney", "CPA + Attorney", "Fee-Only Advisor", "Estate Attorney"] },
      { key: "question",    label: "Question to ask",    type: "textarea" },
      { key: "status",      label: "Status",             type: "select", options: ["Pending", "In Progress", "Answered"] },
    ],
    addLabel: "Add to Route List",
  },
  {
    key: "park",
    label: "PARK — Strategies Deferred",
    blurb: "Not now — but not never. Log what would make this relevant.",
    fields: [
      { key: "strategy",  label: "Strategy category",  type: "text" },
      { key: "reason",    label: "Why it's parked",    type: "textarea" },
      { key: "trigger",   label: "Trigger to revisit", type: "text" },
    ],
    addLabel: "Add to Park List",
  },
];

// ─── STANDARD DISCLAIMERS ─────────────────────────────────────────────────
export const DISCLAIMER_TAX_LANDSCAPE =
  "This data is stored securely and used only to personalize your CLEAR Command Center experience. It is not shared with third parties. This is not a tax return and does not constitute tax advice.";

export const DISCLAIMER_STRATEGY_IMPACT =
  "Estimated tax savings are illustrative. Actual results depend on strategies selected, implementation quality, and CPA validation. This is not a guarantee.";

export const DISCLAIMER_IMPLEMENTATION =
  "Estimated savings are participant-entered and CPA-unvalidated until confirmed. Actual results depend on implementation quality, professional coordination, and tax law as it applies to your specific situation.";

export const DISCLAIMER_DEFENSIBILITY =
  "Defensibility Score is a self-assessment tool, not a legal or audit opinion. Documentation requirements vary by strategy and jurisdiction. A qualified CPA determines whether documentation is legally sufficient for your specific situation.";

// ─── EXTERNAL URLS ────────────────────────────────────────────────────────
export const ENROLLMENT_URL = "https://onepercentplaybook.net";
export const SKOOL_COMMUNITY_URL = "https://www.skool.com/the-one-percent-playbook/about?ref=8a906363386042a0838db4fecee1dfa6";
export const BLS_CPI_URL = "https://www.bls.gov/cpi/";

// Delphi Digital Mind — Sam's CLEAR instance.
export const DELPHI_URL = "https://www.delphi.ai/sam-alherech";

// The book — lower-priced entry point for visitors not ready for the $25K program.
export const BOOK_URL = "https://richbutbrokemd.com";

export const DISCLAIMER_EXODUS_TAX_MIT =
  "Tax savings are illustrative only. Actual mitigation depends on strategies selected in Weeks 3–6 and CPA validation. This is not a guarantee, not a recommendation, and not tax advice.";

export const DISCLAIMER_CAPITAL =
  "Expected return inputs are participant-entered estimates. Actual returns depend on investment selection, market conditions, and execution. This is not a projection or guarantee. Work with a qualified financial advisor for investment-specific guidance.";
