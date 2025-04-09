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

export interface ConfigurationFields {
  admin: Address
  oracleMappings: Address
  oraclePrices: Address
  tokensMetadata: Address
  oracleTwaps: Address
  adminCached: Address
  padding: Array<BN>
}

export interface ConfigurationJSON {
  admin: string
  oracleMappings: string
  oraclePrices: string
  tokensMetadata: string
  oracleTwaps: string
  adminCached: string
  padding: Array<string>
}

export class Configuration {
  readonly admin: Address
  readonly oracleMappings: Address
  readonly oraclePrices: Address
  readonly tokensMetadata: Address
  readonly oracleTwaps: Address
  readonly adminCached: Address
  readonly padding: Array<BN>

  static readonly discriminator = Buffer.from([
    192, 79, 172, 30, 21, 173, 25, 43,
  ])

  static readonly layout = borsh.struct<Configuration>([
    borshAddress("admin"),
    borshAddress("oracleMappings"),
    borshAddress("oraclePrices"),
    borshAddress("tokensMetadata"),
    borshAddress("oracleTwaps"),
    borshAddress("adminCached"),
    borsh.array(borsh.u64(), 1255, "padding"),
  ])

  constructor(fields: ConfigurationFields) {
    this.admin = fields.admin
    this.oracleMappings = fields.oracleMappings
    this.oraclePrices = fields.oraclePrices
    this.tokensMetadata = fields.tokensMetadata
    this.oracleTwaps = fields.oracleTwaps
    this.adminCached = fields.adminCached
    this.padding = fields.padding
  }

  static async fetch(
    rpc: Rpc<GetAccountInfoApi>,
    address: Address,
    programId: Address = PROGRAM_ID
  ): Promise<Configuration | null> {
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
  ): Promise<Array<Configuration | null>> {
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

  static decode(data: Buffer): Configuration {
    if (!data.slice(0, 8).equals(Configuration.discriminator)) {
      throw new Error("invalid account discriminator")
    }

    const dec = Configuration.layout.decode(data.slice(8))

    return new Configuration({
      admin: dec.admin,
      oracleMappings: dec.oracleMappings,
      oraclePrices: dec.oraclePrices,
      tokensMetadata: dec.tokensMetadata,
      oracleTwaps: dec.oracleTwaps,
      adminCached: dec.adminCached,
      padding: dec.padding,
    })
  }

  toJSON(): ConfigurationJSON {
    return {
      admin: this.admin,
      oracleMappings: this.oracleMappings,
      oraclePrices: this.oraclePrices,
      tokensMetadata: this.tokensMetadata,
      oracleTwaps: this.oracleTwaps,
      adminCached: this.adminCached,
      padding: this.padding.map((item) => item.toString()),
    }
  }

  static fromJSON(obj: ConfigurationJSON): Configuration {
    return new Configuration({
      admin: address(obj.admin),
      oracleMappings: address(obj.oracleMappings),
      oraclePrices: address(obj.oraclePrices),
      tokensMetadata: address(obj.tokensMetadata),
      oracleTwaps: address(obj.oracleTwaps),
      adminCached: address(obj.adminCached),
      padding: obj.padding.map((item) => new BN(item)),
    })
  }
}
