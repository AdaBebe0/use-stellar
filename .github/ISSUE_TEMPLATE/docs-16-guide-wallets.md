---
name: "Docs 16 — Wallets guide"
about: Write docs/guides/wallets.md — Freighter, Albedo, and wallet support
title: "docs: add wallets guide"
labels: documentation
---

## Write the wallets guide

**Complexity:** Medium (150 points)
**Estimated time:** half a day to 1 day
**Depends on:** Docs 01 (folder structure must exist)

---

### Context

use-stellar connects to user wallets, and each wallet behaves a little
differently. This guide walks a developer through installing and using the
supported wallets, and explains how to detect which one is connected.

---

### Scope — file to create

```
docs/guides/wallets.md
```

---

### What this file must contain

- Freighter — a step-by-step install guide, how to create a testnet account
  inside Freighter, and how to switch networks
- Albedo — what it is, how it differs from Freighter, and its current support status
- Future wallet support — what wallets are on the roadmap
- How to detect which wallet is connected using the `wallet` return value from
  `useWallet`

---

### Suggested execution

```bash
git checkout main && git pull --rebase origin main
git checkout -b docs/guide-wallets
# write docs/guides/wallets.md
git commit -m "docs(guides): add wallets guide"
```

---

### Acceptance criteria

- [ ] `docs/guides/wallets.md` exists with complete, real content
- [ ] Covers Freighter (install + testnet account + switching networks) and Albedo with current support status
- [ ] Explains detecting the connected wallet via the `wallet` value from `useWallet`
- [ ] Every code example is complete, copy-pasteable, and testnet only
- [ ] No placeholder text or TODO comments
- [ ] PR description includes `Closes #[issue number]`

---

### Important — read before you start

- **Always make sure your CI/CD passes** before requesting review. A red pipeline will not be reviewed.
- **Pull before you push** — run `git pull --rebase origin main` so your branch is up to date and you avoid conflicts.
- **Do not touch or delete any file that is not part of your designated task.** This issue only creates `docs/guides/wallets.md`.
- **Use `docs/example.md` as your reference** for structure and formatting.
- **Use the npm documentation as your API reference:** https://www.npmjs.com/package/use-stellar
- If the npm README and the source disagree, the source wins — confirm behaviour in `packages/core/src/`.

---

### Guidelines

- You must be assigned to this issue before starting work
- Do not open a pull request before you are assigned — unassigned PRs will be closed without review
- Do not open a draft PR to ask questions — ask in the issue comments
- PR description must include `Closes #[issue number]`
