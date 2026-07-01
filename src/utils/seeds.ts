import { Address, getAddressEncoder, getProgramDerivedAddress, getU64Encoder, getUtf8Encoder } from '@solana/kit';
import { SCOPE_PROGRAM_ADDRESS } from '../@codegen/scope/programs';

export const CONFIGURATION_SEED = 'conf';

const addressEncoder = getAddressEncoder();
const u64Encoder = getU64Encoder();
const utf8Encoder = getUtf8Encoder();

export async function getConfigurationPda(feedName: String): Promise<Address> {
  const [addr] = await getProgramDerivedAddress({
    seeds: [utf8Encoder.encode(CONFIGURATION_SEED), utf8Encoder.encode(feedName as string)],
    programAddress: SCOPE_PROGRAM_ADDRESS,
  });
  return addr;
}

export async function getMintsToScopeChainPda(prices: Address, seed: Address, seedId: number): Promise<Address> {
  const [addr] = await getProgramDerivedAddress({
    seeds: [
      utf8Encoder.encode('mints_to_scope_chains'),
      addressEncoder.encode(prices),
      addressEncoder.encode(seed),
      u64Encoder.encode(BigInt(seedId)),
    ],
    programAddress: SCOPE_PROGRAM_ADDRESS,
  });
  return addr;
}
