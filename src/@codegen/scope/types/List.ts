import { address, Address } from "@solana/kit" // eslint-disable-line @typescript-eslint/no-unused-vars
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as types from "../types" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh"
import { borshAddress } from "../utils"

export interface ListFields {
  account: Address
  itemSize: number
  count: number
  newAccount: Address
  copiedCount: number
}

export interface ListJSON {
  account: string
  itemSize: number
  count: number
  newAccount: string
  copiedCount: number
}

export class List {
  readonly account: Address
  readonly itemSize: number
  readonly count: number
  readonly newAccount: Address
  readonly copiedCount: number

  constructor(fields: ListFields) {
    this.account = fields.account
    this.itemSize = fields.itemSize
    this.count = fields.count
    this.newAccount = fields.newAccount
    this.copiedCount = fields.copiedCount
  }

  static layout(property?: string) {
    return borsh.struct(
      [
        borshAddress("account"),
        borsh.u32("itemSize"),
        borsh.u32("count"),
        borshAddress("newAccount"),
        borsh.u32("copiedCount"),
      ],
      property
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static fromDecoded(obj: any) {
    return new List({
      account: obj.account,
      itemSize: obj.itemSize,
      count: obj.count,
      newAccount: obj.newAccount,
      copiedCount: obj.copiedCount,
    })
  }

  static toEncodable(fields: ListFields) {
    return {
      account: fields.account,
      itemSize: fields.itemSize,
      count: fields.count,
      newAccount: fields.newAccount,
      copiedCount: fields.copiedCount,
    }
  }

  toJSON(): ListJSON {
    return {
      account: this.account,
      itemSize: this.itemSize,
      count: this.count,
      newAccount: this.newAccount,
      copiedCount: this.copiedCount,
    }
  }

  static fromJSON(obj: ListJSON): List {
    return new List({
      account: address(obj.account),
      itemSize: obj.itemSize,
      count: obj.count,
      newAccount: address(obj.newAccount),
      copiedCount: obj.copiedCount,
    })
  }

  toEncodable() {
    return List.toEncodable(this)
  }
}
