import { Address, getAddressEncoder, getProgramDerivedAddress } from '@solana/kit';
import { PERPETUALS_PROGRAM_ADDRESS } from '../@codegen/jupiter-perps/programs';

export const MINT_SEED = 'lp_token_mint';

const addressEncoder = getAddressEncoder();

export async function getJlpMintPda(pool: Address): Promise<Address> {
  const [addr] = await getProgramDerivedAddress({
    seeds: [new TextEncoder().encode(MINT_SEED), addressEncoder.encode(pool)],
    programAddress: PERPETUALS_PROGRAM_ADDRESS,
  });
  return addr;
}
