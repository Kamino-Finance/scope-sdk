import { address, Address } from "@solana/kit" // eslint-disable-line @typescript-eslint/no-unused-vars
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as types from "../types" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh"
import { borshAddress } from "../utils"

export interface PythLazerDataFields {
  feedId: number
  exponent: number
  confidenceFactor: number
}

export interface PythLazerDataJSON {
  feedId: number
  exponent: number
  confidenceFactor: number
}

export class PythLazerData {
  readonly feedId: number
  readonly exponent: number
  readonly confidenceFactor: number

  constructor(fields: PythLazerDataFields) {
    this.feedId = fields.feedId
    this.exponent = fields.exponent
    this.confidenceFactor = fields.confidenceFactor
  }

  static layout(property?: string) {
    return borsh.struct(
      [
        borsh.u16("feedId"),
        borsh.u8("exponent"),
        borsh.u32("confidenceFactor"),
      ],
      property
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static fromDecoded(obj: any) {
    return new PythLazerData({
      feedId: obj.feedId,
      exponent: obj.exponent,
      confidenceFactor: obj.confidenceFactor,
    })
  }

  static toEncodable(fields: PythLazerDataFields) {
    return {
      feedId: fields.feedId,
      exponent: fields.exponent,
      confidenceFactor: fields.confidenceFactor,
    }
  }

  toJSON(): PythLazerDataJSON {
    return {
      feedId: this.feedId,
      exponent: this.exponent,
      confidenceFactor: this.confidenceFactor,
    }
  }

  static fromJSON(obj: PythLazerDataJSON): PythLazerData {
    return new PythLazerData({
      feedId: obj.feedId,
      exponent: obj.exponent,
      confidenceFactor: obj.confidenceFactor,
    })
  }

  toEncodable() {
    return PythLazerData.toEncodable(this)
  }
}
