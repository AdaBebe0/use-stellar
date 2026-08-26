# Changelog

All notable changes to use-stellar will be documented here.
Format based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [0.1.5]

### Added

- `usePayments` hook — paginated payment history for an account
- `useClaimableBalance` hook — claimable balances for an account
- `useWallet` — network-mismatch detection (`isNetworkMismatch`, `walletNetwork`, `refreshWalletNetwork`) and `walletName`
- `useBalance` — configurable polling `interval` option and `lastUpdated` timestamp

### Changed

- All hooks now return a typed `StellarError` (with `code` and `message`) via the `error` field, instead of a plain string
- Corrected `packages/core/README.md` to match the actual hook signatures (`useAccount`, `useTransaction`, `useAsset`, `useSorobanContract` had drifted from their documented shapes)

### Fixed

- Removed `useFriendbot` from documentation — it was never implemented

## [0.1.4] and earlier

- useWallet hook with Freighter support
- useBalance hook with watch option
- useAccount hook
- useSendPayment hook
- useTransaction hook
- useNetwork hook
- useAsset hook
- useSorobanContract hook (read-only)
- StellarProvider context
