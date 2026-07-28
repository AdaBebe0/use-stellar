---
name: "Docs 07 — useBalance hook"
about: Write docs/hooks/use-balance.md following the example.md template
title: "docs: add useBalance hook reference"
labels: documentation
---

## Write the `useBalance` hook documentation

**Complexity:** Medium (150 points)
**Estimated time:** 1 day
**Depends on:** Docs 01 (template must exist)

---

### Context

`useBalance` reads how much of an asset an account holds. It supports both native
XLM and issued assets, and can poll for live updates, so its docs need to cover
several distinct usage shapes clearly.

---

### Scope — file to create

```
docs/hooks/use-balance.md
```

This file must follow `docs/example.md` exactly.

---

### What this file must contain

- Explanation of the `asset` parameter and both formats it accepts (native XLM
  string vs issued asset object)
- The `watch` option and how polling works
- All return values: `balance`, `balances`, `loading`, `error`, `refetch`
- Four examples: XLM balance, USDC balance, polling with `watch`, all balances
  for an account
- Explanation of why `balance` is a string and not a number
- A note about what happens when an account has no trustline for an asset

---

### Suggested execution

```bash
git checkout main && git pull --rebase origin main
git checkout -b docs/hook-use-balance
# write docs/hooks/use-balance.md
git commit -m "docs(hooks): add useBalance reference"
```

---

### Acceptance criteria

- [ ] `docs/hooks/use-balance.md` exists and follows `example.md` exactly
- [ ] Has a parameters table, a return values table, at least 3 examples (4 required here), and an error table
- [ ] Documents both `asset` formats, the `watch` option, and the no-trustline case
- [ ] Explains why `balance` is a string
- [ ] Every code example is complete, copy-pasteable, and testnet only
- [ ] No placeholder text or TODO comments
- [ ] PR description includes `Closes #[issue number]`

---

### Important — read before you start

- **Always make sure your CI/CD passes** before requesting review. A red pipeline will not be reviewed.
- **Pull before you push** — run `git pull --rebase origin main` so your branch is up to date and you avoid conflicts.
- **Do not touch or delete any file that is not part of your designated task.** This issue only creates `docs/hooks/use-balance.md`.
- **Use `docs/example.md` as your reference** for structure and formatting.
- **Use the npm documentation as your API reference:** https://www.npmjs.com/package/use-stellar
- If the npm README and the source disagree, the source wins — confirm signatures in `packages/core/src/hooks/`.

---

### Guidelines

- You must be assigned to this issue before starting work
- Do not open a pull request before you are assigned — unassigned PRs will be closed without review
- Do not open a draft PR to ask questions — ask in the issue comments
- PR description must include `Closes #[issue number]`
