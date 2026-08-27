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
  const abortControllerRef = useRef<AbortController | null>(null)

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
      // Note: Federation.Server.resolve doesn't support abort signals directly
      // in the current SDK version, but we still track the controller for future use
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
      const stellarError = toStellarError(err)
      if (stellarError) {
        setRecord(null)
        setError(stellarError)
      }
    } finally {
      if (fetchId === requestRef.current) {
        setLoading(false)
        abortControllerRef.current = null
      }
    }
  }, [address])

  useEffect(() => {
    fetchFederation()

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
        abortControllerRef.current = null
      }
      requestRef.current = -1
    }
  }, [fetchFederation])

  return { record, loading, error, refetch: fetchFederation }
}
