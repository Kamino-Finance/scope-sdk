import { TransactionInstruction, PublicKey, AccountMeta } from "@solana/web3.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as types from "../types" // eslint-disable-line @typescript-eslint/no-unused-vars
import { PROGRAM_ID } from "../programId"

export interface RefreshChainlinkPriceArgs {
  token: number
  serializedChainlinkReport: Uint8Array
}

export interface RefreshChainlinkPriceAccounts {
  /** The account that signs the transaction. */
  user: PublicKey
  oraclePrices: PublicKey
  oracleMappings: PublicKey
  oracleTwaps: PublicKey
  /**
   * The Verifier Account stores the DON's public keys and other verification parameters.
   * This account must match the PDA derived from the verifier program.
   */
  verifierAccount: PublicKey
  /** The Access Controller Account */
  accessController: PublicKey
  /** The Config Account is a PDA derived from a signed report */
  configAccount: PublicKey
  /** The Verifier Program ID specifies the target Chainlink Data Streams Verifier Program. */
  verifierProgramId: PublicKey
}

export const layout = borsh.struct([
  borsh.u16("token"),
  borsh.vecU8("serializedChainlinkReport"),
])

export function refreshChainlinkPrice(
  args: RefreshChainlinkPriceArgs,
  accounts: RefreshChainlinkPriceAccounts,
  programId: PublicKey = PROGRAM_ID
) {
  const keys: Array<AccountMeta> = [
    { pubkey: accounts.user, isSigner: true, isWritable: false },
    { pubkey: accounts.oraclePrices, isSigner: false, isWritable: true },
    { pubkey: accounts.oracleMappings, isSigner: false, isWritable: false },
    { pubkey: accounts.oracleTwaps, isSigner: false, isWritable: true },
    { pubkey: accounts.verifierAccount, isSigner: false, isWritable: false },
    { pubkey: accounts.accessController, isSigner: false, isWritable: false },
    { pubkey: accounts.configAccount, isSigner: false, isWritable: false },
    { pubkey: accounts.verifierProgramId, isSigner: false, isWritable: false },
  ]
  const identifier = Buffer.from([97, 9, 20, 115, 72, 255, 4, 140])
  const buffer = Buffer.alloc(1000)
  const len = layout.encode(
    {
      token: args.token,
      serializedChainlinkReport: Buffer.from(
        args.serializedChainlinkReport.buffer,
        args.serializedChainlinkReport.byteOffset,
        args.serializedChainlinkReport.length
      ),
    },
    buffer
  )
  const data = Buffer.concat([identifier, buffer]).slice(0, 8 + len)
  const ix = new TransactionInstruction({ keys, programId, data })
  return ix
}
