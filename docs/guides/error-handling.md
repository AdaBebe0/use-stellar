# Error handling

Handle wallet, Horizon, transaction, and Soroban failures with one consistent
pattern across `use-stellar`.

## The shared error pattern

Every hook that can fail exposes a nullable `error` value. At the UI layer, this
is the familiar `error: string | null` pattern:

- `null` means there is no current failure.
- A string contains the message you can display to the user.

The current source provides more detail by returning `StellarError | null`.
`StellarError` extends the native JavaScript `Error`, so `error.message` is the
string value used by the UI.

```ts
import type { StellarError } from "use-stellar"

interface HookErrorState {
  error: StellarError | null
}

function getErrorMessage(error: StellarError | null): string | null {
  return error?.message ?? null
}
```

A `StellarError` also includes a stable `code` for programmatic handling and a
`raw` value for debugging:

```ts
import type { StellarError, StellarErrorCode } from "use-stellar"

function describeError(error: StellarError): {
  code: StellarErrorCode
  message: string
  debugValue: unknown
} {
  return {
    code: error.code,
    message: error.message,
    debugValue: error.raw,
  }
}
```

Do not render `error.raw`. It may contain low-level wallet, RPC, or Horizon
response details. Use it only in development logs or send it to an error
monitoring service.

## Display errors to users

Render the human-readable `message` and mark the element as an alert so assistive
technology announces the failure. Keep the previous result visible when that
result is still useful, and disable actions while a retry is running.

```tsx
import { StellarProvider, useBalance, useWallet } from "use-stellar"

export default function App() {
  return (
    <StellarProvider network="testnet">
      <TestnetBalance />
    </StellarProvider>
  )
}

function TestnetBalance() {
  const wallet = useWallet()
  const { balance, loading, error, refetch } = useBalance({
    address: wallet.address,
    asset: "XLM",
  })
  const currentError = wallet.error ?? error

  if (!wallet.connected) {
    return (
      <main>
        <h1>Testnet balance</h1>
        <button
          type="button"
          disabled={wallet.connecting}
          onClick={() => void wallet.connect("freighter")}
        >
          {wallet.connecting ? "Connecting..." : "Connect Freighter"}
        </button>
        {currentError && <p role="alert">{currentError.message}</p>}
      </main>
    )
  }

  return (
    <main>
      <h1>Testnet balance</h1>
      <p>
        XLM balance: <strong>{balance ?? "0"}</strong>
      </p>
      <button type="button" onClick={refetch} disabled={loading}>
        {loading ? "Refreshing..." : "Refresh"}
      </button>
      {currentError && <p role="alert">{currentError.message}</p>}
    </main>
  )
}
```

Use `error.code` when the recovery action should change. For example, an
unfunded account needs different guidance from a temporary network failure.

```tsx
import type { StellarError, StellarErrorCode } from "use-stellar"

const ERROR_MESSAGES: Partial<Record<StellarErrorCode, string>> = {
  WALLET_NOT_INSTALLED: "Install or enable Freighter, then reload this page.",
  WALLET_NOT_CONNECTED: "Connect your testnet wallet before continuing.",
  WRONG_NETWORK: "Switch your wallet and this app to Stellar testnet.",
  ACCOUNT_NOT_FOUND: "Fund this account on testnet, then try again.",
  INSUFFICIENT_BALANCE: "Add test XLM and leave enough for the base reserve and fee.",
  NO_TRUSTLINE: "Add a testnet trustline for this asset before sending it.",
  RATE_LIMITED: "Wait a moment before trying again.",
  NETWORK_ERROR: "Check your connection and try again.",
}

export function ErrorMessage({ error }: { error: StellarError }) {
  const message = ERROR_MESSAGES[error.code] ?? error.message
  return <p role="alert">{message}</p>
}
```

## Retry with `refetch`

Read hooks such as `useAccount`, `useAsset`, `useBalance`,
`useClaimableBalance`, `usePayments`, `useSorobanContract`, and
`useTransaction` return `refetch`. Calling it runs the same request again.

```tsx
import { StellarProvider, useBalance, useWallet } from "use-stellar"

export default function App() {
  return (
    <StellarProvider network="testnet">
      <BalanceWithRetry />
    </StellarProvider>
  )
}

function BalanceWithRetry() {
  const wallet = useWallet()
  const { balance, loading, error, refetch } = useBalance({
    address: wallet.address,
    asset: "XLM",
  })

  if (!wallet.connected) {
    return (
      <main>
        <h1>Testnet account</h1>
        <button
          type="button"
          disabled={wallet.connecting}
          onClick={() => void wallet.connect("freighter")}
        >
          {wallet.connecting ? "Connecting..." : "Connect Freighter"}
        </button>
        {wallet.error && <p role="alert">{wallet.error.message}</p>}
      </main>
    )
  }

  if (error) {
    return (
      <main>
        <h1>Testnet account</h1>
        <p role="alert">{error.message}</p>
        <button type="button" onClick={refetch} disabled={loading}>
          {loading ? "Retrying..." : "Try again"}
        </button>
      </main>
    )
  }

  return (
    <main>
      <h1>Testnet account</h1>
      <p>
        XLM balance: <strong>{loading ? "Loading..." : (balance ?? "0")}</strong>
      </p>
    </main>
  )
}
```

Avoid immediate, unlimited automatic retries. They can repeat a permanent error
or cause `RATE_LIMITED` responses. If you add automatic retry, use a small retry
limit and increasing delays. Always keep a manual retry button available.

`useWallet` and `useSendPayment` use action-specific retry methods:

- Retry a wallet connection by calling `connect("freighter")` again.
- Retry wallet network detection with `refreshWalletNetwork()`.
- `useSendPayment` does not return `refetch`. Call `reset()`, then submit the
  payment with `send()` again.
- Always catch the promise returned by `send()`. Validation and connection
  failures can reject before the hook updates its `error` state.

## Common errors

The library normalizes known failures into stable error codes. Match on the code,
not the message, because messages may become more specific.

| Code | Cause | Fix |
| --- | --- | --- |
| `WALLET_NOT_INSTALLED` | The selected wallet extension was not detected. | Install or enable Freighter, reload the page, and keep Freighter set to Testnet. |
| `WALLET_NOT_CONNECTED` | An action such as `send()` ran before a wallet was connected. | Call `connect("freighter")`, wait for `connected` to become `true`, and retry the action. |
| `WALLET_REQUEST_REJECTED` | The user rejected a connection or signature request. | Explain that approval is required and let the user start the action again. Do not reopen the wallet automatically. |
| `WRONG_NETWORK` | The provider and wallet are using different Stellar networks. | Set `<StellarProvider network="testnet">`, switch the wallet to Testnet, then call `refreshWalletNetwork()`. |
| `ACCOUNT_NOT_FOUND` | The account is not funded on testnet, the address is wrong, or the requested asset does not exist. | Verify the address or asset issuer. Fund new testnet accounts with Friendbot before fetching them. |
| `INSUFFICIENT_BALANCE` | The source account cannot cover the amount, fee, or Stellar base reserve. | Add test XLM, reduce the payment amount, and leave enough balance for the reserve and transaction fee. |
| `NO_TRUSTLINE` | The destination does not trust the issued asset. | Add the asset trustline to the destination account on testnet before sending the asset. |
| `TRANSACTION_FAILED` | Horizon accepted the submission request but the transaction failed on the network. | Check the destination, amount, trustlines, sequence, and wallet approval. Log `error.raw` for the Horizon result codes. |
| `RATE_LIMITED` | Too many requests reached Horizon in a short period. | Pause polling, wait, and retry with increasing delays. Avoid rapid repeated calls to `refetch()`. |
| `VALIDATION_ERROR` | An address, contract ID, argument, or browser-only action is invalid. | Validate input before calling the hook. In Next.js or Remix, keep wallet actions in a client component. |
| `NETWORK_ERROR` | The browser could not reach Horizon or Soroban because of connectivity, DNS, timeout, or CORS problems. | Check the connection and testnet endpoint availability, then offer `refetch`. |
| `UNKNOWN` | The failure did not match a known category. | Show `error.message`, record `error.code` and `error.raw`, and provide a retry when the operation is safe to repeat. |

A separate runtime error means a hook was rendered outside the provider:

```text
use-stellar: No StellarProvider found. Wrap your app in <StellarProvider> before using any use-stellar hooks.
```

Wrap the component tree in `<StellarProvider network="testnet">` before using
any hook.

## Error boundary

Hook errors are normally returned as state, so an error boundary does not catch
them automatically. Error boundaries catch errors thrown during rendering or a
React lifecycle method. They do not catch rejected promises or errors thrown
only inside event handlers.

The component below deliberately throws a hook error during render so the
boundary can replace the whole `use-stellar` section with a fallback. The retry
button remounts the provider and child hooks, which clears their stored state and
starts the read request again.

```tsx
import {
  Component,
  Fragment,
  type ErrorInfo,
  type ReactNode,
} from "react"
import {
  StellarProvider,
  isStellarError,
  useBalance,
  useWallet,
} from "use-stellar"

interface StellarErrorBoundaryProps {
  children: ReactNode
}

interface StellarErrorBoundaryState {
  error: Error | null
  resetKey: number
}

class StellarErrorBoundary extends Component<
  StellarErrorBoundaryProps,
  StellarErrorBoundaryState
> {
  state: StellarErrorBoundaryState = {
    error: null,
    resetKey: 0,
  }

  static getDerivedStateFromError(error: unknown) {
    return {
      error: error instanceof Error ? error : new Error(String(error)),
    }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("use-stellar component failed", {
      error,
      componentStack: info.componentStack,
    })
  }

  private retry = () => {
    this.setState(state => ({
      error: null,
      resetKey: state.resetKey + 1,
    }))
  }

  render() {
    if (this.state.error) {
      const code = isStellarError(this.state.error)
        ? this.state.error.code
        : "UNEXPECTED_ERROR"

      return (
        <main>
          <h1>Stellar testnet is unavailable</h1>
          <p role="alert">{this.state.error.message}</p>
          <p>
            Error code: <code>{code}</code>
          </p>
          <button type="button" onClick={this.retry}>
            Try again
          </button>
        </main>
      )
    }

    return (
      <Fragment key={this.state.resetKey}>
        {this.props.children}
      </Fragment>
    )
  }
}

function TestnetWalletBalance() {
  const wallet = useWallet()
  const { balance, loading, error } = useBalance({
    address: wallet.address,
    asset: "XLM",
  })

  if (wallet.error) {
    throw wallet.error
  }

  if (error) {
    throw error
  }

  if (!wallet.connected) {
    return (
      <main>
        <h1>Stellar testnet wallet</h1>
        <button
          type="button"
          disabled={wallet.connecting}
          onClick={() => void wallet.connect("freighter")}
        >
          {wallet.connecting ? "Connecting..." : "Connect Freighter"}
        </button>
      </main>
    )
  }

  return (
    <main>
      <h1>Stellar testnet wallet</h1>
      <p>
        XLM balance: <strong>{loading ? "Loading..." : (balance ?? "0")}</strong>
      </p>
      <button type="button" onClick={wallet.disconnect}>
        Disconnect
      </button>
    </main>
  )
}

export default function App() {
  return (
    <StellarErrorBoundary>
      <StellarProvider network="testnet">
        <TestnetWalletBalance />
      </StellarProvider>
    </StellarErrorBoundary>
  )
}
```

Use inline error rendering for failures the user can recover from without
leaving the current screen. Use an error boundary when the entire
`use-stellar` section cannot render safely or when you intentionally promote a
hook error by throwing it during render.
