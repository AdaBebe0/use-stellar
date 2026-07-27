---
name: "Docs 02 — Introduction: what use-stellar is"
about: Write docs/getting-started/introduction.md — the landing page that explains what the SDK is and why it exists
title: "docs: add introduction page (what use-stellar is)"
labels: documentation
---

## Write the introduction page

**Complexity:** Trivial (100 points)
**Estimated time:** half a day
**Depends on:** Docs 01 (folder structure must exist)

---

### Context

Before a developer reads about installation or a single hook, they need to know
what use-stellar actually is and whether it solves their problem. Right now there
is no such page. This is the first page in the docs and the first impression of
the whole library.

This page answers one question: "What is this, and why would I use it instead of
the raw Stellar SDK?"

---

### Why this matters

A developer who lands on the docs with no context needs a 60-second read that
tells them what the library does, who it is for, and what they can build. If that
page is missing or vague, they leave before installing anything.

---

### Scope — file to create

```
docs/getting-started/introduction.md
```

---

### What this file must contain

- A one-paragraph description of what use-stellar is: React hooks for the Stellar
  network — "the wagmi of Stellar"
- The problem it solves: interacting with Stellar from React normally means
  wiring the raw SDK, managing loading/error state by hand, and handling wallet
  connections yourself
- What use-stellar gives you instead: ready-made hooks for wallets, balances,
  payments, accounts, transactions, assets, network info, and Soroban reads
- Who it is for: React and Next.js developers, including those who have never
  used Stellar before
- A short bullet list of the available hooks with a one-line description each
- A "Next steps" section linking to installation, quickstart, and the provider page
- No code walkthrough here — keep it conceptual. The quickstart is where code lives.

---

### Suggested execution

```bash
git checkout main && git pull --rebase origin main
git checkout -b docs/introduction
# write docs/getting-started/introduction.md
git commit -m "docs(getting-started): add introduction page"
```

---

### Acceptance criteria

- [ ] `docs/getting-started/introduction.md` exists with complete, real content
- [ ] Explains what the SDK is, the problem it solves, and who it is for
- [ ] Lists all available hooks with a one-line description each
- [ ] Ends with a "Next steps" section linking to installation and quickstart
- [ ] No placeholder text or TODO comments
- [ ] PR description includes `Closes #[issue number]`

---

### Important — read before you start

- **Always make sure your CI/CD passes** before requesting review. A red pipeline will not be reviewed.
- **Pull before you push** — run `git pull --rebase origin main` so your branch is up to date and you avoid conflicts.
- **Do not touch or delete any file that is not part of your designated task.** This issue only creates `docs/getting-started/introduction.md`.
- **Use `docs/example.md` as your reference** for structure and formatting.
- **Use the npm documentation as your API reference:** https://www.npmjs.com/package/use-stellar

---

### Guidelines

- You must be assigned to this issue before starting work
- Do not open a pull request before you are assigned — unassigned PRs will be closed without review
- Do not open a draft PR to ask questions — ask in the issue comments
- PR description must include `Closes #[issue number]`
