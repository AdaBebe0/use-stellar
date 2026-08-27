import { useStellarContext } from "../context/StellarProvider"
import { getHorizonServer, getAddressType } from "../utils"
import { toStellarError } from "../errors"
import { useQuery, accountKey } from "../cache"
import type { UseAccountExistsOptions, UseAccountExistsReturn } from "../types"

/**
 * Checks whether a Stellar account exists on the ledger.
 *
 * Results are cached in the shared QueryStore and deduplicated with useAccount
 * and useBalance, since all three call loadAccount under the hood.
 *
 * @example
 * const { exists, reason } = useAccountExists({ address: "G..." })
 */
export function useAccountExists({
  address,
  staleTime,
}: UseAccountExistsOptions & { staleTime?: number } = {}): UseAccountExistsReturn {
  const { network, networkConfig, queryStore } = useStellarContext()

  // Validate format before hitting the network.
  const formatValid = !address || isValidStellarAddress(address)

  const queryKey =
    address && formatValid
      ? accountKey(networkConfig.horizonUrl, network, address)
      : (["accountExists", "disabled"] as const)

  const {
    data,
    loading,
    error: rawError,
    refetch,
  } = useQuery<{ exists: boolean; reason: UseAccountExistsReturn["reason"] }>({
    queryKey,
    queryFn: async () => {
      const server = getHorizonServer(networkConfig)
      try {
        await server.loadAccount(address!)
        return { exists: true, reason: "exists" as const }
      } catch (err) {
        const stellarError = toStellarError(err)
        if (stellarError.code === "ACCOUNT_NOT_FOUND") {
          return { exists: false, reason: "not_funded" as const }
        }
        throw stellarError
      }
    },
    store: queryStore,
    staleTime,
    enabled: Boolean(address) && formatValid,
  })

  // Handle invalid format without touching the cache.
  if (address && !formatValid) {
    return {
      exists: false,
      reason: "invalid_format",
      loading: false,
      error: null,
      refetch,
    }
  }

    setLoading(true)
    setError(null)
    setExists(null) // Reset while loading, or keep previous? Instructions say: "null while loading / idle"

    if (getAddressType(address) === null) {
      setExists(false)
      setReason("invalid_format")
      setLoading(false)
      return
  // No address → idle
  if (!address) {
    return {
      exists: null,
      reason: "idle",
      loading: false,
      error: null,
      refetch,
    }
  }

    try {
      const server = getHorizonServer(network)
      await server.loadAccount(address)

      if (fetchId !== requestRef.current) return

      setExists(true)
      setReason("exists")
    } catch (err: unknown) {
      if (fetchId !== requestRef.current) return

      const stellarError = toStellarError(err)

      if (stellarError.code === "ACCOUNT_NOT_FOUND") {
        setExists(false)
        setReason("not_funded")
        setError(null)
      } else {
        setExists(null)
        // reason doesn't explicitly have an error state, but let's leave it as is <or change it?
        // Wait, if it fails, what is the reason? The requirements say:
        // "Any other failure (network, rate-limit) Α error via toStellarError, and leave exists as null."
        // We probably don't need to change reason, but let's set it to whatever it was or keep it.
        // Actually, if we just set error, it's fine.
        setError(stellarError)
      }
    } finally {
      if (fetchId === requestRef.current) {
        setLoading(false)
      }
    }
  }, [address, network])

  useEffect(() => {
    fetchExists()
    return () => {
      requestRef.current = -1
    }
  }, [fetchExists])

  return { exists, reason, loading, error, refetch: fetchExists }
}
  const error = rawError ? toStellarError(rawError) : null

  return {
    exists: data?.exists ?? null,
    reason: data?.reason ?? (loading ? "idle" : "idle"),
    loading,
    error,
    refetch,
  }
}
