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

export interface UpdateMappingArgs {
  token: number
  priceType: number
  twapEnabled: boolean
  twapSource: number
  refPriceIndex: number
  feedName: string
  genericData: Array<number>
}

export interface UpdateMappingAccounts {
  admin: TransactionSigner
  configuration: Address
  oracleMappings: Address
  priceInfo: Option<Address>
}

export const layout = borsh.struct([
  borsh.u16("token"),
  borsh.u8("priceType"),
  borsh.bool("twapEnabled"),
  borsh.u16("twapSource"),
  borsh.u16("refPriceIndex"),
  borsh.str("feedName"),
  borsh.array(borsh.u8(), 20, "genericData"),
])

export function updateMapping(
  args: UpdateMappingArgs,
  accounts: UpdateMappingAccounts,
  programAddress: Address = PROGRAM_ID
) {
  const keys: Array<IAccountMeta | IAccountSignerMeta> = [
    { address: accounts.admin.address, role: 2, signer: accounts.admin },
    { address: accounts.configuration, role: 0 },
    { address: accounts.oracleMappings, role: 1 },
    isSome(accounts.priceInfo)
      ? { address: accounts.priceInfo.value, role: 0 }
      : { address: programAddress, role: 0 },
  ]
  const identifier = Buffer.from([56, 102, 90, 236, 243, 21, 185, 105])
  const buffer = Buffer.alloc(1000)
  const len = layout.encode(
    {
      token: args.token,
      priceType: args.priceType,
      twapEnabled: args.twapEnabled,
      twapSource: args.twapSource,
      refPriceIndex: args.refPriceIndex,
      feedName: args.feedName,
      genericData: args.genericData,
    },
    buffer
  )
  const data = Buffer.concat([identifier, buffer]).slice(0, 8 + len)
  const ix: IInstruction = { accounts: keys, programAddress, data }
  return ix
}
