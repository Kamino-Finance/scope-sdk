/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  address,
  Address,
  fetchEncodedAccount,
  fetchEncodedAccounts,
  GetAccountInfoApi,
  GetMultipleAccountsApi,
  Rpc,
} from "@solana/kit"
/* eslint-enable @typescript-eslint/no-unused-vars */
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh" // eslint-disable-line @typescript-eslint/no-unused-vars
import { borshAddress } from "../utils" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as types from "../types" // eslint-disable-line @typescript-eslint/no-unused-vars
import { PROGRAM_ID } from "../programId"

export interface MintsToScopeChainsFields {
  oraclePrices: Address
  seedPk: Address
  seedId: BN
  bump: number
  mapping: Array<types.MintToScopeChainFields>
}

export interface MintsToScopeChainsJSON {
  oraclePrices: string
  seedPk: string
  seedId: string
  bump: number
  mapping: Array<types.MintToScopeChainJSON>
}

/** Map of mints to scope chain only valid for a given price feed */
export class MintsToScopeChains {
  readonly oraclePrices: Address
  readonly seedPk: Address
  readonly seedId: BN
  readonly bump: number
  readonly mapping: Array<types.MintToScopeChain>

  static readonly discriminator = Buffer.from([
    156, 236, 56, 20, 39, 141, 42, 183,
  ])

  static readonly layout = borsh.struct<MintsToScopeChains>([
    borshAddress("oraclePrices"),
    borshAddress("seedPk"),
    borsh.u64("seedId"),
    borsh.u8("bump"),
    borsh.vec(types.MintToScopeChain.layout(), "mapping"),
  ])

  constructor(fields: MintsToScopeChainsFields) {
    this.oraclePrices = fields.oraclePrices
    this.seedPk = fields.seedPk
    this.seedId = fields.seedId
    this.bump = fields.bump
    this.mapping = fields.mapping.map(
      (item) => new types.MintToScopeChain({ ...item })
    )
  }

  static async fetch(
    rpc: Rpc<GetAccountInfoApi>,
    address: Address,
    programId: Address = PROGRAM_ID
  ): Promise<MintsToScopeChains | null> {
    const info = await fetchEncodedAccount(rpc, address)

    if (!info.exists) {
      return null
    }
    if (info.programAddress !== programId) {
      throw new Error("account doesn't belong to this program")
    }

    return this.decode(Buffer.from(info.data))
  }

  static async fetchMultiple(
    rpc: Rpc<GetMultipleAccountsApi>,
    addresses: Address[],
    programId: Address = PROGRAM_ID
  ): Promise<Array<MintsToScopeChains | null>> {
    const infos = await fetchEncodedAccounts(rpc, addresses)

    return infos.map((info) => {
      if (!info.exists) {
        return null
      }
      if (info.programAddress !== programId) {
        throw new Error("account doesn't belong to this program")
      }

      return this.decode(Buffer.from(info.data))
    })
  }

  static decode(data: Buffer): MintsToScopeChains {
    if (!data.slice(0, 8).equals(MintsToScopeChains.discriminator)) {
      throw new Error("invalid account discriminator")
    }

    const dec = MintsToScopeChains.layout.decode(data.slice(8))

    return new MintsToScopeChains({
      oraclePrices: dec.oraclePrices,
      seedPk: dec.seedPk,
      seedId: dec.seedId,
      bump: dec.bump,
      mapping: dec.mapping.map(
        (
          item: any /* eslint-disable-line @typescript-eslint/no-explicit-any */
        ) => types.MintToScopeChain.fromDecoded(item)
      ),
    })
  }

  toJSON(): MintsToScopeChainsJSON {
    return {
      oraclePrices: this.oraclePrices,
      seedPk: this.seedPk,
      seedId: this.seedId.toString(),
      bump: this.bump,
      mapping: this.mapping.map((item) => item.toJSON()),
    }
  }

  static fromJSON(obj: MintsToScopeChainsJSON): MintsToScopeChains {
    return new MintsToScopeChains({
      oraclePrices: address(obj.oraclePrices),
      seedPk: address(obj.seedPk),
      seedId: new BN(obj.seedId),
      bump: obj.bump,
      mapping: obj.mapping.map((item) => types.MintToScopeChain.fromJSON(item)),
    })
  }
}
