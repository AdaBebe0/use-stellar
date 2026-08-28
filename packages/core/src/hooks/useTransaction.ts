import { useState, useEffect, useRef, useCallback } from "react"
import { useStellarContext } from "../context/StellarProvider"
import { getHorizonServer } from "../utils"
import { toStellarError } from "../errors"
import type { StellarError, TransactionResult, TransactionStatus } from "../types"

export interface UseTransactionOptions {
  hash: string | null
  watch?: boolean // keep polling until success or failed
}

export interface UseTransactionReturn {
  transaction: TransactionResult | null
  loading: boolean
  error: StellarError | null
  refetch: () => void
}

/**
 * Fetches the status and details of a specific transaction by hash.
 *
 * @param options - Configuration options
 * @param options.hash - The transaction hash to look up
 * @param options.watch - When true, keeps polling until the transaction succeeds or fails
 * @returns `{ transaction, loading, error, refetch }`
 *
 * @example
 * const { transaction } = useTransaction({ hash: "...", watch: true })
 */
export function useTransaction({
  hash,
  watch = false,
}: UseTransactionOptions): UseTransactionReturn {
  const { network } = useStellarContext()

  const [transaction, setTransaction] = useState<TransactionResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<StellarError | null>(null)
  const transactionRef = useRef<TransactionResult | null>(null)

  // Refs must not be written during render (unsafe under StrictMode and
  // concurrent rendering); keep transactionRef in sync via an effect instead.
  useEffect(() => {
    transactionRef.current = transaction
  }, [transaction])

  // Monotonic id used to ignore superseded responses (e.g. when `hash`
  // changes mid-flight). Distinct from unmount cancellation below — a
  // superseded fetch is discarded because a newer fetch owns the state,
  // while a cancelled fetch is discarded because there is no component left
  // to update.
  const requestRef = useRef(0)
  // Set only by the effect cleanup on unmount. Reset at the top of the
  // effect so it doesn't leak across re-runs (e.g. every watch poll).
  const cancelledRef = useRef(false)

  const fetchTransaction = useCallback(async () => {
    if (!hash) {
      setTransaction(null)
      setError(null)
      setLoading(false)
      return
    }

    const fetchId = ++requestRef.current
    setLoading(true)
    setError(null)

    try {
      const server = getHorizonServer(network)
      const raw = await server.transactions().transaction(hash).call()

      if (cancelledRef.current || fetchId !== requestRef.current) return

      const status: TransactionStatus = raw.successful ? "success" : "failed"

      setTransaction({
        hash: raw.hash,
        status,
        ledger: Number(raw.ledger),
        createdAt: raw.created_at,
        fee: String(raw.fee_charged),
        envelope: raw.envelope_xdr,
      })
    } catch (err: unknown) {
      if (cancelledRef.current || fetchId !== requestRef.current) return

      // 404 means not found / still pending
      const is404 = (err as { response?: { status: number } })?.response?.status === 404
      if (is404) {
        setTransaction({ hash: hash!, status: watch ? "pending" : "not_found" })
      } else {
        setTransaction(null)
        setError(toStellarError(err))
      }
    } finally {
      if (!cancelledRef.current && fetchId === requestRef.current) {
        setLoading(false)
      }
    }
  }, [hash, network, watch])

  useEffect(() => {
    cancelledRef.current = false
    fetchTransaction()

    const interval = watch
      ? setInterval(() => {
          const status = transactionRef.current?.status
          if (status === "success" || status === "failed") return
          fetchTransaction()
        }, 3000)
      : null

    return () => {
      if (interval) {
        clearInterval(interval)
      }
      cancelledRef.current = true
    }
  }, [fetchTransaction, watch])

  return { transaction, loading, error, refetch: fetchTransaction }
}
