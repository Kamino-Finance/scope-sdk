import { address, Address } from "@solana/kit" // eslint-disable-line @typescript-eslint/no-unused-vars
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as types from "../types" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh"
import { borshAddress } from "../utils"

export interface NameJSON {
  kind: "Name"
}

export class Name {
  static readonly discriminator = 0
  static readonly kind = "Name"
  readonly discriminator = 0
  readonly kind = "Name"

  toJSON(): NameJSON {
    return {
      kind: "Name",
    }
  }

  toEncodable() {
    return {
      Name: {},
    }
  }
}

export interface MaxPriceAgeSlotsJSON {
  kind: "MaxPriceAgeSlots"
}

export class MaxPriceAgeSlots {
  static readonly discriminator = 1
  static readonly kind = "MaxPriceAgeSlots"
  readonly discriminator = 1
  readonly kind = "MaxPriceAgeSlots"

  toJSON(): MaxPriceAgeSlotsJSON {
    return {
      kind: "MaxPriceAgeSlots",
    }
  }

  toEncodable() {
    return {
      MaxPriceAgeSlots: {},
    }
  }
}

export interface GroupIdsJSON {
  kind: "GroupIds"
}

export class GroupIds {
  static readonly discriminator = 2
  static readonly kind = "GroupIds"
  readonly discriminator = 2
  readonly kind = "GroupIds"

  toJSON(): GroupIdsJSON {
    return {
      kind: "GroupIds",
    }
  }

  toEncodable() {
    return {
      GroupIds: {},
    }
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function fromDecoded(obj: any): types.UpdateTokenMetadataModeKind {
  if (typeof obj !== "object") {
    throw new Error("Invalid enum object")
  }

  if ("Name" in obj) {
    return new Name()
  }
  if ("MaxPriceAgeSlots" in obj) {
    return new MaxPriceAgeSlots()
  }
  if ("GroupIds" in obj) {
    return new GroupIds()
  }

  throw new Error("Invalid enum object")
}

export function fromJSON(
  obj: types.UpdateTokenMetadataModeJSON
): types.UpdateTokenMetadataModeKind {
  switch (obj.kind) {
    case "Name": {
      return new Name()
    }
    case "MaxPriceAgeSlots": {
      return new MaxPriceAgeSlots()
    }
    case "GroupIds": {
      return new GroupIds()
    }
  }
}

export function layout(property?: string) {
  const ret = borsh.rustEnum([
    borsh.struct([], "Name"),
    borsh.struct([], "MaxPriceAgeSlots"),
    borsh.struct([], "GroupIds"),
  ])
  if (property !== undefined) {
    return ret.replicate(property)
  }
  return ret
}
