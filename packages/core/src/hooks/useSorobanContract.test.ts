/**
 * Tests for useSorobanContract — Soroban RPC simulation.
 * All RPC calls are mocked so no network is needed.
 */

import { renderHook, waitFor } from "@testing-library/react"
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

// `moduleNameMapper` in jest.config.js redirects "@stellar/stellar-sdk" to the
// manual mock in src/__mocks__, and that redirect applies to
// `jest.requireActual` too — so spreading the "real" module here gave no
// Contract, no xdr and no SorobanRpc, and the hook died on
// "Contract is not a constructor". Declare exactly what the hook imports.
jest.mock("@stellar/stellar-sdk", () => {
  class MockScVal {
    constructor(public readonly value: unknown) {}
    toXDR() {
      return "base64-encoded"
    }
  }

  const xdr = {
    ScVal: Object.assign(MockScVal, {
      scvBool: (v: boolean) => new MockScVal(v),
      scvString: (v: string) => new MockScVal(v),
      scvU64: (v: unknown) => new MockScVal(v),
      scvI128: (v: unknown) => new MockScVal(v),
    }),
    Int128Parts: class Int128Parts {
      constructor(public readonly parts: unknown) {}
    },
    Int64: { fromString: (s: string) => s },
    Uint64: { fromString: (s: string) => s },
  }

  class MockServer {
    async simulateTransaction() {
      if (mockSimError) throw mockSimError
      return mockSimResult
    }
  }

  return {
    xdr,
    scValToNative: (v: MockScVal) => v.value,
    Contract: class Contract {
      constructor(public readonly id: string) {}
      call() {
        return { type: "invokeHostFunction" }
      }
    },
    Account: class Account {
      constructor(
        public readonly id: string,
        public readonly sequence: string
      ) {}
    },
    Networks: {
      PUBLIC: "Public Global Stellar Network ; September 2015",
      TESTNET: "Test SDF Network ; September 2015",
    },
    BASE_FEE: "100",
    TransactionBuilder: function TransactionBuilder() {
      const builder = {
        addOperation: () => builder,
        setTimeout: () => builder,
        build: () => ({ toXDR: () => "unsigned_xdr" }),
      }
      return builder
    },
    SorobanRpc: {
      Server: MockServer,
      Api: {
        isSimulationError: (r: unknown) =>
          typeof r === "object" && r !== null && "error" in r && !("result" in r),
        isSimulationSuccess: (r: unknown) => typeof r === "object" && r !== null && "result" in r,
      },
    },
  }
})

// Import AFTER mock is set up
import { useSorobanContract } from "./useSorobanContract"

const VALID_CONTRACT_ID = "CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD2KM"

beforeEach(() => {
  mockSimResult = null
  mockSimError = null
})

// ── Success tests ─────────────────────────────────────────────────────────────

describe("useSorobanContract — success", () => {
  it("returns decoded data on successful simulation", async () => {
    const retval = xdr.ScVal.scvBool(true)
    mockSimResult = { result: { retval }, cost: {}, latestLedger: 1 }

    const { result } = renderHook(() =>
      useSorobanContract({ contractId: VALID_CONTRACT_ID, method: "get_value" })
    )

    await waitFor(() => expect(result.current.loading).toBe(false), { timeout: 5000 })

    expect(result.current.error).toBeNull()
    expect(result.current.data).toBe(true)
  })

  it("sets data to null when simulation returns no retval", async () => {
    mockSimResult = { result: { retval: undefined }, cost: {}, latestLedger: 1 }

    const { result } = renderHook(() =>
      useSorobanContract({ contractId: VALID_CONTRACT_ID, method: "noop" })
    )

    await waitFor(() => expect(result.current.loading).toBe(false), { timeout: 5000 })

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

    await waitFor(() => expect(result.current.loading).toBe(false), { timeout: 5000 })

    // `error` is a StellarError, not a string. "Invalid contract ID …" matches
    // no classifier, so toStellarError falls through to UNKNOWN and keeps it.
    expect(result.current.error?.message).toMatch(/Invalid contract ID/)
    expect(result.current.data).toBeNull()
  })

  it("sets error on RPC simulation error response", async () => {
    mockSimResult = { error: "contract not found" }

    const { result } = renderHook(() =>
      useSorobanContract({ contractId: VALID_CONTRACT_ID, method: "balance" })
    )

    await waitFor(() => expect(result.current.loading).toBe(false), { timeout: 5000 })

    expect(result.current.error?.message).toMatch(/RPC simulation error/)
    expect(result.current.data).toBeNull()
  })

  it("sets error when RPC throws a network error", async () => {
    mockSimError = new Error("Network error")

    const { result } = renderHook(() =>
      useSorobanContract({ contractId: VALID_CONTRACT_ID, method: "balance" })
    )

    await waitFor(() => expect(result.current.loading).toBe(false), { timeout: 5000 })

    // toStellarError classifies "Network error" as NETWORK_ERROR and swaps in
    // the standard copy, so the code is what identifies it — not the message.
    expect(result.current.error?.code).toBe("NETWORK_ERROR")
    expect(result.current.data).toBeNull()
  })

  it("does not call RPC when contractId is empty", async () => {
    const { result } = renderHook(() => useSorobanContract({ contractId: "", method: "balance" }))

    await waitFor(() => expect(result.current.loading).toBe(false), { timeout: 5000 })

    expect(result.current.error).toBeNull()
    expect(result.current.data).toBeNull()
  })

  it("does not call RPC when method is empty", async () => {
    const { result } = renderHook(() =>
      useSorobanContract({ contractId: VALID_CONTRACT_ID, method: "" })
    )

    await waitFor(() => expect(result.current.loading).toBe(false), { timeout: 5000 })

    expect(result.current.data).toBeNull()
  })
})
