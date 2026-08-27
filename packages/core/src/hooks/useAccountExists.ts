import { useState, useEffect, useCallback, useRef } from "react"
import { useStellarContext } from "../context/StellarProvider"
import { getHorizonServer, isValidStellarAddress } from "../utils"
import { toStellarError } from "../errors"
import type { UseAccountExistsOptions, UseAccountExistsReturn } from "../types"

export function useAccountExists({
  address,
}: UseAccountExistsOptions = {}): UseAccountExistsReturn {
  const { network } = useStellarContext()

  const [exists, setExists] = useState<boolean | null>(null)
  const [reason, setReason] = useState<UseAccountExistsReturn["reason"]>("idle")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<UseAccountExistsReturn["error"]>(null)

  const requestRef = useRef(0)
  const abortControllerRef = useRef<AbortController | null>(null)

  const fetchExists = useCallback(async () => {
    // Cancel any in-flight request before starting a new one.
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    const fetchId = ++requestRef.current

    if (!address) {
      setExists(null)
      setReason("idle")
      setError(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    setExists(null) // Reset while loading, or keep previous? Instructions say: "null while loading / idle"

    if (!isValidStellarAddress(address)) {
      setExists(false)
      setReason("invalid_format")
      setLoading(false)
      return
    }

    const controller = new AbortController()
    abortControllerRef.current = controller

    try {
      const server = getHorizonServer(network)
      await server.loadAccount(address)

      if (fetchId !== requestRef.current) return

      setExists(true)
      setReason("exists")
    } catch (err: unknown) {
      if (fetchId !== requestRef.current) return

      const stellarError = toStellarError(err)

      if (stellarError?.code === "ACCOUNT_NOT_FOUND") {
        setExists(false)
        setReason("not_funded")
        setError(null)
      } else if (stellarError) {
        setExists(null)
        setError(stellarError)
      }
    } finally {
      if (fetchId === requestRef.current) {
        setLoading(false)
        abortControllerRef.current = null
      }
    }
  }, [address, network])

  useEffect(() => {
    fetchExists()
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
        abortControllerRef.current = null
      }
      requestRef.current = -1
    }
  }, [fetchExists])

  return { exists, reason, loading, error, refetch: fetchExists }
}
