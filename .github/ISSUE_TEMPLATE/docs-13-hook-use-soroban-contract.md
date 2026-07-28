---
name: "Docs 13 — useSorobanContract hook"
about: Write docs/hooks/use-soroban-contract.md following the example.md template
title: "docs: add useSorobanContract hook reference"
labels: documentation
---

## Write the `useSorobanContract` hook documentation

**Complexity:** Medium (150 points)
**Estimated time:** 1 day
**Depends on:** Docs 01 (template must exist)

---

### Context

`useSorobanContract` calls a read function on a Soroban smart contract. It is
partially implemented — read-only simulation works, write calls do not yet. The
docs must be explicit about that limit so developers do not expect write support.

---

### Scope — file to create

```
docs/hooks/use-soroban-contract.md
```

This file must follow `docs/example.md` exactly.

---

### What this file must contain

- A clear notice at the top that write calls are not yet implemented — this hook
  currently supports read-only simulation only
- Explanation of what a Soroban contract ID looks like (it starts with `C`)
- How to find a deployed contract ID on testnet
- An example of calling a read function
- A link to the GitHub issue tracking the write-call implementation

---

### Suggested execution

```bash
git checkout main && git pull --rebase origin main
git checkout -b docs/hook-use-soroban-contract
# write docs/hooks/use-soroban-contract.md
git commit -m "docs(hooks): add useSorobanContract reference"
```

---

### Acceptance criteria

- [ ] `docs/hooks/use-soroban-contract.md` exists and follows `example.md` exactly
- [ ] States the read-only limitation clearly at the top and links the tracking issue
- [ ] Has a parameters table, a return values table, at least 3 examples, and an error table
- [ ] Every code example is complete, copy-pasteable, and testnet only
- [ ] No placeholder text or TODO comments
- [ ] PR description includes `Closes #[issue number]`

---

### Important — read before you start

- **Always make sure your CI/CD passes** before requesting review. A red pipeline will not be reviewed.
- **Pull before you push** — run `git pull --rebase origin main` so your branch is up to date and you avoid conflicts.
- **Do not touch or delete any file that is not part of your designated task.** This issue only creates `docs/hooks/use-soroban-contract.md`.
- **Use `docs/example.md` as your reference** for structure and formatting.
- **Use the npm documentation as your API reference:** https://www.npmjs.com/package/use-stellar
- If the npm README and the source disagree, the source wins — confirm signatures in `packages/core/src/hooks/`.

---

### Guidelines

- You must be assigned to this issue before starting work
- Do not open a pull request before you are assigned — unassigned PRs will be closed without review
- Do not open a draft PR to ask questions — ask in the issue comments
- PR description must include `Closes #[issue number]`
