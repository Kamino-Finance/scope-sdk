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

export interface RefreshPriceListArgs {
  tokens: Array<number>
}

export interface RefreshPriceListAccounts {
  oraclePrices: Address
  oracleMappings: Address
  oracleTwaps: Address
  instructionSysvarAccountInfo: Address
}

export const layout = borsh.struct([borsh.vec(borsh.u16(), "tokens")])

export function refreshPriceList(
  args: RefreshPriceListArgs,
  accounts: RefreshPriceListAccounts,
  programAddress: Address = PROGRAM_ID
) {
  const keys: Array<IAccountMeta | IAccountSignerMeta> = [
    { address: accounts.oraclePrices, role: 1 },
    { address: accounts.oracleMappings, role: 0 },
    { address: accounts.oracleTwaps, role: 1 },
    { address: accounts.instructionSysvarAccountInfo, role: 0 },
  ]
  const identifier = Buffer.from([83, 186, 207, 131, 203, 254, 198, 130])
  const buffer = Buffer.alloc(1000)
  const len = layout.encode(
    {
      tokens: args.tokens,
    },
    buffer
  )
  const data = Buffer.concat([identifier, buffer]).slice(0, 8 + len)
  const ix: IInstruction = { accounts: keys, programAddress, data }
  return ix
}
