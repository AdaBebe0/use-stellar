---
name: "Docs 05 — StellarProvider guide"
about: Write docs/getting-started/stellar-provider.md — full explanation of the StellarProvider component
title: "docs: add StellarProvider guide"
labels: documentation
---

## Write the StellarProvider guide

**Complexity:** Trivial (100 points)
**Estimated time:** half a day
**Depends on:** Docs 01 (folder structure must exist)

---

### Context

Every hook in the library depends on `StellarProvider` being mounted above it. A
developer who does not set this up correctly gets a confusing error from the very
first hook they call. This page explains the provider in full so that never happens.

---

### Scope — file to create

```
docs/getting-started/stellar-provider.md
```

---

### What this file must contain

- What `StellarProvider` is and why the app needs it
- Where to put it (root layout for Next.js, `main.tsx` for Vite)
- The `network` prop and what values it accepts
- What happens if a hook is used outside the provider — show the exact error message
- A code example for **Next.js App Router**
- A code example for **Vite / Create React App**
- A note about not nesting multiple providers

---

### Suggested execution

```bash
git checkout main && git pull --rebase origin main
git checkout -b docs/stellar-provider
# write docs/getting-started/stellar-provider.md
git commit -m "docs(getting-started): add StellarProvider guide"
```

---

### Acceptance criteria

- [ ] `docs/getting-started/stellar-provider.md` exists with complete, real content
- [ ] Documents the `network` prop and its accepted values
- [ ] Includes both a Next.js App Router example and a Vite / CRA example
- [ ] Shows the error you get when a hook is used outside the provider
- [ ] No placeholder text or TODO comments; testnet only
- [ ] PR description includes `Closes #[issue number]`

---

### Important — read before you start

- **Always make sure your CI/CD passes** before requesting review. A red pipeline will not be reviewed.
- **Pull before you push** — run `git pull --rebase origin main` so your branch is up to date and you avoid conflicts.
- **Do not touch or delete any file that is not part of your designated task.** This issue only creates `docs/getting-started/stellar-provider.md`.
- **Use `docs/example.md` as your reference** for structure and formatting.
- **Use the npm documentation as your API reference:** https://www.npmjs.com/package/use-stellar
- If the npm README and the source code disagree, the source code wins — confirm the `StellarProvider` API in `packages/core/src/`.

---

### Guidelines

- You must be assigned to this issue before starting work
- Do not open a pull request before you are assigned — unassigned PRs will be closed without review
- Do not open a draft PR to ask questions — ask in the issue comments
- PR description must include `Closes #[issue number]`
