# Changelog

All notable changes to use-stellar will be documented here.
Format based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

### Added
- `useContractEvents` hook — poll Soroban contract events with cursor-based pagination, topic filters, a bounded buffer, and a distinct `LEDGER_OUT_OF_RETENTION` error when a start ledger predates the RPC's retention window
- Custom network passphrase support — `StellarNetwork` now includes `"futurenet"` and `"custom"`, `NetworkConfig` carries `networkPassphrase`, and `CustomNetworkConfig` accepts one
- `NETWORK_PASSPHRASES` and `getNetworkPassphrase()` exported for reading a network's passphrase
- Fee strategy — `fee` and `feeMultiplier` options on `useSendPayment`, `useAddTrustline`, and `usePathPayment`, with `DEFAULT_FEE_MULTIPLIER` exported
- New error codes: `DESTINATION_NOT_FOUND`, `SEQUENCE_MISMATCH`, `FEE_TOO_LOW`, `LEDGER_OUT_OF_RETENTION`
- Recorded Horizon error fixtures under `src/__tests__/fixtures/` for classification tests

### Changed
- **Breaking:** `StellarNetwork` widened to `"testnet" | "mainnet" | "futurenet" | "custom"`. Code that exhaustively switches on it must handle the new members. `NETWORK_CONFIGS` and `NETWORK_PASSPHRASES` are keyed by the non-custom networks only.
- **Breaking:** `NetworkConfig` now requires `networkPassphrase`. It is resolved once by `StellarProvider`; every hook reads it from context.
- Transaction fees are bid from the network's current base fee rather than the SDK's `BASE_FEE` constant, which is the network minimum and is rejected during congestion
- `toStellarError` reads Horizon `result_codes` and RFC 7807 problem-details `type` before falling back to message heuristics

### Fixed
- A network error whose message merely contains `404` is no longer classified `ACCOUNT_NOT_FOUND`
- "Transaction rejected by the network" is no longer classified as a user wallet cancellation — the bare `"rejected"` and `"denied"` substring matches are gone
- `tx_insufficient_fee` surfaces as `FEE_TOO_LOW`, `tx_bad_seq` as `SEQUENCE_MISMATCH`, and `op_no_destination` as `DESTINATION_NOT_FOUND`, instead of a generic `TRANSACTION_FAILED`
- A custom network configured without a passphrase now throws at provider render instead of silently signing with the testnet passphrase

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


