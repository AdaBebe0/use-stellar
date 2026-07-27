---
name: "Docs 18 — Types reference"
about: Write docs/reference/types.md — every exported type with field-by-field descriptions
title: "docs: add TypeScript types reference"
labels: documentation
---

## Write the TypeScript types reference

**Complexity:** Medium (150 points)
**Estimated time:** 1 day
**Depends on:** Docs 01 (folder structure must exist)

---

### Context

TypeScript users need one page that shows the exact shape of every object the
library returns. This is the lookup page — no prose, no tutorials, just complete
type definitions with every field explained.

---

### Scope — file to create

```
docs/reference/types.md
```

---

### What this file must contain

- Every exported type and interface from the library, with its full definition
- A field-by-field description for each — name, type, and what it means
- At minimum: `AccountInfo`, `Asset` (and the native vs issued variants),
  `NetworkConfig`, `SendPaymentOptions`, and every hook's return interface
- Logical grouping (account types, asset types, network types, payment types, hook
  return types) with headings
- Keep it a reference, not a tutorial — link out to the relevant hook doc for usage

---

### Suggested execution

```bash
git checkout main && git pull --rebase origin main
git checkout -b docs/reference-types
# write docs/reference/types.md
git commit -m "docs(reference): add complete exported types reference"
```

---

### Acceptance criteria

- [ ] `docs/reference/types.md` exists and lists every exported type
- [ ] Every type has its full definition and a field-by-field description
- [ ] Types are grouped under clear headings
- [ ] Definitions match `packages/core/src/` exactly
- [ ] No placeholder text or TODO comments
- [ ] PR description includes `Closes #[issue number]`

---

### Important — read before you start

- **Always make sure your CI/CD passes** before requesting review. A red pipeline will not be reviewed.
- **Pull before you push** — run `git pull --rebase origin main` so your branch is up to date and you avoid conflicts.
- **Do not touch or delete any file that is not part of your designated task.** This issue only creates `docs/reference/types.md`.
- **Use `docs/example.md` as your reference** for structure and formatting.
- **Use the npm documentation as your API reference:** https://www.npmjs.com/package/use-stellar
- This page must be exhaustive. Read every file under `packages/core/src/` that exports a type — the source is the source of truth; the README is secondary.

---

### Guidelines

- You must be assigned to this issue before starting work
- Do not open a pull request before you are assigned — unassigned PRs will be closed without review
- Do not open a draft PR to ask questions — ask in the issue comments
- PR description must include `Closes #[issue number]`
