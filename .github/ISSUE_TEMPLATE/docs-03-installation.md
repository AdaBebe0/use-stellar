---
name: "Docs 03 — Installation guide"
about: Write docs/getting-started/installation.md — how to install use-stellar and its dependencies
title: "docs: add installation guide"
labels: documentation
---

## Write the installation guide

**Complexity:** Trivial (100 points)
**Estimated time:** half a day
**Depends on:** Docs 01 (folder structure must exist)

---

### Context

This is the first thing a developer does after deciding to try the library. If
the install steps are incomplete or assume the wrong package manager, the
developer is blocked before writing a line of code.

---

### Scope — file to create

```
docs/getting-started/installation.md
```

---

### What this file must contain, in order

- Requirements: Node 18+, React 18+, TypeScript optional
- Install commands for **npm, pnpm, and yarn** — show all three
- Installing the peer dependency `@stellar/stellar-sdk`
- Installing the Freighter browser extension — link to freighter.app
- A note about testnet vs mainnet and which to use during development
- A verification step: a minimal code snippet the developer can paste to confirm
  the install worked

---

### Suggested execution

```bash
git checkout main && git pull --rebase origin main
git checkout -b docs/installation
# write docs/getting-started/installation.md
git commit -m "docs(getting-started): add installation guide"
```

---

### Acceptance criteria

- [ ] `docs/getting-started/installation.md` exists with complete, real content
- [ ] Shows install commands for npm, pnpm, and yarn
- [ ] Documents the `@stellar/stellar-sdk` peer dependency and the Freighter extension
- [ ] Includes a copy-pasteable verification snippet
- [ ] No placeholder text or TODO comments; testnet only
- [ ] PR description includes `Closes #[issue number]`

---

### Important — read before you start

- **Always make sure your CI/CD passes** before requesting review. A red pipeline will not be reviewed.
- **Pull before you push** — run `git pull --rebase origin main` so your branch is up to date and you avoid conflicts.
- **Do not touch or delete any file that is not part of your designated task.** This issue only creates `docs/getting-started/installation.md`.
- **Use `docs/example.md` as your reference** for structure and formatting.
- **Use the npm documentation as your API reference:** https://www.npmjs.com/package/use-stellar

---

### Guidelines

- You must be assigned to this issue before starting work
- Do not open a pull request before you are assigned — unassigned PRs will be closed without review
- Do not open a draft PR to ask questions — ask in the issue comments
- PR description must include `Closes #[issue number]`
