/// <reference types="jest" />
import type { AssetInfo, UseAssetOptions, UseAssetReturn } from "../index"

describe("Root exports", () => {
  it("allows type checking with root-imported AssetInfo and hook types", () => {
    const info: AssetInfo = {
      code: "USDC",
      issuer: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
      supply: "1000000.0000000",
      homeDomain: "centre.io",
      numAccounts: 42,
      flags: {
        authRequired: false,
        authRevocable: false,
        authImmutable: false,
      },
    }

    const options: UseAssetOptions = {
      code: "USDC",
      issuer: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
      autoFetch: true,
    }

    const result: UseAssetReturn = {
      asset: info,
      loading: false,
      error: null,
      refetch: () => {},
    }

    expect(info.code).toBe("USDC")
    expect(options.code).toBe("USDC")
    expect(result.loading).toBe(false)
  })
})
