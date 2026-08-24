# Introduction

React hooks for the Stellar network. `use-stellar` provides a comprehensive suite of React hooks and context providers that make building decentralized applications (dApps) on Stellar productive and predictable. Conceptually similar to wagmi in the Ethereum ecosystem, this library handles the complex interactions between your front-end and the blockchain. You can use it to build modern wallets, token dashboards, payment portals, and interactive decentralized finance (DeFi) interfaces.

## The Problem

Integrating the raw Stellar SDK directly into a React application introduces several complex engineering challenges. You must write significant boilerplate code to manage wallet connection states, track network endpoints, and parse raw blockchain responses. Asynchronous ledger operations require manual state machine implementations to correctly track pending states, load spinners, and catch diverse error classes. Synchronizing this chain state across multiple UI components often results in redundant network requests or complex context wrappers. Writing, maintaining, and testing this repetitive glue code distracts you from building your core product features.

## What use-stellar Provides

`use-stellar` abstracts away the low-level complexities of blockchain integration into simple, robust React hooks. The library handles state management, network synchronization, and multi-wallet interactions out of the box.

You receive native support for:
- Connecting and managing web wallets such as Freighter and LOBSTR.
- Fetching and tracking XLM and custom asset balances.
- Querying full Stellar account structures, signers, and thresholds.
- Constructing, signing, and submitting on-chain payments and transactions.
- Watching transaction status and polling for ledger updates.
- Loading detailed asset metadata and supply information.
- Inspecting network profiles and active Horizon or Soroban RPC endpoints.
- Interacting with deployed Soroban smart contracts using read-only calls.
- Retrieving and paginating historical payments or managing claimable balances.

## Who It Is For

This library is built for front-end engineers who want to build high-quality user interfaces on the Stellar blockchain.

- **React and Next.js developers** who need a declarative, standard library for managing blockchain state in their web applications.
- **Developers new to Stellar** who want to build dApps without spending weeks learning the details of raw transaction construction, XDR serialization, and raw SDK APIs.
- **Experienced Stellar developers** who want to replace thousands of lines of custom React state and side-effect boilerplate with standard, battle-tested hooks.

## Available Hooks

`use-stellar` exports the following public hooks:

- `useWallet` — Connects and disconnects supported Stellar wallets, providing connection status, active address, and adapter errors.
- `useBalance` — Fetches the XLM or custom asset balance for a specific account with support for automatic polling.
- `useAccount` — Retrieves complete account state, including sequence numbers, subentry counts, signers, and thresholds.
- `useSendPayment` — Signs and submits asset payments, handling the loading, error, and transaction result states.
- `useTransaction` — Fetches a Stellar transaction from the ledger by its hash and optionally watches for its status updates.
- `useNetwork` — Exposes the current active Stellar network configuration, including Horizon and Soroban RPC server URLs.
- `useAsset` — Fetches comprehensive asset metadata such as circulating supply, issuer address, and flags.
- `useSorobanContract` — Invokes read-only functions on deployed Soroban smart contracts with automated error tracking.
- `usePayments` — Fetches and paginates historical payment operations for a specific Stellar address.
- `useClaimableBalance` — Queries claimable balances and claimant details associated with a Stellar account.

## Next Steps

Now that you understand what `use-stellar` is, you can start integrating it into your web application.

- [Installation](./installation.md) — Set up the package and its peer dependencies.
- [Quickstart](./quickstart.md) — Build your first wallet connection and payment flow in under five minutes.
- [StellarProvider](./stellar-provider.md) — Learn how to configure the global context provider for your application.
