# useAsset

Fetches metadata about an asset on the Stellar network — its issuer, home domain, supply, and holder count.

## Installation

```bash
npm install use-stellar @stellar/stellar-sdk
```

## Import

```ts
import { useAsset } from "use-stellar"
```

## Basic usage

```tsx
import { useAsset } from "use-stellar"

function Example() {
  const { asset, loading, error } = useAsset({
    code: "USDC",
    issuer: "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5",
  })

  if (loading) return <p>Loading...</p>
  if (error) return <p>Error: {error.message}</p>

  return (
    <div>
      <p>
        {asset.code} issued by {asset.issuer}
      </p>
      <p>Supply: {asset.supply}</p>
      <p>Holders: {asset.numAccounts}</p>
    </div>
  )
}
```

## Parameters

| Parameter   | Type      | Required | Default | Description                                                                          |
| ----------- | --------- | -------- | ------- | ------------------------------------------------------------------------------------ |
| `code`      | `string`  | Yes      | —       | The asset code, e.g. `"USDC"` or `"yXLM"`. Must be 1–12 alphanumeric characters.     |
| `issuer`    | `string`  | Yes      | —       | The Stellar address of the issuing account. Starts with `G` and is 56 characters.    |
| `autoFetch` | `boolean` | No       | `true`  | When `false`, the request is not sent until you call `refetch()`.                     |

## Return values

| Property  | Type                     | Description                                                     |
| --------- | ------------------------ | --------------------------------------------------------------- |
| `asset`   | `AssetInfo \| null`      | The fetched asset metadata. `null` while loading or on error.   |
| `loading` | `boolean`                | `true` while the request is in flight.                           |
| `error`   | `StellarError \| null`   | A typed error object if the request failed, otherwise `null`.    |
| `refetch` | `() => void`             | Call this to manually re-run the request.                        |

### AssetInfo

| Property            | Type      | Description                                                                                         |
| ------------------- | --------- | --------------------------------------------------------------------------------------------------- |
| `code`              | `string`  | The asset code, e.g. `"USDC"`.                                                                      |
| `issuer`            | `string`  | The Stellar address of the issuing account.                                                         |
| `supply`            | `string`  | The total supply of the asset in circulation. Represented as a decimal string.                      |
| `homeDomain`        | `string`  | The home domain set by the issuer. Used to verify the asset against its `stellar.toml` file.        |
| `numAccounts`       | `number`  | The number of accounts that hold this asset (trustline count).                                      |
| `flags`             | `object`  | Authorization flags set by the issuer.                                                              |
| `flags.authRequired`   | `boolean` | When `true`, the issuer must approve every account before it can hold the asset.                 |
| `flags.authRevocable`  | `boolean` | When `true`, the issuer can revoke the asset from any holder at any time.                        |
| `flags.authImmutable`  | `boolean` | When `true`, the authorization settings cannot be changed after the asset is created.            |

## Examples

### Example 1 — fetch USDC info on testnet

Look up the details of Circle's USDC on Stellar testnet.

```tsx
import { useAsset } from "use-stellar"

function UsdcInfo() {
  const { asset, loading, error } = useAsset({
    code: "USDC",
    issuer: "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5",
  })

  if (loading) return <p>Loading USDC info...</p>
  if (error) return <p>Could not load USDC: {error.message}</p>

  return (
    <div>
      <h2>{asset.code}</h2>
      <p><strong>Issuer:</strong> {asset.issuer}</p>
      <p><strong>Supply:</strong> {asset.supply}</p>
      <p><strong>Holders:</strong> {asset.numAccounts}</p>
      {asset.homeDomain && (
        <p>
          <strong>Home domain:</strong>{" "}
          <a href={`https://${asset.homeDomain}/.well-known/stellar.toml`}>
            {asset.homeDomain}
          </a>
        </p>
      )}
    </div>
  )
}
```

### Example 2 — verify an asset using its home domain

The `homeDomain` field lets you confirm an asset belongs to the organisation you expect. Fetch the issuer's `stellar.toml` and check that the asset is listed there.

```tsx
import { useAsset } from "use-stellar"

function VerifiedAsset() {
  const { asset, loading, error } = useAsset({
    code: "USDC",
    issuer: "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5",
  })

  if (loading) return <p>Loading...</p>
  if (error) return <p>Error: {error.message}</p>

  if (!asset.homeDomain) {
    return (
      <div>
        <p>
          {asset.code} has no home domain set. The issuer has not provided
          a way to verify this asset on-chain.
        </p>
      </div>
    )
  }

  const tomlUrl = `https://${asset.homeDomain}/.well-known/stellar.toml`

  return (
    <div>
      <p>
        {asset.code} is issued by {asset.issuer}
      </p>
      <p>
        Verify this asset at{" "}
        <a href={tomlUrl} target="_blank" rel="noopener noreferrer">
          {tomlUrl}
        </a>
      </p>
    </div>
  )
}
```

### Example 3 — handle an unknown asset

When you query an asset that does not exist on the network, the hook returns an error. Show a clear message and let the user try again.

```tsx
import { useAsset } from "use-stellar"

function UnknownAsset() {
  const { asset, loading, error, refetch } = useAsset({
    code: "FAKE",
    issuer: "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5",
  })

  if (loading) return <p>Looking up asset...</p>

  if (error) {
    return (
      <div>
        <p>Could not find this asset: {error.message}</p>
        <p>
          Double-check the asset code and issuer address, then try again.
        </p>
        <button onClick={refetch}>Retry</button>
      </div>
    )
  }

  return (
    <div>
      <p>
        {asset.code} supply: {asset.supply}
      </p>
    </div>
  )
}
```

### Example 4 — deferred fetch with autoFetch: false

When `autoFetch` is `false`, the request waits until you explicitly call `refetch()`. This is useful when you only want to load the data after a user action.

```tsx
import { useAsset } from "use-stellar"

function DeferredFetch() {
  const { asset, loading, error, refetch } = useAsset({
    code: "USDC",
    issuer: "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5",
    autoFetch: false,
  })

  return (
    <div>
      <button onClick={refetch} disabled={loading}>
        {loading ? "Loading..." : "Fetch USDC info"}
      </button>

      {error && <p>Error: {error.message}</p>}

      {asset && (
        <div>
          <p>Supply: {asset.supply}</p>
          <p>Holders: {asset.numAccounts}</p>
        </div>
      )}
    </div>
  )
}
```

## TypeScript

```ts
interface AssetInfo {
  code: string
  issuer: string
  supply: string
  homeDomain?: string
  numAccounts: number
  flags: {
    authRequired: boolean
    authRevocable: boolean
    authImmutable: boolean
  }
}

interface UseAssetOptions {
  code: string
  issuer: string
  autoFetch?: boolean
}

interface UseAssetReturn {
  asset: AssetInfo | null
  loading: boolean
  error: StellarError | null
  refetch: () => void
}
```

## Common errors

| Error message                                                          | Cause                                                            | Fix                                                                                     |
| ---------------------------------------------------------------------- | ---------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `"Asset USDC:GBBD... not found."`                                      | The asset code and issuer combination does not exist on this network. | Verify both values are correct and exist on the current network.                    |
| `"Unable to reach the Stellar network. Check your connection..."`      | The device is offline or Horizon is unreachable.                 | Check your internet connection and try again.                                            |
| `"Too many requests were sent to Horizon..."`                          | Horizon rate-limited your requests (HTTP 429).                    | Add a delay between requests or reduce the number of concurrent calls.                   |

## Notes

- The hook fetches from the Horizon `/assets` endpoint. The issuer must have published the asset on the network before the hook can return data.
- `homeDomain` is only present if the issuing account has set it via a `Set Options` operation. An asset without `homeDomain` is not necessarily untrustworthy, but you cannot verify it on-chain.
- `supply` is returned as a decimal string. Convert it with `Number()` or a big-number library if you need to perform arithmetic.
- The hook re-fetches automatically when `code`, `issuer`, or the network changes. It does not poll — use `refetch()` for updates.

## Related hooks

- [`useBalance`](./use-balance.md) — fetch the balance of one account for any asset, including XLM.
- [`useAccount`](./use-account.md) — load full account details including balances, sequence number, and signers.
