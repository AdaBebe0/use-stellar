---
name: "New hook: useStreamPayments"
about: Subscribe to real-time incoming and outgoing payments for an account
title: "feat(hook): useStreamPayments — real-time payment notifications via Horizon streaming"
labels: enhancement, hook
---

## New hook: `useStreamPayments`

**Complexity:** High (200 points)
**Estimated time:** 3 to 4 days

---

### Context

Horizon supports **Server-Sent Events** streaming: instead of polling, you open a
long-lived connection and Horizon pushes new records as they happen. For payments
this is the difference between "refresh to see if your money arrived" and "the UI
updates the instant it does". Any serious payment interface needs this — a POS
screen, a tip jar, a wallet's live activity feed.

There is currently no streaming hook in use-stellar. Doing this by hand means
managing an EventSource-style subscription, cleaning it up on unmount, and not
leaking connections across re-renders — subtle React lifecycle work that most
developers get wrong. This hook owns that complexity.

This is a **subscription hook**, not a fetch hook: it holds an open stream and
must tear it down cleanly.

---

### Why this matters

Real-time feedback is what makes a payments app feel alive and trustworthy. And a
leaked stream (not closed on unmount, or reopened on every render) is a real bug
that crashes tabs — so the value here is not just "it streams" but "it streams
without leaking". Getting the cleanup right once, in the library, saves every
consumer from getting it wrong.

---

### Where this lives

- Hook: `packages/core/src/hooks/useStreamPayments.ts`
- Test: `packages/core/src/hooks/useStreamPayments.test.tsx`
- Types: add to `packages/core/src/types/index.ts`
- Export: add to `packages/core/src/index.ts` (hook and types)

Reuse the existing `NormalizedPayment` type and the `normalizePayment` logic from
`usePayments` (`packages/core/src/hooks/usePayments.ts`) so streamed payments have
the exact same shape as fetched ones. If it helps, extract `normalizePayment`
into `../utils` and import it in both hooks — but only if you do it cleanly and
update `usePayments` accordingly.

---

### Suggested API

```ts
export interface UseStreamPaymentsOptions {
  address?: string | null // defaults to connected wallet
  cursor?: string | "now" // where to start; "now" = only future payments
  enabled?: boolean // default true; false pauses the stream
}

export interface UseStreamPaymentsReturn {
  payments: NormalizedPayment[] // accumulates newest-first as they arrive
  latest: NormalizedPayment | null // the most recent single payment
  streaming: boolean // is the stream currently open
  error: StellarError | null
  stop: () => void // close the stream manually
  start: () => void // reopen after a stop
}
```

---

### Implementation guidelines

- Open the stream with
  `getHorizonServer(network).payments().forAccount(addr).cursor(cursor ?? "now").stream({ onmessage, onerror })`.
- **Cleanup is the whole point.** The `.stream(...)` call returns a close
  function. Store it in a `useRef` and call it in the `useEffect` cleanup, on
  `stop()`, and before opening a new stream. Never leave a stream open across an
  address/network change or an unmount.
- Do not reopen the stream on every render. Key the `useEffect` on the real
  dependencies only (`address`, `network`, `cursor`, `enabled`).
- Normalize each incoming record into `NormalizedPayment` (reuse `usePayments`
  logic) and prepend it to `payments`. Update `latest`.
- Respect `enabled: false` and `stop()` — both close the stream and set
  `streaming` to `false`. `start()` reopens.
- Route stream errors through `toStellarError` into `error`; do not throw inside
  the callback.
- Guard for SSR: do not open a stream when `!isBrowser()`.

---

### Acceptance criteria

- [ ] `useStreamPayments` implemented in
      `packages/core/src/hooks/useStreamPayments.ts`
- [ ] Streamed payments use the shared `NormalizedPayment` shape
- [ ] The stream is closed on unmount, on `stop()`, and before reopening — verified
      by a test asserting the close function was called
- [ ] The stream does not reopen on unrelated re-renders
- [ ] `enabled: false` and `stop()` both halt streaming; `start()` resumes
- [ ] Errors normalized through `toStellarError`; no throwing in callbacks
- [ ] SSR-safe: no stream opened when `!isBrowser()`
- [ ] Tests in `useStreamPayments.test.tsx` cover: receiving a payment, cleanup on
      unmount, `stop`/`start`, and a stream error — mock the streaming API
- [ ] `pnpm test`, `pnpm lint`, `pnpm typecheck`, and `pnpm build` all pass locally
- [ ] PR description includes `Closes #[issue number]`

---

### Reference

- Normalization to reuse: `packages/core/src/hooks/usePayments.ts`
- SSR guard example: `packages/core/src/__tests__/ssr-guard.test.tsx`
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
  lives" (plus `usePayments.ts` **only** if you extract shared normalization). Do
  not reformat, rename, or delete unrelated files.
- **Follow existing conventions** — match the hooks already in
  `packages/core/src/hooks/`.
- **Use testnet only** in every example and test. Never hardcode a mainnet address.
- **Check the references above** before writing code. If the README and the source
  disagree, the source wins.
