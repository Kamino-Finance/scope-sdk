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

export interface SwapUnevenVaultsArgs {
  targetLimitBps: BN
}

export interface SwapUnevenVaultsAccounts {
  actionsAuthority: TransactionSigner
  strategy: Address
  globalConfig: Address
  tokenAVault: Address
  tokenBVault: Address
  tokenAMint: Address
  tokenBMint: Address
  baseVaultAuthority: Address
  pool: Address
  position: Address
  raydiumPoolConfigOrBaseVaultAuthority: Address
  poolTokenVaultA: Address
  poolTokenVaultB: Address
  /** Payer must send this correctly. */
  tickArray0: Address
  /** Payer must send this correctly. */
  tickArray1: Address
  /** Payer must send this correctly. */
  tickArray2: Address
  oracle: Address
  poolProgram: Address
  scopePrices: Address
  tokenInfos: Address
  tickArrayLower: Address
  tickArrayUpper: Address
  tokenATokenProgram: Address
  tokenBTokenProgram: Address
  memoProgram: Address
  tokenProgram: Address
  tokenProgram2022: Address
  instructionSysvarAccount: Address
  consensusAccount: Address
  eventAuthority: Option<Address>
}

export const layout = borsh.struct([borsh.u64("targetLimitBps")])

export function swapUnevenVaults(
  args: SwapUnevenVaultsArgs,
  accounts: SwapUnevenVaultsAccounts,
  programAddress: Address = PROGRAM_ID
) {
  const keys: Array<IAccountMeta | IAccountSignerMeta> = [
    {
      address: accounts.actionsAuthority.address,
      role: 3,
      signer: accounts.actionsAuthority,
    },
    { address: accounts.strategy, role: 1 },
    { address: accounts.globalConfig, role: 0 },
    { address: accounts.tokenAVault, role: 1 },
    { address: accounts.tokenBVault, role: 1 },
    { address: accounts.tokenAMint, role: 0 },
    { address: accounts.tokenBMint, role: 0 },
    { address: accounts.baseVaultAuthority, role: 1 },
    { address: accounts.pool, role: 1 },
    { address: accounts.position, role: 1 },
    { address: accounts.raydiumPoolConfigOrBaseVaultAuthority, role: 0 },
    { address: accounts.poolTokenVaultA, role: 1 },
    { address: accounts.poolTokenVaultB, role: 1 },
    { address: accounts.tickArray0, role: 1 },
    { address: accounts.tickArray1, role: 1 },
    { address: accounts.tickArray2, role: 1 },
    { address: accounts.oracle, role: 1 },
    { address: accounts.poolProgram, role: 0 },
    { address: accounts.scopePrices, role: 0 },
    { address: accounts.tokenInfos, role: 0 },
    { address: accounts.tickArrayLower, role: 0 },
    { address: accounts.tickArrayUpper, role: 0 },
    { address: accounts.tokenATokenProgram, role: 0 },
    { address: accounts.tokenBTokenProgram, role: 0 },
    { address: accounts.memoProgram, role: 0 },
    { address: accounts.tokenProgram, role: 0 },
    { address: accounts.tokenProgram2022, role: 0 },
    { address: accounts.instructionSysvarAccount, role: 0 },
    { address: accounts.consensusAccount, role: 0 },
    isSome(accounts.eventAuthority)
      ? { address: accounts.eventAuthority.value, role: 0 }
      : { address: programAddress, role: 0 },
  ]
  const identifier = Buffer.from([143, 212, 101, 95, 105, 209, 184, 1])
  const buffer = Buffer.alloc(1000)
  const len = layout.encode(
    {
      targetLimitBps: args.targetLimitBps,
    },
    buffer
  )
  const data = Buffer.concat([identifier, buffer]).slice(0, 8 + len)
  const ix: IInstruction = { accounts: keys, programAddress, data }
  return ix
}
