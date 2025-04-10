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

export interface ApproveAdminCachedArgs {
  feedName: string
}

export interface ApproveAdminCachedAccounts {
  adminCached: TransactionSigner
  configuration: Address
}

export const layout = borsh.struct([borsh.str("feedName")])

export function approveAdminCached(
  args: ApproveAdminCachedArgs,
  accounts: ApproveAdminCachedAccounts,
  programAddress: Address = PROGRAM_ID
) {
  const keys: Array<IAccountMeta | IAccountSignerMeta> = [
    {
      address: accounts.adminCached.address,
      role: 2,
      signer: accounts.adminCached,
    },
    { address: accounts.configuration, role: 1 },
  ]
  const identifier = Buffer.from([101, 149, 97, 58, 48, 79, 16, 105])
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
