/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Address,
  isSome,
  IAccountMeta,
  IAccountSignerMeta,
  IInstruction,
  Option,
  TransactionSigner,
} from "@solana/kit"
/* eslint-enable @typescript-eslint/no-unused-vars */
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh" // eslint-disable-line @typescript-eslint/no-unused-vars
import { borshAddress } from "../utils" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as types from "../types" // eslint-disable-line @typescript-eslint/no-unused-vars
import { PROGRAM_ID } from "../programId"

export interface RefreshPythLazerPriceArgs {
  tokens: Array<number>
  serializedPythMessage: Uint8Array
  ed25519InstructionIndex: number
}

export interface RefreshPythLazerPriceAccounts {
  /** The account that signs the transaction. */
  user: TransactionSigner
  oraclePrices: Address
  oracleMappings: Address
  oracleTwaps: Address
  pythProgram: Address
  pythStorage: Address
  pythTreasury: Address
  systemProgram: Address
  instructionsSysvar: Address
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
  programAddress: Address = PROGRAM_ID
) {
  const keys: Array<IAccountMeta | IAccountSignerMeta> = [
    { address: accounts.user.address, role: 3, signer: accounts.user },
    { address: accounts.oraclePrices, role: 1 },
    { address: accounts.oracleMappings, role: 0 },
    { address: accounts.oracleTwaps, role: 1 },
    { address: accounts.pythProgram, role: 0 },
    { address: accounts.pythStorage, role: 0 },
    { address: accounts.pythTreasury, role: 1 },
    { address: accounts.systemProgram, role: 0 },
    { address: accounts.instructionsSysvar, role: 0 },
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
  const ix: IInstruction = { accounts: keys, programAddress, data }
  return ix
}
