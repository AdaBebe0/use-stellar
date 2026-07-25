import { useStellarContext } from "../context/StellarProvider"
import type { StellarNetwork, NetworkConfig } from "../types"

export interface UseNetworkReturn {
  network: StellarNetwork
  networkConfig: NetworkConfig
  isTestnet: boolean
  isMainnet: boolean
}

/**
 * Returns information about the currently selected Stellar network.
 *
 * @returns `{ network, networkConfig, isTestnet, isMainnet }`
 *
 * @example
 * const { network, isTestnet } = useNetwork()
 */
export function useNetwork(): UseNetworkReturn {
  let context
  try {
    context = useStellarContext()
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.debug("[useNetwork] Missing provider configuration:", error)
    }
    throw error
  }

  const { network, networkConfig } = context

  if (process.env.NODE_ENV !== "production") {
    if (!network || (network !== "testnet" && network !== "mainnet")) {
      // eslint-disable-next-line no-console
      console.debug("[useNetwork] Invalid or unsupported network identifier:", network)
    }

    if (!networkConfig) {
      // eslint-disable-next-line no-console
      console.debug("[useNetwork] Missing network configuration for network:", network)
    } else if (!networkConfig.horizonUrl || !networkConfig.sorobanUrl) {
      // eslint-disable-next-line no-console
      console.debug("[useNetwork] Invalid or incomplete network RPC configuration:", networkConfig)
    }
  }

  return {
    network,
    networkConfig,
    isTestnet: network === "testnet",
    isMainnet: network === "mainnet",
  }
}
