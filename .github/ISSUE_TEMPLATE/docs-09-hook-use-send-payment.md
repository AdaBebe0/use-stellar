---
name: "Docs 09 — useSendPayment hook"
about: Write docs/hooks/use-send-payment.md following the example.md template
title: "docs: add useSendPayment hook reference"
labels: documentation
---

## Write the `useSendPayment` hook documentation

**Complexity:** Medium (150 points)
**Estimated time:** 1 to 1.5 days
**Depends on:** Docs 01 (template must exist)

---

### Context

`useSendPayment` moves funds — it is the highest-stakes hook in the library. Its
documentation must be precise about amount formatting, the signing flow, error
handling, and the mainnet warning, because mistakes here cost real money.

---

### Scope — file to create

```
docs/hooks/use-send-payment.md
```

This file must follow `docs/example.md` exactly.

---

### What this file must contain

- Why `amount` must be a string and not a number
- The full `SendPaymentOptions` interface documented field by field
- Explanation of what happens when Freighter opens
- Examples: send XLM, send USDC with a memo, a full form with state management,
  handling rejection
- An error table covering all common failure modes
- A note about calling `reset()` before a new send to clear previous state
- A warning about never using mainnet addresses in testnet examples

---

### Suggested execution

```bash
git checkout main && git pull --rebase origin main
git checkout -b docs/hook-use-send-payment
# write docs/hooks/use-send-payment.md
git commit -m "docs(hooks): add useSendPayment reference"
```

---

### Acceptance criteria

- [ ] `docs/hooks/use-send-payment.md` exists and follows `example.md` exactly
- [ ] Has a parameters table, a return values table, at least 3 examples, and an error table
- [ ] Documents the full `SendPaymentOptions` interface and the `reset()` behaviour
- [ ] Includes the mainnet warning and explains why `amount` is a string
- [ ] Every code example is complete, copy-pasteable, and testnet only
- [ ] No placeholder text or TODO comments
- [ ] PR description includes `Closes #[issue number]`

---

### Important — read before you start

- **Always make sure your CI/CD passes** before requesting review. A red pipeline will not be reviewed.
- **Pull before you push** — run `git pull --rebase origin main` so your branch is up to date and you avoid conflicts.
- **Do not touch or delete any file that is not part of your designated task.** This issue only creates `docs/hooks/use-send-payment.md`.
- **Use `docs/example.md` as your reference** for structure and formatting.
- **Use the npm documentation as your API reference:** https://www.npmjs.com/package/use-stellar
- If the npm README and the source disagree, the source wins — confirm signatures in `packages/core/src/hooks/`.

---

### Guidelines

- You must be assigned to this issue before starting work
- Do not open a pull request before you are assigned — unassigned PRs will be closed without review
- Do not open a draft PR to ask questions — ask in the issue comments
- PR description must include `Closes #[issue number]`
