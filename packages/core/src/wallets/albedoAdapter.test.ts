import { albedoAdapter } from "./albedoAdapter"
import * as albedo from "@albedo-link/intent"
import { NETWORK_PASSPHRASES } from "./freighterAdapter"

jest.mock("@albedo-link/intent", () => ({
  publicKey: jest.fn(),
  tx: jest.fn(),
}))

const mockPublicKey = jest.mocked(albedo.publicKey)
const mockTx = jest.mocked(albedo.tx)

describe("albedoAdapter", () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  describe("connect", () => {
    it("connects with Albedo", async () => {
      mockPublicKey.mockResolvedValue({ pubkey: "GABC" })

      await expect(albedoAdapter.connect("testnet")).resolves.toEqual({
        address: "GABC",
        network: "testnet",
        networkPassphrase: NETWORK_PASSPHRASES.testnet,
        wallet: "albedo",
      })
    })

    it("throws a typed error when Albedo rejects the connection", async () => {
      mockPublicKey.mockRejectedValue(new Error("Connection rejected"))

      await expect(albedoAdapter.connect("testnet")).rejects.toMatchObject({
        code: "wallet_access_rejected",
      })
    })
  })

  describe("signTransaction", () => {
    it("signs transactions through Albedo", async () => {
      mockTx.mockResolvedValue({ signed_envelope_xdr: "signed-xdr", pubkey: "GABC" })

      await expect(
        albedoAdapter.signTransaction("raw-xdr", {
          address: "GABC",
          network: "testnet",
          networkPassphrase: NETWORK_PASSPHRASES.testnet,
        })
      ).resolves.toBe("signed-xdr")
    })

    it("throws a typed error when Albedo fails to sign", async () => {
      mockTx.mockRejectedValue(new Error("Signing failed"))

      await expect(
        albedoAdapter.signTransaction("raw-xdr", {
          address: "GABC",
          network: "testnet",
          networkPassphrase: NETWORK_PASSPHRASES.testnet,
        })
      ).rejects.toMatchObject({
        code: "wallet_sign_failed",
      })
    })
  })

  describe("getNetworkDetails", () => {
    it("returns the requested network details", async () => {
      await expect(albedoAdapter.getNetworkDetails("testnet")).resolves.toEqual({
        network: "testnet",
        networkPassphrase: NETWORK_PASSPHRASES.testnet,
      })
    })
  })

  describe("isAvailable", () => {
    it("returns true when in a browser environment", async () => {
      // Assuming 'isBrowser' utility is mocked to return true in test setup
      await expect(albedoAdapter.isAvailable()).resolves.toBe(true)
    })
  })
})
