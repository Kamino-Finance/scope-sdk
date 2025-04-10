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

export interface OracleTwapsFields {
  oraclePrices: Address
  oracleMappings: Address
  twaps: Array<types.EmaTwapFields>
}

export interface OracleTwapsJSON {
  oraclePrices: string
  oracleMappings: string
  twaps: Array<types.EmaTwapJSON>
}

export class OracleTwaps {
  readonly oraclePrices: Address
  readonly oracleMappings: Address
  readonly twaps: Array<types.EmaTwap>

  static readonly discriminator = Buffer.from([
    192, 139, 27, 250, 53, 166, 101, 61,
  ])

  static readonly layout = borsh.struct<OracleTwaps>([
    borshAddress("oraclePrices"),
    borshAddress("oracleMappings"),
    borsh.array(types.EmaTwap.layout(), 512, "twaps"),
  ])

  constructor(fields: OracleTwapsFields) {
    this.oraclePrices = fields.oraclePrices
    this.oracleMappings = fields.oracleMappings
    this.twaps = fields.twaps.map((item) => new types.EmaTwap({ ...item }))
  }

  static async fetch(
    rpc: Rpc<GetAccountInfoApi>,
    address: Address,
    programId: Address = PROGRAM_ID
  ): Promise<OracleTwaps | null> {
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
  ): Promise<Array<OracleTwaps | null>> {
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

  static decode(data: Buffer): OracleTwaps {
    if (!data.slice(0, 8).equals(OracleTwaps.discriminator)) {
      throw new Error("invalid account discriminator")
    }

    const dec = OracleTwaps.layout.decode(data.slice(8))

    return new OracleTwaps({
      oraclePrices: dec.oraclePrices,
      oracleMappings: dec.oracleMappings,
      twaps: dec.twaps.map(
        (
          item: any /* eslint-disable-line @typescript-eslint/no-explicit-any */
        ) => types.EmaTwap.fromDecoded(item)
      ),
    })
  }

  toJSON(): OracleTwapsJSON {
    return {
      oraclePrices: this.oraclePrices,
      oracleMappings: this.oracleMappings,
      twaps: this.twaps.map((item) => item.toJSON()),
    }
  }

  static fromJSON(obj: OracleTwapsJSON): OracleTwaps {
    return new OracleTwaps({
      oraclePrices: address(obj.oraclePrices),
      oracleMappings: address(obj.oracleMappings),
      twaps: obj.twaps.map((item) => types.EmaTwap.fromJSON(item)),
    })
  }
}
