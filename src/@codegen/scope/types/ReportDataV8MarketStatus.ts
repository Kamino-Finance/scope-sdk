import { address, Address } from "@solana/kit" // eslint-disable-line @typescript-eslint/no-unused-vars
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as types from "../types" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh"
import { borshAddress } from "../utils"

export interface UnknownJSON {
  kind: "Unknown"
}

export class Unknown {
  static readonly discriminator = 0
  static readonly kind = "Unknown"
  readonly discriminator = 0
  readonly kind = "Unknown"

  toJSON(): UnknownJSON {
    return {
      kind: "Unknown",
    }
  }

  toEncodable() {
    return {
      Unknown: {},
    }
  }
}

export interface ClosedJSON {
  kind: "Closed"
}

export class Closed {
  static readonly discriminator = 1
  static readonly kind = "Closed"
  readonly discriminator = 1
  readonly kind = "Closed"

  toJSON(): ClosedJSON {
    return {
      kind: "Closed",
    }
  }

  toEncodable() {
    return {
      Closed: {},
    }
  }
}

export interface OpenJSON {
  kind: "Open"
}

export class Open {
  static readonly discriminator = 2
  static readonly kind = "Open"
  readonly discriminator = 2
  readonly kind = "Open"

  toJSON(): OpenJSON {
    return {
      kind: "Open",
    }
  }

  toEncodable() {
    return {
      Open: {},
    }
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function fromDecoded(obj: any): types.ReportDataV8MarketStatusKind {
  if (typeof obj !== "object") {
    throw new Error("Invalid enum object")
  }

  if ("Unknown" in obj) {
    return new Unknown()
  }
  if ("Closed" in obj) {
    return new Closed()
  }
  if ("Open" in obj) {
    return new Open()
  }

  throw new Error("Invalid enum object")
}

export function fromJSON(
  obj: types.ReportDataV8MarketStatusJSON
): types.ReportDataV8MarketStatusKind {
  switch (obj.kind) {
    case "Unknown": {
      return new Unknown()
    }
    case "Closed": {
      return new Closed()
    }
    case "Open": {
      return new Open()
    }
  }
}

export function layout(property?: string) {
  const ret = borsh.rustEnum([
    borsh.struct([], "Unknown"),
    borsh.struct([], "Closed"),
    borsh.struct([], "Open"),
  ])
  if (property !== undefined) {
    return ret.replicate(property)
  }
  return ret
}
