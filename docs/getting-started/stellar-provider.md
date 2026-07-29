# StellarProvider

`StellarProvider` is the global context provider that powers `use-stellar`. It manages the active Stellar network configuration and the active wallet connection state across your React application.

---

## What is StellarProvider?

`StellarProvider` is a React context provider component. Every hook in the library depends on the context that `StellarProvider` provides.

The provider acts as the single source of truth for your application's blockchain state. It stores and shares:
- The active Stellar network configuration (such as the Horizon and Soroban RPC endpoint URLs).
- The state of the user's connected wallet (such as connection status, public key address, and wallet adapter errors).

Without this context, the hooks cannot determine which network to query or which wallet is connected. You must wrap your component tree with `StellarProvider` before you can call any `use-stellar` hooks.

---

## Where to Place the Provider

To ensure every hook has access to the Stellar context, you should mount `StellarProvider` at the root of your application hierarchy. This makes the Stellar state available to all components.

### Next.js App Router

In Next.js, root layouts are server components by default, but context providers require client-side React state. You should create a client component to wrap the provider, and then import it into your root layout.

### Vite / Create React App

In Vite or Create React App applications, you should wrap your primary `<App />` component directly inside the application's entry point file.

---

## The `network` Prop

The `network` prop controls which Stellar network environment the hooks connect to. It configures the endpoints that are used to query ledger data and submit transactions.

### Accepted Values

The `network` prop accepts the following values:

- `"testnet"` — Connects to the public Stellar Development Foundation (SDF) test network. It uses the pre-configured endpoints `https://horizon-testnet.stellar.org` and `https://soroban-testnet.stellar.org`.
- `"mainnet"` — Connects to the public Stellar production network. It uses the pre-configured endpoints `https://horizon.stellar.org` and `https://soroban.stellar.org`.

### Default Behavior

If you omit the `network` prop, `StellarProvider` defaults to `"testnet"`. This prevents accidental mainnet transactions during development.

You should use `"testnet"` for all development, integration, and testing. Never use mainnet configurations or hardcode real assets during development.

---

## Using Hooks Outside the Provider

If you attempt to call a hook from `use-stellar` in a component that is not a descendant of a `StellarProvider`, the library will throw a runtime error.

### The Runtime Error Message

The exact runtime error thrown by the library is:

```text
use-stellar: No StellarProvider found. Wrap your app in <StellarProvider> before using any use-stellar hooks.
```

### Why It Happens

The hook attempts to read the Stellar context, but the context is `null` because no provider was found higher in the component tree.

### How to Fix It

To resolve this error, move the failing component inside a component tree that is wrapped by `<StellarProvider>`. Make sure that the component containing the hook is a child of the provider, and not a sibling or a parent.

---

## Next.js App Router Example

Here is a complete example showing how to configure `StellarProvider` in a Next.js App Router project using a client wrapper.

### 1. Create a Providers wrapper

Create a separate file for client-side providers. Mark it with the `"use client"` directive at the top.

```tsx
// app/providers.tsx
"use client";

import * as React from "react";
import { StellarProvider } from "use-stellar";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <StellarProvider network="testnet">
      {children}
    </StellarProvider>
  );
}
```

### 2. Import the wrapper into your Root Layout

Wrap the children of your layout in the custom `Providers` component.

```tsx
// app/layout.tsx
import * as React from "react";
import { Providers } from "./providers";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
```

### 3. Consume a hook in a Client Component

Any component that uses `use-stellar` hooks must be marked as a client component.

```tsx
// app/components/WalletStatus.tsx
"use client";

import * as React from "react";
import { useWallet } from "use-stellar";

export function WalletStatus() {
  const { connected, address } = useWallet();

  if (!connected) {
    return <p>Wallet is not connected.</p>;
  }

  return (
    <div>
      <p>Connected Address: <code>{address}</code></p>
    </div>
  );
}
```

---

## Vite / Create React App Example

Here is how to configure `StellarProvider` inside a Vite or Create React App project.

### 1. Wrap the App in the entry point

Open your main entry point file (such as `main.tsx` or `index.tsx`) and wrap the root component.

```tsx
// src/main.tsx
import * as React from "react";
import * as ReactDOM from "react-dom/client";
import { StellarProvider } from "use-stellar";
import { App } from "./App";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <StellarProvider network="testnet">
      <App />
    </StellarProvider>
  </React.StrictMode>
);
```

### 2. Consume the context in your App

```tsx
// src/App.tsx
import * as React from "react";
import { useWallet } from "use-stellar";

export function App() {
  const { connected, address, connect, disconnect, connecting } = useWallet();

  if (connecting) {
    return <p>Connecting to wallet...</p>;
  }

  return (
    <main style={{ padding: "20px" }}>
      <h1>Stellar dApp</h1>
      {connected ? (
        <div>
          <p>Connected as: <code>{address}</code></p>
          <button onClick={disconnect}>Disconnect</button>
        </div>
      ) : (
        <button onClick={() => connect("freighter")}>
          Connect Freighter
        </button>
      )}
    </main>
  );
}
```

---

## Important Notes

### Do Not Nest Providers

You should avoid wrapping your application in multiple nested `StellarProvider` components.

Nesting multiple providers creates multiple independent instances of the Stellar context. This can lead to the following problems:
- Downstream hooks will only bind to the nearest parent provider. This causes state fragmentation where different parts of your application see different active networks or wallet connection statuses.
- Changing the configuration in one provider will not update components that are wrapped by a different provider.
- Actions taken in one context (such as connecting a wallet) will not sync with other contexts. This results in inconsistent user interfaces.

To avoid these problems, configure a single `<StellarProvider>` at the absolute root of your React component tree.

### Related links

- [Introduction](./introduction.md) — Understand the architecture of the library.
- [Installation](./installation.md) — Install the package and peer dependencies.
