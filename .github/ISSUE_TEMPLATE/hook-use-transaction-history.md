---
name: "New hook: useTransactionHistory"
about: Fetch and paginate the full transaction history of a Stellar account
title: "feat(hook): useTransactionHistory — paginated account transaction history"
labels: enhancement, hook, good first issue
---

## New hook: `useTransactionHistory`

**Complexity:** High (200 points)
**Estimated time:** 3 to 4 days

---

### Context

Every real Stellar app eventually needs to show a user their history — "what
happened on this account?" We already have `usePayments`, but payments are only
one operation type. A transaction is the top-level envelope that can contain
payments, trustline changes, offers, account merges, and more. Developers
building a wallet, an explorer, or an activity feed need the **transaction**
stream, not just the payment stream.

Right now there is no way to get this without dropping down to the raw
`@stellar/stellar-sdk` and calling Horizon directly — which is exactly the pain
use-stellar exists to remove.

This hook fetches the transaction history for an account, newest first, with
forward and backward pagination.

---

### Why this matters

A developer who wants an "Activity" tab currently has to learn Horizon's
`.transactions().forAccount()` API, its cursor-based pagination, and its record
shape. That is a wall. With this hook they write `useTransactionHistory()` and
get a typed, paginated list. This is one of the top three things people ask for
in a Stellar React app.

---

### Where this lives

- Hook: `packages/core/src/hooks/useTransactionHistory.ts`
- Test: `packages/core/src/hooks/useTransactionHistory.test.ts`
- Types: add to `packages/core/src/types/index.ts`
- Export: add to `packages/core/src/index.ts` (both the hook and its types)

Model your implementation on the existing **`usePayments`** hook
(`packages/core/src/hooks/usePayments.ts`) — it already solves cursor pagination
with `fetchNext` / `fetchPrev` / `hasNext` / `hasPrev`. Follow that pattern
exactly so the two hooks feel identical to use.

---

### Suggested API

```ts
export interface UseTransactionHistoryOptions {
  address?: string | null // defaults to the connected wallet
  limit?: number // default 10
  order?: "asc" | "desc" // default "desc"
  cursor?: string
}

export interface NormalizedTransaction {
  hash: string
  ledger: number
  createdAt: string
  sourceAccount: string
  fee: string
  operationCount: number
  successful: boolean
  memo?: string
  memoType?: string
}

export interface UseTransactionHistoryReturn {
  transactions: NormalizedTransaction[]
  loading: boolean
  error: StellarError | null
  refetch: () => void
  fetchNext: () => Promise<void>
  fetchPrev: () => Promise<void>
  hasNext: boolean
  hasPrev: boolean
}
```

---

### Implementation guidelines

- Use `useStellarContext()` for `network` and the connected `wallet`, exactly like
  `usePayments` does. Resolve the address as `address ?? wallet.address`.
- Use `getHorizonServer(network)` from `../utils` — never construct a Horizon
  server by hand.
- Query with `server.transactions().forAccount(addr).limit(limit).order(order)`
  and apply `.cursor(cursor)` when a cursor is provided.
- Normalize each Horizon record into `NormalizedTransaction` in a private helper,
  the same way `usePayments` has `normalizePayment`. Do not leak raw Horizon types
  out of the hook.
- Wrap every failure with `toStellarError(err)` from `../errors` and store it in
  `error`. Never throw raw.
- If there is no resolved address, set `transactions` to `[]` and do not call
  Horizon.
- Keep pagination callbacks in `useRef` like `usePayments` does, and re-fetch in a
  `useEffect` keyed on the memoized fetch function.

---

### Acceptance criteria

- [ ] `useTransactionHistory` is implemented in
      `packages/core/src/hooks/useTransactionHistory.ts`
- [ ] The three interfaces above are added to `packages/core/src/types/index.ts`
- [ ] The hook and its types are exported from `packages/core/src/index.ts`
- [ ] Pagination works: `fetchNext`, `fetchPrev`, `hasNext`, `hasPrev` behave like
      `usePayments`
- [ ] All errors are normalized through `toStellarError`
- [ ] Unit tests in `useTransactionHistory.test.ts` cover: happy path, empty
      address, Horizon error, and pagination — mock Horizon, do not hit the network
- [ ] `pnpm test`, `pnpm lint`, `pnpm typecheck`, and `pnpm build` all pass locally
- [ ] PR description includes `Closes #[issue number]`

---

### Reference

- Pattern to copy: `packages/core/src/hooks/usePayments.ts`
- Documentation template: [`docs/example.md`](../../docs/example.md)
- npm API reference: https://www.npmjs.com/package/use-stellar
- Error codes you may need: `packages/core/src/errors/codes.ts`

---

### Important rules — read before you start

- **Get assigned first.** Do not open a PR before you are assigned to this issue.
  Unassigned PRs are closed without review.
- **Make sure CI/CD passes.** Run `pnpm lint`, `pnpm typecheck`, `pnpm test`, and
  `pnpm build` locally and confirm they are green before you push. A red pipeline
  will not be reviewed.
- **Pull before you push.** Run `git pull --rebase origin main` right before
  pushing so you never open a PR against a stale `main`.
- **Do not touch files outside your task.** Only create/modify the files listed in
  "Where this lives". Do not reformat, rename, or delete any file that is not part
  of this issue.
- **Follow the existing conventions.** Match the style, naming, and structure of
  `usePayments` and the other hooks already in `packages/core/src/hooks/`.
- **Use testnet only** in every example and test. Never hardcode a mainnet address.
- **Check the references above** — read `docs/example.md` and the npm docs before
  writing code. If the README and the source disagree, the source wins.
