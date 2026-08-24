# useNetwork

Returns information about the currently selected Stellar network and its configuration.

## Installation

```bash
npm install use-stellar @stellar/stellar-sdk
```

## Import

```ts
import { useNetwork } from "use-stellar"
```

## Basic usage

```tsx
import React from "react"
import { useNetwork } from "use-stellar"

function NetworkInfo() {
  const { network, isTestnet, networkConfig } = useNetwork()

  return (
    <div>
      <p>Current Network: {network}</p>
      <p>Is Testnet: {isTestnet ? "Yes" : "No"}</p>
      <p>Horizon RPC: {networkConfig.horizonUrl}</p>
    </div>
  )
}
```

## Parameters

This hook takes no parameters.

| Parameter | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| — | — | — | — | This hook takes no parameters. |

## Return values

| Property | Type | Description |
| --- | --- | --- |
| `network` | `StellarNetwork` | The active network identifier (`"testnet"` or `"mainnet"`). |
| `networkConfig` | `NetworkConfig` | Configuration object containing `network`, `horizonUrl`, and `sorobanUrl`. |
| `isTestnet` | `boolean` | `true` if the active network is testnet, `false` otherwise. |
| `isMainnet` | `boolean` | `true` if the active network is mainnet, `false` otherwise. |

## Examples

### Example 1 — show a testnet warning banner

Display a warning notification whenever your application is connected to the testnet network.

```tsx
import React from "react"
import { useNetwork } from "use-stellar"

function TestnetWarningBanner() {
  const { isTestnet, network } = useNetwork()

  if (!isTestnet) {
    return null
  }

  return (
    <div style={{ padding: "12px", backgroundColor: "#fff3cd", color: "#856404" }}>
      <p>Warning: You are currently connected to Stellar {network}.</p>
    </div>
  )
}
```

### Example 2 — display the Horizon URL

Display the active Horizon RPC endpoint URL from the network configuration.

```tsx
import React from "react"
import { useNetwork } from "use-stellar"

function HorizonEndpointDisplay() {
  const { networkConfig } = useNetwork()

  return (
    <div>
      <p>Active Horizon Endpoint:</p>
      <code>{networkConfig.horizonUrl}</code>
    </div>
  )
}
```

### Example 3 — conditionally render content based on the network

Render distinct UI elements or messaging depending on whether the app is on testnet or mainnet.

```tsx
import React from "react"
import { useNetwork } from "use-stellar"

function EnvironmentStatus() {
  const { isTestnet, network } = useNetwork()

  return (
    <div>
      <p>Current Network: {network}</p>
      {isTestnet ? (
        <p>Testnet environment: You can request test tokens from Friendbot.</p>
      ) : (
        <p>Mainnet environment: Real asset transactions apply.</p>
      )}
    </div>
  )
}
```

## TypeScript

```ts
type StellarNetwork = "testnet" | "mainnet"

interface NetworkConfig {
  network: StellarNetwork
  horizonUrl: string
  sorobanUrl: string
}

interface UseNetworkReturn {
  network: StellarNetwork
  networkConfig: NetworkConfig
  isTestnet: boolean
  isMainnet: boolean
}
```

## Common errors

| Error message | Cause | Fix |
| --- | --- | --- |
| `"use-stellar: No StellarProvider found. Wrap your app in <StellarProvider> before using any use-stellar hooks."` | The hook ran outside of a `<StellarProvider>` component tree. | Wrap your application or component tree in `<StellarProvider>`. |

## Notes

- The default network for `<StellarProvider>` is `"testnet"`.
- Updating the `network` prop on `<StellarProvider>` updates the configuration across all child components automatically.

## Related hooks

- [`useWallet`](./use-wallet.md) — Manages wallet connection status and wallet-detected network state.
