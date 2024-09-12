import { PublicKey } from '@solana/web3.js';

export const U16_MAX = 2 ** 16 - 1;
export interface ScopeConfig {
  oracleMappings: PublicKey;
  oraclePrices: PublicKey;
  programId: PublicKey;
  configurationAccount: PublicKey;
  kliquidityProgramId: PublicKey;
}
export const SCOPE_MAINNET_CONFIG: ScopeConfig = {
  oracleMappings: new PublicKey('Chpu5ZgfWX5ZzVpUx9Xvv4WPM75Xd7zPJNDPsFnCpLpk'),
  oraclePrices: new PublicKey('3NJYftD5sjVfxSnUdZ1wVML8f3aC6mp1CXCL6L7TnU8C'),
  programId: new PublicKey('HFn8GnPADiny6XqUoWE8uRPPxb29ikn4yTuPa9MF2fWJ'),
  configurationAccount: new PublicKey('AdTiP7QyjUyv6crF4H8z7fxJKU7Z5eCAGvJN1Y55cXxb'),
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
