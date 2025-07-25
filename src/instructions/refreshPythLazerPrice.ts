import { TransactionInstruction, PublicKey, AccountMeta } from "@solana/web3.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as types from "../types" // eslint-disable-line @typescript-eslint/no-unused-vars
import { PROGRAM_ID } from "../programId"

export interface RefreshPythLazerPriceArgs {
  tokens: Array<number>
  serializedPythMessage: Uint8Array
  ed25519InstructionIndex: number
}

export interface RefreshPythLazerPriceAccounts {
  /** The account that signs the transaction. */
  user: PublicKey
  oraclePrices: PublicKey
  oracleMappings: PublicKey
  oracleTwaps: PublicKey
  pythProgram: PublicKey
  pythStorage: PublicKey
  pythTreasury: PublicKey
  systemProgram: PublicKey
  instructionsSysvar: PublicKey
}

export const layout = borsh.struct([
  borsh.vec(borsh.u16(), "tokens"),
  borsh.vecU8("serializedPythMessage"),
  borsh.u16("ed25519InstructionIndex"),
])

/**
 * IMPORTANT: we assume the tokens passed in to this ix are in the same order in which
 * they are found in the message payload. Thus, we rely on the client to do this work
 */
export function refreshPythLazerPrice(
  args: RefreshPythLazerPriceArgs,
  accounts: RefreshPythLazerPriceAccounts,
  programId: PublicKey = PROGRAM_ID
) {
  const keys: Array<AccountMeta> = [
    { pubkey: accounts.user, isSigner: true, isWritable: true },
    { pubkey: accounts.oraclePrices, isSigner: false, isWritable: true },
    { pubkey: accounts.oracleMappings, isSigner: false, isWritable: false },
    { pubkey: accounts.oracleTwaps, isSigner: false, isWritable: true },
    { pubkey: accounts.pythProgram, isSigner: false, isWritable: false },
    { pubkey: accounts.pythStorage, isSigner: false, isWritable: false },
    { pubkey: accounts.pythTreasury, isSigner: false, isWritable: true },
    { pubkey: accounts.systemProgram, isSigner: false, isWritable: false },
    { pubkey: accounts.instructionsSysvar, isSigner: false, isWritable: false },
  ]
  const identifier = Buffer.from([122, 47, 177, 133, 177, 35, 93, 118])
  const buffer = Buffer.alloc(1000)
  const len = layout.encode(
    {
      tokens: args.tokens,
      serializedPythMessage: Buffer.from(
        args.serializedPythMessage.buffer,
        args.serializedPythMessage.byteOffset,
        args.serializedPythMessage.length
      ),
      ed25519InstructionIndex: args.ed25519InstructionIndex,
    },
    buffer
  )
  const data = Buffer.concat([identifier, buffer]).slice(0, 8 + len)
  const ix = new TransactionInstruction({ keys, programId, data })
  return ix
}
