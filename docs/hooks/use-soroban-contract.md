# useSorobanContract

Calls a read-only function on a Soroban smart contract and returns the decoded result.

> **Write calls are not yet implemented.** This hook currently supports read-only simulation only. If you need to submit a write transaction, follow [issue #105](https://github.com/RaceeyXo/use-stellar/issues/105) for updates.

## Installation

```bash
npm install use-stellar @stellar/stellar-sdk
```

## Import

```ts
import { useSorobanContract } from "use-stellar"
```

## Basic usage

```tsx
import { useSorobanContract } from "use-stellar"

function AuctionStatus() {
  const contractId = "CCLTROGWNZ5LGXU57UUYNIDMN2TG4JF5J3GUEO5TWCSAJHKD2QT73J4N"
  const { data, loading, error } = useSorobanContract({
    contractId,
    method: "get_state",
    args: [],
  })

  if (loading) return <p>Loading auction state...</p>
  if (error) return <p>Error: {error.message}</p>

  return <pre>{JSON.stringify(data, null, 2)}</pre>
}
```

## Parameters

| Parameter    | Type      | Required | Default | Description                                               |
| ------------ | --------- | -------- | ------- | --------------------------------------------------------- |
| `contractId` | `string`  | Yes      | —       | The Soroban contract ID (starts with `C`, 56 characters). |
| `method`     | `string`  | Yes      | —       | The name of the contract function to call.                |
| `args`       | `unknown[]` | No     | `[]`    | Arguments passed to the contract function.                |

### Contract IDs

A Soroban contract ID is a 56-character string that starts with `C`. It uses the same base-32 encoding as Stellar public keys.

You can find a deployed contract ID on testnet by:
- Checking the project's deployment artifacts (e.g., `contracts/deployed.testnet.json`)
- Looking up the deploy transaction on [stellar.expert](https://stellar.expert)
- Running the deploy script yourself and capturing the output

### Argument types

The hook converts JavaScript values to Soroban `ScVal` automatically:

| JavaScript type | Soroban ScVal       |
| --------------- | ------------------- |
| `string`        | `scvString`         |
| `boolean`       | `scvBool`           |
| `number` (int)  | `scvU64` / `scvI128` |
| `xdr.ScVal`     | Passed through      |

For complex types (addresses, vectors, maps), pass an `xdr.ScVal` instance directly.

## Return values

| Property  | Type                          | Description                                                |
| --------- | ----------------------------- | ---------------------------------------------------------- |
| `data`    | `unknown \| null`             | The decoded return value. `null` while loading or on error. |
| `loading` | `boolean`                     | `true` while the simulation is in flight.                  |
| `error`   | `StellarError \| null`        | The error if the simulation failed, otherwise `null`.      |
| `refetch` | `() => void`                  | Call this to manually re-run the simulation.               |

## Examples

### Example 1 — reading a contract counter

```tsx
import { useSorobanContract } from "use-stellar"

function CounterDisplay() {
  const { data, loading } = useSorobanContract({
    contractId: "CCLTROGWNZ5LGXU57UUYNIDMN2TG4JF5J3GUEO5TWCSAJHKD2QT73J4N",
    method: "counter",
    args: [],
  })

  if (loading) return <p>Loading...</p>

  return <p>Counter value: {String(data ?? "N/A")}</p>
}
```

### Example 2 — passing arguments to a contract function

```tsx
function UserBalance({ userId }: { userId: string }) {
  const { data, loading } = useSorobanContract({
    contractId: "CCLTROGWNZ5LGXU57UUYNIDMN2TG4JF5J3GUEO5TWCSAJHKD2QT73J4N",
    method: "balance_of",
    args: [userId],
  })

  if (loading) return <p>Loading...</p>

  return <p>Balance: {String(data ?? "N/A")}</p>
}
```

### Example 3 — handling errors and retrying

```tsx
function WithRetry() {
  const { data, error, refetch } = useSorobanContract({
    contractId: "CCLTROGWNZ5LGXU57UUYNIDMN2TG4JF5J3GUEO5TWCSAJHKD2QT73J4N",
    method: "get_state",
    args: [],
  })

  if (error) {
    return (
      <div>
        <p>Something went wrong: {error.message}</p>
        <button onClick={refetch}>Try again</button>
      </div>
    )
  }

  return <p>{JSON.stringify(data)}</p>
}
```

## TypeScript

```ts
interface UseSorobanContractReturn {
  data: unknown | null
  loading: boolean
  error: StellarError | null
  refetch: () => void
}
```

## Common errors

| Error message                          | Cause                                                | Fix                                                                |
| -------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------ |
| `"Invalid contract ID ..."`           | The contract ID does not match the C-prefixed format. | Check the contract ID is 56 characters and starts with `C`.       |
| `"RPC simulation error ..."`          | The Soroban RPC returned an error during simulation.  | Verify the contract is deployed on the current network.            |
| `"Unsupported argument type: ..."`    | A non-integer number or object was passed as an arg.  | Pass an `xdr.ScVal` directly for complex types.                   |
| `"Argument conversion failed: ..."`   | One of the arguments could not be converted to ScVal. | Check the type and format of each argument.                        |

## Notes

- This hook performs a **read-only simulation**. It does not submit a transaction and does not require a wallet connection.
- The hook automatically calls the contract function when the component mounts and re-calls if `contractId`, `method`, or `args` change.
- Write-call support is tracked in [issue #105](https://github.com/RaceeyXo/use-stellar/issues/105).

## Related hooks

- [`useWallet`](./use-wallet.md) — connect a wallet before submitting write transactions.
- [`useSendPayment`](./use-send-payment.md) — send a Stellar payment.
