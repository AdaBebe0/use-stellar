---
name: "New hook: useAddTrustline"
about: Create a trustline so an account can hold and receive an issued asset like USDC
title: "feat(hook): useAddTrustline — add a trustline to receive issued assets"
labels: enhancement, hook
---

## New hook: `useAddTrustline`

**Complexity:** High (200 points)
**Estimated time:** 3 to 4 days

---

### Context

On Stellar, an account cannot hold an issued asset (USDC, EURC, any non-XLM
token) until it establishes a **trustline** to that asset's issuer. This is not
optional — a payment of USDC to an account with no USDC trustline **fails** with
`op_no_trust`. This single missing step blocks the most common real-world use
case: receiving stablecoins.

Today a developer has to hand-build a `changeTrust` operation with the raw SDK,
sign it through the wallet, and submit it. That is a lot of blockchain-specific
knowledge for what users think of as "let me accept USDC". This hook removes
that wall.

This is a **signing hook** — it builds, signs (via the connected wallet), and
submits a transaction. Model it on **`useSendPayment`**
(`packages/core/src/hooks/useSendPayment.ts`), which already does the full
build → sign → submit flow correctly.

---

### Why this matters

Without a trustline, "receive USDC" simply does not work, and the error message
from Horizon (`op_no_trust`) is opaque to anyone who has not read the Stellar
docs. Shipping this hook is the difference between use-stellar being usable for a
real payments app and being a demo toy.

---

### Where this lives

- Hook: `packages/core/src/hooks/useAddTrustline.ts`
- Test: `packages/core/src/hooks/useAddTrustline.test.tsx`
- Types: add to `packages/core/src/types/index.ts`
- Export: add to `packages/core/src/index.ts` (hook and types)

---

### Suggested API

```ts
export interface AddTrustlineOptions {
  asset: IssuedAsset // { code, issuer } — native XLM never needs a trustline
  limit?: string // optional trust limit; omit for the max
}

export interface UseAddTrustlineReturn {
  addTrustline: (options: AddTrustlineOptions) => Promise<TransactionResult>
  loading: boolean
  error: StellarError | null
  result: TransactionResult | null
  reset: () => void
}
```

---

### Implementation guidelines

- Copy the guard logic at the top of `useSendPayment`: require
  `wallet.connected` + `wallet.address`, require a selected `wallet.wallet`,
  require `isBrowser()`, and check for a provider/wallet network mismatch. Throw
  `createStellarError(...)` with the correct code from `errors/codes.ts`.
- Reject a native asset with a `VALIDATION_ERROR` — XLM never needs a trustline.
- Build the transaction with `TransactionBuilder`, add
  `Operation.changeTrust({ asset, limit })` where `asset` is
  `new StellarAsset(code, issuer)`, `.setTimeout(30)`, and build.
- Sign via `getWalletAdapter(wallet.wallet).signTransaction(...)` and submit with
  `getHorizonServer(network).submitTransaction(...)` — exactly as `useSendPayment`
  does.
- On success, store a `TransactionResult` (`{ hash, status: "success" }`) in
  `result` and return it. On failure, set `error` via `toStellarError` and rethrow.
- Provide `reset()` to clear `error` and `result`.

---

### Acceptance criteria

- [ ] `useAddTrustline` implemented in `packages/core/src/hooks/useAddTrustline.ts`
- [ ] `AddTrustlineOptions` and `UseAddTrustlineReturn` added to `types/index.ts`
- [ ] Hook and types exported from `packages/core/src/index.ts`
- [ ] Passing a native (`"XLM"`) asset throws a `VALIDATION_ERROR`
- [ ] All wallet/network guards match `useSendPayment` behaviour
- [ ] Errors normalized through `toStellarError`; `reset()` clears state
- [ ] Tests in `useAddTrustline.test.tsx` cover: success, wallet-not-connected,
      native-asset rejection, and a submit failure — mock the wallet adapter and
      Horizon, never hit the network
- [ ] `pnpm test`, `pnpm lint`, `pnpm typecheck`, and `pnpm build` all pass locally
- [ ] PR description includes `Closes #[issue number]`

---

### Reference

- Pattern to copy: `packages/core/src/hooks/useSendPayment.ts`
- Error codes: `packages/core/src/errors/codes.ts` (see `NO_TRUSTLINE`,
  `WALLET_NOT_CONNECTED`, `VALIDATION_ERROR`)
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
- **Follow existing conventions** — match `useSendPayment` and the other hooks.
- **Use testnet only** in every example and test. Never hardcode a mainnet address.
- **Check the references above** before writing code. If the README and the source
  disagree, the source wins.
