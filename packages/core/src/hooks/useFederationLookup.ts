import { useState, useEffect, useRef, useCallback } from "react"
import { Federation } from "@stellar/stellar-sdk"
import { createStellarError, toStellarError } from "../errors"
import type {
  FederationRecord,
  UseFederationLookupOptions,
  UseFederationLookupReturn,
  StellarError,
} from "../types"

const FEDERATION_ADDRESS_RE = /^[^*]+\*[^*]+$/

export function useFederationLookup({
  address,
}: UseFederationLookupOptions = {}): UseFederationLookupReturn {
  const [record, setRecord] = useState<FederationRecord | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<StellarError | null>(null)
  const requestRef = useRef(0)

  const fetchFederation = useCallback(async () => {
    const normalizedAddress = typeof address === "string" ? address.trim() : null

    if (!normalizedAddress) {
      setRecord(null)
      setError(null)
      setLoading(false)
      return
    }

    if (!FEDERATION_ADDRESS_RE.test(normalizedAddress)) {
      setRecord(null)
      setError(
        createStellarError("VALIDATION_ERROR", "Federated address must be in the form name*domain.")
      )
      setLoading(false)
      return
    }

    const fetchId = ++requestRef.current
    setLoading(true)
    setError(null)

    try {
      const raw = await Federation.Server.resolve(normalizedAddress)
      if (fetchId !== requestRef.current) return

      setRecord({
        stellarAddress: normalizedAddress,
        accountId: raw.account_id,
        memoType: raw.memo_type ?? undefined,
        memo: raw.memo ?? undefined,
      })
    } catch (err) {
      if (fetchId !== requestRef.current) return
      setRecord(null)
      setError(toStellarError(err))
    } finally {
      if (fetchId === requestRef.current) {
        setLoading(false)
      }
    }
  }, [address])

  useEffect(() => {
    fetchFederation()

    return () => {
      requestRef.current = -1
    }
  }, [fetchFederation])

  return { record, loading, error, refetch: fetchFederation }
}
