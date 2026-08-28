import { useState, useEffect, useCallback, useRef } from "react"
import { useStellarContext } from "../context/StellarProvider"
import { getHorizonServer } from "../utils"
import { toStellarError } from "../errors"
import type { ClaimableBalance, StellarError } from "../types"

export interface UseClaimableBalanceOptions {
  address?: string | null // defaults to connected wallet address
}

export interface UseClaimableBalanceReturn {
  balances: ClaimableBalance[]
  loading: boolean
  error: StellarError | null
  refetch: () => void
}

export function useClaimableBalance({
  address,
}: UseClaimableBalanceOptions = {}): UseClaimableBalanceReturn {
  const { network, wallet } = useStellarContext()
  const resolvedAddress = address ?? wallet.address

  const [balances, setBalances] = useState<ClaimableBalance[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<StellarError | null>(null)

  // Monotonic id used to ignore superseded responses (e.g. when the
  // address/network changes mid-flight). This is distinct from unmount
  // cancellation below — a superseded fetch is discarded because a newer
  // fetch owns the state, while a cancelled fetch is discarded because
  // there is no component left to update.
  const requestRef = useRef(0)
  // Set only by the effect cleanup on unmount. Reset at the top of the
  // effect so it doesn't leak across re-runs.
  const cancelledRef = useRef(false)

  const fetchBalances = useCallback(async () => {
    if (!resolvedAddress) {
      setBalances([])
      setLoading(false)
      return
    }

    const fetchId = ++requestRef.current
    setLoading(true)
    setError(null)

    try {
      const server = getHorizonServer(network)
      const result = await server.claimableBalances().claimant(resolvedAddress).call()

      if (cancelledRef.current || fetchId !== requestRef.current) return

      const parsed: ClaimableBalance[] = result.records.map(record => ({
        id: record.id,
        asset: record.asset,
        amount: record.amount,
        claimants: record.claimants.map(c => ({
          destination: c.destination,
          predicate: c.predicate as object,
        })),
        sponsor: record.sponsor,
      }))

      setBalances(parsed)
    } catch (err) {
      if (cancelledRef.current || fetchId !== requestRef.current) return
      const stellarError = toStellarError(err)
      // A 404 means the account has no claimable balances — treat as empty
      if (stellarError.code === "ACCOUNT_NOT_FOUND") {
        setBalances([])
      } else {
        setBalances([])
        setError(stellarError)
      }
    } finally {
      if (!cancelledRef.current && fetchId === requestRef.current) {
        setLoading(false)
      }
    }
  }, [resolvedAddress, network])

  useEffect(() => {
    cancelledRef.current = false
    fetchBalances()
    return () => {
      cancelledRef.current = true
    }
  }, [fetchBalances])

  return { balances, loading, error, refetch: fetchBalances }
}
