import { address, Address } from "@solana/kit" // eslint-disable-line @typescript-eslint/no-unused-vars
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as types from "../types" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh"
import { borshAddress } from "../utils"

export interface CappedMostRecentOfDataFields {
  sourceEntries: Array<number>
  maxDivergenceBps: number
  sourcesMaxAgeS: BN
  capEntry: number
}

export interface CappedMostRecentOfDataJSON {
  sourceEntries: Array<number>
  maxDivergenceBps: number
  sourcesMaxAgeS: string
  capEntry: number
}

export class CappedMostRecentOfData {
  readonly sourceEntries: Array<number>
  readonly maxDivergenceBps: number
  readonly sourcesMaxAgeS: BN
  readonly capEntry: number

  constructor(fields: CappedMostRecentOfDataFields) {
    this.sourceEntries = fields.sourceEntries
    this.maxDivergenceBps = fields.maxDivergenceBps
    this.sourcesMaxAgeS = fields.sourcesMaxAgeS
    this.capEntry = fields.capEntry
  }

  static layout(property?: string) {
    return borsh.struct(
      [
        borsh.array(borsh.u16(), 4, "sourceEntries"),
        borsh.u16("maxDivergenceBps"),
        borsh.u64("sourcesMaxAgeS"),
        borsh.u16("capEntry"),
      ],
      property
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static fromDecoded(obj: any) {
    return new CappedMostRecentOfData({
      sourceEntries: obj.sourceEntries,
      maxDivergenceBps: obj.maxDivergenceBps,
      sourcesMaxAgeS: obj.sourcesMaxAgeS,
      capEntry: obj.capEntry,
    })
  }

  static toEncodable(fields: CappedMostRecentOfDataFields) {
    return {
      sourceEntries: fields.sourceEntries,
      maxDivergenceBps: fields.maxDivergenceBps,
      sourcesMaxAgeS: fields.sourcesMaxAgeS,
      capEntry: fields.capEntry,
    }
  }

  toJSON(): CappedMostRecentOfDataJSON {
    return {
      sourceEntries: this.sourceEntries,
      maxDivergenceBps: this.maxDivergenceBps,
      sourcesMaxAgeS: this.sourcesMaxAgeS.toString(),
      capEntry: this.capEntry,
    }
  }

  static fromJSON(obj: CappedMostRecentOfDataJSON): CappedMostRecentOfData {
    return new CappedMostRecentOfData({
      sourceEntries: obj.sourceEntries,
      maxDivergenceBps: obj.maxDivergenceBps,
      sourcesMaxAgeS: new BN(obj.sourcesMaxAgeS),
      capEntry: obj.capEntry,
    })
  }

  toEncodable() {
    return CappedMostRecentOfData.toEncodable(this)
  }
}
