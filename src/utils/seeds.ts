import { Address, getAddressEncoder, getProgramDerivedAddress } from '@solana/kit';
import { PROGRAM_ID } from '../@codegen/scope/programId';
import BN from 'bn.js';

export const CONFIGURATION_SEED = 'conf';

const addressEncoder = getAddressEncoder();

export async function getConfigurationPda(feedName: String): Promise<Address> {
  const [addr] = await getProgramDerivedAddress({
    seeds: [Buffer.from(CONFIGURATION_SEED), Buffer.from(feedName)],
    programAddress: PROGRAM_ID,
  });
  return addr;
}

export async function getMintsToScopeChainPda(prices: Address, seed: Address, seedId: number): Promise<Address> {
  const [addr] = await getProgramDerivedAddress({
    seeds: [
      Buffer.from('mints_to_scope_chains'),
      addressEncoder.encode(prices),
      addressEncoder.encode(seed),
      new Uint8Array(new BN(seedId).toBuffer('le', 8)),
    ],
    programAddress: PROGRAM_ID,
  });
  return addr;
}
