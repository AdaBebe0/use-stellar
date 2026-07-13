# CODEX INSTRUCTIONS — use-stellar codebase cleanup and bug fix

## Role

You are a senior TypeScript engineer and open-source maintainer with deep expertise in:

- React 18 hooks and context
- TypeScript strict mode
- pnpm monorepos
- Next.js 14 App Router
- Jest and ts-jest
- The Stellar blockchain SDK (`@stellar/stellar-sdk`)
- GitHub Actions CI pipelines

Your job is to audit, fix, format, and validate the entire `use-stellar`
codebase so that every CI check passes cleanly. You work methodically —
one file at a time, reading before editing, verifying after every change.
You never guess. You never skip a step. You never leave a file worse than
you found it.

---

## The problem

Contributors have submitted code but the CI pipeline is failing. The
checks that must all pass are:

1. `pnpm --filter use-stellar build` — TypeScript must compile with zero errors
2. `pnpm --filter use-stellar test` — all Jest tests must pass
3. Type checking — no implicit `any`, no unused variables, no missing return types on public functions
4. The demo app must compile — `pnpm --filter @use-stellar/demo build`

You must fix every issue blocking these four checks without breaking any
existing functionality.

---

## Project structure

```
use-stellar/
├── package.json                          ← pnpm workspace root
├── pnpm-workspace.yaml
├── packages/
│   ├── core/                             ← the SDK published to npm as "use-stellar"
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts                  ← public exports
│   │       ├── context/
│   │       │   └── StellarProvider.tsx   ← React context + provider
│   │       ├── hooks/
│   │       │   ├── useWallet.ts
│   │       │   ├── useBalance.ts
│   │       │   ├── useAccount.ts
│   │       │   ├── useSendPayment.ts
│   │       │   ├── useTransaction.ts
│   │       │   ├── useNetwork.ts
│   │       │   ├── useAsset.ts
│   │       │   └── useSorobanContract.ts
│   │       ├── types/
│   │       │   └── index.ts              ← all TypeScript types
│   │       └── utils/
│   │           └── index.ts              ← helper functions
│   │   └── src/utils.test.ts             ← Jest tests (wrong location — see bug list)
│   └── demo/                             ← Next.js 14 demo app
│       ├── package.json
│       ├── next.config.js
│       ├── app/
│       │   ├── layout.tsx
│       │   ├── page.tsx
│       │   └── demo/
│       │       ├── wallet/page.tsx
│       │       ├── balance/page.tsx
│       │       └── network/page.tsx
│       └── components/
│           ├── DemoCard.tsx
│           └── Providers.tsx
```

---

## Known bugs to fix

Work through every bug in this list. Do not skip any. After fixing each
one, write a one-line note confirming what you changed.

---

### Bug 1 — Test file is in the wrong location

The test file is at `packages/core/src/utils.test.ts` but it imports
from `"./utils"` which resolves to `packages/core/src/utils` — a
directory, not a file. The actual utils module is at
`packages/core/src/utils/index.ts`.

Fix: Move the test file to `packages/core/src/utils/utils.test.ts` so
the relative import `"./index"` resolves correctly, OR update the import
path to `"./utils/index"` from the current location.

The correct final location is `packages/core/src/utils/utils.test.ts`
with the import updated to:

```ts
import {
  isValidStellarAddress,
  shortenAddress,
  formatAmount,
  formatAssetCode,
} from "./index";
```

---

### Bug 2 — Jest config has a typo that prevents setup files from loading

In `packages/core/package.json` the Jest config has this key:

```json
"setupFilesAfterFramework": ["@testing-library/jest-dom"]
```

This is a typo. The correct key is:

```json
"setupFilesAfterEach": ["@testing-library/jest-dom"]
```

Wait — that is also wrong. The correct Jest config key is:

```json
"setupFilesAfterFramework"  ← WRONG
"setupFilesAfterEach"       ← WRONG
"setupFilesAfterEnv"        ← CORRECT
```

Fix: Replace `"setupFilesAfterFramework"` with `"setupFilesAfterEnv"` in
the `jest` block inside `packages/core/package.json`.

---

### Bug 3 — `useBalance` has a stale closure bug

In `packages/core/src/hooks/useBalance.ts` the `fetchBalances` function
is defined inside the component body but is NOT wrapped in `useCallback`.
It is then passed as the `refetch` return value and also called inside
`useEffect`. This causes the `useEffect` dependency array to be missing
`fetchBalances` which triggers a React hooks exhaustive-deps violation and
causes stale closure bugs in watch mode.

Fix: Wrap `fetchBalances` in `useCallback` with the correct dependency
array `[resolvedAddress, network]`. Then reference it in the `useEffect`
dependency array.

The corrected structure:

```ts
const fetchBalances = useCallback(async () => {
  if (!resolvedAddress) return;
  setLoading(true);
  setError(null);
  try {
    const server  = getHorizonServer(network);
    const account = await server.loadAccount(resolvedAddress);
    const parsed  = account.balances.map(parseHorizonBalance);
    setBalances(parsed);
  } catch (err) {
    setError(err instanceof Error ? err.message : "Failed to fetch balance");
  } finally {
    setLoading(false);
  }
}, [resolvedAddress, network]);

useEffect(() => {
  fetchBalances();
  if (watch) {
    const interval = setInterval(fetchBalances, 10_000);
    return () => clearInterval(interval);
  }
}, [fetchBalances, watch]);
```

---

### Bug 4 — `useAccount` has the same stale closure bug

Same issue as Bug 3 but in `packages/core/src/hooks/useAccount.ts`.
The `fetchAccount` function is not wrapped in `useCallback` and the
`useEffect` dependency array does not include it.

Fix: Apply the same `useCallback` pattern as Bug 3.

```ts
const fetchAccount = useCallback(async () => {
  // ... existing fetch logic unchanged
}, [resolvedAddress, network]);

useEffect(() => {
  fetchAccount();
}, [fetchAccount]);
```

---

### Bug 5 — `useTransaction` watch interval captures stale `transaction` state

In `packages/core/src/hooks/useTransaction.ts` the watch interval reads
`transaction?.status` from the outer scope but `transaction` is a state
variable. Inside `setInterval`, the closure captures the initial value of
`transaction` (null) and never sees updates. This means the interval
never stops even when the transaction reaches a final status.

Fix: Use a `ref` to track whether polling should stop, or use the
functional update pattern. The simplest correct fix is to use a `ref`:

```ts
const isFinalRef = useRef(false);

// Inside fetchTransaction, after setTransaction:
if (status === "success" || status === "failed") {
  isFinalRef.current = true;
}

// Inside the interval:
const interval = setInterval(() => {
  if (isFinalRef.current) {
    clearInterval(interval);
    return;
  }
  fetchTransaction();
}, 3_000);
```

Also wrap `fetchTransaction` in `useCallback` to fix the stale closure
in the `useEffect` dependency array — same pattern as Bug 3 and 4.

---

### Bug 6 — `useAsset` does not fetch `homeDomain`

In `packages/core/src/hooks/useAsset.ts` the `AssetInfo` interface
declares `homeDomain?: string` but the fetch implementation never
actually fetches it. It only reads from the assets endpoint which does
not return home domain — you must load the issuer account separately.

Fix: After fetching the asset record, fetch the issuer account and read
`home_domain`:

```ts
// After fetching the asset record:
let homeDomain: string | undefined;
try {
  const issuerAccount = await server.loadAccount(issuer);
  homeDomain = issuerAccount.home_domain ?? undefined;
} catch {
  // home_domain is optional — do not fail the whole hook if this errors
}

setAsset({
  code:        raw.asset_code,
  issuer:      raw.asset_issuer,
  supply:      raw.amount,
  numAccounts: raw.num_accounts,
  homeDomain,
  flags: {
    authRequired:  raw.flags.auth_required,
    authRevocable: raw.flags.auth_revocable,
    authImmutable: raw.flags.auth_immutable,
  },
});
```

---

### Bug 7 — `useSendPayment` does a redundant dynamic import

In `packages/core/src/hooks/useSendPayment.ts` there is this line:

```ts
const { TransactionBuilder: TB } = await import("@stellar/stellar-sdk");
```

This dynamically imports `TransactionBuilder` which is already statically
imported at the top of the file as `TransactionBuilder`. The dynamic
import is redundant and could cause tree-shaking issues.

Fix: Remove the dynamic import entirely. Replace `TB.fromXDR(...)` with
the already-imported `TransactionBuilder.fromXDR(...)`.

---

### Bug 8 — `useSendPayment` throws instead of returning error state

When a send fails, `useSendPayment` currently does this:

```ts
} catch (err) {
  const message = err instanceof Error ? err.message : "Transaction failed";
  setError(message);
  throw new Error(message);   // ← this rethrows and crashes the caller
}
```

Rethrowing forces every caller to wrap `send()` in a try/catch even
though the hook already exposes an `error` state. This is inconsistent
with how React hooks work — hooks surface errors through state, not
exceptions.

Fix: Remove the `throw` from the catch block. Return a failed result
instead so the caller can check `error` or `result`:

```ts
} catch (err) {
  const message = err instanceof Error ? err.message : "Transaction failed";
  setError(message);
  return { hash: "", status: "failed" };
} finally {
  setLoading(false);
}
```

---

### Bug 9 — `useSorobanContract` does not actually call the contract

In `packages/core/src/hooks/useSorobanContract.ts` the implementation
does not call any contract method. It attempts to `getAccount` on the
contractId (which is wrong — contracts are not accounts) and then returns
a placeholder object:

```ts
setData({ contractId, method, note: "Simulation wiring tracked in issue #10" });
```

This means the hook returns fake data instead of real contract data. For
the codebase to be honest, this hook should clearly indicate it is a stub.

Fix: Replace the misleading fake data return with a clear stub that does
NOT pretend to call the contract:

```ts
// Stub — full Soroban simulation implementation tracked in GitHub issue #10
// This hook is not yet functional. Do not use in production.
setData(null);
setError(
  `useSorobanContract is not yet implemented. ` +
  `Full Soroban simulation support is tracked in GitHub issue #10. ` +
  `Contributions welcome.`
);
```

This is honest about the state of the hook so developers using the
library are not misled.

---

### Bug 10 — CI workflow uses `npm` instead of `pnpm`

In `.github/workflows/ci.yml` every job uses `npm install` and `npm run`
but the project uses pnpm. This means CI installs with npm which ignores
`pnpm-lock.yaml` and can install different dependency versions than what
contributors have locally.

Fix: Replace all CI jobs with the correct pnpm setup:

```yaml
name: CI

on: [push, pull_request]

jobs:
  test:
    name: Test SDK
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with:
          version: 8
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "pnpm"
      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter use-stellar test

  typecheck:
    name: Typecheck
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with:
          version: 8
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "pnpm"
      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter use-stellar build

  build:
    name: Build SDK + Demo
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with:
          version: 8
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "pnpm"
      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter use-stellar build
      - run: pnpm --filter @use-stellar/demo build
```

---

### Bug 11 — `packages/core/package.json` missing `"jest"` transform config

The Jest config in `packages/core/package.json` is missing the
`transform` key. Without it ts-jest does not know how to handle `.tsx`
files and will fail on any test that imports a `.tsx` module.

Fix: Add the transform key to the jest block:

```json
"jest": {
  "preset": "ts-jest",
  "testEnvironment": "jsdom",
  "testMatch": ["**/*.test.ts", "**/*.test.tsx"],
  "setupFilesAfterEnv": ["@testing-library/jest-dom"],
  "transform": {
    "^.+\\.(ts|tsx)$": ["ts-jest", {
      "tsconfig": "./tsconfig.json"
    }]
  },
  "moduleNameMapper": {
    "^@stellar/stellar-sdk$": "<rootDir>/src/__mocks__/@stellar/stellar-sdk.ts"
  }
}
```

---

### Bug 12 — `useBalance` USDC asset import missing from demo balance page

In `packages/demo/app/demo/balance/page.tsx` the page likely imports
`USDC` from `"use-stellar"` but `USDC` is not exported from
`packages/core/src/index.ts`. The `USDC` constant is defined in utils
but not exported.

Fix: Add `USDC` and `XLM` convenience constants to
`packages/core/src/utils/index.ts` and export them from
`packages/core/src/index.ts`:

```ts
// In packages/core/src/utils/index.ts
export const XLM: Asset = "XLM";

export const USDC: IssuedAsset = {
  code:   "USDC",
  issuer: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
};
```

```ts
// In packages/core/src/index.ts — add to the utils exports section:
export { XLM, USDC } from "./utils";
```

---

### Bug 13 — Demo pages import `useCallback` but it is not used

Check every demo page in `packages/demo/app/demo/` for unused imports.
TypeScript strict mode with `noUnusedLocals` will fail the build for any
unused import. Remove any import that is declared but not referenced in
the file body.

For each demo page:

1. Read the file
2. Find every import statement
3. Check each imported name is actually used in the JSX or logic
4. Remove any that are not used

---

## Formatting rules

After fixing all bugs, format every file in `packages/core/src/` and
`packages/demo/` to match these rules consistently. Do not use Prettier
— apply these rules manually as you read and rewrite each file:

- 2 space indentation — no tabs
- No trailing whitespace on any line
- Single blank line between logical sections (imports, types, component)
- Double blank line before each exported function
- Aligned object properties using spaces when there are 3 or more keys:
  ```ts
  // Good
  const foo = {
    name:    "bar",
    version: "1.0.0",
    active:  true,
  };
  // Bad
  const foo = {
    name: "bar",
    version: "1.0.0",
    active: true,
  };
  ```
- No semicolons — the codebase uses semicolons so keep them
- Trailing commas on multi-line objects and arrays
- Import groups separated by a blank line:
  1. React imports
  2. Third-party imports (`@stellar/stellar-sdk`, etc.)
  3. Internal imports (`../context/...`, `../utils`, etc.)
  4. Type imports (`import type { ... }`)

---

## Verification steps

After completing every fix and formatting pass, run these commands in
order. Do not proceed to the next command if the previous one fails —
stop and fix the error first.

```bash
# Step 1 — confirm pnpm workspace is healthy
pnpm install --frozen-lockfile

# Step 2 — build the SDK
pnpm --filter use-stellar build

# Step 3 — run tests
pnpm --filter use-stellar test

# Step 4 — build the demo (catches any import errors in demo pages)
pnpm --filter @use-stellar/demo build
```

All four commands must exit with code 0 before you are done.

If any command fails:

1. Read the full error output carefully
2. Identify the exact file and line number causing the failure
3. Fix only that specific issue
4. Re-run the failing command
5. Repeat until it passes
6. Then continue to the next command

---

## Output format

After completing all fixes, provide a summary in this exact format:

```
## Cleanup summary

### Bugs fixed
1. [Bug number] — [one line description of what was wrong and what you changed]
2. ...

### Files modified
- packages/core/src/... — [what changed]
- ...

### CI status
- pnpm --filter use-stellar build     → PASS
- pnpm --filter use-stellar test      → PASS
- pnpm --filter @use-stellar/demo build → PASS

### Remaining known issues
- [anything that is a stub or intentionally incomplete — be honest]
```

---

## Hard rules

These rules apply for the entire task. Breaking any of them means the
work is not complete.

1. Never use `any` — use `unknown` and narrow the type, or define a
   proper interface
2. Never leave a TODO comment — if something is not implemented, use the
   stub pattern from Bug 9 with a clear error message
3. Never delete functionality — only fix bugs and formatting
4. Never change the public API — the exports from `packages/core/src/index.ts`
   must remain identical after your changes
5. Never modify `packages/core/dist/` — that is build output, not source
6. Read every file before editing it — do not assume what is in a file
7. One fix at a time — fix Bug 1 completely before starting Bug 2
8. Verify after every fix — after each bug fix, confirm the specific
   error it caused would now be resolved before moving on