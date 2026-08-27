import { useEffect, useRef } from "react"
import { useStellarContext } from "../context/StellarProvider"
import { getHorizonServer } from "../utils"
import { toStellarError } from "../errors"
import { useQuery, transactionKey } from "../cache"
import type { StellarError, TransactionResult, TransactionStatus } from "../types"

export interface UseTransactionOptions {
  hash: string | null
  watch?: boolean // keep polling until success or failed
  /** Override the provider-level staleTime for this hook instance (ms). */
  staleTime?: number
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
 * Results are cached in the shared QueryStore.
 *
 * @param options - Configuration options
 * @param options.hash - The transaction hash to look up
 * @param options.watch - When true, keeps polling until the transaction succeeds or fails
 * @param options.staleTime - Override the provider-level staleTime for this hook.
 * @returns `{ transaction, loading, error, refetch }`
 *
 * @example
 * const { transaction } = useTransaction({ hash: "...", watch: true })
 */
export function useTransaction({
  hash,
  watch = false,
  staleTime,
}: UseTransactionOptions): UseTransactionReturn {
  const { network } = useStellarContext()

  const [transaction, setTransaction] = useState<TransactionResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<StellarError | null>(null)
  const transactionRef = useRef<TransactionResult | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  transactionRef.current = transaction

  const fetchTransaction = useCallback(async () => {
    if (!hash) {
      setTransaction(null)
      setError(null)
      setLoading(false)
      return
    }

    // Cancel any in-flight request before starting a new one.
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    const controller = new AbortController()
    abortControllerRef.current = controller

    setLoading(true)
    setError(null)
  const { network, networkConfig, queryStore } = useStellarContext()

  const queryKey = hash
    ? transactionKey(networkConfig.horizonUrl, network, hash)
    : (["transaction", "disabled"] as const)

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
      const stellarError = toStellarError(err)

      // 404 means not found / still pending
      const is404 = (err as { response?: { status: number } })?.response?.status === 404
      if (is404) {
        setTransaction({ hash: hash!, status: watch ? "pending" : "not_found" })
      } else if (stellarError) {
        setTransaction(null)
        setError(stellarError)
      }
    } finally {
      setLoading(false)
      abortControllerRef.current = null
    }
  }, [hash, network, watch])
  const {
    data: transaction,
    loading,
    error: rawError,
    refetch,
  } = useQuery<TransactionResult>({
    queryKey,
    queryFn: async () => {
      const server = getHorizonServer(networkConfig)
      try {
        const raw = await server.transactions().transaction(hash!).call()
        const status: TransactionStatus = raw.successful ? "success" : "failed"
        return {
          hash: raw.hash,
          status,
          ledger: Number(raw.ledger),
          createdAt: raw.created_at,
          fee: String(raw.fee_charged),
          envelope: raw.envelope_xdr,
        }
      } catch (err) {
        const is404 = (err as { response?: { status: number } })?.response?.status === 404
        if (is404) {
          return {
            hash: hash!,
            status: watch ? ("pending" as TransactionStatus) : ("not_found" as TransactionStatus),
          }
        }
        throw err
      }
    },
    store: queryStore,
    staleTime,
    enabled: Boolean(hash),
  })

  // Keep a stable ref so the interval doesn't close over a stale refetch.
  const refetchRef = useRef(refetch)
  refetchRef.current = refetch
  const transactionRef = useRef(transaction)
  transactionRef.current = transaction

  // Polling for watch mode: keep going until settled.
  useEffect(() => {
    if (!watch || !hash) return

    const id = setInterval(() => {
      const status = transactionRef.current?.status
      if (status === "success" || status === "failed") return
      refetchRef.current()
    }, 3000)

    return () => {
      if (interval) {
        clearInterval(interval)
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
        abortControllerRef.current = null
      }
    }
  }, [fetchTransaction, watch])
    return () => clearInterval(id)
  }, [watch, hash])

  const error = rawError ? toStellarError(rawError) : null

  return { transaction, loading, error, refetch }
}
