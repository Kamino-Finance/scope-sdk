import {
  AccountMeta,
  AccountRole,
  Address,
  fetchEncodedAccount,
  fixDecoderSize,
  GetAccountInfoApi,
  getAddressDecoder,
  getBytesDecoder,
  getStructDecoder,
  getU64Decoder,
  getU8Decoder,
  Rpc,
} from '@solana/kit';

// Leading fields of the klend `Reserve` account, up to the lending market needed to refresh a
// `KlendCTokenExchangeRate` entry. Mirrors `klend-itf` in the scope program repo.
const reservePrefixDecoder = getStructDecoder([
  ['discriminator', fixDecoderSize(getBytesDecoder(), 8)],
  ['version', getU64Decoder()],
  [
    'lastUpdate',
    getStructDecoder([
      ['slot', getU64Decoder()],
      ['stale', getU8Decoder()],
      ['priceStatus', getU8Decoder()],
      ['padding', fixDecoderSize(getBytesDecoder(), 6)],
    ]),
  ],
  ['lendingMarket', getAddressDecoder()],
]);

/**
 * Get the extra accounts consumed by the refresh of a `KlendCTokenExchangeRate` oracle entry, in
 * the order expected by the scope program (see `klend_ctoken_exchange_rate::get_price` in the
 * program): the klend program and the lending market of the reserve.
 * @param rpc
 * @param klendProgramId
 * @param reserve - the klend `Reserve` account the entry is mapped to
 */
export async function getKlendCTokenRefreshAccounts(
  rpc: Rpc<GetAccountInfoApi>,
  klendProgramId: Address,
  reserve: Address
): Promise<AccountMeta[]> {
  const maybeReserve = await fetchEncodedAccount(rpc, reserve);
  if (!maybeReserve.exists) {
    throw Error(`Could not get klend reserve ${reserve}`);
  }
  if (maybeReserve.programAddress !== klendProgramId) {
    throw Error(`Account ${reserve} is owned by ${maybeReserve.programAddress}, expected klend ${klendProgramId}`);
  }
  const { lendingMarket } = reservePrefixDecoder.decode(maybeReserve.data);
  return [
    { role: AccountRole.READONLY, address: klendProgramId },
    { role: AccountRole.READONLY, address: lendingMarket },
  ];
}
