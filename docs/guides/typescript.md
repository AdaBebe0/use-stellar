# TypeScript guide

`use-stellar` is written in TypeScript and exports type definitions for every
hook, option bag, return value, error, and utility. This guide shows how to use
those types to build type-safe Stellar dApps — from configuring the provider to
writing custom hooks that compose several `use-stellar` hooks together.

---

## Why types matter

Blockchain SDKs deal with raw Horizon responses, XDR envelopes, and numeric
amounts stored as strings. A single mistyped property can produce a runtime
error that is hard to debug. `use-stellar` types catch these mistakes at compile
time:

- The `Asset` type prevents you from passing a raw string where an issued-asset
  object is required.
- The `SendPaymentOptions` interface ensures you provide every field the
  transaction builder needs before the wallet ever opens.
- The `StellarError` class exposes a discriminated `code` property so you can
  branch on specific failure reasons without string-matching on messages.

Every public hook, option bag, and return value is typed. You get autocomplete,
inline documentation, and refactoring safety in any editor that supports
TypeScript.

---

## Type-safe provider setup

The `StellarProvider` accepts a single `network` prop whose type is the union
`"testnet" | "mainnet"`. TypeScript rejects any other string at compile time.

```tsx
import { StellarProvider } from "use-stellar"

// ✅ OK — the union only accepts these two literals
<StellarProvider network="testnet">
  <App />
</StellarProvider>

// ❌ Type error
<StellarProvider network="futurenet">
  <App />
</StellarProvider>
```

If you store the network value in a variable, annotate it with the
`StellarNetwork` type so that refactoring tools catch renamed values:

```ts
import type { StellarNetwork } from "use-stellar"

const activeNetwork: StellarNetwork =
  process.env.NEXT_PUBLIC_STELLAR_NETWORK === "mainnet" ? "mainnet" : "testnet"
```

The `NetworkConfig` interface describes the resolved configuration (Horizon URL,
Soroban RPC URL). You rarely construct one yourself — the provider builds it
from the `network` prop — but you can read it from `useNetwork`:

```tsx
import { useNetwork } from "use-stellar"
import type { NetworkConfig } from "use-stellar"

function DebugPanel() {
  const { networkConfig }: { networkConfig: NetworkConfig } = useNetwork()

  return (
    <pre>
      Horizon: {networkConfig.horizonUrl}{"\n"}
      Soroban: {networkConfig.sorobanUrl}
    </pre>
  )
}
```

---

## Working with hook return types

Every `use-stellar` hook returns a typed object. Instead of annotating every
destructured variable by hand, let TypeScript infer the shape from the hook
call:

```tsx
import { useBalance } from "use-stellar"

function BalanceDisplay() {
  // TypeScript infers:
  //   balance: string | null
  //   loading: boolean
  //   error: StellarError | null
  const { balance, loading, error } = useBalance({ asset: "XLM" })

  if (loading) return <p>Loading…</p>
  if (error) return <p>{error.message}</p>

  return <p>{balance} XLM</p>
}
```

When you need to pass a hook's return value through a component boundary, import
the dedicated return-type interface:

```tsx
import { useBalance } from "use-stellar"
import type { UseBalanceReturn } from "use-stellar"

interface Props {
  balanceData: UseBalanceReturn
}

function BalanceCard({ balanceData }: Props) {
  // balanceData.balance, balanceData.loading, balanceData.error, etc.
}
```

Every hook exports its own return interface:

| Hook                  | Return-type interface           |
| --------------------- | ------------------------------- |
| `useWallet`           | `UseWalletReturn`               |
| `useBalance`          | `UseBalanceReturn`              |
| `useAccount`          | `UseAccountReturn`              |
| `useSendPayment`      | `UseSendPaymentReturn`          |
| `useTransaction`      | `UseTransactionReturn`          |
| `useNetwork`          | `UseNetworkReturn`              |
| `useAsset`            | `UseAssetReturn`                |
| `useSorobanContract`  | `UseSorobanContractReturn`      |
| `usePayments`         | `UsePaymentsReturn`             |
| `useClaimableBalance` | `UseClaimableBalanceReturn`     |

Each return interface includes the `StellarError | null` error type rather than
a raw string. You can branch on `error.code` for fine-grained handling.

---

## Asset types

The `Asset` type is a discriminated union of the native asset and issued assets:

```ts
type Asset = "XLM" | { code: string; issuer: string }
```

This means TypeScript narrows the shape automatically when you check which
variant you have:

```tsx
import type { Asset } from "use-stellar"

function formatAsset(asset: Asset): string {
  if (asset === "XLM") {
    // TypeScript knows `asset` is the string "XLM" here
    return "XLM (native)"
  }

  // TypeScript narrows to { code: string; issuer: string }
  return `${asset.code} (${asset.issuer.slice(0, 4)}…)`
}
```

The same narrowing works when you pass an `Asset` to a hook. `useBalance`
accepts an optional `asset` parameter typed as `Asset`:

```tsx
import { useBalance } from "use-stellar"

// Native XLM
const xlm = useBalance({ asset: "XLM" })

// Issued asset — replace with a real testnet issuer
const usdc = useBalance({
  asset: {
    code: "USDC",
    issuer: "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5",
  },
})
```

The library also exports narrower helper types when you need them:

- `NativeAsset` — the literal `"XLM"`
- `IssuedAsset` — `{ code: string; issuer: string }`
- `AssetMetadata` — extends `IssuedAsset` with `verified` and `timestamp` fields

---

## Balance types

The `Balance` type is another discriminated union. A balance entry can be native
XLM, an issued asset, or a liquidity pool share:

```ts
type Balance =
  | { asset: "XLM"; balance: string }
  | { asset: { code: string; issuer: string }; balance: string; limit: string }
  | { asset: "liquidity_pool_shares"; balance: string; liquidityPoolId: string }
```

Use this to render different balance rows with type safety:

```tsx
import { useBalance } from "use-stellar"
import type { Balance } from "use-stellar"

function BalanceRow({ entry }: { entry: Balance }) {
  const label =
    entry.asset === "XLM"
      ? "XLM"
      : entry.asset === "liquidity_pool_shares"
        ? `Pool ${entry.liquidityPoolId.slice(0, 8)}…`
        : entry.asset.code

  return (
    <tr>
      <td>{label}</td>
      <td>{entry.balance}</td>
    </tr>
  )
}

function BalancesTable() {
  const { balances } = useBalance()

  return (
    <table>
      <tbody>
        {balances.map((b, i) => (
          <BalanceRow key={i} entry={b} />
        ))}
      </tbody>
    </table>
  )
}
```

---

## Account types

`useAccount` returns an `AccountInfo` object or `null`. The `AccountInfo`
interface includes nested types for thresholds and signers:

```ts
interface AccountInfo {
  address: string
  sequence: string
  balances: Balance[]
  subentryCount: number
  thresholds: {
    lowThreshold: number
    medThreshold: number
    highThreshold: number
  }
  signers: {
    key: string
    weight: number
    type: string
  }[]
}
```

Because `balances` inside `AccountInfo` uses the same `Balance` union, you can
reuse balance-rendering logic across `useBalance` and `useAccount`:

```tsx
import { useAccount } from "use-stellar"

function AccountDetails() {
  const { account, loading, error } = useAccount()

  if (loading || !account) return <p>Loading…</p>
  if (error) return <p>{error.message}</p>

  return (
    <div>
      <p>Sequence: {account.sequence}</p>
      <p>Signers: {account.signers.length}</p>
      <ul>
        {account.balances.map((b, i) => (
          <li key={i}>{balanceLabel(b)}</li>
        ))}
      </ul>
    </div>
  )
}

function balanceLabel(b: Balance): string {
  if (b.asset === "XLM") return `XLM: ${b.balance}`
  if (b.asset === "liquidity_pool_shares") return `Pool share: ${b.balance}`
  return `${b.asset.code}: ${b.balance}`
}
```

---

## Wallet types

### WalletState

`WalletState` describes the raw wallet context stored in `StellarProvider`. You
rarely use it directly — `useWallet` returns `UseWalletReturn` which extends
`WalletState` with action methods — but it is useful when you need to pass the
shape through a context or a reducer:

```ts
interface WalletState {
  connected: boolean
  connecting: boolean
  address: string | null
  network: StellarNetwork | null
  wallet: WalletType | null
  error: StellarError | null
  walletNetwork: StellarNetwork | null
  walletName: string | null
}
```

### UseWalletReturn

`UseWalletReturn` extends `WalletState` with the `connect`, `disconnect`,
`refreshWalletNetwork` methods and the `isNetworkMismatch` boolean. This is the
type you work with in practice:

```tsx
import { useWallet } from "use-stellar"
import type { UseWalletReturn } from "use-stellar"

function WalletGate({ children, wallet }: { children: React.ReactNode; wallet: UseWalletReturn }) {
  if (!wallet.connected) {
    return (
      <button onClick={() => wallet.connect("freighter")} disabled={wallet.connecting}>
        Connect Freighter
      </button>
    )
  }

  return <>{children}</>
}
```

### WalletType

`WalletType` is the union of supported wallet identifiers:

```ts
type WalletType = "freighter" | "lobstr" | "albedo" | "rabet"
```

Use it when you build a wallet selector component:

```tsx
import type { WalletType } from "use-stellar"

interface WalletOption {
  type: WalletType
  label: string
}

const WALLETS: WalletOption[] = [
  { type: "freighter", label: "Freighter" },
  { type: "lobstr", label: "LOBSTR" },
]
```

### WalletAdapter

`WalletAdapter` is the interface that every wallet integration implements. You
only need it if you are writing a custom wallet adapter:

```ts
interface WalletAdapter {
  metadata: WalletAdapterMetadata
  isAvailable: () => Promise<boolean>
  connect: (network: StellarNetwork) => Promise<WalletConnection>
  disconnect?: () => void | Promise<void>
  getNetworkDetails: (network: StellarNetwork) => Promise<WalletNetworkDetails>
  signTransaction: (xdr: string, options: SignTransactionOptions) => Promise<string>
}
```

---

## Error handling with types

Every hook exposes `error` as `StellarError | null`. `StellarError` extends the
native `Error` class and adds a `code` property typed as `StellarErrorCode`:

```ts
class StellarError extends Error {
  readonly code: StellarErrorCode
  readonly raw?: unknown
}
```

`StellarErrorCode` is a union of string literals:

```ts
type StellarErrorCode =
  | "WALLET_NOT_INSTALLED"
  | "WALLET_NOT_CONNECTED"
  | "WALLET_REQUEST_REJECTED"
  | "WRONG_NETWORK"
  | "ACCOUNT_NOT_FOUND"
  | "INSUFFICIENT_BALANCE"
  | "NO_TRUSTLINE"
  | "TRANSACTION_FAILED"
  | "RATE_LIMITED"
  | "VALIDATION_ERROR"
  | "NETWORK_ERROR"
  | "UNKNOWN"
```

Because `code` is a discriminated union, TypeScript narrows the error type when
you switch on it:

```tsx
import { useSendPayment } from "use-stellar"

function SendForm() {
  const { send, error, loading } = useSendPayment()

  if (error) {
    switch (error.code) {
      case "WALLET_NOT_CONNECTED":
        return <p>Connect your wallet before sending.</p>
      case "INSUFFICIENT_BALANCE":
        return <p>Your balance is too low for this payment.</p>
      case "NO_TRUSTLINE":
        return <p>The destination does not trust this asset.</p>
      case "RATE_LIMITED":
        return <p>Horizon is rate-limiting requests. Wait and try again.</p>
      default:
        return <p>Payment failed: {error.message}</p>
    }
  }

  return (
    <button onClick={() => send({ to: "G…", asset: "XLM", amount: "1" })}>Send</button>
  )
}
```

### Type guards and helpers

The library exports type guards and factory helpers for working with errors
outside of hooks:

```ts
import {
  StellarError,
  isStellarError,
  toStellarError,
  createStellarError,
  isStellarErrorCode,
} from "use-stellar"
```

- `isStellarError(value)` — type guard that returns `true` for `StellarError`
  instances and plain objects that carry a recognized `code`. Use this in
  try-catch blocks where the thrown value is `unknown`:

  ```ts
  try {
    await riskyOperation()
  } catch (err: unknown) {
    if (isStellarError(err)) {
      console.error(err.code, err.message)
    } else {
      console.error("Unexpected error:", err)
    }
  }
  ```

- `toStellarError(unknown)` — normalises any thrown value into a `StellarError`.
  Horizon 404s become `ACCOUNT_NOT_FOUND`, network failures become
  `NETWORK_ERROR`, and anything unrecognised becomes `UNKNOWN`.

- `createStellarError(code)` — builds a `StellarError` from a `StellarErrorCode`
  with the default human-readable message.

- `isStellarErrorCode(value)` — type guard that checks whether a string is one
  of the known error codes.

---

## Transaction and payment types

### SendPaymentOptions

The `send` function returned by `useSendPayment` accepts a `SendPaymentOptions`
object:

```ts
interface SendPaymentOptions {
  to: string
  asset: Asset
  amount: string
  memo?: string
}
```

TypeScript ensures you provide all required fields:

```tsx
import { useSendPayment } from "use-stellar"
import type { SendPaymentOptions } from "use-stellar"

function PaymentButton() {
  const { send, loading } = useSendPayment()

  const pay: SendPaymentOptions = {
    to: "GDLUW7G2E66W4J…",
    asset: { code: "USDC", issuer: "G…" },
    amount: "25",
    memo: "Invoice #42", // optional
  }

  return (
    <button onClick={() => send(pay)} disabled={loading}>
      Pay 25 USDC
    </button>
  )
}
```

### SendPaymentResult

The resolved value of `send()` is a `SendPaymentResult`:

```ts
interface SendPaymentResult {
  hash: string
  status: TransactionStatus
}
```

`TransactionStatus` is the union `"pending" | "success" | "failed" | "not_found"`.

### TransactionResult

`useTransaction` returns a `TransactionResult | null`:

```ts
interface TransactionResult {
  hash: string
  status: TransactionStatus
  ledger?: number
  createdAt?: string
  fee?: string
  envelope?: string
}
```

---

## Payment history types

`usePayments` returns `UsePaymentsReturn` which includes `NormalizedPayment[]`:

```ts
interface NormalizedPayment {
  id: string
  txHash: string
  type: string
  from: string
  to: string
  amount: string
  asset: Asset
  direction: "incoming" | "outgoing"
  createdAt: string
}
```

The `direction` field is the literal union `"incoming" | "outgoing"` so you can
branch on it safely:

```tsx
import { usePayments } from "use-stellar"
import type { NormalizedPayment } from "use-stellar"

function PaymentRow({ payment }: { payment: NormalizedPayment }) {
  const arrow = payment.direction === "incoming" ? "↓" : "↑"
  const amount = payment.direction === "incoming"
    ? `+${payment.amount}`
    : `-${payment.amount}`

  return (
    <tr>
      <td>{arrow} {amount}</td>
      <td>{typeof payment.asset === "string" ? payment.asset : payment.asset.code}</td>
      <td>{new Date(payment.createdAt).toLocaleDateString()}</td>
    </tr>
  )
}
```

---

## Composing custom hooks

You can build your own typed hooks that compose several `use-stellar` hooks
together. Import the return-type interfaces to keep the composition type-safe:

```tsx
import { useWallet, useBalance, useSendPayment } from "use-stellar"
import type { UseWalletReturn, UseBalanceReturn, UseSendPaymentReturn, StellarError } from "use-stellar"

interface UsePaymentFlowReturn {
  wallet: UseWalletReturn
  balance: UseBalanceReturn
  payment: UseSendPaymentReturn
  canSend: boolean
  flowError: StellarError | null
}

export function usePaymentFlow(): UsePaymentFlowReturn {
  const wallet = useWallet()
  const balance = useBalance({ asset: "XLM", watch: true })
  const payment = useSendPayment()

  const canSend = wallet.connected && balance.balance !== null && !payment.loading
  const flowError = wallet.error ?? balance.error ?? payment.error

  return { wallet, balance, payment, canSend, flowError }
}
```

---

## Type imports

All types are re-exported from the package root. Prefer `import type` so the
imports are erased at runtime and do not affect your bundle size:

```ts
import type {
  // Network
  StellarNetwork,
  NetworkConfig,

  // Wallet
  WalletState,
  WalletType,
  UseWalletReturn,
  WalletAdapter,
  WalletAdapterMetadata,
  WalletConnection,
  WalletNetworkDetails,
  SignTransactionOptions,

  // Assets
  Asset,
  NativeAsset,
  IssuedAsset,
  Balance,
  AccountInfo,

  // Transactions
  TransactionResult,
  TransactionStatus,
  SendPaymentOptions,
  SendPaymentResult,
  NormalizedPayment,

  // Soroban
  ContractCallOptions,

  // Error handling
  StellarError,
  StellarErrorCode,
  StellarErrorOptions,

  // Hook options
  UseBalanceOptions,
  UseAccountOptions,

  // Hook returns
  UseBalanceReturn,
  UseAccountReturn,
  UseSendPaymentReturn,
  UseTransactionOptions,
  UseTransactionReturn,
  UseNetworkReturn,
  UseAssetOptions,
  UseAssetReturn,
  UseSorobanContractReturn,
  UsePaymentsOptions,
  UsePaymentsReturn,
  UseClaimableBalanceOptions,
  UseClaimableBalanceReturn,
} from "use-stellar"
```

---

## Discriminated unions and narrowing

Many `use-stellar` types are designed as discriminated unions so that
TypeScript's control-flow analysis narrows the shape automatically. The most
common patterns are:

### Checking an Asset variant

```ts
function assetLabel(asset: Asset): string {
  return asset === "XLM" ? "XLM" : asset.code
}
```

### Checking a Balance variant

```ts
function balanceLabel(b: Balance): string {
  if (b.asset === "XLM") return "XLM"
  if (b.asset === "liquidity_pool_shares") return `Pool ${b.liquidityPoolId.slice(0, 8)}…`
  return b.asset.code
}
```

### Checking a TransactionStatus

```tsx
function StatusBadge({ status }: { status: TransactionStatus }) {
  switch (status) {
    case "pending":
      return <span className="badge badge-pending">Pending</span>
    case "success":
      return <span className="badge badge-success">Success</span>
    case "failed":
      return <span className="badge badge-failed">Failed</span>
    case "not_found":
      return <span className="badge badge-muted">Not found</span>
  }
}
```

TypeScript enforces exhaustiveness: if you add a `default` branch, the compiler
warns you when a new status variant is added in a future release.

---

## Next.js and server-side rendering

`use-stellar` is safe to import in server components — it never accesses
`window` or wallet-extension APIs at module load time. However, hooks that
depend on browser APIs (`useWallet`, `useSendPayment`) must run inside a client
component.

### Typed client-wrapper pattern

Create a thin client wrapper and annotate it with `React.ReactNode`:

```tsx
// app/providers.tsx
"use client"

import { StellarProvider } from "use-stellar"

export function Providers({ children }: { children: React.ReactNode }) {
  return <StellarProvider network="testnet">{children}</StellarProvider>
}
```

Then import it into your server-component layout:

```tsx
// app/layout.tsx
import { Providers } from "./providers"

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
```

Any component that calls a browser-only hook needs the `"use client"` directive
and properly typed props:

```tsx
// app/components/WalletButton.tsx
"use client"

import { useWallet } from "use-stellar"
import type { UseWalletReturn } from "use-stellar"

export function WalletButton() {
  const wallet: UseWalletReturn = useWallet()

  if (wallet.connecting) return <button disabled>Connecting…</button>

  return wallet.connected ? (
    <button onClick={wallet.disconnect}>Disconnect {wallet.address?.slice(0, 8)}…</button>
  ) : (
    <button onClick={() => wallet.connect("freighter")}>Connect Freighter</button>
  )
}
```

The hooks `useBalance`, `useAccount`, `useTransaction`, `useAsset`, and
`usePayments` fetch via Horizon and work server-side when an explicit `address`
is provided. They are safe to use outside `"use client"` boundaries in that
configuration.

---

## Related guides

- [Installation](../getting-started/installation.md) — set up the package and its peer dependency
- [Quickstart](../getting-started/quickstart.md) — build a payment flow in five minutes
- [StellarProvider](../getting-started/stellar-provider.md) — configure the context provider
