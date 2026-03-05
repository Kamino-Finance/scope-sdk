import {
  AddressesByLookupTableAddress,
  addSignersToTransactionMessage,
  appendTransactionMessageInstructions,
  Blockhash,
  compressTransactionMessageUsingAddressLookupTables,
  createTransactionMessage,
  GetLatestBlockhashApi,
  getSignatureFromTransaction,
  Instruction,
  pipe,
  Rpc,
  RpcSubscriptions,
  sendAndConfirmTransactionFactory,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
  Signature,
  signTransactionMessageWithSigners,
  SolanaRpcApiMainnet,
  SolanaRpcSubscriptionsApi,
  TransactionSigner,
} from '@solana/kit';

export type ConnectionPool = {
  rpc: Rpc<SolanaRpcApiMainnet>;
  wsRpc: RpcSubscriptions<SolanaRpcSubscriptionsApi>;
};

export async function sendAndConfirmTx(
  { rpc, wsRpc }: ConnectionPool,
  payer: TransactionSigner,
  ixs: Instruction[],
  signers: TransactionSigner[] = [],
  luts: AddressesByLookupTableAddress = {}
): Promise<Signature> {
  const blockhash = await fetchBlockhash(rpc);

  const tx = await pipe(
    createTransactionMessage({ version: 0 }),
    (tx) => appendTransactionMessageInstructions(ixs, tx),
    (tx) => setTransactionMessageFeePayerSigner(payer, tx),
    (tx) => setTransactionMessageLifetimeUsingBlockhash(blockhash, tx),
    (tx) => compressTransactionMessageUsingAddressLookupTables(tx, luts),
    (tx) => addSignersToTransactionMessage(signers, tx),
    (tx) => signTransactionMessageWithSigners(tx)
  );

  const sig = getSignatureFromTransaction(tx);

  await sendAndConfirmTransactionFactory({ rpc, rpcSubscriptions: wsRpc })(tx as typeof tx & { lifetimeConstraint: { lastValidBlockHeight: bigint } }, {
    commitment: 'processed',
    preflightCommitment: 'processed',
  });

  return sig;
}

export type BlockhashWithHeight = { blockhash: Blockhash; lastValidBlockHeight: bigint; slot: bigint };

export async function fetchBlockhash(rpc: Rpc<GetLatestBlockhashApi>): Promise<BlockhashWithHeight> {
  const res = await rpc.getLatestBlockhash({ commitment: 'finalized' }).send();
  return {
    blockhash: res.value.blockhash,
    lastValidBlockHeight: res.value.lastValidBlockHeight,
    slot: res.context.slot,
  };
}
