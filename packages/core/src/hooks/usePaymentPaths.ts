import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { Asset as StellarAsset } from "@stellar/stellar-sdk"
import { useStellarContext } from "../context/StellarProvider"
import { getHorizonServer, isNativeAsset, isIssuedAsset } from "../utils"
import { createStellarError, toStellarError } from "../errors"
import type {
  Asset,
  PaymentPath,
  StellarError,
  UsePaymentPathsOptions,
  UsePaymentPathsReturn,
} from "../types"

// Default polling interval (ms) used when `watch` is enabled without an
// explicit `interval`. Matches useBalance so the API is consistent.
const DEFAULT_WATCH_INTERVAL = 10_000

/** Digits of precision kept when computing a rate. */
const RATE_SCALE = 7

/** Stellar amounts carry 7 decimal places. */
const STROOP_DECIMALS = 7

/**
 * Parses a Stellar decimal amount string into an integer number of stroops.
 *
 * String arithmetic, not `parseFloat` — a float cannot represent every
 * 7-decimal amount and the rounding shows up as a wrong quote.
 */
function toStroops(amount: string): bigint {
  const trimmed = amount.trim()
  if (!/^\d+(\.\d+)?$/.test(trimmed)) {
    throw new Error(`Invalid amount "${amount}". Expected a positive decimal string.`)
  }

  const [whole, fraction = ""] = trimmed.split(".")
  const padded = (fraction + "0".repeat(STROOP_DECIMALS)).slice(0, STROOP_DECIMALS)

  return BigInt(whole) * BigInt(10) ** BigInt(STROOP_DECIMALS) + BigInt(padded)
}

/**
 * Divides two stroop amounts into a fixed-precision decimal string.
 *
 * Done entirely in BigInt. `parseFloat` here is the same trap `formatAmount`
 * fell into — it silently loses precision on values a swap UI shows to a user.
 */
function divideToDecimalString(numerator: bigint, denominator: bigint): string {
  if (denominator === BigInt(0)) return "0"

  const scale = BigInt(10) ** BigInt(RATE_SCALE)
  const scaled = (numerator * scale) / denominator

  const whole = scaled / scale
  const fraction = (scaled % scale).toString().padStart(RATE_SCALE, "0").replace(/0+$/, "")

  return fraction ? `${whole}.${fraction}` : whole.toString()
}

/** Compares two rate strings without converting either to a float. */
function compareRates(a: string, b: string): number {
  const [aWhole, aFraction = ""] = a.split(".")
  const [bWhole, bFraction = ""] = b.split(".")

  const width = Math.max(aFraction.length, bFraction.length)
  const left = BigInt(aWhole + aFraction.padEnd(width, "0"))
  const right = BigInt(bWhole + bFraction.padEnd(width, "0"))

  if (left === right) return 0
  return left > right ? 1 : -1
}

function toStellarAsset(asset: Asset): StellarAsset {
  if (isNativeAsset(asset)) return StellarAsset.native()
  if (isIssuedAsset(asset)) return new StellarAsset(asset.code, asset.issuer)

  throw createStellarError(
    "VALIDATION_ERROR",
    `Unsupported asset ${JSON.stringify(asset)}. Pass "XLM" or { code, issuer }.`
  )
}

/** Horizon's record shape for one candidate path. */
interface HorizonPathRecord {
  source_amount: string
  destination_amount: string
  path: {
    asset_type: string
    asset_code?: string
    asset_issuer?: string
  }[]
}

function toAsset(hop: HorizonPathRecord["path"][number]): Asset {
  if (hop.asset_type === "native") return "XLM"
  return { code: hop.asset_code ?? "", issuer: hop.asset_issuer ?? "" }
}

function toPaymentPath(record: HorizonPathRecord): PaymentPath {
  return {
    path: record.path.map(toAsset),
    sourceAmount: record.source_amount,
    destinationAmount: record.destination_amount,
    rate: divideToDecimalString(
      toStroops(record.destination_amount),
      toStroops(record.source_amount)
    ),
  }
}

/**
 * Finds the routes and quotes for converting one asset into another.
 *
 * Two modes, matching Horizon:
 * - `strictSend` — you pin what leaves your account, and ask what the
 *   recipient can get.
 * - `strictReceive` — you pin what must arrive, and ask what it will cost.
 *
 * Paths come back best-rate-first, so `paths[0]` is the route a UI should show
 * by default. `rate` is `destinationAmount / sourceAmount` computed in BigInt.
 *
 * **Quotes go stale in seconds.** `lastUpdated` says when the current numbers
 * were fetched. Re-fetch immediately before you build a transaction, and
 * derive the slippage bound `usePathPayment` requires from the fresh quote.
 *
 * An empty `paths` array is a normal result: it means no route exists between
 * the two assets, which a UI should say in those words. It is not an error.
 *
 * @example
 * const { paths, lastUpdated } = usePaymentPaths({
 *   mode: "strictSend",
 *   sourceAsset: "XLM",
 *   sourceAmount: "100",
 *   destinationAsset: { code: "USDC", issuer: "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5" },
 * })
 */
export function usePaymentPaths(options: UsePaymentPathsOptions): UsePaymentPathsReturn {
  const {
    mode,
    sourceAsset,
    destinationAsset,
    enabled = true,
    watch = false,
    interval = DEFAULT_WATCH_INTERVAL,
  } = options

  const sourceAmount = mode === "strictSend" ? options.sourceAmount : undefined
  const destinationAmount = mode === "strictReceive" ? options.destinationAmount : undefined
  const destinationAddress = mode === "strictSend" ? options.destinationAddress : undefined
  const sourceAddress = mode === "strictReceive" ? options.sourceAddress : undefined

  const { network } = useStellarContext()

  const [paths, setPaths] = useState<PaymentPath[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<StellarError | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  // Monotonic id used to drop out-of-order responses and any response that
  // lands after unmount.
  const requestRef = useRef(0)

  // Depend on asset primitives, not the objects themselves. An inline
  // `sourceAsset={{ code, issuer }}` prop is a new object every render, and
  // depending on it would hand every consumer a new `paths` array each time.
  const sourceKey = assetKey(sourceAsset)
  const destinationKey = assetKey(destinationAsset)

  const fetchPaths = useCallback(async () => {
    if (!enabled) return

    const fetchId = ++requestRef.current
    setLoading(true)
    setError(null)

    try {
      if (mode === "strictSend" && !sourceAmount) {
        throw createStellarError(
          "VALIDATION_ERROR",
          'usePaymentPaths: "strictSend" mode requires `sourceAmount`.'
        )
      }
      if (mode === "strictReceive" && !destinationAmount) {
        throw createStellarError(
          "VALIDATION_ERROR",
          'usePaymentPaths: "strictReceive" mode requires `destinationAmount`.'
        )
      }

      const server = getHorizonServer(network)
      const source = toStellarAsset(sourceAsset)
      const destination = toStellarAsset(destinationAsset)

      const builder =
        mode === "strictSend"
          ? server.strictSendPaths(
              source,
              sourceAmount as string,
              destinationAddress ?? [destination]
            )
          : server.strictReceivePaths(
              sourceAddress ?? [source],
              destination,
              destinationAmount as string
            )

      const response = await builder.call()

      if (fetchId !== requestRef.current) return

      const records = (response.records ?? []) as unknown as HorizonPathRecord[]
      const converted = records
        .map(toPaymentPath)
        // Best rate first: the most destination asset per unit of source
        // asset. `paths[0]` is the route a UI should show by default.
        .sort((a, b) => compareRates(b.rate, a.rate))

      setPaths(converted)
      setLastUpdated(new Date())
    } catch (err) {
      if (fetchId !== requestRef.current) return
      setPaths([])
      setLastUpdated(null)
      setError(toStellarError(err))
    } finally {
      if (fetchId === requestRef.current) {
        setLoading(false)
      }
    }
    // Asset objects are covered by their primitive keys above.
  }, [
    enabled,
    mode,
    sourceKey,
    destinationKey,
    sourceAmount,
    destinationAmount,
    destinationAddress,
    sourceAddress,
    network,
  ])

  useEffect(() => {
    if (!enabled) {
      // `enabled: false` issues no request at all, and leaves whatever the
      // last enabled render produced untouched.
      return
    }

    fetchPaths()

    // Guard against non-positive intervals that would busy-loop setInterval.
    const ms = interval > 0 ? interval : DEFAULT_WATCH_INTERVAL
    const id = watch ? setInterval(fetchPaths, ms) : null

    return () => {
      if (id) clearInterval(id)
      // Cancel any in-flight request so a late or out-of-order response cannot
      // update an unmounted component.
      requestRef.current = -1
    }
  }, [fetchPaths, enabled, watch, interval])

  // Stable identity: consumers put `paths` in dependency arrays.
  const value = useMemo<UsePaymentPathsReturn>(
    () => ({ paths, loading, error, lastUpdated, refetch: fetchPaths }),
    [paths, loading, error, lastUpdated, fetchPaths]
  )

  return value
}

/** A stable primitive key for an asset, for use in dependency arrays. */
function assetKey(asset: Asset): string {
  if (isNativeAsset(asset)) return "native"
  if (isIssuedAsset(asset)) return `${asset.code}:${asset.issuer}`
  return String(asset)
}
