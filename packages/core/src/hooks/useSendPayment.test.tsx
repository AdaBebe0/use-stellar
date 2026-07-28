import React from "react"
import { renderHook } from "@testing-library/react"
import { useSendPayment } from "./useSendPayment"
import { StellarProvider } from "../context/StellarProvider"
import type { ReactNode } from "react"
import type { WalletState } from "../types"

// Mock the Stellar SDK and Freighter API
jest.mock("@stellar/stellar-sdk")
jest.mock("@stellar/freighter-api")
jest.mock("../utils")

// Mock isBrowser to return true for these tests
jest.mock("../utils", () => ({
  ...jest.requireActual("../utils"),
  isBrowser: () => true,
}))

// Mock the context to inject wallet state
const mockSetWallet = jest.fn()
let mockWalletState: WalletState = {
  connected: false,
  address: null,
  network: null,
  wallet: null,
  connecting: false,
  error: null,
  walletNetwork: null,
  walletName: null,
}

jest.mock("../context/StellarProvider", () => {
  const actual = jest.requireActual("../context/StellarProvider")
  return {
    ...actual,
    useStellarContext: () => ({
      network: "testnet",
      networkConfig: {
        network: "testnet",
        horizonUrl: "https://horizon-testnet.stellar.org",
        sorobanUrl: "https://soroban-testnet.stellar.org",
      },
      wallet: mockWalletState,
      setWallet: mockSetWallet,
    }),
  }
})

function createWrapper(network: "testnet" | "mainnet" = "testnet") {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <StellarProvider network={network}>{children}</StellarProvider>
  }
}

describe("useSendPayment - Payment Flow", () => {
  beforeEach(() => {
    // Set up wallet state for a connected wallet
    mockWalletState = {
      connected: true,
      address: "GABC123",
      network: "testnet",
      wallet: "freighter",
      connecting: false,
      error: null,
      walletNetwork: "testnet",
      walletName: "Freighter",
    }

    // Mock stellar-sdk
    const { TransactionBuilder, Networks, Operation } = jest.requireActual("@stellar/stellar-sdk")
    const sdk = jest.requireMock("@stellar/stellar-sdk") as any
    sdk.TransactionBuilder = TransactionBuilder
    sdk.Networks = Networks
    sdk.Operation = Operation
    sdk.BASE_FEE = "100"
    sdk.Memo = { text: jest.fn() }
    sdk.Asset = { native: jest.fn() }

    // Mock getHorizonServer and its methods
    const { getHorizonServer } = jest.requireMock("../utils") as any
    getHorizonServer.mockReturnValue({
      loadAccount: jest.fn().mockResolvedValue({
        sequenceNumber: () => "123",
      }),
      submitTransaction: jest.fn().mockResolvedValue({
        hash: "tx_hash_123",
      }),
    })

    // Mock wallet adapter
    const { getWalletAdapter } = jest.requireMock("../wallets") as any
    getWalletAdapter.mockReturnValue({
      signTransaction: jest.fn().mockResolvedValue("signed_xdr"),
    })
  })

  it("should handle a successful payment", async () => {
    const { result } = renderHook(() => useSendPayment(), {
      wrapper: createWrapper("testnet"),
    })

    const paymentOpts = { to: "GDEST", amount: "10", asset: "XLM" as const }
    await result.current.send(paymentOpts)

    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
    expect(result.current.result).toEqual({
      hash: "tx_hash_123",
      status: "success",
    })
  })

  it("should handle a failed payment", async () => {
    const { getHorizonServer } = jest.requireMock("../utils") as any
    getHorizonServer.mockReturnValue({
      loadAccount: jest.fn().mockResolvedValue({
        sequenceNumber: () => "123",
      }),
      submitTransaction: jest.fn().mockRejectedValue(new Error("Submission failed")),
    })

    const { result } = renderHook(() => useSendPayment(), {
      wrapper: createWrapper("testnet"),
    })

    const paymentOpts = { to: "GDEST", amount: "10", asset: "XLM" as const }

    await expect(result.current.send(paymentOpts)).rejects.toThrow("Submission failed")

    expect(result.current.loading).toBe(false)
    expect(result.current.error).not.toBeNull()
    expect(result.current.error?.message).toBe("Submission failed")
    expect(result.current.result).toBeNull()
  })
})
