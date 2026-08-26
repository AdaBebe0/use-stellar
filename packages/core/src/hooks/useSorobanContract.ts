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
import type { ContractCallOptions, ContractSpecLike, StellarError } from "../types"

/**
 * The account simulations run as when no wallet is connected.
 *
 * It exists only so a read can be attempted before connect. Simulating as this
 * account is simulating as a stranger: anything gated on the caller —
 * `require_auth`, a balance read, any permission check — is answered for the
 * wrong account, and the answer is wrong. Connect a wallet for those.
 */
export const ANONYMOUS_SIMULATION_SOURCE =
  "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5"

export interface UseSorobanContractReturn<T = unknown> {
  data: T | null
  loading: boolean
  error: StellarError | null
  refetch: () => void
}

/**
 * Converts a JavaScript value to an `xdr.ScVal`, refusing every case where the
 * correct XDR type cannot be known from the value alone.
 *
 * Soroban distinguishes `u32`, `u64`, `u128` and `i128`, and `Symbol`,
 * `String` and `Address` — a JavaScript `number` or `string` maps to any of
 * them. A guess produces a host type error the caller cannot diagnose from the
 * message, so an ambiguous value is a loud error naming what to pass instead.
 */
function toScVal(arg: unknown, index: number): xdr.ScVal {
  if (arg instanceof xdr.ScVal) return arg

  // Unambiguous: a JS boolean is a Soroban bool and nothing else.
  if (typeof arg === "boolean") return xdr.ScVal.scvBool(arg)

  if (typeof arg === "string") {
    throw new Error(
      `Argument ${index} is a string, which could be Symbol, String, or Address. ` +
        "Pass an xdr.ScVal so the type is explicit — " +
        'e.g. nativeToScVal(value, { type: "symbol" }), ' +
        "new Address(value).toScVal(), or xdr.ScVal.scvString(value)."
    )
  }

  if (typeof arg === "number") {
    throw new Error(
      `Argument ${index} is a number, which could be u32, i32, u64, i64, u128, or i128, ` +
        "and loses precision above Number.MAX_SAFE_INTEGER. " +
        'Pass an xdr.ScVal so the type is explicit — e.g. nativeToScVal(7, { type: "u32" }) ' +
        'or nativeToScVal(9007199254740993n, { type: "i128" }).'
    )
  }

  if (typeof arg === "bigint") {
    throw new Error(
      `Argument ${index} is a bigint, which could be u64, i64, u128, or i128. ` +
        'Pass an xdr.ScVal so the width is explicit — e.g. nativeToScVal(value, { type: "i128" }).'
    )
  }

  throw new Error(
    `Argument ${index} has unsupported type ${typeof arg}. ` +
      "Pass an xdr.ScVal directly for complex types."
  )
}

/**
 * A stable string for one argument, used to decide whether the simulation
 * needs re-running. `JSON.stringify` alone throws on a BigInt, which would
 * turn an argument the hook is about to reject anyway into a render-time
 * crash.
 */
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
 * Maps positional args onto the parameter names the spec declares, which is
 * the shape `funcArgsToScVals` expects. Values that are already `xdr.ScVal`
 * pass through the spec's converter untouched.
 */
function buildSpecArgs(
  spec: ContractSpecLike,
  method: string,
  args: readonly unknown[]
): Record<string, unknown> {
  const params = spec.getFunc(method).inputs() as { name: () => { toString: () => string } }[]

  if (args.length !== params.length) {
    throw new Error(
      `Contract method "${method}" expects ${params.length} argument(s), received ${args.length}.`
    )
  }

  const named: Record<string, unknown> = {}
  params.forEach((param, index) => {
    named[param.name().toString()] = args[index]
  })

  return named
}

/**
 * Reads a Soroban contract by simulating a call against the RPC server.
 *
 * Arguments are `xdr.ScVal[]`. That is the main road, not an escape hatch:
 * Soroban is strongly typed and a JavaScript value does not carry enough
 * information to choose between `u32` and `i128`, or between `Symbol`,
 * `String` and `Address`. Pass `spec` — the contract's own parsed spec — to
 * have its declared parameter types do the conversion instead.
 *
 * Simulation runs as the connected wallet. With no wallet connected it runs
 * anonymously, and anything that depends on the caller is answered for the
 * wrong account.
 *
 * @example
 * const { data } = useSorobanContract<bigint>({
 *   contractId: "CB...",
 *   method: "balance",
 *   args: [new Address(address).toScVal()],
 * })
 */
export function useSorobanContract<T = unknown>({
  contractId,
  method,
  args = [],
  spec,
  sourceAccount: sourceAccountOverride,
}: ContractCallOptions): UseSorobanContractReturn<T> {
  const { networkConfig, wallet } = useStellarContext()

  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<StellarError | null>(null)

  // Monotonic id used to ignore stale responses (args changed mid-flight, or
  // the component unmounted before the simulation resolved).
  const requestRef = useRef(0)

  const source = sourceAccountOverride ?? wallet.address ?? ANONYMOUS_SIMULATION_SOURCE

  // `args` is almost always an inline array literal, and `networkConfig` is
  // rebuilt by the provider on every render. Depending on either object
  // directly would re-run the simulation forever, so both are reduced to
  // primitives here.
  const argsKey = args.map(describeArg).join("|")
  const { sorobanUrl, networkPassphrase } = networkConfig

  // A spec is usually built inline (`spec={new contract.Spec(entries)}`), so
  // depending on the object itself would re-run the simulation on every
  // render. Hold the latest one in a ref and depend on whether one is present.
  const specRef = useRef(spec)
  specRef.current = spec
  const hasSpec = Boolean(spec)

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
      )
      setData(null)
      return
    }

    const fetchId = ++requestRef.current
    setLoading(true)
    setError(null)

    try {
      const server = new SorobanRpc.Server(sorobanUrl, {
        allowHttp: sorobanUrl.startsWith("http://"),
      })

      const activeSpec = specRef.current

      let scArgs: xdr.ScVal[]
      try {
        scArgs = activeSpec
          ? // The contract's spec declares each parameter's XDR type, so this
            // conversion is correct by construction rather than inferred.
            (activeSpec.funcArgsToScVals(
              method,
              buildSpecArgs(activeSpec, method, args)
            ) as xdr.ScVal[])
          : args.map(toScVal)
      } catch (argErr) {
        throw new Error(
          `Argument conversion failed: ${argErr instanceof Error ? argErr.message : String(argErr)}`
        )
      }

      const contract = new Contract(contractId)
      const operation = contract.call(method, ...scArgs)

      const simulationSource = new Account(source, "0")

      const tx = new TransactionBuilder(simulationSource, {
        // This envelope is only ever simulated, never signed or submitted, so
        // the fee is a placeholder the RPC ignores — there is no auction to
        // bid in. A real Soroban submission pays a resource fee derived from
        // the simulation result; that path belongs to the write hook.
        fee: BASE_FEE,
        networkPassphrase,
      })
        .addOperation(operation)
        .setTimeout(30)
        .build()

      const simResult = await server.simulateTransaction(tx)

      if (fetchId !== requestRef.current) return

      if (SorobanRpc.Api.isSimulationError(simResult)) {
        throw new Error(`RPC simulation error: ${simResult.error}`)
      }

      if (!SorobanRpc.Api.isSimulationSuccess(simResult)) {
        throw new Error("Simulation did not return a successful result.")
      }

      const returnVal = simResult.result?.retval
      if (!returnVal) {
        setData(null)
        return
      }

      try {
        setData(
          (activeSpec
            ? activeSpec.funcResToNative(method, returnVal)
            : scValToNative(returnVal)) as T
        )
      } catch {
        setData({ raw: returnVal.toXDR("base64") } as T)
      }
    } catch (err) {
      if (fetchId !== requestRef.current) return
      setData(null)
      setError(toStellarError(err))
    } finally {
      if (fetchId === requestRef.current) {
        setLoading(false)
      }
    }
    // `args` is covered by `argsKey`; `networkConfig` by its two primitives.
  }, [contractId, method, argsKey, sorobanUrl, networkPassphrase, source, hasSpec])

  useEffect(() => {
    callContract()

    return () => {
      // Cancel any in-flight simulation so a late response cannot update an
      // unmounted component.
      requestRef.current = -1
    }
  }, [callContract])

  return { data, loading, error, refetch: callContract }
}
