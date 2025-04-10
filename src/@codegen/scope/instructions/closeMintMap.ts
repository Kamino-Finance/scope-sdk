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

export interface CloseMintMapAccounts {
  admin: TransactionSigner
  configuration: Address
  mappings: Address
  systemProgram: Address
}

export function closeMintMap(
  accounts: CloseMintMapAccounts,
  programAddress: Address = PROGRAM_ID
) {
  const keys: Array<IAccountMeta | IAccountSignerMeta> = [
    { address: accounts.admin.address, role: 3, signer: accounts.admin },
    { address: accounts.configuration, role: 0 },
    { address: accounts.mappings, role: 1 },
    { address: accounts.systemProgram, role: 0 },
  ]
  const identifier = Buffer.from([146, 212, 203, 239, 191, 104, 38, 102])
  const data = identifier
  const ix: IInstruction = { accounts: keys, programAddress, data }
  return ix
}
