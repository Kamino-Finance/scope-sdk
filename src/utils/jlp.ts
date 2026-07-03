import { Address, getAddressEncoder, getProgramDerivedAddress, getUtf8Encoder } from '@solana/kit';
import { PERPETUALS_PROGRAM_ADDRESS } from '../@codegen/jupiter-perps/programs';

export const MINT_SEED = 'lp_token_mint';

const addressEncoder = getAddressEncoder();
const utf8Encoder = getUtf8Encoder();

export async function getJlpMintPda(pool: Address): Promise<Address> {
  const [addr] = await getProgramDerivedAddress({
    seeds: [utf8Encoder.encode(MINT_SEED), addressEncoder.encode(pool)],
    programAddress: PERPETUALS_PROGRAM_ADDRESS,
  });
  return addr;
}
