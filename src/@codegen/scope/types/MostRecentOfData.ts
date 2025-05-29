import { address, Address } from "@solana/kit" // eslint-disable-line @typescript-eslint/no-unused-vars
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as types from "../types" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh"
import { borshAddress } from "../utils"

export interface MostRecentOfDataFields {
  sourceEntries: Array<number>
  maxDivergenceBps: number
  sourcesMaxAgeS: number
}

export interface MostRecentOfDataJSON {
  sourceEntries: Array<number>
  maxDivergenceBps: number
  sourcesMaxAgeS: number
}

export class MostRecentOfData {
  readonly sourceEntries: Array<number>
  readonly maxDivergenceBps: number
  readonly sourcesMaxAgeS: number

  constructor(fields: MostRecentOfDataFields) {
    this.sourceEntries = fields.sourceEntries
    this.maxDivergenceBps = fields.maxDivergenceBps
    this.sourcesMaxAgeS = fields.sourcesMaxAgeS
  }

  static layout(property?: string) {
    return borsh.struct(
      [
        borsh.array(borsh.u16(), 4, "sourceEntries"),
        borsh.u16("maxDivergenceBps"),
        borsh.u16("sourcesMaxAgeS"),
      ],
      property
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static fromDecoded(obj: any) {
    return new MostRecentOfData({
      sourceEntries: obj.sourceEntries,
      maxDivergenceBps: obj.maxDivergenceBps,
      sourcesMaxAgeS: obj.sourcesMaxAgeS,
    })
  }

  static toEncodable(fields: MostRecentOfDataFields) {
    return {
      sourceEntries: fields.sourceEntries,
      maxDivergenceBps: fields.maxDivergenceBps,
      sourcesMaxAgeS: fields.sourcesMaxAgeS,
    }
  }

  toJSON(): MostRecentOfDataJSON {
    return {
      sourceEntries: this.sourceEntries,
      maxDivergenceBps: this.maxDivergenceBps,
      sourcesMaxAgeS: this.sourcesMaxAgeS,
    }
  }

  static fromJSON(obj: MostRecentOfDataJSON): MostRecentOfData {
    return new MostRecentOfData({
      sourceEntries: obj.sourceEntries,
      maxDivergenceBps: obj.maxDivergenceBps,
      sourcesMaxAgeS: obj.sourcesMaxAgeS,
    })
  }

  toEncodable() {
    return MostRecentOfData.toEncodable(this)
  }
}
