import {
  createDefaultRpcTransport,
  createRpc,
  createSolanaRpcApi,
  createSolanaRpcSubscriptions,
  DEFAULT_RPC_CONFIG,
  generateKeyPairSigner,
  lamports,
  SolanaRpcApi,
  TransactionSigner,
} from '@solana/kit';
import { sleep } from './utils';
import { ConnectionPool } from './tx';

export type Env = {
  c: ConnectionPool;
  admin: TransactionSigner;
  priceFeed: string;
};

export async function initEnv(): Promise<Env> {
  const api = createSolanaRpcApi<SolanaRpcApi>({
    ...DEFAULT_RPC_CONFIG,
    defaultCommitment: 'processed',
  });
  const rpc = createRpc({ api, transport: createDefaultRpcTransport({ url: 'http://localhost:8899' }) });
  const ws = createSolanaRpcSubscriptions('ws://localhost:8900');

  const admin = await generateKeyPairSigner();

  const solAirdrop = 1000;
  await rpc.requestAirdrop(admin.address, lamports(BigInt(solAirdrop * 1e9))).send();
  await sleep(2000);
  console.log(`Airdropping ${solAirdrop} SOL to admin: ${admin.address}...`);

  const env: Env = {
    admin,
    c: { rpc, wsRpc: ws },
    priceFeed: `test-${Math.floor(Math.random() * 1000000) + 1}`,
  };

  return env;
}
