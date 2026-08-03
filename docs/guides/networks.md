# Networks

Understand the difference between Stellar testnet and mainnet, get free test
funds with Friendbot, and switch your app between networks with the `network`
prop.

## Testnet vs mainnet

Stellar runs several independent networks. Each has its own ledger, its own
accounts, and its own XLM. A testnet account does not exist on mainnet, and a
mainnet account does not exist on testnet.

### Testnet

Testnet is a free, public sandbox run by the Stellar Development Foundation
(SDF). It exists so developers can build and test without risking real money.
Accounts, balances, and transactions on testnet have **no real-world value**.

- Horizon API: `https://horizon-testnet.stellar.org`
- Soroban RPC: `https://soroban-testnet.stellar.org`
- Test XLM can be created for free with Friendbot.

### Mainnet

Mainnet is the production Stellar network. Every XLM and every issued asset on
mainnet has **real-world value**. Transactions on mainnet move real money and
cannot be undone.

- Horizon API: `https://horizon.stellar.org`
- Soroban RPC: `https://soroban.stellar.org`
- XLM must be bought or received from another account.

## use-stellar defaults to testnet

`use-stellar` keeps you safe during development. If you do not pass the
`network` prop, `StellarProvider` defaults to `"testnet"`:

```tsx
import { StellarProvider } from "use-stellar"

export function App() {
  return (
    <StellarProvider>
      <YourApplication />
    </StellarProvider>
  )
}
```

Because the default is testnet, a forgotten `network` prop cannot accidentally
send real funds. Only set `network="mainnet"` when you are ready for real
transactions.

## Funding a testnet account with Friendbot

Friendbot is a free service that creates and funds a new testnet account with
10,000 testnet XLM. You can use it from the browser or from your code.

### Option 1 — use the Stellar Laboratory

1. Open the [Stellar Laboratory](https://laboratory.stellar.org).
2. Navigate to the **Friendbot** tab.
3. Paste a testnet public address (an account key that starts with `G`).
4. Click **Get test network lumens**.
5. The account is created and funded instantly.

### Option 2 — use the Friendbot endpoint from your code

Friendbot is a simple HTTP endpoint. You can call it with `fetch` or any HTTP
client:

```ts
const address = "GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"

const response = await fetch(`https://friendbot.stellar.org?addr=${address}`)
const result = await response.json()

if (!response.ok) {
  throw new Error(result.detail ?? "Friendbot request failed")
}
```

Friendbot only works for **testnet**. A Friendbot request funds an account on
the testnet ledger, not on mainnet.

## Switching networks with the `network` prop

Pass `"testnet"` or `"mainnet"` to the `network` prop on `StellarProvider`. This
configures the Horizon and Soroban endpoints for every hook in your app.

```tsx
import { StellarProvider } from "use-stellar"

export function App() {
  return (
    <StellarProvider network="mainnet">
      <YourApplication />
    </StellarProvider>
  )
}
```

You can switch the network dynamically. When the `network` prop changes, the
context updates its config instantly and every downstream hook re-queries on the
new network:

```tsx
import { useState } from "react"
import { StellarProvider } from "use-stellar"
import type { StellarNetwork } from "use-stellar"

export function App() {
  const [network, setNetwork] = useState<StellarNetwork>("testnet")

  return (
    <StellarProvider network={network}>
      <button onClick={() => setNetwork("testnet")}>Use testnet</button>
      <button onClick={() => setNetwork("mainnet")}>Use mainnet</button>
      <YourApplication />
    </StellarProvider>
  )
}
```

You can read the active network anywhere in your app with `useNetwork`:

```tsx
import { useNetwork } from "use-stellar"

function NetworkBanner() {
  const { network, isTestnet } = useNetwork()

  if (isTestnet) {
    return <p>Connected to Stellar testnet.</p>
  }

  return <p>Connected to Stellar mainnet.</p>
}
```

### Keep the wallet on the same network

A wallet extension such as Freighter has its own active network setting. Your
app's `network` prop and your wallet must be on the same network, or
transactions fail with a network mismatch. When you switch your app to mainnet,
switch your wallet to mainnet too.

## Warning — never test with real funds on mainnet

Mainnet transactions move real money and cannot be reversed. If you point a test
script or a debug button at mainnet, you can permanently lose real XLM or
assets.

- Keep `network="testnet"` everywhere you test.
- Never reuse a mainnet address in a Friendbot request or a tutorial.
- Guard mainnet with an explicit confirmation in your UI before sending.
- Keep a hard-coded `network="testnet"` until you are ready to deploy.

## Exploring the chain

Use these tools to inspect accounts, balances, and transactions:

- [Stellar Laboratory](https://laboratory.stellar.org) — build and submit
  transactions, use Friendbot, and explore the testnet.
- [Stellar Expert](https://stellar.expert) — an explorer for the Stellar
  network with account, asset, and transaction details.

## Related guides

- [`StellarProvider`](../getting-started/stellar-provider.md) — the `network`
  prop and provider configuration.
- [Connecting Wallets](./wallets.md) — setting up Freighter on testnet.
- [`useNetwork`](../hooks/use-network.md) — reading the active network in a
  component.
