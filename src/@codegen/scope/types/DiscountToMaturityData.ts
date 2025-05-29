import { address, Address } from "@solana/kit" // eslint-disable-line @typescript-eslint/no-unused-vars
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as types from "../types" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh"
import { borshAddress } from "../utils"

export interface DiscountToMaturityDataFields {
  discountPerYearBps: number
  maturityTimestamp: BN
}

export interface DiscountToMaturityDataJSON {
  discountPerYearBps: number
  maturityTimestamp: string
}

export class DiscountToMaturityData {
  readonly discountPerYearBps: number
  readonly maturityTimestamp: BN

  constructor(fields: DiscountToMaturityDataFields) {
    this.discountPerYearBps = fields.discountPerYearBps
    this.maturityTimestamp = fields.maturityTimestamp
  }

  static layout(property?: string) {
    return borsh.struct(
      [borsh.u16("discountPerYearBps"), borsh.i64("maturityTimestamp")],
      property
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static fromDecoded(obj: any) {
    return new DiscountToMaturityData({
      discountPerYearBps: obj.discountPerYearBps,
      maturityTimestamp: obj.maturityTimestamp,
    })
  }

  static toEncodable(fields: DiscountToMaturityDataFields) {
    return {
      discountPerYearBps: fields.discountPerYearBps,
      maturityTimestamp: fields.maturityTimestamp,
    }
  }

  toJSON(): DiscountToMaturityDataJSON {
    return {
      discountPerYearBps: this.discountPerYearBps,
      maturityTimestamp: this.maturityTimestamp.toString(),
    }
  }

  static fromJSON(obj: DiscountToMaturityDataJSON): DiscountToMaturityData {
    return new DiscountToMaturityData({
      discountPerYearBps: obj.discountPerYearBps,
      maturityTimestamp: new BN(obj.maturityTimestamp),
    })
  }

  toEncodable() {
    return DiscountToMaturityData.toEncodable(this)
  }
}
