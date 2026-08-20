import {
  AccountMeta,
  AccountRole,
  Address,
  fetchEncodedAccount,
  GetAccountInfoApi,
  getAddressDecoder,
  getStructDecoder,
  Rpc,
} from '@solana/kit';

// Leading field of an SPL token account (shared by the legacy token program and Token-2022):
// the mint of the account.
const tokenAccountPrefixDecoder = getStructDecoder([['mint', getAddressDecoder()]]);

/**
 * Get the extra accounts consumed by the refresh of a `SplBalance` oracle entry, in the order
 * expected by the scope program (see `spl_balance::get_price` in the program): the mint of the
 * token account.
 * @param rpc
 * @param tokenAccount - the SPL token account the entry is mapped to
 */
export async function getSplBalanceRefreshAccounts(
  rpc: Rpc<GetAccountInfoApi>,
  tokenAccount: Address
): Promise<AccountMeta[]> {
  const maybeTokenAccount = await fetchEncodedAccount(rpc, tokenAccount);
  if (!maybeTokenAccount.exists) {
    throw Error(`Could not get SPL token account ${tokenAccount}`);
  }
  const { mint } = tokenAccountPrefixDecoder.decode(maybeTokenAccount.data);
  return [{ role: AccountRole.READONLY, address: mint }];
}
