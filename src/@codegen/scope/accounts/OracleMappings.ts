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

export interface OracleMappingsFields {
  priceInfoAccounts: Array<Address>
  priceTypes: Array<number>
  twapSource: Array<number>
  twapEnabled: Array<number>
  refPrice: Array<number>
  generic: Array<Array<number>>
}

export interface OracleMappingsJSON {
  priceInfoAccounts: Array<string>
  priceTypes: Array<number>
  twapSource: Array<number>
  twapEnabled: Array<number>
  refPrice: Array<number>
  generic: Array<Array<number>>
}

export class OracleMappings {
  readonly priceInfoAccounts: Array<Address>
  readonly priceTypes: Array<number>
  readonly twapSource: Array<number>
  readonly twapEnabled: Array<number>
  readonly refPrice: Array<number>
  readonly generic: Array<Array<number>>

  static readonly discriminator = Buffer.from([
    40, 244, 110, 80, 255, 214, 243, 188,
  ])

  static readonly layout = borsh.struct<OracleMappings>([
    borsh.array(borshAddress(), 512, "priceInfoAccounts"),
    borsh.array(borsh.u8(), 512, "priceTypes"),
    borsh.array(borsh.u16(), 512, "twapSource"),
    borsh.array(borsh.u8(), 512, "twapEnabled"),
    borsh.array(borsh.u16(), 512, "refPrice"),
    borsh.array(borsh.array(borsh.u8(), 20), 512, "generic"),
  ])

  constructor(fields: OracleMappingsFields) {
    this.priceInfoAccounts = fields.priceInfoAccounts
    this.priceTypes = fields.priceTypes
    this.twapSource = fields.twapSource
    this.twapEnabled = fields.twapEnabled
    this.refPrice = fields.refPrice
    this.generic = fields.generic
  }

  static async fetch(
    rpc: Rpc<GetAccountInfoApi>,
    address: Address,
    programId: Address = PROGRAM_ID
  ): Promise<OracleMappings | null> {
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
  ): Promise<Array<OracleMappings | null>> {
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

  static decode(data: Buffer): OracleMappings {
    if (!data.slice(0, 8).equals(OracleMappings.discriminator)) {
      throw new Error("invalid account discriminator")
    }

    const dec = OracleMappings.layout.decode(data.slice(8))

    return new OracleMappings({
      priceInfoAccounts: dec.priceInfoAccounts,
      priceTypes: dec.priceTypes,
      twapSource: dec.twapSource,
      twapEnabled: dec.twapEnabled,
      refPrice: dec.refPrice,
      generic: dec.generic,
    })
  }

  toJSON(): OracleMappingsJSON {
    return {
      priceInfoAccounts: this.priceInfoAccounts,
      priceTypes: this.priceTypes,
      twapSource: this.twapSource,
      twapEnabled: this.twapEnabled,
      refPrice: this.refPrice,
      generic: this.generic,
    }
  }

  static fromJSON(obj: OracleMappingsJSON): OracleMappings {
    return new OracleMappings({
      priceInfoAccounts: obj.priceInfoAccounts.map((item) => address(item)),
      priceTypes: obj.priceTypes,
      twapSource: obj.twapSource,
      twapEnabled: obj.twapEnabled,
      refPrice: obj.refPrice,
      generic: obj.generic,
    })
  }
}
