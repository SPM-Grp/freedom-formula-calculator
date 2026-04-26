# Testing

The Command Center uses **Vitest** for unit tests — Vite-native, fast, familiar Jest-like API.

---

## Running tests

```bash
# single-run (CI-style, exits when done)
npm test

# watch mode (re-runs on file change)
npm run test:watch

# UI dashboard (interactive)
npm run test:ui
```

---

## Coverage (current)

95 tests across 3 suites:

| Suite | Tests | What it covers |
|---|---|---|
| `src/lib/math.test.js` | 55 | Formatters · core solvers (solveR, solveRWithContrib, solveNWithContrib, calcFVWithContrib) · break-even · verdict · lifestyle → FV · audit exposure · defensibility score · capital placement · FV recalibration |
| `src/data/strategies.test.js` | 32 | Library integrity (every strategy has required fields) · category validity · unique ids · excluded-abusive-strategies guarantee · explicit-Sam-requirements guarantee (FMC, asymmetric charitable, FF&E, etc.) |
| `src/data/strategyPrompts.test.js` | 8 | All four tab prompts defined · `[STRATEGY NAME]` placeholder · `do not give tax advice` guardrail · tab-specific concepts |

Run `npx vitest --coverage` for a detailed coverage report (v8 provider, text + HTML).

---

## What's intentionally NOT tested

- **Supabase client calls** — these require a live Supabase instance. Integration testing happens at the pre-deploy regression checklist in `DEPLOY.md`.
- **Full UI component rendering** — the React Testing Library harness is set up (`src/test/setup.js`), but we don't exhaustively test UI. Visual regressions are caught by the manual smoke test before production deploys.
- **Recharts visual output** — charts use `recharts`; visual output is checked in-browser.

---

## Adding tests

### Pure functions

Add to the same directory as the source file, with `.test.js` suffix. E.g., `src/lib/math.js` → `src/lib/math.test.js`.

```js
import { describe, it, expect } from "vitest";
import { yourFunction } from "./yourFile";

describe("yourFunction", () => {
  it("handles the happy path", () => {
    expect(yourFunction(inputs)).toBe(expected);
  });
  it("handles edge cases", () => {
    expect(yourFunction(null)).toBe(null);
  });
});
```

### React components

Use React Testing Library. `@testing-library/jest-dom` matchers are set up in `src/test/setup.js`.

```jsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { YourComponent } from "./YourComponent";

describe("YourComponent", () => {
  it("renders with props", () => {
    render(<YourComponent foo="bar" />);
    expect(screen.getByText("bar")).toBeInTheDocument();
  });
});
```

### Data integrity tests

The strategy library has extensive integrity tests that catch structural regressions (missing fields, typos in category ids, duplicates). When you add a new strategy, these tests fire automatically — you don't need to write new tests, the existing suite catches most regressions.

If you add a new field to the strategy schema, update the integrity test in `strategies.test.js → "every strategy has required top-level fields"`.

---

## CI integration (future)

Add to your CI pipeline:

```yaml
# .github/workflows/ci.yml
steps:
  - run: npm ci
  - run: npm test
  - run: npm run build
```

Green = safe to merge.

---

## Debugging a failing test

```bash
# Run a single test file
npx vitest run src/lib/math.test.js

# Run a single test by name
npx vitest run -t "solveR (closed-form required return)"

# Drop into watch mode with the test focused
npx vitest src/lib/math.test.js
```
