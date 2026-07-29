# Connecting Wallets

> A guide on how to integrate and manage Stellar wallets using use-stellar.

## Freighter

### What it is

Freighter is a browser extension wallet for the Stellar network. It provides a secure way to manage your Stellar accounts and sign transactions directly from your browser. 

### Installation

To install Freighter, navigate to [freighter.app](https://www.freighter.app) and install the extension for your preferred browser (Chrome, Firefox, Edge, or Brave). Once installed, pin the extension to your browser toolbar and follow the setup flow to create a new wallet and save your recovery phrase.

### Creating a testnet account

Before you can build on the testnet, you need an active testnet account in your Freighter wallet.

1. Open the Freighter extension.
2. Click the gear icon in the top-right corner to open Settings.
3. Navigate to **Preferences** -> **Active Network**.
4. Select **Test Network**.
5. Copy your Stellar public address (starts with `G`) from the main Freighter screen.
6. Navigate to the [Stellar Laboratory Friendbot](https://laboratory.stellar.org/#friendbot).
7. Paste your address into the Friendbot tool and click **Get test network lumens**. This funds your account with 10,000 testnet XLM, making it active on the testnet.

### Switching networks

When building with `use-stellar`, your application expects the connected wallet to be on the same network as your `StellarProvider`. Since `use-stellar` targets the testnet by default during development, you must ensure Freighter's active network is also set to the **Test Network**. If you ever need to switch back to Mainnet, you can do so from Freighter's **Preferences** -> **Active Network** menu.

### Connecting Freighter

You can connect Freighter to your application using the `useWallet` hook. This hook provides the connection state and the functions needed to interact with the wallet.

```tsx
import { useWallet } from "use-stellar"

export function ConnectFreighter() {
  const { connected, connecting, address, error, connect, disconnect } = useWallet()

  if (connecting) {
    return <button disabled>Connecting...</button>
  }

  if (connected) {
    return (
      <div>
        <p>Connected to Freighter: {address}</p>
        <button onClick={disconnect}>Disconnect</button>
      </div>
    )
  }

  return (
    <div>
      <button onClick={() => connect("freighter")}>Connect Freighter</button>
      {error && <p>Error connecting: {error.message}</p>}
    </div>
  )
}
```

## Albedo

### What it is

Albedo is a web-based popup signer for the Stellar network. Unlike Freighter, it does not require a browser extension to be installed. It uses a session-based signing model, where users confirm their identity and transactions in a secure browser popup window.

### Differences from Freighter

Because Albedo is entirely web-based, it works in any modern browser without requiring users to install extensions. However, it operates on a per-request basis. It does not maintain a persistent background connection or expose an active network toggle in the same way Freighter does. Instead, the network is confirmed for each transaction signing request. 

### Current support status

The underlying adapter code for Albedo exists in `use-stellar`, but it is currently marked as unsupported in the wallet registry. It is considered an open issue and contributions are welcome. Attempting to connect Albedo using the hook will result in an "Albedo is not supported yet" error.

### Connecting Albedo

Because Albedo is not fully supported, passing `"albedo"` to the `connect` function will throw an unsupported wallet error. Here is how you might handle it in an application.

```tsx
import { useWallet } from "use-stellar"

export function ConnectAlbedo() {
  const { connected, address, error, connect } = useWallet()

  if (connected) {
    return <p>Connected to Albedo: {address}</p>
  }

  return (
    <div>
      <button onClick={() => connect("albedo")}>Connect Albedo</button>
      {error && <p>Error: {error.message}</p>}
    </div>
  )
}
```

## Future wallet support

The `use-stellar` library is built to support a diverse ecosystem of Stellar wallets. In addition to Freighter, the wallet registry contains stubs for future integrations. The following wallets are planned for future support:

- **LOBSTR:** A popular mobile and web wallet for the Stellar network.
- **Rabet:** A browser extension and desktop wallet for Stellar.

Currently, attempting to connect either of these will return an unsupported error.

## Detecting the connected wallet

You can determine which wallet a user has connected to by inspecting the `wallet` property returned from the `useWallet` hook. This is useful for displaying the correct wallet name or tailoring the user experience based on their active provider.

```tsx
import { useWallet } from "use-stellar"

export function WalletInfo() {
  const { connected, address, wallet, walletName } = useWallet()

  if (!connected) {
    return <p>No wallet is currently connected.</p>
  }

  return (
    <div>
      <p>Wallet Address: {address}</p>
      {wallet === "freighter" ? (
        <p>You are connected with {walletName}.</p>
      ) : (
        <p>You are connected with an unsupported wallet: {wallet}.</p>
      )}
    </div>
  )
}
```
