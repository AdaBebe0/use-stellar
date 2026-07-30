// Stellar React SDK - Main entry point
// ── Provider ───────────────────────────────────────────────────────────────
export { StellarProvider } from "./context/StellarProvider"
export type { StellarProviderProps } from "./context/StellarProvider"

// ── Hooks ──────────────────────────────────────────────────────────────────
export { useWallet } from "./hooks/useWallet"
export type { UseWalletReturn } from "./hooks/useWallet"
export { useBalance } from "./hooks/useBalance"
export type { UseBalanceOptions, UseBalanceReturn } from "./hooks/useBalance"
export { useAccount } from "./hooks/useAccount"
export type { UseAccountOptions, UseAccountReturn } from "./hooks/useAccount"
export { useAccountExists } from "./hooks/useAccountExists"
export { useSendPayment } from "./hooks/useSendPayment"
export type { UseSendPaymentReturn } from "./hooks/useSendPayment"
export { useAddTrustline } from "./hooks/useAddTrustline"
export { useTransaction } from "./hooks/useTransaction"
export type { UseTransactionOptions, UseTransactionReturn } from "./hooks/useTransaction"
export { useNetwork } from "./hooks/useNetwork"
export type { UseNetworkReturn } from "./hooks/useNetwork"
export { useAsset } from "./hooks/useAsset"
export type { AssetInfo, UseAssetOptions, UseAssetReturn } from "./hooks/useAsset"
export { useFederationLookup } from "./hooks/useFederationLookup"
export type {
  FederationRecord,
  UseFederationLookupOptions,
  UseFederationLookupReturn,
} from "./types"
export { useSorobanContract } from "./hooks/useSorobanContract"
export type { UseSorobanContractReturn } from "./hooks/useSorobanContract"
export { usePayments } from "./hooks/usePayments"
export { useTransactionHistory } from "./hooks/useTransactionHistory"
export { usePaymentHistory } from "./hooks/usePaymentHistory"
export { useClaimableBalance } from "./hooks/useClaimableBalance"
export type {
  UseClaimableBalanceOptions,
  UseClaimableBalanceReturn,
} from "./hooks/useClaimableBalance"

export {
  FREIGHTER_WALLET_TYPE,
  NETWORK_PASSPHRASES,
  WalletAdapterError,
  freighterAdapter,
  getWalletAdapter,
  getWalletAdapters,
} from "./wallets"

// ── Errors ─────────────────────────────────────────────────────────────────
export {
  StellarError,
  createStellarError,
  toStellarError,
  isStellarError,
  isStellarErrorCode,
  STELLAR_ERROR_CODES,
  DEFAULT_ERROR_MESSAGES,
} from "./errors"
export type { StellarErrorCode, StellarErrorOptions } from "./errors"

// ── Utilities ────────────────────────────────────────────────────────────
export {
  isBrowser,
  isValidAssetCode,
  isValidStellarAddress,
  shortenAddress,
  formatAmount,
  formatAssetCode,
} from "./utils"

// ── Types ──────────────────────────────────────────────────────────────────
export type {
  StellarNetwork,
  NetworkConfig,
  CustomNetworkConfig,
  WalletType,
  WalletState,
  Asset,
  NativeAsset,
  IssuedAsset,
  Balance,
  AccountInfo,
  TransactionResult,
  TransactionStatus,
  SendPaymentOptions,
  SendPaymentResult,
  UseAddTrustlineReturn,
  AddTrustlineOptions,
  NormalizedPayment,
  ContractCallOptions,
  StellarContextValue,
  UsePaymentsOptions,
  UsePaymentsReturn,
  UseTransactionHistoryOptions,
  UseTransactionHistoryReturn,
  NormalizedTransaction,
  UsePaymentHistoryOptions,
  UsePaymentHistoryReturn,
  ClaimableBalance,
  ClaimableBalanceClaimant,
  UseAccountExistsOptions,
  UseAccountExistsReturn,
  AccountExistsReason,
} from "./types"
export type {
  SignTransactionOptions,
  WalletAdapter,
  WalletAdapterErrorCode,
  WalletAdapterMetadata,
  WalletConnection,
  WalletNetworkDetails,
} from "./wallets"
