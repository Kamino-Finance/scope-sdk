import { address, Address } from '@solana/kit';

export const U16_MAX = 2 ** 16 - 1;
export interface ScopeConfig {
  oracleMappings: Address;
  oraclePrices: Address;
  programId: Address;
  configurationAccount: Address;
  kliquidityProgramId: Address;
}
export const SCOPE_MAINNET_CONFIG: ScopeConfig = {
  oracleMappings: address('Chpu5ZgfWX5ZzVpUx9Xvv4WPM75Xd7zPJNDPsFnCpLpk'),
  oraclePrices: address('3NJYftD5sjVfxSnUdZ1wVML8f3aC6mp1CXCL6L7TnU8C'),
  programId: address('HFn8GnPADiny6XqUoWE8uRPPxb29ikn4yTuPa9MF2fWJ'),
  configurationAccount: address('AdTiP7QyjUyv6crF4H8z7fxJKU7Z5eCAGvJN1Y55cXxb'),
  kliquidityProgramId: address('6LtLpnUFNByNXLyCoK9wA2MykKAmQNZKBdY8s47dehDc'),
};
export const SCOPE_DEVNET_CONFIG: ScopeConfig = {
  ...SCOPE_MAINNET_CONFIG,
  kliquidityProgramId: address('E6qbhrt4pFmCotNUSSEh6E5cRQCEJpMcd79Z56EG9KY'),
};
export const SCOPE_LOCALNET_CONFIG: ScopeConfig = {
  ...SCOPE_MAINNET_CONFIG,
  kliquidityProgramId: address('E6qbhrt4pFmCotNUSSEh6E5cRQCEJpMcd79Z56EG9KY'),
};
