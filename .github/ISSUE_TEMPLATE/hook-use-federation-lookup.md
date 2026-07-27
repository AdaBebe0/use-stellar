---
name: "New hook: useFederationLookup"
about: Resolve human-readable Stellar addresses like name*domain.com to a G... account
title: "feat(hook): useFederationLookup — resolve federated addresses to account IDs"
labels: enhancement, hook
---

## New hook: `useFederationLookup`

**Complexity:** High (200 points)
**Estimated time:** 3 to 4 days

---

### Context

Stellar has a federation protocol (SEP-2) that maps a human-readable address like
`israel*stellar.org` to a real account ID (`G...`) — the same way an email
address is friendlier than an IP. Users would much rather send to
`alice*example.com` than paste a 56-character public key. But resolving that
address requires knowing the federation protocol, fetching the domain's
`stellar.toml`, and calling its federation server.

This hook takes a federated address and returns the resolved account ID and any
memo the federation server attaches. It is a **read-only** hook — no wallet, no
signing.

---

### Why this matters

Address entry is where users make the most costly mistakes (sending to the wrong
key = lost funds). Federation makes addresses human-readable and less
error-prone. A payment UI that accepts `name*domain.com` feels dramatically more
polished than one that only accepts raw keys — and today there is no way to do
this in use-stellar without the raw SDK's `Federation` server.

---

### Where this lives

- Hook: `packages/core/src/hooks/useFederationLookup.ts`
- Test: `packages/core/src/hooks/useFederationLookup.test.ts`
- Types: add to `packages/core/src/types/index.ts`
- Export: add to `packages/core/src/index.ts` (hook and types)

This is a fetch-on-input hook, so model its state shape on `useAsset`
(`packages/core/src/hooks/useAsset.ts`) — a query input plus
`{ data, loading, error, refetch }`.

---

### Suggested API

```ts
export interface UseFederationLookupOptions {
  address?: string | null // e.g. "israel*stellar.org"; pass null to skip
}

export interface FederationRecord {
  stellarAddress: string // the input, echoed back
  accountId: string // the resolved G... key
  memoType?: string // "text" | "id" | "hash", if any
  memo?: string // memo the recipient requires
}

export interface UseFederationLookupReturn {
  record: FederationRecord | null
  loading: boolean
  error: StellarError | null
  refetch: () => void
}
```

---

### Implementation guidelines

- Validate the input looks like a federated address (`name*domain`) before doing
  any network work. If it is malformed, set a `VALIDATION_ERROR` via
  `createStellarError` and do not fetch.
- Use the SDK's `Federation.Server.resolve(address)` from
  `@stellar/stellar-sdk` to resolve. Do not re-implement `stellar.toml` fetching
  by hand.
- If `address` is `null`/empty, set `record` to `null`, clear error, and skip
  fetching — same "skip when no input" behaviour the other read hooks use.
- Normalize the SDK response into `FederationRecord`. Do not leak the raw SDK type.
- Wrap all failures with `toStellarError`. A domain with no federation server, or
  an unknown name, should surface as a clean error — not a thrown exception.
- Expose `refetch()` to retry the current address.

---

### Acceptance criteria

- [ ] `useFederationLookup` implemented in
      `packages/core/src/hooks/useFederationLookup.ts`
- [ ] The three interfaces added to `packages/core/src/types/index.ts`
- [ ] Hook and types exported from `packages/core/src/index.ts`
- [ ] Malformed input (no `*`, empty) produces a `VALIDATION_ERROR` and does not
      hit the network
- [ ] `null` address skips fetching and yields `record: null`
- [ ] All errors normalized through `toStellarError`
- [ ] Tests in `useFederationLookup.test.ts` cover: successful resolve, malformed
      input, unknown address, and null input — mock the federation resolver
- [ ] `pnpm test`, `pnpm lint`, `pnpm typecheck`, and `pnpm build` all pass locally
- [ ] PR description includes `Closes #[issue number]`

---

### Reference

- Pattern to copy: `packages/core/src/hooks/useAsset.ts`
- Documentation template: [`docs/example.md`](../../docs/example.md)
- npm API reference: https://www.npmjs.com/package/use-stellar
- SEP-2 federation protocol: https://developers.stellar.org/docs/learn/encyclopedia/network-configuration/federation

---

### Important rules — read before you start

- **Get assigned first.** Do not open a PR before you are assigned. Unassigned PRs
  are closed without review.
- **Make sure CI/CD passes.** Run `pnpm lint`, `pnpm typecheck`, `pnpm test`, and
  `pnpm build` locally and confirm green before pushing.
- **Pull before you push.** `git pull --rebase origin main` right before pushing.
- **Do not touch files outside your task.** Only the files under "Where this
  lives". Do not reformat, rename, or delete unrelated files.
- **Follow existing conventions** — match `useAsset` and the other read hooks.
- **Use testnet only** in every example and test. Never hardcode a mainnet address.
- **Check the references above** before writing code. If the README and the source
  disagree, the source wins.
