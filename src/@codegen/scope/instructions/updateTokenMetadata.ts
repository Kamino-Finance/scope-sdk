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

export interface UpdateTokenMetadataArgs {
  index: BN
  mode: BN
  feedName: string
  value: Uint8Array
}

export interface UpdateTokenMetadataAccounts {
  admin: TransactionSigner
  configuration: Address
  tokensMetadata: Address
}

export const layout = borsh.struct([
  borsh.u64("index"),
  borsh.u64("mode"),
  borsh.str("feedName"),
  borsh.vecU8("value"),
])

export function updateTokenMetadata(
  args: UpdateTokenMetadataArgs,
  accounts: UpdateTokenMetadataAccounts,
  programAddress: Address = PROGRAM_ID
) {
  const keys: Array<IAccountMeta | IAccountSignerMeta> = [
    { address: accounts.admin.address, role: 2, signer: accounts.admin },
    { address: accounts.configuration, role: 0 },
    { address: accounts.tokensMetadata, role: 1 },
  ]
  const identifier = Buffer.from([243, 6, 8, 23, 126, 181, 251, 158])
  const buffer = Buffer.alloc(1000)
  const len = layout.encode(
    {
      index: args.index,
      mode: args.mode,
      feedName: args.feedName,
      value: Buffer.from(
        args.value.buffer,
        args.value.byteOffset,
        args.value.length
      ),
    },
    buffer
  )
  const data = Buffer.concat([identifier, buffer]).slice(0, 8 + len)
  const ix: IInstruction = { accounts: keys, programAddress, data }
  return ix
}
