---
name: "Docs 08 — useAccount hook"
about: Write docs/hooks/use-account.md following the example.md template
title: "docs: add useAccount hook reference"
labels: documentation
---

## Write the `useAccount` hook documentation

**Complexity:** Medium (150 points)
**Estimated time:** 1 day
**Depends on:** Docs 01 (template must exist)

---

### Context

`useAccount` returns the full picture of a Stellar account: balances, signers,
thresholds, and sequence number. Because it returns a rich object, its docs must
document every field so developers know what they are working with.

---

### Scope — file to create

```
docs/hooks/use-account.md
```

This file must follow `docs/example.md` exactly.

---

### What this file must contain

- The full `AccountInfo` interface with every field documented
- How to pass a custom address vs defaulting to the connected wallet
- Examples: display full account info, check if an account is multisig, list all
  balances, inspect a different address
- A note about what `subentryCount` means and why it matters

---

### Suggested execution

```bash
git checkout main && git pull --rebase origin main
git checkout -b docs/hook-use-account
# write docs/hooks/use-account.md
git commit -m "docs(hooks): add useAccount reference"
```

---

### Acceptance criteria

- [ ] `docs/hooks/use-account.md` exists and follows `example.md` exactly
- [ ] Has a parameters table, a return values table, at least 3 examples, and an error table
- [ ] Documents every field of the `AccountInfo` interface
- [ ] Explains custom address vs connected-wallet default, and `subentryCount`
- [ ] Every code example is complete, copy-pasteable, and testnet only
- [ ] No placeholder text or TODO comments
- [ ] PR description includes `Closes #[issue number]`

---

### Important — read before you start

- **Always make sure your CI/CD passes** before requesting review. A red pipeline will not be reviewed.
- **Pull before you push** — run `git pull --rebase origin main` so your branch is up to date and you avoid conflicts.
- **Do not touch or delete any file that is not part of your designated task.** This issue only creates `docs/hooks/use-account.md`.
- **Use `docs/example.md` as your reference** for structure and formatting.
- **Use the npm documentation as your API reference:** https://www.npmjs.com/package/use-stellar
- If the npm README and the source disagree, the source wins — confirm signatures in `packages/core/src/hooks/`.

---

### Guidelines

- You must be assigned to this issue before starting work
- Do not open a pull request before you are assigned — unassigned PRs will be closed without review
- Do not open a draft PR to ask questions — ask in the issue comments
- PR description must include `Closes #[issue number]`
