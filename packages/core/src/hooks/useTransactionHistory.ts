import { useState, useEffect, useCallback, useRef } from "react"
import { useStellarContext } from "../context/StellarProvider"
import { getHorizonServer } from "../utils"
import type {
  UseTransactionHistoryOptions,
  UseTransactionHistoryReturn,
  NormalizedTransaction,
  StellarError,
} from "../types"
import type { Horizon } from "@stellar/stellar-sdk"
import { toStellarError } from "../errors"

type TransactionRecord = Horizon.ServerApi.TransactionRecord
type TransactionPage = Horizon.ServerApi.CollectionPage<TransactionRecord>

export function useTransactionHistory({
  address,
  limit = 10,
  order = "desc",
  cursor,
}: UseTransactionHistoryOptions = {}): UseTransactionHistoryReturn {
  const { network, wallet } = useStellarContext()
  const resolvedAddress = address ?? wallet.address

  const [transactions, setTransactions] = useState<NormalizedTransaction[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<StellarError | null>(null)

  // Store page navigation functions from the Horizon response
  const nextRef = useRef<(() => Promise<TransactionPage>) | null>(null)
  const prevRef = useRef<(() => Promise<TransactionPage>) | null>(null)

  const [hasNext, setHasNext] = useState(false)
  const [hasPrev, setHasPrev] = useState(false)

  const fetchTransactions = useCallback(async () => {
    if (!resolvedAddress) {
      setTransactions([])
      setHasNext(false)
      setHasPrev(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const server = getHorizonServer(network)
      let query = server.transactions().forAccount(resolvedAddress).limit(limit).order(order)
      if (cursor) {
        query = query.cursor(cursor)
      }

      const res = await query.call()
      const normalized = res.records.map(normalizeTransaction)
      setTransactions(normalized)

      // Save pagination callbacks
      nextRef.current = res.records.length > 0 ? () => res.next() : null
      prevRef.current = res.records.length > 0 ? () => res.prev() : null

      setHasNext(res.records.length >= limit)
      setHasPrev(!!cursor)
    } catch (err) {
      setError(toStellarError(err))
    } finally {
      setLoading(false)
    }
  }, [resolvedAddress, network, limit, order, cursor])

  const fetchNext = useCallback(async () => {
    if (!nextRef.current) return
    setLoading(true)
    setError(null)
    try {
      const res = await nextRef.current()
      const normalized = res.records.map(normalizeTransaction)
      setTransactions(normalized)

      nextRef.current = res.records.length > 0 ? () => res.next() : null
      prevRef.current = res.records.length > 0 ? () => res.prev() : null

      setHasNext(res.records.length >= limit)
      setHasPrev(true)
    } catch (err) {
      setError(toStellarError(err))
    } finally {
      setLoading(false)
    }
  }, [limit])

  const fetchPrev = useCallback(async () => {
    if (!prevRef.current) return
    setLoading(true)
    setError(null)
    try {
      const res = await prevRef.current()
      const normalized = res.records.map(normalizeTransaction)
      setTransactions(normalized)

      nextRef.current = res.records.length > 0 ? () => res.next() : null
      prevRef.current = res.records.length > 0 ? () => res.prev() : null

      setHasNext(true)
      setHasPrev(res.records.length >= limit)
    } catch (err) {
      setError(toStellarError(err))
    } finally {
      setLoading(false)
    }
  }, [limit])

  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  return {
    transactions,
    loading,
    error,
    refetch: fetchTransactions,
    fetchNext,
    fetchPrev,
    hasNext,
    hasPrev,
  }
}

// ── Normalize Transaction Records ──────────────────────────────────────────
function normalizeTransaction(record: TransactionRecord): NormalizedTransaction {
  return {
    hash: record.hash,
    ledger: Number(record.ledger),
    createdAt: record.created_at,
    sourceAccount: record.source_account,
    fee: String(record.fee_charged),
    operationCount: record.operation_count,
    successful: record.successful,
    memo: record.memo,
    memoType: record.memo_type,
  }
}
