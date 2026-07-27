---
name: "Docs 11 — useNetwork hook"
about: Write docs/hooks/use-network.md following the example.md template
title: "docs: add useNetwork hook reference"
labels: documentation
---

## Write the `useNetwork` hook documentation

**Complexity:** Medium (150 points)
**Estimated time:** half a day to 1 day
**Depends on:** Docs 01 (template must exist)

---

### Context

`useNetwork` tells the app which network it is on and exposes the Horizon and
Soroban endpoints for that network. Developers use it to show testnet warnings
and to switch behaviour between testnet and mainnet.

---

### Scope — file to create

```
docs/hooks/use-network.md
```

This file must follow `docs/example.md` exactly.

---

### What this file must contain

- All return values: `network`, `networkConfig`, `isTestnet`, `isMainnet`
- The full `NetworkConfig` interface with `horizonUrl` and `sorobanUrl`
- Examples: show a testnet warning banner, display the Horizon URL, conditionally
  render content based on the network

---

### Suggested execution

```bash
git checkout main && git pull --rebase origin main
git checkout -b docs/hook-use-network
# write docs/hooks/use-network.md
git commit -m "docs(hooks): add useNetwork reference"
```

---

### Acceptance criteria

- [ ] `docs/hooks/use-network.md` exists and follows `example.md` exactly
- [ ] Has a parameters table, a return values table, at least 3 examples, and an error table
- [ ] Documents all four return values and the full `NetworkConfig` interface
- [ ] Every code example is complete, copy-pasteable, and testnet only
- [ ] No placeholder text or TODO comments
- [ ] PR description includes `Closes #[issue number]`

---

### Important — read before you start

- **Always make sure your CI/CD passes** before requesting review. A red pipeline will not be reviewed.
- **Pull before you push** — run `git pull --rebase origin main` so your branch is up to date and you avoid conflicts.
- **Do not touch or delete any file that is not part of your designated task.** This issue only creates `docs/hooks/use-network.md`.
- **Use `docs/example.md` as your reference** for structure and formatting.
- **Use the npm documentation as your API reference:** https://www.npmjs.com/package/use-stellar
- If the npm README and the source disagree, the source wins — confirm signatures in `packages/core/src/hooks/`.

---

### Guidelines

- You must be assigned to this issue before starting work
- Do not open a pull request before you are assigned — unassigned PRs will be closed without review
- Do not open a draft PR to ask questions — ask in the issue comments
- PR description must include `Closes #[issue number]`
