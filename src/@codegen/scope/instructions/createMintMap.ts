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

export interface CreateMintMapArgs {
  seedPk: Address
  seedId: BN
  bump: number
  scopeChains: Array<Array<number>>
}

export interface CreateMintMapAccounts {
  admin: TransactionSigner
  configuration: Address
  mappings: Address
  systemProgram: Address
}

export const layout = borsh.struct([
  borshAddress("seedPk"),
  borsh.u64("seedId"),
  borsh.u8("bump"),
  borsh.vec(borsh.array(borsh.u16(), 4), "scopeChains"),
])

export function createMintMap(
  args: CreateMintMapArgs,
  accounts: CreateMintMapAccounts,
  programAddress: Address = PROGRAM_ID
) {
  const keys: Array<IAccountMeta | IAccountSignerMeta> = [
    { address: accounts.admin.address, role: 3, signer: accounts.admin },
    { address: accounts.configuration, role: 0 },
    { address: accounts.mappings, role: 1 },
    { address: accounts.systemProgram, role: 0 },
  ]
  const identifier = Buffer.from([216, 218, 224, 60, 23, 31, 193, 243])
  const buffer = Buffer.alloc(1000)
  const len = layout.encode(
    {
      seedPk: args.seedPk,
      seedId: args.seedId,
      bump: args.bump,
      scopeChains: args.scopeChains,
    },
    buffer
  )
  const data = Buffer.concat([identifier, buffer]).slice(0, 8 + len)
  const ix: IInstruction = { accounts: keys, programAddress, data }
  return ix
}
