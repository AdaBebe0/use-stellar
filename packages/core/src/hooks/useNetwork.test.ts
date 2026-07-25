import { renderHook } from "@testing-library/react"
import React from "react"
import { StellarProvider } from "../context/StellarProvider"
import { useNetwork } from "./useNetwork"
import { NETWORK_CONFIGS } from "../types"

// Test wrapper
function createWrapper(network: "testnet" | "mainnet" = "testnet") {
  return ({ children }: { children: React.ReactNode }) => {
    return React.createElement(StellarProvider, { network, children })
  }
}

describe("useNetwork", () => {
  describe("testnet configuration", () => {
    it("should return correct testnet configuration", () => {
      const { result } = renderHook(() => useNetwork(), { wrapper: createWrapper("testnet") })

      expect(result.current.network).toBe("testnet")
      expect(result.current.networkConfig).toEqual(NETWORK_CONFIGS.testnet)
      expect(result.current.isTestnet).toBe(true)
      expect(result.current.isMainnet).toBe(false)
    })

    it("should return expected testnet URLs", () => {
      const { result } = renderHook(() => useNetwork(), { wrapper: createWrapper("testnet") })

      expect(result.current.networkConfig.horizonUrl).toBe("https://horizon-testnet.stellar.org")
      expect(result.current.networkConfig.sorobanUrl).toBe("https://soroban-testnet.stellar.org")
    })
  })

  describe("mainnet configuration", () => {
    it("should return correct mainnet configuration", () => {
      const { result } = renderHook(() => useNetwork(), { wrapper: createWrapper("mainnet") })

      expect(result.current.network).toBe("mainnet")
      expect(result.current.networkConfig).toEqual(NETWORK_CONFIGS.mainnet)
      expect(result.current.isTestnet).toBe(false)
      expect(result.current.isMainnet).toBe(true)
    })

    it("should return expected mainnet URLs", () => {
      const { result } = renderHook(() => useNetwork(), { wrapper: createWrapper("mainnet") })

      expect(result.current.networkConfig.horizonUrl).toBe("https://horizon.stellar.org")
      expect(result.current.networkConfig.sorobanUrl).toBe("https://soroban.stellar.org")
    })
  })

  describe("stable state", () => {
    it("should maintain stable values across re-renders", () => {
      const { result, rerender } = renderHook(() => useNetwork(), {
        wrapper: createWrapper("testnet"),
      })

      const firstResult = result.current

      // Force re-render
      rerender()

      const secondResult = result.current

      expect(firstResult.network).toBe(secondResult.network)
      expect(firstResult.networkConfig).toBe(secondResult.networkConfig)
      expect(firstResult.isTestnet).toBe(secondResult.isTestnet)
      expect(firstResult.isMainnet).toBe(secondResult.isMainnet)
    })

    it("should return referentially stable networkConfig object", () => {
      const { result, rerender } = renderHook(() => useNetwork(), {
        wrapper: createWrapper("testnet"),
      })

      const firstConfig = result.current.networkConfig

      // Force re-render
      rerender()

      const secondConfig = result.current.networkConfig

      // Should be the same reference from NETWORK_CONFIGS
      expect(firstConfig).toBe(secondConfig)
    })
  })

  describe("network switching", () => {
    it("should update when network changes", () => {
      let currentNetwork: "testnet" | "mainnet" = "testnet"
      const wrapper = ({ children }: { children: React.ReactNode }) => {
        return React.createElement(StellarProvider, { network: currentNetwork, children })
      }

      const { result, rerender } = renderHook(() => useNetwork(), { wrapper })

      expect(result.current.network).toBe("testnet")
      expect(result.current.isTestnet).toBe(true)
      expect(result.current.isMainnet).toBe(false)

      // Rerender with new props
      currentNetwork = "mainnet"
      rerender()

      expect(result.current.network).toBe("mainnet")
      expect(result.current.isTestnet).toBe(false)
      expect(result.current.isMainnet).toBe(true)
    })
  })

  describe("development debug logging", () => {
    const originalEnv = process.env.NODE_ENV
    let debugSpy: jest.SpyInstance

    beforeEach(() => {
      process.env.NODE_ENV = "development"
      debugSpy = jest.spyOn(console, "debug").mockImplementation(() => {})
    })

    afterEach(() => {
      process.env.NODE_ENV = originalEnv
      debugSpy.mockRestore()
    })

    it("should log debug error when StellarProvider context is missing", () => {
      expect(() => renderHook(() => useNetwork())).toThrow("use-stellar: No StellarProvider found")

      expect(debugSpy).toHaveBeenCalledWith(
        "[useNetwork] Missing provider configuration:",
        expect.any(Error)
      )
    })

    it("should log debug info when network identifier is invalid or unsupported", () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => {
        // @ts-expect-error Testing invalid network prop
        return React.createElement(StellarProvider, { network: "custom-network", children })
      }

      renderHook(() => useNetwork(), { wrapper })

      expect(debugSpy).toHaveBeenCalledWith(
        "[useNetwork] Invalid or unsupported network identifier:",
        "custom-network"
      )
    })

    it("should not log debug info in production mode", () => {
      process.env.NODE_ENV = "production"

      expect(() => renderHook(() => useNetwork())).toThrow("use-stellar: No StellarProvider found")

      expect(debugSpy).not.toHaveBeenCalled()
    })
  })
})
