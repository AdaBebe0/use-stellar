# Add usage example to README for `useSendPayment`

**Points:** 5
**Estimated time:** 1 day

## Context

The `useSendPayment` hook is one of the primary entry points developers interact with when integrating payment functionality into their applications. While the API surface may be straightforward for contributors already familiar with the codebase, new consumers often rely heavily on README examples to understand the expected usage pattern.

Currently, the documentation does not provide a complete example demonstrating:

* Which props or configuration values are required.
* How to handle loading and error states.
* The typical lifecycle of initiating and completing a payment.
* Recommended integration patterns for applications consuming the hook.

This creates unnecessary onboarding friction and increases the likelihood of incorrect implementations or repeated support questions.

A concise, production-like example in the README dramatically improves developer experience. Good documentation behaves like a map left by a previous traveler: it turns exploration into navigation.

The goal of this task is to provide a minimal but complete example that developers can copy, paste, and adapt immediately.

---

## Before you start

Pull the latest changes from `main` before creating your branch:

```bash
git checkout main
git pull --rebase origin main
git checkout -b docs/send-payment-readme
```

---

## What needs doing

Update the relevant README file with a minimal usage example for `useSendPayment`.

The example should demonstrate:

* Importing the hook correctly.
* Supplying all required props or configuration values.
* Triggering a payment action.
* Handling loading states.
* Handling successful responses.
* Handling failures or errors gracefully.

The example should represent the most common integration path rather than an advanced or edge-case scenario.

An ideal reader should be able to copy the example directly into a project and have it work with minimal modification.

The documentation should include enough surrounding explanation to answer the following questions:

* What inputs are required?
* What does the hook return?
* How should consumers handle errors?
* What does the expected user flow look like?

For example, a typical flow may resemble:

1. Initialize the hook with required configuration.
2. Trigger payment submission from a button click or form submission.
3. Display loading state while the request is in progress.
4. Handle success response.
5. Display or log errors if the operation fails.

---
# Improve inline documentation in `StellarProvider`

**Points:** 2
**Estimated time:** 1 day

## Context

`StellarProvider` is one of the foundational pieces of the SDK and serves as the entry point for establishing application-wide access to Stellar configuration, network state, and related functionality.

Because provider components sit at the root of an application's component tree, developers often interact with them before using any hooks or higher-level abstractions exposed by the package. Missing or unclear documentation at this layer can lead to confusion around initialization order, required props, provider nesting, and component lifecycle expectations.

Currently, some of the inline documentation inside `packages/core/src/context/StellarProvider.tsx` does not fully explain:

* Which props are required versus optional.
* The purpose of individual configuration values.
* When the provider initializes resources.
* How consumers are expected to use the provider within their application lifecycle.
* Any assumptions made by hooks or components that depend on the provider.

Improving the inline documentation reduces onboarding time for contributors and helps prevent incorrect usage patterns without requiring developers to inspect implementation details.

Good provider documentation acts like a flight manual for the rest of the SDK: most users only need it once, but when they do need it, precision matters.

---

## Before you start

Pull the latest changes from `main` before creating your branch:

```bash
git checkout main
git pull --rebase origin main
git checkout -b docs/stellarprovider-comments
```

---

## What needs doing

Open:

```text
packages/core/src/context/StellarProvider.tsx
```

Review all existing comments, JSDoc blocks, and inline documentation related to:

* Provider props
* Initialization logic
* Context creation
* Mount and unmount behavior
* Side effects and cleanup logic
* Expected usage patterns for consumers

Improve comments where additional context would help future maintainers understand:

### Required props

Clarify:

* Which props are mandatory.
* Why those props are required.
* What happens if they are omitted or invalid.
* Whether default values exist.

Example topics might include:

* Network configuration
* RPC endpoints
* Wallet configuration
* Environment-specific settings

---

### Lifecycle behavior

Document the provider lifecycle clearly, including:

* What happens during initial mount.
* Which resources or connections are initialized.
* Whether any subscriptions, listeners, or polling mechanisms are created.
* What cleanup occurs during unmount.
* Whether consumers should expect values to change during runtime.

This is particularly useful for contributors investigating initialization bugs or provider ordering issues.

---

### Consumer expectations

Document assumptions made by downstream consumers, such as:

* Hooks that require `StellarProvider` to exist higher in the tree.
* Errors thrown when the provider is missing.
* Recommended placement within the application's root component hierarchy.

Examples:

```tsx
<App>
  <StellarProvider>
    <YourApplication />
  </StellarProvider>
</App>
```

If there are provider ordering requirements relative to other context providers, document those as well.

---

## Important constraints

This task is documentation-only.

Do not:

* Refactor implementation logic
* Rename variables or props
* Modify initialization behavior
* Change provider APIs
* Introduce new functionality
* Alter component rendering behavior

The generated JavaScript output and runtime behavior should remain identical before and after the change.

The only modifications in this pull request should be comments, JSDoc improvements, and explanatory documentation.

---

## Acceptance criteria

* [ ] Inline documentation in `StellarProvider.tsx` has been reviewed and improved
* [ ] Required props are clearly documented
* [ ] Provider lifecycle behavior is explained
* [ ] Consumer usage expectations are documented
* [ ] No runtime behavior changes have been introduced
* [ ] No API changes have been introduced
* [ ] Type checking and linting continue to pass

---

## How to verify

Since this task does not change behavior, verification primarily consists of ensuring the documentation changes do not accidentally introduce formatting or linting issues.

Run:

```bash
pnpm lint
pnpm typecheck
pnpm test
```

Verify that:

* No implementation code changed unintentionally.
* The provider behaves exactly as before.
* Documentation formatting is consistent with the rest of the repository.

A useful sanity check is reviewing the diff to confirm it contains only comments and documentation updates.

---

## Commit guidelines

```bash
git add packages/core/src/context/StellarProvider.tsx
git commit -m "docs(StellarProvider): clarify props and lifecycle"
git push origin docs/stellarprovider-comments
```

One commit is sufficient for this task.

---

## Branch / Commit

### Suggested branch

```text
docs/stellarprovider-comments
```

### Commit example

```text
docs(StellarProvider): clarify props and lifecycle
```

---

## Pull Request notes

Include a short summary covering:

* Which areas of the provider were documented.
* Which lifecycle stages were clarified.
* Confirmation that no behavioral changes were introduced.

Before pushing your changes, ensure your branch is up to date:

```bash
git pull --rebase origin main
```

Resolve any conflicts locally before opening the pull request.

## Important constraints

Keep the example intentionally small and focused.

Do not:

* Introduce advanced configuration options.
* Demonstrate uncommon edge cases.
* Include unrelated APIs or hooks.
* Add framework-specific abstractions unless already required by the package.
* Add examples that depend on internal implementation details.

The objective is clarity, not completeness.

A developer reading the README for the first time should understand the happy path within a few minutes.

---

## Demo compatibility requirement

The example provided in the README must compile successfully inside `packages/demo`.

Documentation examples that drift from actual implementation become liabilities over time because developers trust examples more than type definitions.

To prevent documentation rot:

* Copy the example into the demo application.
* Verify that imports resolve correctly.
* Verify that TypeScript passes without modification.
* Verify that the example still works after any recent API changes.

If the README example requires additional setup or wrapper components, document those requirements explicitly.

---

## Acceptance criteria

* [ ] README updated with a minimal `useSendPayment` example
* [ ] Example demonstrates required props or configuration values
* [ ] Example demonstrates loading state handling
* [ ] Example demonstrates error handling
* [ ] Example demonstrates the typical payment flow
* [ ] Example compiles successfully inside `packages/demo`
* [ ] TypeScript passes without errors
* [ ] Documentation formatting renders correctly on GitHub

---

## How to verify

Run the demo application locally:

```bash
pnpm dev
```

Verify that:

* The example compiles successfully.
* The example can be executed without runtime errors.
* Loading states behave correctly.
* Errors are displayed or handled appropriately.
* The documented flow matches actual hook behavior.

Run the project's verification commands:

```bash
pnpm lint
pnpm typecheck
pnpm test
```

All checks should pass without introducing unrelated changes.

---

## Commit guidelines

```bash
git add README.md packages/demo
git commit -m "docs(readme): add useSendPayment example"
git push origin docs/send-payment-readme
```

One commit is sufficient for this task unless maintainers request documentation and demo verification in separate commits.

---

## Branch / Commit

### Suggested branch

```text
docs/send-payment-readme
```

### Commit example

```text
docs(readme): add useSendPayment example
```

---

## Pull Request notes

Include a short summary covering:

* The README sections updated.
* The scenarios demonstrated in the example.
* Confirmation that the example compiles successfully inside `packages/demo`.

Before pushing your changes, ensure your branch is up to date:

```bash
git pull --rebase origin main
```

Resolve conflicts locally before opening the pull request.

---

## Resources

* Existing README examples in the repository
* Existing examples inside `packages/demo`
* TypeScript definitions for `useSendPayment`
* Contribution guidelines for documentation changes
