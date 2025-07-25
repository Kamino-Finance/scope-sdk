import { address, Address } from "@solana/kit" // eslint-disable-line @typescript-eslint/no-unused-vars
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as types from "../types" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh"
import { borshAddress } from "../utils"

export interface CappedFlooredDataFields {
  sourceEntry: number
  capEntry: number | null
  floorEntry: number | null
}

export interface CappedFlooredDataJSON {
  sourceEntry: number
  capEntry: number | null
  floorEntry: number | null
}

export class CappedFlooredData {
  readonly sourceEntry: number
  readonly capEntry: number | null
  readonly floorEntry: number | null

  constructor(fields: CappedFlooredDataFields) {
    this.sourceEntry = fields.sourceEntry
    this.capEntry = fields.capEntry
    this.floorEntry = fields.floorEntry
  }

  static layout(property?: string) {
    return borsh.struct(
      [
        borsh.u16("sourceEntry"),
        borsh.option(borsh.u16(), "capEntry"),
        borsh.option(borsh.u16(), "floorEntry"),
      ],
      property
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static fromDecoded(obj: any) {
    return new CappedFlooredData({
      sourceEntry: obj.sourceEntry,
      capEntry: obj.capEntry,
      floorEntry: obj.floorEntry,
    })
  }

  static toEncodable(fields: CappedFlooredDataFields) {
    return {
      sourceEntry: fields.sourceEntry,
      capEntry: fields.capEntry,
      floorEntry: fields.floorEntry,
    }
  }

  toJSON(): CappedFlooredDataJSON {
    return {
      sourceEntry: this.sourceEntry,
      capEntry: this.capEntry,
      floorEntry: this.floorEntry,
    }
  }

  static fromJSON(obj: CappedFlooredDataJSON): CappedFlooredData {
    return new CappedFlooredData({
      sourceEntry: obj.sourceEntry,
      capEntry: obj.capEntry,
      floorEntry: obj.floorEntry,
    })
  }

  toEncodable() {
    return CappedFlooredData.toEncodable(this)
  }
}
