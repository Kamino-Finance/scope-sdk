import { address, Address } from "@solana/kit" // eslint-disable-line @typescript-eslint/no-unused-vars
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as types from "../types" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh"
import { borshAddress } from "../utils"

export interface AllUpdatesJSON {
  kind: "AllUpdates"
}

export class AllUpdates {
  static readonly discriminator = 0
  static readonly kind = "AllUpdates"
  readonly discriminator = 0
  readonly kind = "AllUpdates"

  toJSON(): AllUpdatesJSON {
    return {
      kind: "AllUpdates",
    }
  }

  toEncodable() {
    return {
      AllUpdates: {},
    }
  }
}

export interface OpenJSON {
  kind: "Open"
}

export class Open {
  static readonly discriminator = 1
  static readonly kind = "Open"
  readonly discriminator = 1
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

export interface OpenAndPrePostJSON {
  kind: "OpenAndPrePost"
}

export class OpenAndPrePost {
  static readonly discriminator = 2
  static readonly kind = "OpenAndPrePost"
  readonly discriminator = 2
  readonly kind = "OpenAndPrePost"

  toJSON(): OpenAndPrePostJSON {
    return {
      kind: "OpenAndPrePost",
    }
  }

  toEncodable() {
    return {
      OpenAndPrePost: {},
    }
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function fromDecoded(obj: any): types.MarketStatusBehaviorKind {
  if (typeof obj !== "object") {
    throw new Error("Invalid enum object")
  }

  if ("AllUpdates" in obj) {
    return new AllUpdates()
  }
  if ("Open" in obj) {
    return new Open()
  }
  if ("OpenAndPrePost" in obj) {
    return new OpenAndPrePost()
  }

  throw new Error("Invalid enum object")
}

export function fromJSON(
  obj: types.MarketStatusBehaviorJSON
): types.MarketStatusBehaviorKind {
  switch (obj.kind) {
    case "AllUpdates": {
      return new AllUpdates()
    }
    case "Open": {
      return new Open()
    }
    case "OpenAndPrePost": {
      return new OpenAndPrePost()
    }
  }
}

export function layout(property?: string) {
  const ret = borsh.rustEnum([
    borsh.struct([], "AllUpdates"),
    borsh.struct([], "Open"),
    borsh.struct([], "OpenAndPrePost"),
  ])
  if (property !== undefined) {
    return ret.replicate(property)
  }
  return ret
}
