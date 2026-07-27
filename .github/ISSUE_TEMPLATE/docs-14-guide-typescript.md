---
name: "Docs 14 — TypeScript guide"
about: Write docs/guides/typescript.md — how to use use-stellar with TypeScript
title: "docs: add TypeScript guide"
labels: documentation
---

## Write the TypeScript guide

**Complexity:** Medium (150 points)
**Estimated time:** 1 day
**Depends on:** Docs 01 (folder structure must exist)

---

### Context

Many use-stellar users are on TypeScript and want type safety end to end. This
guide is the conceptual, example-driven companion to the exhaustive types
reference — it teaches how to work with the library's types, not just list them.

---

### Scope — file to create

```
docs/guides/typescript.md
```

---

### What this file must contain

- All exported types and interfaces with short descriptions
- The `Asset` discriminated union and how to work with it
- How to type hook return values in component props
- How to import types: `import type { ... } from "use-stellar"`
- An example of narrowing `Asset` to check if it is native or issued

---

### Suggested execution

```bash
git checkout main && git pull --rebase origin main
git checkout -b docs/guide-typescript
# write docs/guides/typescript.md
git commit -m "docs(guides): add TypeScript guide"
```

---

### Acceptance criteria

- [ ] `docs/guides/typescript.md` exists with complete, real content
- [ ] Explains the `Asset` discriminated union with a narrowing example
- [ ] Shows how to import types and type hook return values in props
- [ ] Every code example is complete, copy-pasteable, and testnet only
- [ ] No placeholder text or TODO comments
- [ ] PR description includes `Closes #[issue number]`

---

### Important — read before you start

- **Always make sure your CI/CD passes** before requesting review. A red pipeline will not be reviewed.
- **Pull before you push** — run `git pull --rebase origin main` so your branch is up to date and you avoid conflicts.
- **Do not touch or delete any file that is not part of your designated task.** This issue only creates `docs/guides/typescript.md`.
- **Use `docs/example.md` as your reference** for structure and formatting.
- **Use the npm documentation as your API reference:** https://www.npmjs.com/package/use-stellar
- If the npm README and the source disagree, the source wins — confirm types in `packages/core/src/`.

---

### Guidelines

- You must be assigned to this issue before starting work
- Do not open a pull request before you are assigned — unassigned PRs will be closed without review
- Do not open a draft PR to ask questions — ask in the issue comments
- PR description must include `Closes #[issue number]`
