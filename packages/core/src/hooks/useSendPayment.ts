import { useState, useCallback } from "react"
import {
  TransactionBuilder,
  Networks,
  BASE_FEE,
  Operation,
  Asset as StellarAsset,
  Memo,
} from "@stellar/stellar-sdk"
import { useStellarContext } from "../context/StellarProvider"
import { getHorizonServer, isNativeAsset, isIssuedAsset, isBrowser } from "../utils"
import { getWalletAdapter } from "../wallets"
import { createStellarError, toStellarError } from "../errors"
import type { SendPaymentOptions, SendPaymentResult, Asset, StellarError } from "../types"

export interface UseSendPaymentReturn {
  send: (options: SendPaymentOptions) => Promise<SendPaymentResult & { error?: string }>
  loading: boolean
  error: StellarError | null
  result: SendPaymentResult | null
  reset: () => void
}

/**
 * Builds, signs, and submits a payment transaction to the Stellar network.
 *
 * @returns `{ send, loading, error, result, reset }`
 *
 * @example
 * const { send, loading } = useSendPayment()
 * await send({ to: "G...", asset: "XLM", amount: "10" })
 */
export function useSendPayment(): UseSendPaymentReturn {
  const { network, networkConfig, wallet } = useStellarContext()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<StellarError | null>(null)
  const [result, setResult] = useState<SendPaymentResult | null>(null)

  const send = useCallback(
    async (options: SendPaymentOptions): Promise<SendPaymentResult & { error?: string }> => {
      if (!wallet.connected || !wallet.address) {
        throw createStellarError(
          "WALLET_NOT_CONNECTED",
          "Wallet not connected. Call connect() first."
        )
      }
      if (!wallet.wallet) {
        throw new Error("No wallet adapter selected. Call connect() first.")
      }

      if (!isBrowser()) {
        throw createStellarError(
          "VALIDATION_ERROR",
          "Transaction signing is only available in the browser. " +
            'Move your component to a "use client" boundary in Next.js / Remix.'
        )
      }

      // Check for network mismatch
      if (wallet.walletNetwork && wallet.network !== wallet.walletNetwork) {
        throw new Error(
          `Network mismatch: Provider is on ${wallet.network} but wallet is on ${wallet.walletNetwork}. ` +
            `Switch your wallet to ${wallet.network} or call refreshWalletNetwork() to update.`
        )
      }

      setLoading(true)
      setError(null)
      setResult(null)

      try {
        const stellarAsset = toStellarAsset(options.asset)
        const server = getHorizonServer(network)
        const sourceAcc = await server.loadAccount(wallet.address)
        const networkPassphrase =
          networkConfig.network === "mainnet" ? Networks.PUBLIC : Networks.TESTNET

        const operation = Operation.payment({
          destination: options.to,
          asset: stellarAsset,
          amount: options.amount,
        })

        const builder = new TransactionBuilder(sourceAcc, {
          fee: BASE_FEE,
          networkPassphrase,
        }).addOperation(operation)

        if (options.memo) {
          builder.addMemo(Memo.text(options.memo))
        }

        builder.setTimeout(30)
        const tx = builder.build()
        const xdr = tx.toXDR()

        // Sign & submit via the active wallet's adapter
        const adapter = getWalletAdapter(wallet.wallet)
        const signedTxXdr = await adapter.signTransaction(xdr, {
          address: wallet.address,
          network,
          networkPassphrase,
        })

        const signed = TransactionBuilder.fromXDR(signedTxXdr, networkPassphrase)
        const res = await server.submitTransaction(signed)

        const outcome: SendPaymentResult = {
          hash: res.hash,
          status: "success",
        }

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

  return { send, loading, error, result, reset }
}

function toStellarAsset(asset: Asset): StellarAsset {
  if (isNativeAsset(asset)) return StellarAsset.native()
  if (isIssuedAsset(asset)) return new StellarAsset(asset.code, asset.issuer)
  throw createStellarError(
    "VALIDATION_ERROR",
    `Unsupported asset: ${JSON.stringify(asset)}. ` + `Pass "XLM" or { code, issuer }.`
  )
}
