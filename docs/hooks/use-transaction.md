# useTransaction

> Fetches a Stellar transaction from the ledger by its hash and optionally watches for its status updates.

## Installation

```bash
npm install use-stellar @stellar/stellar-sdk
```

## Import

```ts
import { useTransaction } from "use-stellar"
```

## Basic usage

> The simplest way to look up a transaction by its hash.

```tsx
import { useTransaction } from "use-stellar"

function Example() {
  const { transaction, loading, error } = useTransaction({ hash: "abc123..." })

  if (loading) return <p>Loading...</p>
  if (error) return <p>Error: {error.message}</p>

  return <pre>{JSON.stringify(transaction, null, 2)}</pre>
}
```

## Parameters

> This hook takes two parameters: the transaction hash (required) and whether to watch for status updates (optional).

| Parameter | Type      | Required | Default | Description                       |
|-----------|-----------|----------|---------|-----------------------------------|
| `hash`    | `string \| null` | Yes      | —       | The transaction hash to look up   |
| `watch`   | `boolean` | No       | `false` | When true, keeps polling until success or failure |

## Return values

> The hook returns four values in this exact order.

| Property  | Type                     | Description                                                 |
|-----------|--------------------------|-----------------------------------------------------------|
| `transaction` | `TransactionResult \| null` | The transaction details or null if not found/loading |
| `loading`   | `boolean`              | `true` while the request is in flight                     |
| `error`     | `StellarError \| null` | The error message if the request failed, otherwise `null` |
| `refetch`   | `() => void`           | Call this to manually re-run the request                    |

## Examples

### Example 1 — look up a transaction

```tsx
import { useTransaction } from "use-stellar"

const { transaction, loading, error } = useTransaction({ hash: "abc123..." })

if (loading) return <p>Checking status...</p>
if (error) return <p>Failed: {error.message}</p>

return <pre>{JSON.stringify(transaction, null, 2)}</pre>
```

### Example 2 — watch until confirmed

```tsx
import { useTransaction } from "use-stellar"

function TrackPayment() {
  const { transaction, loading, error } = useTransaction({
    hash: "abc123...",
    watch: true
  })

  if (loading) return <p>Waiting for confirmation...</p>
  if (error) return <p>Error: {error.message}</p>

  return (
    <div>
      <p>Status: {transaction?.status}</p>
      <button onClick={() => window.location.reload()}>Refresh</button>
    </div>
  )
}
```

### Example 3 — chain with useSendPayment

```tsx
import { useSendPayment, useTransaction } from "use-stellar"

function SendAndTrack() {
  const { data: payment, refetch: sendPayment } = useSendPayment({
    source: "GBTC7...",
    destination: "GCNY2...",
    amount: "100",
    asset: "USDC"
  })

  const { transaction, loading, error } = useTransaction({
    hash: payment?.transactionHash,
    watch: true
  })

  if (loading) return <p>Sending payment...</p>
  if (error) return <p>Payment failed: {error.message}</p>

  return (
    <div>
      <p>Payment sent! Transaction: {transaction?.hash}</p>
      <p>Status: {transaction?.status}</p>
    </div>
  )
}
```

## TypeScript

```ts
interface UseTransactionReturn {
  transaction: TransactionResult | null
  loading: boolean
  error: StellarError | null
  refetch: () => void
}
```

## Common errors

| Error message            | Cause                                       | Fix                                         |
|--------------------------|---------------------------------------------|---------------------------------------------|
| `"Transaction not found"` | Invalid or non-existent hash                | Verify the hash is correct and exists on testnet |
| `"Wallet not connected"`  | No wallet connected before calling the hook | Connect a wallet using `useWallet` first    |
| `"Network error"`         | Horizon server issue or network problem     | Check network connection and try again      |

## Notes

- When `watch: true`, the hook polls every 3 seconds until the transaction reaches a terminal state (`success` or `failed`)
- `null` hash value will immediately return `{ transaction: null, loading: false, error: null, refetch: () => {} }`
- The hook automatically handles 404 responses (transaction not found) and treats them as `not_found` status

## Related hooks

- [`useSendPayment`](./use-send-payment.md) — use this hook to send payments you want to track
- [`useTransactionHistory`](./use-transaction-history.md) — view all transactions for an account