---
name: "Docs 04 — Quickstart guide"
about: Write docs/getting-started/quickstart.md — zero to a working component in under 5 minutes
title: "docs: add quickstart guide"
labels: documentation
---

## Write the quickstart guide

**Complexity:** Medium (150 points)
**Estimated time:** 1 day
**Depends on:** Docs 01 (folder structure must exist)

---

### Context

This is the single most important page in the docs. It walks a developer from an
empty project to a working component in under five minutes. A developer who
succeeds here trusts the library. A developer who hits a red screen here
uninstalls it.

---

### Scope — file to create

```
docs/getting-started/quickstart.md
```

---

### What this file must contain

Walk the developer from zero to a working component. Each step is a complete,
copy-pasteable code block that actually runs — no pseudo-code, no placeholders.

- **Step 1** — wrap the app in `StellarProvider`
- **Step 2** — connect Freighter with `useWallet`
- **Step 3** — display the XLM balance with `useBalance`
- **Step 4** — send a payment with `useSendPayment`
- End with a **"What's next"** section linking to the individual hook docs

---

### Suggested execution

```bash
git checkout main && git pull --rebase origin main
git checkout -b docs/quickstart
# write docs/getting-started/quickstart.md
git commit -m "docs(getting-started): add quickstart guide"
```

---

### Acceptance criteria

- [ ] `docs/getting-started/quickstart.md` exists with complete, real content
- [ ] Covers all four steps in order, each a complete runnable code block
- [ ] No pseudo-code, placeholders, or `// ...` in any snippet
- [ ] Ends with a "What's next" section linking to the hook docs
- [ ] Testnet only; no TODOs
- [ ] PR description includes `Closes #[issue number]`

---

### Important — read before you start

- **Always make sure your CI/CD passes** before requesting review. A red pipeline will not be reviewed.
- **Pull before you push** — run `git pull --rebase origin main` so your branch is up to date and you avoid conflicts.
- **Do not touch or delete any file that is not part of your designated task.** This issue only creates `docs/getting-started/quickstart.md`.
- **Use `docs/example.md` as your reference** for structure and formatting.
- **Use the npm documentation as your API reference:** https://www.npmjs.com/package/use-stellar

---

### Guidelines

- You must be assigned to this issue before starting work
- Do not open a pull request before you are assigned — unassigned PRs will be closed without review
- Do not open a draft PR to ask questions — ask in the issue comments
- PR description must include `Closes #[issue number]`
