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

export interface RefreshChainlinkPriceArgs {
  token: number
  serializedChainlinkReport: Uint8Array
}

export interface RefreshChainlinkPriceAccounts {
  /** The account that signs the transaction. */
  user: TransactionSigner
  oraclePrices: Address
  oracleMappings: Address
  oracleTwaps: Address
  /**
   * The Verifier Account stores the DON's public keys and other verification parameters.
   * This account must match the PDA derived from the verifier program.
   */
  verifierAccount: Address
  /** The Access Controller Account */
  accessController: Address
  /** The Config Account is a PDA derived from a signed report */
  configAccount: Address
  /** The Verifier Program ID specifies the target Chainlink Data Streams Verifier Program. */
  verifierProgramId: Address
}

export const layout = borsh.struct([
  borsh.u16("token"),
  borsh.vecU8("serializedChainlinkReport"),
])

export function refreshChainlinkPrice(
  args: RefreshChainlinkPriceArgs,
  accounts: RefreshChainlinkPriceAccounts,
  programAddress: Address = PROGRAM_ID
) {
  const keys: Array<IAccountMeta | IAccountSignerMeta> = [
    { address: accounts.user.address, role: 2, signer: accounts.user },
    { address: accounts.oraclePrices, role: 1 },
    { address: accounts.oracleMappings, role: 0 },
    { address: accounts.oracleTwaps, role: 1 },
    { address: accounts.verifierAccount, role: 0 },
    { address: accounts.accessController, role: 0 },
    { address: accounts.configAccount, role: 0 },
    { address: accounts.verifierProgramId, role: 0 },
  ]
  const identifier = Buffer.from([97, 9, 20, 115, 72, 255, 4, 140])
  const buffer = Buffer.alloc(1000)
  const len = layout.encode(
    {
      token: args.token,
      serializedChainlinkReport: Buffer.from(
        args.serializedChainlinkReport.buffer,
        args.serializedChainlinkReport.byteOffset,
        args.serializedChainlinkReport.length
      ),
    },
    buffer
  )
  const data = Buffer.concat([identifier, buffer]).slice(0, 8 + len)
  const ix: IInstruction = { accounts: keys, programAddress, data }
  return ix
}
