import { useEffect, useRef } from "react"
import { useStellarContext } from "../context/StellarProvider"
import { getHorizonServer, parseHorizonBalance } from "../utils"
import { toStellarError } from "../errors"
import { useQuery, accountKey } from "../cache"
import type { Asset, Balance, StellarError } from "../types"

export interface UseBalanceOptions {
  address?: string | null // defaults to connected wallet address
  asset?: Asset // defaults to XLM
  watch?: boolean // auto re-fetch on an interval (default false)
  interval?: number // polling interval in ms when watch is true (default 10000)
  /** Override the provider-level staleTime for this hook instance (ms). */
  staleTime?: number
}

export interface UseBalanceReturn {
  balance: string | null
  balances: Balance[]
  loading: boolean
  error: StellarError | null
  lastUpdated: Date | null // timestamp of the last successful fetch
  refetch: () => void
}

// Default polling interval (ms) used when `watch` is enabled without an explicit
// `interval`.
const DEFAULT_WATCH_INTERVAL = 10_000

/**
 * Fetches the XLM or asset balance for the connected wallet or any Stellar address.
 *
 * Results are cached in the shared QueryStore and deduplicated: two components
 * calling useBalance for the same address issue exactly one network request.
 *
 * @param options - Configuration options
 * @param options.address - The Stellar address to fetch balances for. Defaults to the connected wallet.
 * @param options.asset - The asset to return in `balance`. Defaults to XLM.
 * @param options.watch - When true, re-fetches on an interval (default false).
 * @param options.interval - Polling interval in ms when `watch` is true (default 10000).
 * @param options.staleTime - Override the provider-level staleTime for this hook.
 * @returns `{ balance, balances, loading, error, lastUpdated, refetch }`
 *
 * @example
 * const { balance, loading } = useBalance({ asset: "XLM", watch: true, interval: 5000 })
 */
export function useBalance({
  address,
  asset = "XLM",
  watch = false,
  interval = DEFAULT_WATCH_INTERVAL,
  staleTime,
}: UseBalanceOptions = {}): UseBalanceReturn {
  const { network, networkConfig, wallet, queryStore } = useStellarContext()
  const resolvedAddress = address ?? wallet.address

  const queryKey = resolvedAddress
    ? accountKey(networkConfig.horizonUrl, network, resolvedAddress)
    : (["balance", "disabled"] as const)

  // Monotonic id used to ignore superseded responses (e.g. when the
  // address/network changes mid-flight). This is distinct from unmount
  // cancellation below — a superseded fetch is discarded because a newer
  // fetch owns the state, while a cancelled fetch is discarded because
  // there is no component left to update.
  const requestRef = useRef(0)
  // Set only by the effect cleanup on unmount. Reset at the top of the
  // effect so it doesn't leak across re-runs (e.g. every watch interval).
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
      const account = await server.loadAccount(resolvedAddress)

      if (cancelledRef.current || fetchId !== requestRef.current) return

      const parsed = account.balances.map(parseHorizonBalance)
      setBalances(parsed)
      setLastUpdated(new Date())
    } catch (err) {
      if (cancelledRef.current || fetchId !== requestRef.current) return
      setBalances([])
      setLastUpdated(null)
      setError(toStellarError(err))
    } finally {
      if (!cancelledRef.current && fetchId === requestRef.current) {
        setLoading(false)
      }
    }
  }, [resolvedAddress, network])
  const {
    data: balances,
    loading,
    error: rawError,
    updatedAt,
    refetch,
  } = useQuery<Balance[]>({
    queryKey,
    queryFn: async () => {
      const server = getHorizonServer(networkConfig)
      const account = await server.loadAccount(resolvedAddress!)
      return account.balances.map(parseHorizonBalance)
    },
    store: queryStore,
    staleTime,
    enabled: Boolean(resolvedAddress),
  })

  // Keep a stable ref so the interval doesn't close over a stale refetch.
  const refetchRef = useRef(refetch)
  refetchRef.current = refetch

  // Polling: when watch is enabled, call refetch() on the interval. The cache
  // bypasses staleTime on a refetch() call, so this always fetches fresh data.
  useEffect(() => {
    cancelledRef.current = false
    fetchBalances()
    if (!watch || !resolvedAddress) return

    const ms = interval > 0 ? interval : DEFAULT_WATCH_INTERVAL
    const id = setInterval(() => refetchRef.current(), ms)
    return () => clearInterval(id)
  }, [watch, interval, resolvedAddress, network, networkConfig.horizonUrl])

    return () => {
      if (id) clearInterval(id)
      // Mark cancelled so a late response from this cycle can't update an
      // unmounted component. Superseded (but still-mounted) responses are
      // handled separately by requestRef above.
      cancelledRef.current = true
    }
  }, [fetchBalances, watch, interval])
  const error = rawError ? toStellarError(rawError) : null
  const lastUpdated = updatedAt ? new Date(updatedAt) : null

  const match = (balances ?? []).find(b => {
    if (asset === "XLM") return b.asset === "XLM"
    if (typeof asset === "object" && typeof b.asset === "object") {
      return b.asset.code === asset.code && b.asset.issuer === asset.issuer
    }
    return false
  })
  const balance = match?.balance ?? null

  return {
    balance,
    balances: balances ?? [],
    loading,
    error,
    lastUpdated,
    refetch,
  }
}
