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

export interface ScopeFeedAddresses {
  oraclePrices: PublicKey;
  oracleMappings: PublicKey;
  configuration: PublicKey;
}

export const SCOPE_MAINNET_HUBBLE_FEED: ScopeFeedAddresses = {
  oraclePrices: new PublicKey('3NJYftD5sjVfxSnUdZ1wVML8f3aC6mp1CXCL6L7TnU8C'),
  oracleMappings: new PublicKey('Chpu5ZgfWX5ZzVpUx9Xvv4WPM75Xd7zPJNDPsFnCpLpk'),
  configuration: new PublicKey('AdTiP7QyjUyv6crF4H8z7fxJKU7Z5eCAGvJN1Y55cXxb'),
};

export const SCOPE_MAINNET_KLEND_FEED: ScopeFeedAddresses = {
  oraclePrices: new PublicKey('3t4JZcueEzTbVP6kLxXrL3VpWx45jDer4eqysweBchNH'),
  oracleMappings: new PublicKey('4zh6bmb77qX2CL7t5AJYCqa6YqFafbz3QJNeFvZjLowg'),
  configuration: new PublicKey('6cMwdbrJ95D7v5655Zsoe7oXmjQJMnagWK8EcdG6qmGM'),
};
