import {
  AccountMeta,
  AccountRole,
  Address,
  address,
  fetchEncodedAccount,
  fixDecoderSize,
  GetAccountInfoApi,
  getAddressDecoder,
  getBooleanDecoder,
  getBytesDecoder,
  getStructDecoder,
  getU64Decoder,
  Rpc,
} from '@solana/kit';

/**
 * The securitize program, owning the `VaultState` accounts mapped by `Securitize` oracle entries.
 */
export const SECURITIZE_PROGRAM_ID = address('9N3yqarWXmXJ9NQBGgN47JXV82smby8nSMffkwetgYov');

/**
 * RedStone feed account priced by the scope program for `Securitize` (sAcred) entries
 * (hardcoded as `REDSTONE_FEED_PK` in the program).
 */
export const SECURITIZE_REDSTONE_FEED = address('6sK8czVw8Xy6T8YbH6VC8p5ovNZD2mXf5vUTv8sgnUJf');

// Leading fields of the securitize `VaultState` account, up to the accounts needed to refresh a
// `Securitize` entry. Mirrors `securitize-itf` in the scope program repo.
const vaultStatePrefixDecoder = getStructDecoder([
  ['discriminator', fixDecoderSize(getBytesDecoder(), 8)],
  ['id', getU64Decoder()],
  ['admin', getAddressDecoder()],
  ['isPaused', getBooleanDecoder()],
  ['assetVault', getAddressDecoder()],
  ['shareMint', getAddressDecoder()],
]);

/**
 * Get the extra accounts consumed by the refresh of a `Securitize` oracle entry, in the order
 * expected by the scope program (see `get_sacred_price` in the program): the vault share mint,
 * the vault asset token account and the RedStone feed pricing the asset.
 * @param rpc
 * @param vaultState - the `VaultState` account the entry is mapped to
 */
export async function getSecuritizeRefreshAccounts(
  rpc: Rpc<GetAccountInfoApi>,
  vaultState: Address
): Promise<AccountMeta[]> {
  const maybeVaultState = await fetchEncodedAccount(rpc, vaultState);
  if (!maybeVaultState.exists) {
    throw Error(`Could not get securitize vault state ${vaultState}`);
  }
  if (maybeVaultState.programAddress !== SECURITIZE_PROGRAM_ID) {
    throw Error(
      `Account ${vaultState} is owned by ${maybeVaultState.programAddress}, expected securitize ${SECURITIZE_PROGRAM_ID}`
    );
  }
  const { assetVault, shareMint } = vaultStatePrefixDecoder.decode(maybeVaultState.data);
  return [
    { role: AccountRole.READONLY, address: shareMint },
    { role: AccountRole.READONLY, address: assetVault },
    { role: AccountRole.READONLY, address: SECURITIZE_REDSTONE_FEED },
  ];
}
