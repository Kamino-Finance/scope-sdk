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

export interface SetAdminCachedArgs {
  newAdmin: Address
  feedName: string
}

export interface SetAdminCachedAccounts {
  admin: TransactionSigner
  configuration: Address
}

export const layout = borsh.struct([
  borshAddress("newAdmin"),
  borsh.str("feedName"),
])

export function setAdminCached(
  args: SetAdminCachedArgs,
  accounts: SetAdminCachedAccounts,
  programAddress: Address = PROGRAM_ID
) {
  const keys: Array<IAccountMeta | IAccountSignerMeta> = [
    { address: accounts.admin.address, role: 2, signer: accounts.admin },
    { address: accounts.configuration, role: 1 },
  ]
  const identifier = Buffer.from([114, 14, 105, 205, 216, 148, 30, 75])
  const buffer = Buffer.alloc(1000)
  const len = layout.encode(
    {
      newAdmin: args.newAdmin,
      feedName: args.feedName,
    },
    buffer
  )
  const data = Buffer.concat([identifier, buffer]).slice(0, 8 + len)
  const ix: IInstruction = { accounts: keys, programAddress, data }
  return ix
}
