import { address, Address } from "@solana/kit" // eslint-disable-line @typescript-eslint/no-unused-vars
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as types from "../types" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh"
import { borshAddress } from "../utils"

export interface DatedPriceFields {
  price: types.PriceFields
  lastUpdatedSlot: BN
  unixTimestamp: BN
  genericData: Array<number>
}

export interface DatedPriceJSON {
  price: types.PriceJSON
  lastUpdatedSlot: string
  unixTimestamp: string
  genericData: Array<number>
}

export class DatedPrice {
  readonly price: types.Price
  readonly lastUpdatedSlot: BN
  readonly unixTimestamp: BN
  readonly genericData: Array<number>

  constructor(fields: DatedPriceFields) {
    this.price = new types.Price({ ...fields.price })
    this.lastUpdatedSlot = fields.lastUpdatedSlot
    this.unixTimestamp = fields.unixTimestamp
    this.genericData = fields.genericData
  }

  static layout(property?: string) {
    return borsh.struct(
      [
        types.Price.layout("price"),
        borsh.u64("lastUpdatedSlot"),
        borsh.u64("unixTimestamp"),
        borsh.array(borsh.u8(), 24, "genericData"),
      ],
      property
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static fromDecoded(obj: any) {
    return new DatedPrice({
      price: types.Price.fromDecoded(obj.price),
      lastUpdatedSlot: obj.lastUpdatedSlot,
      unixTimestamp: obj.unixTimestamp,
      genericData: obj.genericData,
    })
  }

  static toEncodable(fields: DatedPriceFields) {
    return {
      price: types.Price.toEncodable(fields.price),
      lastUpdatedSlot: fields.lastUpdatedSlot,
      unixTimestamp: fields.unixTimestamp,
      genericData: fields.genericData,
    }
  }

  toJSON(): DatedPriceJSON {
    return {
      price: this.price.toJSON(),
      lastUpdatedSlot: this.lastUpdatedSlot.toString(),
      unixTimestamp: this.unixTimestamp.toString(),
      genericData: this.genericData,
    }
  }

  static fromJSON(obj: DatedPriceJSON): DatedPrice {
    return new DatedPrice({
      price: types.Price.fromJSON(obj.price),
      lastUpdatedSlot: new BN(obj.lastUpdatedSlot),
      unixTimestamp: new BN(obj.unixTimestamp),
      genericData: obj.genericData,
    })
  }

  toEncodable() {
    return DatedPrice.toEncodable(this)
  }
}
