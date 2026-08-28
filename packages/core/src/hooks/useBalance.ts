import { useState, useEffect, useCallback, useRef } from "react"
import { useStellarContext } from "../context/StellarProvider"
import { getHorizonServer, parseHorizonBalance } from "../utils"
import { toStellarError } from "../errors"
import type { Asset, Balance, StellarError } from "../types"

// Default polling interval (ms) used when `watch` is enabled without an explicit
// `interval`.
const DEFAULT_WATCH_INTERVAL = 10_000

export interface UseBalanceOptions {
  address?: string | null // defaults to connected wallet address
  asset?: Asset // defaults to XLM
  watch?: boolean // auto re-fetch on an interval (default false)
  interval?: number // polling interval in ms when watch is true (default 10000)
}

export interface UseBalanceReturn {
  balance: string | null
  balances: Balance[]
  loading: boolean
  error: StellarError | null
  lastUpdated: Date | null // timestamp of the last successful fetch
  /**
   * `true` when `error` is set but `balances` still holds data from a
   * previous successful fetch (stale-while-revalidate). `false` once a
   * fetch succeeds again, or when there is no data to be stale.
   */
  isStale: boolean
  refetch: () => void
}

/**
 * Fetches the XLM or asset balance for the connected wallet or any Stellar address.
 *
 * Follows a stale-while-revalidate contract: a failed fetch (e.g. a transient
 * Horizon rate limit while `watch` is polling) never clears `balances` or
 * `lastUpdated` — it only sets `error` and flips `isStale` to `true`, so the
 * consumer can keep rendering the last known-good balance instead of nothing.
 * `balances` is only cleared when the query itself changes (`address` or the
 * network), since that data is about a different account.
 *
 * @param options - Configuration options
 * @param options.address - The Stellar address to fetch balances for. Defaults to the connected wallet.
 * @param options.asset - The asset to return in `balance`. Defaults to XLM.
 * @param options.watch - When true, re-fetches on an interval (default false).
 * @param options.interval - Polling interval in ms when `watch` is true (default 10000).
 * @returns `{ balance, balances, loading, error, lastUpdated, isStale, refetch }`
 *
 * @example
 * const { balance, loading, isStale } = useBalance({ asset: "XLM", watch: true, interval: 5000 })
 */
export function useBalance({
  address,
  asset = "XLM",
  watch = false,
  interval = DEFAULT_WATCH_INTERVAL,
}: UseBalanceOptions = {}): UseBalanceReturn {
  const { network, wallet } = useStellarContext()
  const resolvedAddress = address ?? wallet.address

  const [balances, setBalances] = useState<Balance[]>([])
  const [loading, setLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [error, setError] = useState<StellarError | null>(null)

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
      // Stale-while-revalidate: a failed fetch keeps the last known-good
      // balances and lastUpdated in place, and only surfaces the error.
      setError(toStellarError(err))
    } finally {
      if (!cancelledRef.current && fetchId === requestRef.current) {
        setLoading(false)
      }
    }
  }, [resolvedAddress, network])

  // Clear stale data synchronously the moment the query changes (address or
  // network), before the new fetch resolves — otherwise there's a window
  // where the previous account's balances render under the new query.
  // Refetches (manual or via `watch`) must NOT hit this: they keep the old
  // data in place until the new fetch settles, per stale-while-revalidate.
  useEffect(() => {
    setBalances([])
    setLastUpdated(null)
    setError(null)
  }, [resolvedAddress, network])

  useEffect(() => {
    cancelledRef.current = false
    fetchBalances()

    // Guard against non-positive intervals that would busy-loop setInterval.
    const ms = interval > 0 ? interval : DEFAULT_WATCH_INTERVAL
    const id = watch ? setInterval(fetchBalances, ms) : null

    return () => {
      if (id) clearInterval(id)
      // Mark cancelled so a late response from this cycle can't update an
      // unmounted component. Superseded (but still-mounted) responses are
      // handled separately by requestRef above.
      cancelledRef.current = true
    }
  }, [fetchBalances, watch, interval])

  const match = balances.find(b => {
    if (asset === "XLM") return b.asset === "XLM"
    if (typeof asset === "object" && typeof b.asset === "object") {
      return b.asset.code === asset.code && b.asset.issuer === asset.issuer
    }
    return false
  })
  const balance = match?.balance ?? null
  const isStale = error !== null && balances.length > 0

  return {
    balance,
    balances,
    loading,
    error,
    lastUpdated,
    isStale,
    refetch: fetchBalances,
  }
}
