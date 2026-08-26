import type { Dispatch, SetStateAction } from "react"
import type { StellarError } from "../errors"

export type { StellarError, StellarErrorCode } from "../errors"
export type { AssetInfo, UseAssetOptions, UseAssetReturn } from "../hooks/useAsset"

/**
 * Represents the Stellar network environment.
 */
export type StellarNetwork = "testnet" | "mainnet"

/**
 * Configuration details for a specific Stellar network.
 */
export interface NetworkConfig {
  network: StellarNetwork
  horizonUrl: string
  sorobanUrl: string
}

/**
 * Partial override for custom Horizon / Soroban RPC endpoints.
 * Pass this to `StellarProvider` to bypass the built-in SDF defaults.
 *
 * @example
 * // Private infrastructure or rate-limit avoidance:
 * <StellarProvider
 *   network="mainnet"
 *   networkConfig={{
 *     horizonUrl: "https://horizon.my-node.com",
 *     sorobanUrl: "https://rpc.my-node.com",
 *   }}
 * />
 */
export interface CustomNetworkConfig {
  horizonUrl: string
  sorobanUrl: string
}

/**
 * Pre-defined configurations for supported Stellar networks.
 */
export const NETWORK_CONFIGS: Record<StellarNetwork, NetworkConfig> = {
  testnet: {
    network: "testnet",
    horizonUrl: "https://horizon-testnet.stellar.org",
    sorobanUrl: "https://soroban-testnet.stellar.org",
  },
  mainnet: {
    network: "mainnet",
    horizonUrl: "https://horizon.stellar.org",
    sorobanUrl: "https://soroban.stellar.org",
  },
}

/**
 * Supported wallet providers.
 *
 * The built-in types keep autocomplete, while `(string & {})` lets an
 * application or a wallet vendor register its own adapter with
 * `registerWalletAdapter()` and pass that type to `connect()`.
 */
export type WalletType = "freighter" | "lobstr" | "albedo" | "rabet" | (string & {})

/**
 * The network a wallet reports it is currently on.
 *
 * `"custom"` means the wallet reported a passphrase that is neither the SDF
 * testnet nor the SDF mainnet one — a private or standalone network. It is a
 * value, not an error: the wallet is simply somewhere this app does not
 * recognise, which `isNetworkMismatch` reports as a mismatch.
 */
export type WalletNetworkId = StellarNetwork | "custom"

/**
 * The current state of the wallet connection.
 */
export interface WalletState {
  connected: boolean
  connecting: boolean
  address: string | null
  network: StellarNetwork | null // Network from provider config
  wallet: WalletType | null
  error: StellarError | null
  walletNetwork: WalletNetworkId | null // Actual network from wallet extension
  walletName: string | null
  /**
   * Raw passphrase reported by the wallet, present when `walletNetwork` is
   * set. Optional so existing code that builds a `WalletState` by hand keeps
   * compiling.
   */
  walletNetworkPassphrase?: string | null
}

/**
 * Represents the native Stellar asset (XLM).
 */
export type NativeAsset = "XLM"

/**
 * Represents a custom issued asset on the Stellar network.
 */
export interface IssuedAsset {
  code: string
  issuer: string
}

export interface LiquidityPoolAsset {
  asset: "liquidity_pool_shares"
  liquidityPoolId: string
}

/**
 * Extended asset information with validation metadata.
 */
export interface AssetMetadata extends IssuedAsset {
  verified: boolean
  timestamp: number
}

/**
 * Can be either a native asset or an issued asset.
 */
export type Asset = NativeAsset | IssuedAsset

/**
 * Represents a balance entry for an account.
 */
export type Balance =
  | {
      asset: "XLM"
      balance: string
    }
  | {
      asset: {
        code: string
        issuer: string
      }
      balance: string
      limit: string
    }
  | {
      asset: "liquidity_pool_shares"
      balance: string
      liquidityPoolId: string
    }

/**
 * Detailed account information from the Stellar network.
 */
export interface AccountInfo {
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

/**
 * The current status of a transaction on the network.
 */
export type TransactionStatus = "pending" | "success" | "failed" | "not_found"

/**
 * Result details from a submitted or queried transaction.
 */
export interface TransactionResult {
  hash: string
  status: TransactionStatus
  ledger?: number
  createdAt?: string
  fee?: string
  envelope?: string
}

/**
 * Options for sending a payment transaction.
 */
export interface SendPaymentOptions {
  to: string
  asset: Asset
  amount: string
  memo?: string
}

/**
 * Result returned after a payment is sent.
 */
export interface SendPaymentResult {
  hash: string
  status: TransactionStatus
}

/**
 * Options for adding a trustline to an asset.
 */
export interface AddTrustlineOptions {
  asset: IssuedAsset
  limit?: string
}

/**
 * Return value from the `useAddTrustline` hook.
 */
export interface UseAddTrustlineReturn {
  addTrustline: (options: AddTrustlineOptions) => Promise<TransactionResult>
  loading: boolean
  error: StellarError | null
  result: TransactionResult | null
  reset: () => void
}

/**
 * A normalized payment record for display or processing.
 */
export interface NormalizedPayment {
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

/**
 * Options for calling a Soroban smart contract.
 */
export interface ContractCallOptions {
  contractId: string
  method: string
  /**
   * Call arguments. `xdr.ScVal` values are the primary path and pass through
   * untouched; a bare `number` or `string` is ambiguous in Soroban's type
   * system and is rejected with an error naming the XDR type to use.
   */
  args?: unknown[]
  /**
   * The contract's parsed spec. When supplied, arguments are converted against
   * the parameter types the contract itself declares, and the return value is
   * decoded against its declared return type.
   *
   * @example
   * const spec = new contract.Spec(specEntries)
   */
  spec?: ContractSpecLike
  /**
   * Account to simulate as. Defaults to the connected wallet address, then to
   * a documented placeholder when no wallet is connected.
   */
  sourceAccount?: string
}

/**
 * The subset of the SDK's `contract.Spec` this library uses.
 *
 * Declared structurally so consumers are not forced to line up SDK instance
 * types across package boundaries.
 */
export interface ContractSpecLike {
  funcArgsToScVals: (name: string, args: object) => unknown[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  funcResToNative: (name: string, val: any) => any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getFunc: (name: string) => any
}

export interface ClaimableBalanceClaimant {
  destination: string
  predicate: object
}

export interface ClaimableBalance {
  id: string
  asset: string
  amount: string
  claimants: ClaimableBalanceClaimant[]
  sponsor?: string
}

/**
 * Options controlling whether a wallet session survives a page reload.
 *
 * Autoconnect is **off by default** — enabling it is an explicit choice,
 * because it changes what happens on mount for an existing consumer.
 */
export interface AutoConnectOptions {
  /** Restore the wallet session on mount. Defaults to `false`. */
  enabled?: boolean
  /**
   * Also persist the connected public address, so a UI can render it during
   * the moment between mount and the wallet answering. Defaults to `false`.
   *
   * Only ever the public address. Nothing secret is persisted — a wallet
   * adapter holds no key material and this hook must not start.
   */
  persistAddress?: boolean
  /** Where to persist. Defaults to `"local"` (`localStorage`). */
  storage?: "local" | "session"
}

/**
 * Context value provided by the StellarProvider.
 */
export interface StellarContextValue {
  network: StellarNetwork
  networkConfig: NetworkConfig
  wallet: WalletState
  setWallet: Dispatch<SetStateAction<WalletState>>
  /** Fully-resolved autoconnect options. `enabled` is `false` unless opted in. */
  autoConnect: Required<AutoConnectOptions>
}

export interface UsePaymentsOptions {
  address?: string | null
  limit?: number
  order?: "asc" | "desc"
  cursor?: string
}

export interface UsePaymentsReturn {
  payments: NormalizedPayment[]
  loading: boolean
  error: StellarError | null
  refetch: () => void
  fetchNext: () => Promise<void>
  fetchPrev: () => Promise<void>
  hasNext: boolean
  hasPrev: boolean
}

/**
 * Options for fetching an account's transaction history.
 */
export interface UseTransactionHistoryOptions {
  address?: string | null // defaults to the connected wallet
  limit?: number // default 10
  order?: "asc" | "desc" // default "desc"
  cursor?: string
}

/**
 * A normalized transaction record for display or processing.
 */
export interface NormalizedTransaction {
  hash: string
  ledger: number
  createdAt: string
  sourceAccount: string
  fee: string
  operationCount: number
  successful: boolean
  memo?: string
  memoType?: string
}

export interface UseTransactionHistoryReturn {
  transactions: NormalizedTransaction[]
  loading: boolean
  error: StellarError | null
  refetch: () => void
  fetchNext: () => Promise<void>
  fetchPrev: () => Promise<void>
  hasNext: boolean
  hasPrev: boolean
}

export interface UsePaymentHistoryOptions {
  address?: string | null
  limit?: number
  order?: "asc" | "desc"
  cursor?: string
  direction?: "incoming" | "outgoing" | "all"
  asset?: Asset | "all"
}

export interface UsePaymentHistoryReturn {
  payments: NormalizedPayment[]
  loading: boolean
  error: StellarError | null
  refetch: () => void
  fetchNext: () => Promise<void>
  fetchPrev: () => Promise<void>
  hasNext: boolean
  hasPrev: boolean
}

export interface FederationRecord {
  stellarAddress: string
  accountId: string
  memoType?: string
  memo?: string
}

export interface UseFederationLookupOptions {
  address?: string | null
}

export interface UseFederationLookupReturn {
  record: FederationRecord | null
  loading: boolean
  error: StellarError | null
  refetch: () => Promise<void>
}

export interface UseAccountExistsOptions {
  address?: string | null
}

export type AccountExistsReason = "exists" | "not_funded" | "invalid_format" | "idle"

export interface UseAccountExistsReturn {
  exists: boolean | null
  reason: AccountExistsReason
  loading: boolean
  error: StellarError | null
  refetch: () => void
}

// ── Path payments (swaps) ──────────────────────────────────────────────────
/**
 * A single conversion route returned by `usePaymentPaths`.
 */
export interface PaymentPath {
  /** Intermediate hops. Empty means a direct market exists. */
  path: Asset[]
  /** What leaves the sender's account on this route. */
  sourceAmount: string
  /** What arrives at the destination on this route. */
  destinationAmount: string
  /** `destinationAmount / sourceAmount`, as a precise decimal string. */
  rate: string
}

/**
 * Options for `usePaymentPaths`.
 *
 * The mode decides which amount you must supply: `strictSend` pins what you
 * send, `strictReceive` pins what the recipient gets.
 */
export type UsePaymentPathsOptions =
  | {
      mode: "strictSend"
      sourceAsset: Asset
      /** Required in `strictSend` mode — exactly what leaves your account. */
      sourceAmount: string
      destinationAsset: Asset
      destinationAmount?: never
      /**
       * Optional: restrict results to assets this account can actually
       * receive, which is usually what a UI wants.
       */
      destinationAddress?: string
      sourceAddress?: never
      enabled?: boolean
      /** Re-fetch on an interval. Quotes go stale in seconds. */
      watch?: boolean
      /** Polling interval in ms when `watch` is true (default 10000). */
      interval?: number
    }
  | {
      mode: "strictReceive"
      sourceAsset: Asset
      sourceAmount?: never
      destinationAsset: Asset
      /** Required in `strictReceive` mode — exactly what must arrive. */
      destinationAmount: string
      destinationAddress?: never
      /**
       * Optional: restrict results to assets this account actually holds, so
       * every quote is one the sender can pay with.
       */
      sourceAddress?: string
      enabled?: boolean
      /** Re-fetch on an interval. Quotes go stale in seconds. */
      watch?: boolean
      /** Polling interval in ms when `watch` is true (default 10000). */
      interval?: number
    }

export interface UsePaymentPathsReturn {
  /** Candidate routes, best rate first. Empty means no route exists. */
  paths: PaymentPath[]
  loading: boolean
  error: StellarError | null
  /** When the current `paths` were fetched. Quotes go stale in seconds. */
  lastUpdated: Date | null
  refetch: () => Promise<void>
}

/**
 * Options for `usePathPayment`.
 *
 * `mode` discriminates which amount is pinned and which slippage bound is
 * required. Both bounds are required — there is no permissive default.
 */
export type PathPaymentOptions =
  | {
      mode: "strictSend"
      destination: string
      sendAsset: Asset
      /** Exactly what leaves your account. */
      sendAmount: string
      destAsset: Asset
      /** Required — the least the recipient will accept. Your slippage bound. */
      destMin: string
      /** Intermediate hops from `usePaymentPaths`. Empty means direct. */
      path?: Asset[]
      memo?: string
      sendMax?: never
      destAmount?: never
    }
  | {
      mode: "strictReceive"
      destination: string
      sendAsset: Asset
      /** Required — the most you will spend. Your slippage bound. */
      sendMax: string
      destAsset: Asset
      /** Exactly what arrives at the destination. */
      destAmount: string
      /** Intermediate hops from `usePaymentPaths`. Empty means direct. */
      path?: Asset[]
      memo?: string
      sendAmount?: never
      destMin?: never
    }

export interface UsePathPaymentReturn {
  pathPayment: (options: PathPaymentOptions) => Promise<TransactionResult>
  loading: boolean
  error: StellarError | null
  result: TransactionResult | null
  reset: () => void
}
