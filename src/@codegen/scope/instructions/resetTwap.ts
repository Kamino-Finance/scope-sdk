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

export interface ResetTwapArgs {
  token: BN
  feedName: string
}

export interface ResetTwapAccounts {
  admin: TransactionSigner
  configuration: Address
  oracleTwaps: Address
  instructionSysvarAccountInfo: Address
}

export const layout = borsh.struct([borsh.u64("token"), borsh.str("feedName")])

export function resetTwap(
  args: ResetTwapArgs,
  accounts: ResetTwapAccounts,
  programAddress: Address = PROGRAM_ID
) {
  const keys: Array<IAccountMeta | IAccountSignerMeta> = [
    { address: accounts.admin.address, role: 2, signer: accounts.admin },
    { address: accounts.configuration, role: 0 },
    { address: accounts.oracleTwaps, role: 1 },
    { address: accounts.instructionSysvarAccountInfo, role: 0 },
  ]
  const identifier = Buffer.from([101, 216, 28, 92, 154, 79, 49, 187])
  const buffer = Buffer.alloc(1000)
  const len = layout.encode(
    {
      token: args.token,
      feedName: args.feedName,
    },
    buffer
  )
  const data = Buffer.concat([identifier, buffer]).slice(0, 8 + len)
  const ix: IInstruction = { accounts: keys, programAddress, data }
  return ix
}
