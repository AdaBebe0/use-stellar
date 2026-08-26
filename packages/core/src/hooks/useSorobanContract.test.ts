/**
 * Tests for useSorobanContract — Soroban RPC simulation.
 * All RPC calls are mocked so no network is needed.
 */

import { act, renderHook } from "@testing-library/react"
import { xdr } from "@stellar/stellar-sdk"

// ── Mock StellarProvider ──────────────────────────────────────────────────────
jest.mock("../context/StellarProvider", () => ({
  useStellarContext: () => ({
    networkConfig: {
      network: "testnet",
      sorobanUrl: "https://soroban-testnet.stellar.org",
      horizonUrl: "https://horizon-testnet.stellar.org",
    },
  }),
}))

// ── Shared mock state ─────────────────────────────────────────────────────────
let mockSimResult: unknown = null
let mockSimError: Error | null = null
const mockSimulateTransaction = jest.fn()

jest.mock("@stellar/stellar-sdk", () => {
  const actual = jest.requireActual("../../node_modules/@stellar/stellar-sdk/lib/index.js")

  class MockServer {
    simulateTransaction(transaction: unknown) {
      return mockSimulateTransaction(transaction)
    }
  }

  const MockSorobanRpc = {
    ...actual.SorobanRpc,
    Server: MockServer,
    Api: {
      ...actual.SorobanRpc?.Api,
      isSimulationError: (r: unknown) =>
        typeof r === "object" && r !== null && "error" in r && !("result" in r),
      isSimulationSuccess: (r: unknown) => typeof r === "object" && r !== null && "result" in r,
    },
  }

  return {
    ...actual,
    SorobanRpc: MockSorobanRpc,
  }
})

// Import AFTER mock is set up
import { useSorobanContract } from "./useSorobanContract"

const VALID_CONTRACT_ID = "CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD2KM"
const OTHER_CONTRACT_ID = "CAAQCAIBAEAQCAIBAEAQCAIBAEAQCAIBAEAQCAIBAEAQCAIBAEAQC526"

beforeEach(() => {
  mockSimResult = null
  mockSimError = null
  mockSimulateTransaction.mockImplementation(async () => {
    if (mockSimError) throw mockSimError
    return mockSimResult
  })
})

async function flushHookEffects() {
  await act(async () => {
    await Promise.resolve()
  })
}

// ── Success tests ─────────────────────────────────────────────────────────────

describe("useSorobanContract — success", () => {
  it("returns decoded data on successful simulation", async () => {
    const retval = xdr.ScVal.scvBool(true)
    mockSimResult = { result: { retval }, cost: {}, latestLedger: 1 }

    const { result } = renderHook(() =>
      useSorobanContract({ contractId: VALID_CONTRACT_ID, method: "get_value" })
    )

    await flushHookEffects()

    expect(result.current.error).toBeNull()
    expect(result.current.data).toBe(true)
  })

  it("sets data to null when simulation returns no retval", async () => {
    mockSimResult = { result: { retval: undefined }, cost: {}, latestLedger: 1 }

    const { result } = renderHook(() =>
      useSorobanContract({ contractId: VALID_CONTRACT_ID, method: "noop" })
    )

    await flushHookEffects()

    expect(result.current.data).toBeNull()
    expect(result.current.error).toBeNull()
  })
})

// ── Failure tests ─────────────────────────────────────────────────────────────

describe("useSorobanContract — errors", () => {
  it("sets error when contract ID is invalid", async () => {
    const { result } = renderHook(() =>
      useSorobanContract({ contractId: "INVALID_ID", method: "balance" })
    )

    await flushHookEffects()

    expect(result.current.error?.message).toMatch(/Invalid contract ID/)
    expect(result.current.data).toBeNull()
  })

  it("sets error on RPC simulation error response", async () => {
    mockSimResult = { error: "contract not found" }

    const { result } = renderHook(() =>
      useSorobanContract({ contractId: VALID_CONTRACT_ID, method: "balance" })
    )

    await flushHookEffects()

    expect(result.current.error?.message).toMatch(/RPC simulation error/)
    expect(result.current.data).toBeNull()
  })

  it("sets error when RPC throws a network error", async () => {
    mockSimError = new Error("Network error")

    const { result } = renderHook(() =>
      useSorobanContract({ contractId: VALID_CONTRACT_ID, method: "balance" })
    )

    await flushHookEffects()

    expect(result.current.error?.code).toBe("NETWORK_ERROR")
    expect(result.current.data).toBeNull()
  })

  it("does not call RPC when contractId is empty", async () => {
    const { result } = renderHook(() => useSorobanContract({ contractId: "", method: "balance" }))

    await flushHookEffects()

    expect(result.current.error).toBeNull()
    expect(result.current.data).toBeNull()
  })

  it("does not call RPC when method is empty", async () => {
    const { result } = renderHook(() =>
      useSorobanContract({ contractId: VALID_CONTRACT_ID, method: "" })
    )

    await flushHookEffects()

    expect(result.current.data).toBeNull()
  })
})

describe("useSorobanContract — simulation identity", () => {
  beforeEach(() => {
    mockSimResult = { result: { retval: undefined }, cost: {}, latestLedger: 1 }
  })

  it("simulates exactly once when mounted", async () => {
    renderHook(() => useSorobanContract({ contractId: VALID_CONTRACT_ID, method: "balance" }))

    await flushHookEffects()

    expect(mockSimulateTransaction).toHaveBeenCalledTimes(1)
  })

  it("does not resimulate across parent renders with inline args", async () => {
    const { rerender } = renderHook(
      ({ renderNumber }: { renderNumber: number }) => {
        void renderNumber
        return useSorobanContract({
          contractId: VALID_CONTRACT_ID,
          method: "sum",
          args: [1, 2],
        })
      },
      { initialProps: { renderNumber: 0 } }
    )

    await flushHookEffects()

    for (let renderNumber = 1; renderNumber <= 5; renderNumber += 1) {
      rerender({ renderNumber })
    }
    await flushHookEffects()

    expect(mockSimulateTransaction).toHaveBeenCalledTimes(1)
  })

  it("uses XDR serialization to stabilize equivalent ScVal arguments", async () => {
    const { rerender } = renderHook(
      ({ renderNumber }: { renderNumber: number }) => {
        void renderNumber
        return useSorobanContract({
          contractId: VALID_CONTRACT_ID,
          method: "enabled",
          args: [xdr.ScVal.scvBool(true)],
        })
      },
      { initialProps: { renderNumber: 0 } }
    )

    await flushHookEffects()

    rerender({ renderNumber: 1 })
    await flushHookEffects()

    expect(mockSimulateTransaction).toHaveBeenCalledTimes(1)
  })

  it("simulates once for each changed contract ID, method, or argument value", async () => {
    const { rerender } = renderHook(
      ({ contractId, method, args }: { contractId: string; method: string; args: unknown[] }) =>
        useSorobanContract({ contractId, method, args }),
      {
        initialProps: {
          contractId: VALID_CONTRACT_ID,
          method: "sum",
          args: [1, 2],
        },
      }
    )

    await flushHookEffects()

    rerender({ contractId: OTHER_CONTRACT_ID, method: "sum", args: [1, 2] })
    await flushHookEffects()
    expect(mockSimulateTransaction).toHaveBeenCalledTimes(2)

    rerender({ contractId: OTHER_CONTRACT_ID, method: "multiply", args: [1, 2] })
    await flushHookEffects()
    expect(mockSimulateTransaction).toHaveBeenCalledTimes(3)

    rerender({ contractId: OTHER_CONTRACT_ID, method: "multiply", args: [1, 3] })
    await flushHookEffects()

    expect(mockSimulateTransaction).toHaveBeenCalledTimes(4)
  })

  it("sets an invalid-contract error once without entering a render loop", async () => {
    const { result, rerender } = renderHook(
      ({ renderNumber }: { renderNumber: number }) => {
        void renderNumber
        return useSorobanContract({ contractId: "INVALID_ID", method: "balance" })
      },
      { initialProps: { renderNumber: 0 } }
    )

    await flushHookEffects()
    expect(result.current.error?.message).toMatch(/Invalid contract ID/)
    const initialError = result.current.error

    for (let renderNumber = 1; renderNumber <= 5; renderNumber += 1) {
      rerender({ renderNumber })
    }
    await flushHookEffects()

    expect(result.current.error).toBe(initialError)
    expect(mockSimulateTransaction).not.toHaveBeenCalled()
  })
})
