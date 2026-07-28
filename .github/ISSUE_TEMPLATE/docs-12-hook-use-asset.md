---
name: "Docs 12 — useAsset hook"
about: Write docs/hooks/use-asset.md following the example.md template
title: "docs: add useAsset hook reference"
labels: documentation
---

## Write the `useAsset` hook documentation

**Complexity:** Medium (150 points)
**Estimated time:** half a day to 1 day
**Depends on:** Docs 01 (template must exist)

---

### Context

`useAsset` fetches metadata about an asset on the Stellar network — its issuer,
home domain, supply, and holder count. Developers use it to display trustworthy
information about a token before interacting with it.

---

### Scope — file to create

```
docs/hooks/use-asset.md
```

This file must follow `docs/example.md` exactly.

---

### What this file must contain

- Explanation of what an asset code and issuer are on Stellar
- What `homeDomain` means and how to verify an asset using it
- What `supply` and `numAccounts` mean
- Examples: fetch USDC info, display asset metadata, handle an unknown asset

---

### Suggested execution

```bash
git checkout main && git pull --rebase origin main
git checkout -b docs/hook-use-asset
# write docs/hooks/use-asset.md
git commit -m "docs(hooks): add useAsset reference"
```

---

### Acceptance criteria

- [ ] `docs/hooks/use-asset.md` exists and follows `example.md` exactly
- [ ] Has a parameters table, a return values table, at least 3 examples, and an error table
- [ ] Explains asset code, issuer, `homeDomain`, `supply`, and `numAccounts`
- [ ] Every code example is complete, copy-pasteable, and testnet only
- [ ] No placeholder text or TODO comments
- [ ] PR description includes `Closes #[issue number]`

---

### Important — read before you start

- **Always make sure your CI/CD passes** before requesting review. A red pipeline will not be reviewed.
- **Pull before you push** — run `git pull --rebase origin main` so your branch is up to date and you avoid conflicts.
- **Do not touch or delete any file that is not part of your designated task.** This issue only creates `docs/hooks/use-asset.md`.
- **Use `docs/example.md` as your reference** for structure and formatting.
- **Use the npm documentation as your API reference:** https://www.npmjs.com/package/use-stellar
- If the npm README and the source disagree, the source wins — confirm signatures in `packages/core/src/hooks/`.

---

### Guidelines

- You must be assigned to this issue before starting work
- Do not open a pull request before you are assigned — unassigned PRs will be closed without review
- Do not open a draft PR to ask questions — ask in the issue comments
- PR description must include `Closes #[issue number]`
