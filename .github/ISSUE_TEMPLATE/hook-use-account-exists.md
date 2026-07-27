---
name: "New hook: useAccountExists"
about: Check whether a Stellar address is a real, funded account before sending to it
title: "feat(hook): useAccountExists — validate an address is funded before sending"
labels: enhancement, hook, good first issue
---

## New hook: `useAccountExists`

**Complexity:** High (200 points)
**Estimated time:** 3 to 4 days

---

### Context

On Stellar there is a critical difference between an address that is
**syntactically valid** (56 chars, starts with `G`, passes the checksum) and an
account that **actually exists on the ledger**. An account only exists once it
has been funded with the minimum XLM reserve. Sending a normal payment to a valid
-but-unfunded address fails — you need a `create_account` operation instead.

Before a payment UI lets a user hit "Send", it should tell them: is this
destination a real, funded account? This hook answers exactly that. It combines a
local format check with a Horizon existence check and returns a clear boolean plus
the reason.

This is a small, focused, **read-only** hook — the ideal first contribution — but
getting the two-stage check and the edge cases right is what earns the points.

---

### Why this matters

"I sent money and it disappeared / it failed and I don't know why" is the worst
experience a payment app can give. Almost always the cause is an unfunded or
mistyped destination. A pre-send existence check turns a confusing failure into a
clear, up-front "this account isn't active yet". Every send form should use this.

---

### Where this lives

- Hook: `packages/core/src/hooks/useAccountExists.ts`
- Test: `packages/core/src/hooks/useAccountExists.test.ts`
- Types: add to `packages/core/src/types/index.ts`
- Export: add to `packages/core/src/index.ts` (hook and types)

Use the existing `isValidStellarAddress` helper from `../utils` for the format
check — do not re-implement address validation.

---

### Suggested API

```ts
export interface UseAccountExistsOptions {
  address?: string | null // pass null/empty to reset to idle
}

export type AccountExistsReason =
  | "exists" // valid format AND funded on-ledger
  | "not_funded" // valid format but no account on-ledger yet
  | "invalid_format" // failed the local address check
  | "idle" // no address supplied yet

export interface UseAccountExistsReturn {
  exists: boolean | null // null while loading / idle
  reason: AccountExistsReason
  loading: boolean
  error: StellarError | null
  refetch: () => void
}
```

---

### Implementation guidelines

- **Stage 1 (local):** run `isValidStellarAddress(address)`. If it fails, set
  `exists: false`, `reason: "invalid_format"`, and do **not** call Horizon.
- **Stage 2 (network):** call `getHorizonServer(network).loadAccount(address)`.
  - Resolves → `exists: true`, `reason: "exists"`.
  - Horizon 404 (account not found) → `exists: false`, `reason: "not_funded"`.
    This is a normal result, **not** an error — do not populate `error` for a 404.
  - Any other failure (network, rate-limit) → `error` via `toStellarError`, and
    leave `exists` as `null`.
- Empty/`null` address → `exists: null`, `reason: "idle"`, no network call.
- Distinguish a 404 from a transport error carefully — inspect the normalized
  error code (`ACCOUNT_NOT_FOUND`) rather than swallowing everything.
- Expose `refetch()` to re-run both stages for the current address.

---

### Acceptance criteria

- [ ] `useAccountExists` implemented in
      `packages/core/src/hooks/useAccountExists.ts`
- [ ] The interfaces above added to `packages/core/src/types/index.ts`
- [ ] Hook and types exported from `packages/core/src/index.ts`
- [ ] Invalid format is caught locally with **no** Horizon call
- [ ] A 404 yields `reason: "not_funded"` and does **not** set `error`
- [ ] Transport/rate-limit failures set `error` and leave `exists` as `null`
- [ ] Empty/null address is `idle` with no network call
- [ ] Tests in `useAccountExists.test.ts` cover: exists, not_funded (404),
      invalid_format, idle, and a network error — mock Horizon
- [ ] `pnpm test`, `pnpm lint`, `pnpm typecheck`, and `pnpm build` all pass locally
- [ ] PR description includes `Closes #[issue number]`

---

### Reference

- Validation helper: `isValidStellarAddress` in `packages/core/src/utils/index.ts`
- Account loading pattern: `packages/core/src/hooks/useAccount.ts`
- Error codes: `packages/core/src/errors/codes.ts` (`ACCOUNT_NOT_FOUND`)
- Documentation template: [`docs/example.md`](../../docs/example.md)
- npm API reference: https://www.npmjs.com/package/use-stellar

---

### Important rules — read before you start

- **Get assigned first.** Do not open a PR before you are assigned. Unassigned PRs
  are closed without review.
- **Make sure CI/CD passes.** Run `pnpm lint`, `pnpm typecheck`, `pnpm test`, and
  `pnpm build` locally and confirm green before pushing.
- **Pull before you push.** `git pull --rebase origin main` right before pushing.
- **Do not touch files outside your task.** Only the files under "Where this
  lives". Do not reformat, rename, or delete unrelated files.
- **Follow existing conventions** — match `useAccount` and the other read hooks.
- **Use testnet only** in every example and test. Never hardcode a mainnet address.
- **Check the references above** before writing code. If the README and the source
  disagree, the source wins.
