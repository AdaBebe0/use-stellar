import { useStellarContext } from "../context/StellarProvider"
import { getHorizonServer } from "../utils"
import { toStellarError } from "../errors"
import { useQuery, claimableBalanceKey } from "../cache"
import type { ClaimableBalance, StellarError } from "../types"

export interface UseClaimableBalanceOptions {
  address?: string | null // defaults to connected wallet address
  /** Override the provider-level staleTime for this hook instance (ms). */
  staleTime?: number
}

export interface UseClaimableBalanceReturn {
  balances: ClaimableBalance[]
  loading: boolean
  error: StellarError | null
  refetch: () => void
}

/**
 * Fetches claimable balances for an address.
 *
 * Results are cached in the shared QueryStore and deduplicated.
 *
 * @example
 * const { balances } = useClaimableBalance({ address: "G..." })
 */
export function useClaimableBalance({
  address,
  staleTime,
}: UseClaimableBalanceOptions = {}): UseClaimableBalanceReturn {
  const { network, networkConfig, wallet, queryStore } = useStellarContext()
  const resolvedAddress = address ?? wallet.address

  const queryKey = resolvedAddress
    ? claimableBalanceKey(networkConfig.horizonUrl, network, resolvedAddress)
    : (["claimableBalance", "disabled"] as const)

  // Monotonic id used to ignore stale responses (e.g. when the address/network
  // changes mid-flight, or the component unmounts before a fetch resolves).
  const requestRef = useRef(0)
  const abortControllerRef = useRef<AbortController | null>(null)

  const fetchBalances = useCallback(async () => {
    if (!resolvedAddress) {
      setBalances([])
      return
    }

    // Cancel any in-flight request before starting a new one.
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    const fetchId = ++requestRef.current
    const controller = new AbortController()
    abortControllerRef.current = controller

    setLoading(true)
    setError(null)

    try {
      const server = getHorizonServer(network)
      const result = await server.claimableBalances().claimant(resolvedAddress).call()

      if (fetchId !== requestRef.current) return

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
      if (fetchId !== requestRef.current) return
      const stellarError = toStellarError(err)

      // toStellarError may return null for abort errors
      if (!stellarError) {
        return
      }

      // A 404 means the account has no claimable balances — treat as empty
      if (stellarError?.code === "ACCOUNT_NOT_FOUND") {
        setBalances([])
      } else if (stellarError) {
        setBalances([])
        setError(stellarError)
      }
    } finally {
      if (fetchId === requestRef.current) {
        setLoading(false)
  const {
    data,
    loading,
    error: rawError,
    refetch,
  } = useQuery<ClaimableBalance[]>({
    queryKey,
    queryFn: async () => {
      const server = getHorizonServer(networkConfig)
      try {
        const result = await server.claimableBalances().claimant(resolvedAddress!).call()
        return result.records.map(record => ({
          id: record.id,
          asset: record.asset,
          amount: record.amount,
          claimants: record.claimants.map(c => ({
            destination: c.destination,
            predicate: c.predicate as object,
          })),
          sponsor: record.sponsor,
        }))
      } catch (err) {
        const stellarError = toStellarError(err)
        // A 404 means the account has no claimable balances — treat as empty
        if (stellarError.code === "ACCOUNT_NOT_FOUND") {
          return []
        }
        throw stellarError
      }
    },
    store: queryStore,
    staleTime,
    enabled: Boolean(resolvedAddress),
  })

  const error = rawError ? toStellarError(rawError) : null

  return { balances: data ?? [], loading, error, refetch }
}
