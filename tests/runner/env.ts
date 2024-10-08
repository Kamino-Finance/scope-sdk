import { Idl, Program, AnchorProvider, Wallet } from '@coral-xyz/anchor';
import { Connection, ConnectionConfig, Keypair, LAMPORTS_PER_SOL } from '@solana/web3.js';
import idl from '../../src/scope.json';
import { PROGRAM_ID } from '../../src/programId';
import { sleep } from './utils';

export type Env = {
  provider: AnchorProvider;
  program: Program;
  admin: Keypair;
  wallet: Wallet;
  priceFeed: string;
};

export async function initEnv(): Promise<Env> {
  const config: ConnectionConfig = {
    commitment: 'processed',
    confirmTransactionInitialTimeout: 220000,
  };

  console.log('Connecting to localnet...');
  const connection = new Connection('http://127.0.0.1:8899', config);

  const admin = Keypair.generate();
  console.log(`Airdropping SOL to admin: ${admin.publicKey.toBase58()}...`);
  const solAirdrop = 1000;
  await connection.requestAirdrop(admin.publicKey, solAirdrop * LAMPORTS_PER_SOL);
  await sleep(2000);

  const wallet = new Wallet(admin);
  const provider = new AnchorProvider(connection, wallet, {
    preflightCommitment: 'processed',
  });

  return {
    provider: new AnchorProvider(connection, wallet, {
      preflightCommitment: 'processed',
    }),
    program: new Program(idl as Idl, PROGRAM_ID, provider),
    admin,
    wallet,
    priceFeed: `test-${Math.floor(Math.random() * 1000000) + 1}`,
  };
}
