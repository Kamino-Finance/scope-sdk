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

export interface InitializeArgs {
  feedName: string
}

export interface InitializeAccounts {
  admin: TransactionSigner
  systemProgram: Address
  configuration: Address
  tokenMetadatas: Address
  oracleTwaps: Address
  oraclePrices: Address
  oracleMappings: Address
}

export const layout = borsh.struct([borsh.str("feedName")])

export function initialize(
  args: InitializeArgs,
  accounts: InitializeAccounts,
  programAddress: Address = PROGRAM_ID
) {
  const keys: Array<IAccountMeta | IAccountSignerMeta> = [
    { address: accounts.admin.address, role: 3, signer: accounts.admin },
    { address: accounts.systemProgram, role: 0 },
    { address: accounts.configuration, role: 1 },
    { address: accounts.tokenMetadatas, role: 1 },
    { address: accounts.oracleTwaps, role: 1 },
    { address: accounts.oraclePrices, role: 1 },
    { address: accounts.oracleMappings, role: 1 },
  ]
  const identifier = Buffer.from([175, 175, 109, 31, 13, 152, 155, 237])
  const buffer = Buffer.alloc(1000)
  const len = layout.encode(
    {
      feedName: args.feedName,
    },
    buffer
  )
  const data = Buffer.concat([identifier, buffer]).slice(0, 8 + len)
  const ix: IInstruction = { accounts: keys, programAddress, data }
  return ix
}
