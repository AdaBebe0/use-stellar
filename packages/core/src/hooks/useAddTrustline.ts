import { useState, useCallback } from "react"
import {
  TransactionBuilder,
  Networks,
  BASE_FEE,
  Operation,
  Asset as StellarAsset,
} from "@stellar/stellar-sdk"
import { useStellarContext } from "../context/StellarProvider"
import { getHorizonServer, isBrowser, isIssuedAsset } from "../utils"
import { getWalletAdapter } from "../wallets"
import { createStellarError, toStellarError, toSubmissionError } from "../errors"
import type {
  AddTrustlineOptions,
  TransactionResult,
  StellarError,
  UseAddTrustlineReturn,
} from "../types"

/**
 * Builds, signs, and submits a `changeTrust` transaction to establish a trustline
 * for an asset, allowing an account to hold it.
 *
 * @returns `{ addTrustline, loading, error, result, reset }`
 *
 * @example
 * const { addTrustline, loading } = useAddTrustline()
 * await addTrustline({
 *   asset: { code: "USDC", issuer: "G..." }
 * })
 */
export function useAddTrustline(): UseAddTrustlineReturn {
  const { network, networkConfig, wallet } = useStellarContext()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<StellarError | null>(null)
  const [result, setResult] = useState<TransactionResult | null>(null)

  const addTrustline = useCallback(
    async (options: AddTrustlineOptions): Promise<TransactionResult> => {
      if (!wallet.connected || !wallet.address) {
        throw createStellarError(
          "WALLET_NOT_CONNECTED",
          "Wallet not connected. Call connect() first."
        )
      }
      if (!wallet.wallet) {
        throw createStellarError("WALLET_NOT_CONNECTED", "No wallet adapter selected.")
      }

      if (!isBrowser()) {
        throw createStellarError(
          "VALIDATION_ERROR",
          "Transaction signing is only available in the browser. " +
            'Move your component to a "use client" boundary in Next.js / Remix.'
        )
      }

      if (wallet.walletNetwork && wallet.network !== wallet.walletNetwork) {
        throw createStellarError(
          "WRONG_NETWORK",
          `Network mismatch: Provider is on ${wallet.network} but wallet is on ${wallet.walletNetwork}. ` +
            `Switch your wallet to ${wallet.network} or call refreshWalletNetwork() to update.`
        )
      }

      if (!isIssuedAsset(options.asset)) {
        throw createStellarError(
          "VALIDATION_ERROR",
          "Invalid asset. Trustlines can only be created for issued assets, not XLM."
        )
      }

      setLoading(true)
      setError(null)
      setResult(null)

      try {
        const server = getHorizonServer(network)
        const sourceAcc = await server.loadAccount(wallet.address)
        const networkPassphrase =
          networkConfig.network === "mainnet" ? Networks.PUBLIC : Networks.TESTNET

        const stellarAsset = new StellarAsset(options.asset.code, options.asset.issuer)
        const operation = Operation.changeTrust({
          asset: stellarAsset,
          limit: options.limit,
        })

        const tx = new TransactionBuilder(sourceAcc, { fee: BASE_FEE, networkPassphrase })
          .addOperation(operation)
          .setTimeout(30)
          .build()

        const adapter = getWalletAdapter(wallet.wallet)
        const signedTxXdr = await adapter.signTransaction(tx.toXDR(), {
          address: wallet.address,
          network,
          networkPassphrase,
        })
        const signed = TransactionBuilder.fromXDR(signedTxXdr, networkPassphrase)
        const res = await server.submitTransaction(signed)

        if (!res.successful) {
          const failedOutcome: TransactionResult = {
            hash: res.hash,
            status: "failed",
          }
          setResult(failedOutcome)
          throw toSubmissionError(res)
        }

        const outcome: TransactionResult = { hash: res.hash, status: "success" }
        setResult(outcome)
        return outcome
      } catch (err) {
        const stellarError = toStellarError(err)
        setError(stellarError)
        throw stellarError
      } finally {
        setLoading(false)
      }
    },
    [network, networkConfig, wallet]
  )

  const reset = useCallback(() => {
    setError(null)
    setResult(null)
  }, [])

  return { addTrustline, loading, error, result, reset }
}
