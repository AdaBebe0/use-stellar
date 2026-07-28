import * as React from "react";
import { createContext, useContext, useState } from "react";
import type {
  CustomNetworkConfig,
  NetworkConfig,
  StellarContextValue,
  StellarNetwork,
  WalletState,
} from "../types";
import { NETWORK_CONFIGS } from "../types";

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

// ── Validation ─────────────────────────────────────────────────────────────
/**
 * Validates a custom network config override and returns the merged
 * `NetworkConfig`. Throws a descriptive error if required URLs are missing
 * or obviously malformed so developers catch misconfiguration at startup.
 */
function resolveNetworkConfig(
  network: StellarNetwork,
  override: CustomNetworkConfig | undefined,
): NetworkConfig {
  if (!override) {
    // No override — use the built-in SDF defaults.
    return NETWORK_CONFIGS[network];
  }

  const { horizonUrl, sorobanUrl } = override;

  if (!horizonUrl || typeof horizonUrl !== "string" || horizonUrl.trim() === "") {
    throw new Error(
      "use-stellar: Invalid networkConfig — `horizonUrl` is required when " +
      "providing a custom networkConfig. " +
      "Example: { horizonUrl: \"https://horizon.my-node.com\", sorobanUrl: \"...\" }"
    );
  }

  if (!sorobanUrl || typeof sorobanUrl !== "string" || sorobanUrl.trim() === "") {
    throw new Error(
      "use-stellar: Invalid networkConfig — `sorobanUrl` is required when " +
      "providing a custom networkConfig. " +
      "Example: { horizonUrl: \"...\", sorobanUrl: \"https://rpc.my-node.com\" }"
    );
  }

  return {
    network,
    horizonUrl: horizonUrl.trim(),
    sorobanUrl: sorobanUrl.trim(),
  };
}

// ── Provider ───────────────────────────────────────────────────────────────
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
  network?: StellarNetwork;
  /**
   * Optional override for Horizon and Soroban RPC endpoints.
   * When omitted, the built-in SDF public endpoints are used.
   *
   * Both `horizonUrl` and `sorobanUrl` are required when this prop is provided.
   *
   * @example
   * // Custom private node:
   * <StellarProvider
   *   network="mainnet"
   *   networkConfig={{
   *     horizonUrl: "https://horizon.my-node.com",
   *     sorobanUrl: "https://rpc.my-node.com",
   *   }}
   * />
   */
  networkConfig?: CustomNetworkConfig;
  /**
   * The React component tree to be wrapped by the provider.
   *
   * - **Required**: Must contain React components that will consume the Stellar context.
   * - **Omission**: If omitted, it will cause build-time TypeScript errors or render an empty provider.
   */
  children: React.ReactNode;
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
 *   - The `network`