import * as React from "react"
import { createContext, useContext, useState } from "react"
import type { StellarContextValue, StellarNetwork, WalletState } from "../types"
import { NETWORK_CONFIGS } from "../types"

/**
 * The default initial state for a wallet connection in the Stellar context.
 *
 * - `connected`: false (no wallet has established a connection yet)
 * - `connecting`: false (no active connection request is in progress)
 * - `address`: null (no public key address is available)
 * - `network`: null (no context network associated with the wallet yet)
 * - `wallet`: null (no wallet provider selected)
 * - `walletName`: null (no friendly name for the wallet provider)
 * - `error`: null (no connection-related errors have occurred)
 * - `walletNetwork`: null (no network detected from the wallet browser extension itself)
 */
const DEFAULT_WALLET: WalletState = {
  connected: false,
  connecting: false,
  address: null,
  network: null,
  wallet: null,
  walletName: null,
  error: null,
  walletNetwork: null,
}

/**
 * React Context object that holds the Stellar context value or null.
 * Primarily consumed via the `useStellarContext` helper.
 */
const StellarContext = createContext<StellarContextValue | null>(null)

/**
 * Props accepted by the `StellarProvider` component.
 */
export interface StellarProviderProps {
  /**
   * The Stellar network environment.
   *
   * - **Optional**: If omitted or invalid, it defaults to `"testnet"`.
   * - **Values**: `"testnet"` (pre-configured to SDF testnet Horizon/Soroban RPC endpoints)
   *             or `"mainnet"` (pre-configured to SDF mainnet Horizon/Soroban RPC endpoints).
   * - **Impact**: Configures Horizon and Soroban RPC URL endpoints via `NETWORK_CONFIGS` for
   *             all downstream hooks. Determines where transactions are queried and submitted.
   */
  network?: StellarNetwork
  /**
   * The React component tree to be wrapped by the provider.
   *
   * - **Required**: Must contain React components that will consume the Stellar context.
   * - **Omission**: If omitted, it will cause build-time TypeScript errors or render an empty provider.
   */
  children: React.ReactNode
}

/**
 * StellarProvider wraps your React application to manage the active Stellar network configuration
 * and wallet connection states. It serves as the single source of truth for the SDK/wallet contexts.
 *
 * ### Lifecycle and Resource Management:
 * - **On Mount**: Initializes the internal `wallet` state with `DEFAULT_WALLET`. It does not make
 *   any network requests, open WebSocket connections, setup timers, or add window event listeners
 *   upon initial mounting. This makes the provider lightweight, fast to mount, and fully server-side
 *   rendering (SSR) safe.
 * - **At Runtime**:
 *   - The `network` prop can change dynamically if updated by the parent component. When the
 *     `network` prop changes, the context updates its network config instantly, notifying all downstream hooks.
 *   - The `wallet` state is dynamically managed via the returned `setWallet` function when a wallet
 *     adapter (e.g. Freighter, LOBSTR) connects, disconnects, or updates network profiles.
 * - **On Unmount**: Because no background resources (like network polling, socket connections, or event listeners)
 *   are spawned during initialization or maintained directly by this provider, no cleanup or
 *   unsubscription operations are performed during the unmount phase.
 *
 * ### Consumer Expectations:
 * - All hooks provided by `use-stellar` (such as `useWallet`, `useBalance`, `useAccount`, `useSendPayment`, etc.)
 *   require `StellarProvider` to be present higher in the React component tree.
 * - Recommended placement is at the root level of your application (e.g., `main.tsx` in Vite/CRA, or wrapping
 *   your root layout in Next.js).
 * - There are no strict ordering requirements relative to other common providers (like React Query or Theme providers),
 *   though placing `StellarProvider` near the top is recommended.
 *
 * @example
 * ```tsx
 * <App>
 *   <StellarProvider>
 *     <YourApplication />
 *   </StellarProvider>
 * </App>
 * ```
 */
export function StellarProvider({ network = "testnet", children }: StellarProviderProps) {
  const [wallet, setWallet] = useState<WalletState>(DEFAULT_WALLET)

  const value: StellarContextValue = {
    network,
    networkConfig: NETWORK_CONFIGS[network],
    wallet,
    setWallet,
  }

  return <StellarContext.Provider value={value}>{children}</StellarContext.Provider>
}

/**
 * Custom hook to consume the Stellar provider context values.
 *
 * ### Behavior and Constraints:
 * - Must be called within a component wrapped inside `<StellarProvider>`.
 * - If called outside of a `<StellarProvider>` wrapper, it will throw a runtime error immediately,
 *   preventing silent failures in hooks consumption.
 *
 * @throws {Error} If called outside of a `<StellarProvider>` context hierarchy.
 * @returns {StellarContextValue} The active network, network config, wallet state, and state setter.
 */
export function useStellarContext(): StellarContextValue {
  const ctx = useContext(StellarContext)
  if (!ctx) {
    throw new Error(
      "use-stellar: No StellarProvider found. " +
        "Wrap your app in <StellarProvider> before using any use-stellar hooks."
    )
  }
  return ctx
}
