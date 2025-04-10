import { Address, getAddressEncoder, getProgramDerivedAddress } from '@solana/kit';
import { PROGRAM_ID as JLP_PROGRAM_ID } from '../@codegen/jupiter-perps/programId';

export const MINT_SEED = 'lp_token_mint';

const addressEncoder = getAddressEncoder();

export async function getJlpMintPda(pool: Address): Promise<Address> {
  const [addr] = await getProgramDerivedAddress({
    seeds: [Buffer.from(MINT_SEED), addressEncoder.encode(pool)],
    programAddress: JLP_PROGRAM_ID,
  });
  return addr;
}
