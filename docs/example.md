# Hook Documentation Template

This file is the **canonical template** for every hook page in `docs/hooks/`.
It exists so that every hook is documented the same way — same sections, same
order, same tone. A developer who reads one hook page should feel instantly at
home on the next.

## How to use this template

1. Copy this file to `docs/hooks/use-your-hook.md`.
2. Replace every `[placeholder]` and example with the real content for your hook.
3. Delete this "How to use this template" section and every `> Guidance:` note —
   they must never appear in a finished page.
4. Keep every remaining section heading, even if a section is short. If a section
   genuinely does not apply, say so in one sentence rather than deleting it.

> Guidance notes are quoted like this throughout the template. They tell you what
> a section is for and what "good" looks like. **Remove them before you commit.**

### Rules that apply to every page

- Write for a React developer who has never touched a blockchain. Never assume
  knowledge of Stellar, Horizon, Soroban, or wallets.
- Every code example must be complete and copy-pasteable — no `// ...`, no
  `<YourComponent>`, no fake imports.
- Every example must use **testnet**. Never hardcode a mainnet address or
  contract ID.
- Use the second person — "you", not "the developer".
- Short sentences. One idea per sentence.
- If something can go wrong, document it in the **Common errors** table.
- Never use the words "simple" or "easy".
- Confirm every signature against the source in `packages/core/src/hooks/` and
  the npm docs: https://www.npmjs.com/package/use-stellar. If the README and the
  source disagree, the source wins.

---

<!-- Everything below this line is the template. Copy from here down. -->

# useHookName

> One sentence that says exactly what this hook does. Start with a verb, e.g.
> "Fetches the XLM or token balance of a Stellar account."

## Installation

> Guidance: keep this identical across pages unless the hook needs an extra
> dependency. If it does, add it here and explain why.

```bash
npm install use-stellar @stellar/stellar-sdk
```

## Import

```ts
import { useHookName } from "use-stellar"
```

## Basic usage

> Guidance: the shortest complete component that demonstrates the hook. It must
> run as-is inside an app already wrapped in `StellarProvider`.

```tsx
import { useHookName } from "use-stellar"

function Example() {
  const { data, loading, error } = useHookName()

  if (loading) return <p>Loading...</p>
  if (error) return <p>Error: {error}</p>

  return <p>{data}</p>
}
```

## Parameters

> Guidance: one row per option, using the exact type from the source. If the hook
> takes no parameters, replace the whole table with the sentence:
> "This hook takes no parameters."

| Parameter | Type      | Required | Default | Description                       |
| --------- | --------- | -------- | ------- | --------------------------------- |
| `param1`  | `string`  | Yes      | —       | What this parameter controls.     |
| `param2`  | `boolean` | No       | `false` | What turning this on or off does. |

## Return values

> Guidance: document every property the hook returns, in the order it appears in
> the return type. Match the exact type from the source.

| Property  | Type             | Description                                                 |
| --------- | ---------------- | ---------------------------------------------------------- |
| `data`    | `T \| null`      | The result. `null` while loading or if an error occurred.  |
| `loading` | `boolean`        | `true` while the request is in flight.                     |
| `error`   | `string \| null` | The error message if the request failed, otherwise `null`. |
| `refetch` | `() => void`     | Call this to manually re-run the request.                  |

## Examples

> Guidance: at least three examples. The first is the common case, the last is
> always error handling. Each block must be complete and copy-pasteable.

### Example 1 — the common case

Describe in one line what this example shows.

```tsx
const { data, loading } = useHookName()
```

### Example 2 — with options

Describe in one line what changes when you pass options.

```tsx
const { data } = useHookName({ param2: true })
```

### Example 3 — handling errors and retrying

```tsx
function WithRetry() {
  const { data, error, refetch } = useHookName()

  if (error) {
    return (
      <div>
        <p>Something went wrong: {error}</p>
        <button onClick={refetch}>Try again</button>
      </div>
    )
  }

  return <p>{data}</p>
}
```

## TypeScript

> Guidance: paste the real return interface from the source so TypeScript users
> can see the exact shape at a glance.

```ts
interface HookNameReturn {
  data: ResultType | null
  loading: boolean
  error: string | null
  refetch: () => void
}
```

## Common errors

> Guidance: every hook can fail. List the failures a real developer will hit,
> what causes each, and the exact fix. Never leave this table empty.

| Error message            | Cause                                       | Fix                                         |
| ------------------------ | ------------------------------------------- | ------------------------------------------- |
| `"Wallet not connected"` | The hook ran before a wallet was connected. | Call `connect()` from `useWallet` first.    |
| `"Account not found"`    | The address is not funded on this network.  | Fund the account on testnet with Friendbot. |

## Notes

> Guidance: caveats, gotchas, and anything important that does not fit above.
> Remove this section only if there is genuinely nothing to add.

- Note anything surprising about timing, caching, or network behaviour here.

## Related hooks

- [`useRelatedHook`](./use-related-hook.md) — one line on why it is related.
