---
name: "Docs 15 — Networks guide"
about: Write docs/guides/networks.md — testnet vs mainnet, funding, and switching networks
title: "docs: add networks guide"
labels: documentation
---

## Write the networks guide

**Complexity:** Medium (150 points)
**Estimated time:** half a day to 1 day
**Depends on:** Docs 01 (folder structure must exist)

---

### Context

New Stellar developers do not know the difference between testnet and mainnet, or
how to get test funds. This guide keeps them safely on testnet during development
and explains how to switch when they are ready.

---

### Scope — file to create

```
docs/guides/networks.md
```

---

### What this file must contain

- The difference between testnet and mainnet
- How to fund a testnet account using the Stellar friendbot
- How to switch the app between networks using the `network` prop
- A warning about never testing with real funds on mainnet
- Links to Stellar Laboratory and Stellar Expert for exploring the chain

---

### Suggested execution

```bash
git checkout main && git pull --rebase origin main
git checkout -b docs/guide-networks
# write docs/guides/networks.md
git commit -m "docs(guides): add networks guide"
```

---

### Acceptance criteria

- [ ] `docs/guides/networks.md` exists with complete, real content
- [ ] Explains testnet vs mainnet and includes the friendbot funding steps
- [ ] Documents switching networks via the `network` prop and includes the mainnet warning
- [ ] Links to Stellar Laboratory and Stellar Expert
- [ ] No placeholder text or TODO comments; testnet only
- [ ] PR description includes `Closes #[issue number]`

---

### Important — read before you start

- **Always make sure your CI/CD passes** before requesting review. A red pipeline will not be reviewed.
- **Pull before you push** — run `git pull --rebase origin main` so your branch is up to date and you avoid conflicts.
- **Do not touch or delete any file that is not part of your designated task.** This issue only creates `docs/guides/networks.md`.
- **Use `docs/example.md` as your reference** for structure and formatting.
- **Use the npm documentation as your API reference:** https://www.npmjs.com/package/use-stellar

---

### Guidelines

- You must be assigned to this issue before starting work
- Do not open a pull request before you are assigned — unassigned PRs will be closed without review
- Do not open a draft PR to ask questions — ask in the issue comments
- PR description must include `Closes #[issue number]`
