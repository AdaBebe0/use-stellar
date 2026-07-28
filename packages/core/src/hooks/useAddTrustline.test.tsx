import { renderHook, act } from "@testing-library/react"
import { jest, describe, it, expect, beforeEach } from "@jest/globals" // This line might be removable depending on your Jest setup
import React from "react"
import { StellarProvider, useStellarContext } from "../context/StellarProvider"
import { useAddTrustline } from "./useAddTrustline"
import { STELLAR_ERROR_CODES } from "../errors"
import type { WalletState } from "../types"

const TEST_ADDRESS = "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF"
const MOCK_WALLET_STATE: WalletState = {
  connected: true,
  connecting: false,
  address: TEST_ADDRESS,
  network: "testnet",
  wallet: "freighter",
  error: null,
  walletNetwork: "testnet",
  walletName: "Freighter",
}

const mockSignTransaction = jest.fn()
const mockSubmitTransaction = jest.fn()
const mockLoadAccount = jest.fn()

jest.mock("../wallets", () => ({
  ...jest.requireActual("../wallets"),
  getWalletAdapter: () => ({
    signTransaction: mockSignTransaction,
  }),
}))

jest.mock("../utils", () => ({
  ...jest.requireActual("../utils"),
  getHorizonServer: () => ({
    loadAccount: mockLoadAccount,
    submitTransaction: mockSubmitTransaction,
  }),
  isBrowser: () => true,
}))

const mockTx = { toXDR: () => "xdr" }
const mockSignedTx = { toXDR: () => "signed_xdr" }

jest.mock("@stellar/stellar-sdk", () => {
  const original = jest.requireActual("@stellar/stellar-sdk")
  return {
    ...original,
    TransactionBuilder: jest.fn(() => ({
      addOperation: jest.fn().mockReturnThis(),
      setTimeout: jest.fn().mockReturnThis(),
      build: jest.fn(() => mockTx),
      fromXDR: jest.fn(() => mockSignedTx),
    })),
  }
})

function Wrapper({ children }: { children: React.ReactNode }) {
  const { setWallet } = useStellarContext()

  React.useEffect(() => {
    setWallet(MOCK_WALLET_STATE)
  }, [setWallet])

  return <>{children}</>
}

function TestProvider({ children }: { children: React.ReactNode }) {
  return (
    <StellarProvider network="testnet">
      <Wrapper>{children}</Wrapper>
    </StellarProvider>
  )
}

const ISSUED_ASSET = {
  code: "USDC",
  issuer: "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5",
}

describe("useAddTrustline", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockLoadAccount.mockResolvedValue({ sequenceNumber: () => "123" })
    mockSignTransaction.mockResolvedValue("signed_xdr")
    mockSubmitTransaction.mockResolvedValue({ hash: "tx_hash", successful: true })
  })

  it("successfully adds a trustline", async () => {
    const { result } = renderHook(() => useAddTrustline(), { wrapper: TestProvider })

    let txResult
    await act(async () => {
      txResult = await result.current.addTrustline({ asset: ISSUED_ASSET })
    })

    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
    expect(result.current.result).toEqual({ hash: "tx_hash", status: "success" })
    expect(txResult).toEqual({ hash: "tx_hash", status: "success" })
    expect(mockLoadAccount).toHaveBeenCalledWith(TEST_ADDRESS)
    expect(mockSignTransaction).toHaveBeenCalledWith("xdr", { network: "testnet" })
    expect(mockSubmitTransaction).toHaveBeenCalledWith(mockSignedTx)
  })

  it("throws an error if wallet is not connected", async () => {
    const { result } = renderHook(() => useAddTrustline(), {
      wrapper: ({ children }: { children: React.ReactNode }) => (
        <StellarProvider network="testnet">{children}</StellarProvider>
      ),
    })

    await expect(result.current.addTrustline({ asset: ISSUED_ASSET })).rejects.toThrow(
      "Wallet not connected. Call connect() first."
    )
    expect(result.current.error?.code).toBe(STELLAR_ERROR_CODES.WALLET_NOT_CONNECTED)
  })

  it("throws an error for native asset", async () => {
    const { result } = renderHook(() => useAddTrustline(), { wrapper: TestProvider })

    await expect(
      // @ts-expect-error - testing invalid input
      result.current.addTrustline({ asset: "XLM" })
    ).rejects.toThrow("Invalid asset. Trustlines can only be created for issued assets, not XLM.")
    expect(result.current.error?.code).toBe(STELLAR_ERROR_CODES.VALIDATION_ERROR)
  })

  it("handles transaction submission failure", async () => {
    const submissionError = new Error("Submission failed")
    mockSubmitTransaction.mockRejectedValue(submissionError)
    const { result } = renderHook(() => useAddTrustline(), { wrapper: TestProvider })

    await expect(result.current.addTrustline({ asset: ISSUED_ASSET })).rejects.toThrow(
      submissionError
    )

    expect(result.current.loading).toBe(false)
    expect(result.current.result).toBeNull()
    expect(result.current.error).toBeDefined()
    expect(result.current.error?.message).toBe("Submission failed")
  })

  it("handles signing rejection", async () => {
    const signingError = new Error("User rejected")
    mockSignTransaction.mockRejectedValue(signingError)
    const { result } = renderHook(() => useAddTrustline(), { wrapper: TestProvider })

    await expect(result.current.addTrustline({ asset: ISSUED_ASSET })).rejects.toThrow(signingError)

    expect(result.current.loading).toBe(false)
    expect(result.current.result).toBeNull()
    expect(result.current.error).toBeDefined()
    expect(result.current.error?.message).toBe("User rejected")
  })

  it("resets state when reset() is called", async () => {
    const { result } = renderHook(() => useAddTrustline(), { wrapper: TestProvider })

    await act(async () => {
      await result.current.addTrustline({ asset: ISSUED_ASSET })
    })

    expect(result.current.result).not.toBeNull()

    act(() => {
      result.current.reset()
    })

    expect(result.current.result).toBeNull()
    expect(result.current.error).toBeNull()
  })
})
