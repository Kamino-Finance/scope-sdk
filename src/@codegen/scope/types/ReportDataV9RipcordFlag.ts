import { address, Address } from "@solana/kit" // eslint-disable-line @typescript-eslint/no-unused-vars
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as types from "../types" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh"
import { borshAddress } from "../utils"

export interface NormalJSON {
  kind: "Normal"
}

export class Normal {
  static readonly discriminator = 0
  static readonly kind = "Normal"
  readonly discriminator = 0
  readonly kind = "Normal"

  toJSON(): NormalJSON {
    return {
      kind: "Normal",
    }
  }

  toEncodable() {
    return {
      Normal: {},
    }
  }
}

export interface PausedJSON {
  kind: "Paused"
}

export class Paused {
  static readonly discriminator = 1
  static readonly kind = "Paused"
  readonly discriminator = 1
  readonly kind = "Paused"

  toJSON(): PausedJSON {
    return {
      kind: "Paused",
    }
  }

  toEncodable() {
    return {
      Paused: {},
    }
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function fromDecoded(obj: any): types.ReportDataV9RipcordFlagKind {
  if (typeof obj !== "object") {
    throw new Error("Invalid enum object")
  }

  if ("Normal" in obj) {
    return new Normal()
  }
  if ("Paused" in obj) {
    return new Paused()
  }

  throw new Error("Invalid enum object")
}

export function fromJSON(
  obj: types.ReportDataV9RipcordFlagJSON
): types.ReportDataV9RipcordFlagKind {
  switch (obj.kind) {
    case "Normal": {
      return new Normal()
    }
    case "Paused": {
      return new Paused()
    }
  }
}

export function layout(property?: string) {
  const ret = borsh.rustEnum([
    borsh.struct([], "Normal"),
    borsh.struct([], "Paused"),
  ])
  if (property !== undefined) {
    return ret.replicate(property)
  }
  return ret
}
