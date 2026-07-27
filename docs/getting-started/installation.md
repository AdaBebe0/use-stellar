# Installation

This guide helps you install the library and verify that everything is configured correctly. You will set up the core package, configure the required peer dependencies, and verify the installation with a minimal React component.

## Requirements

Before you install the package, ensure your local development environment meets the following criteria:

- **Node.js**: Version 18 or newer is required.
- **React**: Version 18 or newer (including `react-dom`) must be installed in your project.
- **TypeScript**: Optional but supported.

## Install use-stellar

You can install the core library using your preferred package manager. Run one of the following commands in your project root directory:

### npm

```bash
npm install use-stellar
```

### pnpm

```bash
pnpm add use-stellar
```

### yarn

```bash
yarn add use-stellar
```

## Install the Peer Dependency

The library requires the official `@stellar/stellar-sdk` package as a peer dependency. This package contains the low-level APIs and cryptographic tools for interacting with the Stellar ledger. `use-stellar` uses these APIs to serialize transactions, parse Horizon network responses, and communicate with the blockchain.

Install `@stellar/stellar-sdk` using one of the following commands:

### npm

```bash
npm install @stellar/stellar-sdk
```

### pnpm

```bash
pnpm add @stellar/stellar-sdk
```

### yarn

```bash
yarn add @stellar/stellar-sdk
```

## Install Freighter

You should install the Freighter browser extension before building applications that connect to Stellar wallets. Freighter handles secure key management and signing operations in the browser.

You can download and install the extension from the official [Freighter website](https://freighter.app).

## Choosing a Network

Stellar operates multiple networks for different stages of the development lifecycle:

- **Testnet**: A free, public network for testing and development. The SDF Testnet includes Friendbot, a service that provides free test network lumens. You must always use Testnet during development to avoid risking real funds.
- **Mainnet**: The production network where real assets and real value transactions reside.

You should configure your development environment to use the Testnet.

## Verify the Installation

To verify your setup, you can construct a minimal React component that uses the library. Wrap your application in `StellarProvider` and consume the `useWallet` hook to display the connection status.

```tsx
import { StellarProvider, useWallet } from "use-stellar"

function WalletStatus() {
  const { connected, address } = useWallet()

  return (
    <div>
      {connected ? (
        <p>Connected to: {address}</p>
      ) : (
        <p>Wallet not connected</p>
      )}
    </div>
  )
}

export default function App() {
  return (
    <StellarProvider network="testnet">
      <WalletStatus />
    </StellarProvider>
  )
}
```
