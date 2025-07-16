import { PublicKey } from '@solana/web3.js';

export const U16_MAX = 2 ** 16 - 1;
export interface ScopeConfig {
  programId: PublicKey;
  kliquidityProgramId: PublicKey;
}
export const SCOPE_MAINNET_CONFIG: ScopeConfig = {
  programId: new PublicKey('HFn8GnPADiny6XqUoWE8uRPPxb29ikn4yTuPa9MF2fWJ'),
  kliquidityProgramId: new PublicKey('6LtLpnUFNByNXLyCoK9wA2MykKAmQNZKBdY8s47dehDc'),
};
export const SCOPE_DEVNET_CONFIG: ScopeConfig = {
  ...SCOPE_MAINNET_CONFIG,
  kliquidityProgramId: new PublicKey('E6qbhrt4pFmCotNUSSEh6E5cRQCEJpMcd79Z56EG9KY'),
};
export const SCOPE_LOCALNET_CONFIG: ScopeConfig = {
  ...SCOPE_MAINNET_CONFIG,
  kliquidityProgramId: new PublicKey('E6qbhrt4pFmCotNUSSEh6E5cRQCEJpMcd79Z56EG9KY'),
};
