import { address, Address } from "@solana/kit" // eslint-disable-line @typescript-eslint/no-unused-vars
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as types from "../types" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh"
import { borshAddress } from "../utils"

export interface TokenMetadataFields {
  name: Array<number>
  maxAgePriceSlots: BN
  groupIdsBitset: BN
  reserved: Array<BN>
}

export interface TokenMetadataJSON {
  name: Array<number>
  maxAgePriceSlots: string
  groupIdsBitset: string
  reserved: Array<string>
}

export class TokenMetadata {
  readonly name: Array<number>
  readonly maxAgePriceSlots: BN
  readonly groupIdsBitset: BN
  readonly reserved: Array<BN>

  constructor(fields: TokenMetadataFields) {
    this.name = fields.name
    this.maxAgePriceSlots = fields.maxAgePriceSlots
    this.groupIdsBitset = fields.groupIdsBitset
    this.reserved = fields.reserved
  }

  static layout(property?: string) {
    return borsh.struct(
      [
        borsh.array(borsh.u8(), 32, "name"),
        borsh.u64("maxAgePriceSlots"),
        borsh.u64("groupIdsBitset"),
        borsh.array(borsh.u64(), 15, "reserved"),
      ],
      property
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static fromDecoded(obj: any) {
    return new TokenMetadata({
      name: obj.name,
      maxAgePriceSlots: obj.maxAgePriceSlots,
      groupIdsBitset: obj.groupIdsBitset,
      reserved: obj.reserved,
    })
  }

  static toEncodable(fields: TokenMetadataFields) {
    return {
      name: fields.name,
      maxAgePriceSlots: fields.maxAgePriceSlots,
      groupIdsBitset: fields.groupIdsBitset,
      reserved: fields.reserved,
    }
  }

  toJSON(): TokenMetadataJSON {
    return {
      name: this.name,
      maxAgePriceSlots: this.maxAgePriceSlots.toString(),
      groupIdsBitset: this.groupIdsBitset.toString(),
      reserved: this.reserved.map((item) => item.toString()),
    }
  }

  static fromJSON(obj: TokenMetadataJSON): TokenMetadata {
    return new TokenMetadata({
      name: obj.name,
      maxAgePriceSlots: new BN(obj.maxAgePriceSlots),
      groupIdsBitset: new BN(obj.groupIdsBitset),
      reserved: obj.reserved.map((item) => new BN(item)),
    })
  }

  toEncodable() {
    return TokenMetadata.toEncodable(this)
  }
}
