---
name: "Docs 06 — useWallet hook"
about: Write docs/hooks/use-wallet.md following the example.md template
title: "docs: add useWallet hook reference"
labels: documentation
---

## Write the `useWallet` hook documentation

**Complexity:** Medium (150 points)
**Estimated time:** 1 day
**Depends on:** Docs 01 (template must exist)

---

### Context

`useWallet` is the entry point to almost every use-stellar app — it connects the
user's wallet and exposes their address. This is usually the first hook a
developer calls, so its docs must be complete and precise.

---

### Scope — file to create

```
docs/hooks/use-wallet.md
```

This file must follow `docs/example.md` exactly.

---

### What this file must contain

- What Freighter is and where to get it
- All return values: `connected`, `connecting`, `address`, `network`, `wallet`,
  `error`, `connect`, `disconnect`
- Three examples: a connect button, gating content behind connection, displaying
  a shortened address
- An error table covering: Freighter not installed, user rejected, wrong network
- A note on the `WalletType` parameter and what values are supported

---

### Suggested execution

```bash
git checkout main && git pull --rebase origin main
git checkout -b docs/hook-use-wallet
# write docs/hooks/use-wallet.md
git commit -m "docs(hooks): add useWallet reference"
```

---

### Acceptance criteria

- [ ] `docs/hooks/use-wallet.md` exists and follows `example.md` exactly
- [ ] Has a parameters table, a return values table, at least 3 examples, and an error table
- [ ] Documents all listed return values and the `WalletType` parameter
- [ ] Every code example is complete, copy-pasteable, and testnet only
- [ ] No placeholder text or TODO comments
- [ ] PR description includes `Closes #[issue number]`

---

### Important — read before you start

- **Always make sure your CI/CD passes** before requesting review. A red pipeline will not be reviewed.
- **Pull before you push** — run `git pull --rebase origin main` so your branch is up to date and you avoid conflicts.
- **Do not touch or delete any file that is not part of your designated task.** This issue only creates `docs/hooks/use-wallet.md`.
- **Use `docs/example.md` as your reference** for structure and formatting.
- **Use the npm documentation as your API reference:** https://www.npmjs.com/package/use-stellar
- If the npm README and the source disagree, the source wins — confirm signatures in `packages/core/src/hooks/`.

---

### Guidelines

- You must be assigned to this issue before starting work
- Do not open a pull request before you are assigned — unassigned PRs will be closed without review
- Do not open a draft PR to ask questions — ask in the issue comments
- PR description must include `Closes #[issue number]`
