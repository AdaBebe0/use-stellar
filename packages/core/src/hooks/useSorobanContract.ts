import { useState, useEffect, useCallback, useRef } from "react"
import {
  SorobanRpc,
  Contract,
  xdr,
  scValToNative,
  TransactionBuilder,
  BASE_FEE,
  Account,
} from "@stellar/stellar-sdk"
import { useStellarContext } from "../context/StellarProvider"
import { toStellarError } from "../errors"
import { useQuery, sorobanContractKey } from "../cache"
import type { ContractCallOptions, ContractSpecLike, StellarError } from "../types"

/**
 * The account simulations run as when no wallet is connected.
 */
export const ANONYMOUS_SIMULATION_SOURCE =
  "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5"

export interface UseSorobanContractReturn<T = unknown> {
  data: T | null
  loading: boolean
  error: StellarError | null
  refetch: () => void
}

function toScVal(arg: unknown, index: number): xdr.ScVal {
  if (arg instanceof xdr.ScVal) return arg
  if (typeof arg === "boolean") return xdr.ScVal.scvBool(arg)
  if (typeof arg === "string") {
    throw new Error(
      `Argument ${index} is a string, which could be Symbol, String, or Address. ` +
        "Pass an xdr.ScVal so the type is explicit."
    )
  }
  if (typeof arg === "number") {
    throw new Error(
      `Argument ${index} is a number, which could be u32, i32, u64, i64, u128, or i128. ` +
        "Pass an xdr.ScVal so the type is explicit."
    )
  }
  if (typeof arg === "bigint") {
    throw new Error(
      `Argument ${index} is a bigint, which could be u64, i64, u128, or i128. ` +
        "Pass an xdr.ScVal so the width is explicit."
    )
  }
  throw new Error(
    `Argument ${index} has unsupported type ${typeof arg}. Pass an xdr.ScVal directly.`
  )
}

function describeArg(arg: unknown): string {
  if (arg instanceof xdr.ScVal) return arg.toXDR("base64")
  if (typeof arg === "bigint") return `${arg}n`
  try {
    return JSON.stringify(arg) ?? String(arg)
  } catch {
    return String(arg)
  }
}

function isValidContractId(id: string): boolean {
  return typeof id === "string" && /^C[A-Z2-7]{55}$/.test(id)
}

/**
 * Module-level so an omitted `args` has a stable identity across renders. A
 * `= []` default allocates a fresh array every render, which would change the
 * `callContract` identity every render and re-fire the effect forever.
 */
const EMPTY_ARGS: unknown[] = []

/**
 * Holds `args` steady while its contents are unchanged, so callers can pass an
 * inline array literal without driving an render loop.
 *
 * Compares by identity per element: primitives (the common case — addresses,
 * amounts, method arguments) settle immediately. Callers passing freshly
 * constructed `xdr.ScVal` objects inline should still memoize them, since a new
 * object each render is genuinely a new value.
 */
function useStableArgs(args: unknown[]): unknown[] {
  const ref = useRef(args)
  const prev = ref.current
  const unchanged = prev.length === args.length && prev.every((v, i) => Object.is(v, args[i]))
  if (!unchanged) ref.current = args
  return ref.current
}

export function useSorobanContract({
  contractId,
  method,
  args = EMPTY_ARGS,
}: ContractCallOptions): UseSorobanContractReturn {
  const { networkConfig } = useStellarContext()
  // Depend on the two fields actually used, not the object: a provider that
  // rebuilds its context value each render would otherwise re-fire the effect
  // on every render.
  const { sorobanUrl, network } = networkConfig
  const stableArgs = useStableArgs(args)

  const [data, setData] = useState<unknown | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<StellarError | null>(null)

  const callContract = useCallback(async () => {
    if (!contractId || !method) {
      setData(null)
      setError(null)
      return
    }

    if (!isValidContractId(contractId)) {
      setError(
        toStellarError(
          new Error(
            `Invalid contract ID "${contractId}". Must be a C-prefixed 56-character Stellar address.`
          )
        )
      }

    try {
      const server = new SorobanRpc.Server(sorobanUrl, {
        allowHttp: sorobanUrl.startsWith("http://"),
      })

      let scArgs: xdr.ScVal[]
      try {
        scArgs = stableArgs.map(toScVal)
      } catch (argErr) {
        throw new Error(
          `Argument conversion failed: ${argErr instanceof Error ? argErr.message : String(argErr)}`
        )
      }

      const contract = new Contract(contractId)
      const operation = contract.call(method, ...scArgs)
      const simulationSource = new Account(source, "0")

      const sourceAccount = new Account(
        "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5",
        "0"
      )
      const networkPassphrase = network === "mainnet" ? Networks.PUBLIC : Networks.TESTNET

      const tx = new TransactionBuilder(sourceAccount, {
        fee: BASE_FEE,
        networkPassphrase,
      })
        .addOperation(operation)
        .setTimeout(30)
        .build()

      const simResult = await server.simulateTransaction(tx)

      if (SorobanRpc.Api.isSimulationError(simResult)) {
        throw new Error(`RPC simulation error: ${simResult.error}`)
      }
      if (!SorobanRpc.Api.isSimulationSuccess(simResult)) {
        throw new Error("Simulation did not return a successful result.")
      }

      const returnVal = simResult.result?.retval
      if (!returnVal) return null as unknown as T

      try {
        return (spec ? spec.funcResToNative(method, returnVal) : scValToNative(returnVal)) as T
      } catch {
        return { raw: returnVal.toXDR("base64") } as T
      }
    } catch (err) {
      setData(null)
      setError(toStellarError(err))
    } finally {
      setLoading(false)
    }
  }, [contractId, method, stableArgs, sorobanUrl, network])

  useEffect(() => {
    callContract()
  }, [callContract])

  return { data, loading, error, refetch: callContract }
}
