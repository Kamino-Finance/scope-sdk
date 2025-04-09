/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  address,
  Address,
  fetchEncodedAccount,
  fetchEncodedAccounts,
  GetAccountInfoApi,
  GetMultipleAccountsApi,
  Rpc,
} from "@solana/kit"
/* eslint-enable @typescript-eslint/no-unused-vars */
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh" // eslint-disable-line @typescript-eslint/no-unused-vars
import { borshAddress } from "../utils" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as types from "../types" // eslint-disable-line @typescript-eslint/no-unused-vars
import { PROGRAM_ID } from "../programId"

export interface TokenMetadatasFields {
  metadatasArray: Array<types.TokenMetadataFields>
}

export interface TokenMetadatasJSON {
  metadatasArray: Array<types.TokenMetadataJSON>
}

export class TokenMetadatas {
  readonly metadatasArray: Array<types.TokenMetadata>

  static readonly discriminator = Buffer.from([
    221, 107, 64, 103, 67, 0, 165, 22,
  ])

  static readonly layout = borsh.struct<TokenMetadatas>([
    borsh.array(types.TokenMetadata.layout(), 512, "metadatasArray"),
  ])

  constructor(fields: TokenMetadatasFields) {
    this.metadatasArray = fields.metadatasArray.map(
      (item) => new types.TokenMetadata({ ...item })
    )
  }

  static async fetch(
    rpc: Rpc<GetAccountInfoApi>,
    address: Address,
    programId: Address = PROGRAM_ID
  ): Promise<TokenMetadatas | null> {
    const info = await fetchEncodedAccount(rpc, address)

    if (!info.exists) {
      return null
    }
    if (info.programAddress !== programId) {
      throw new Error("account doesn't belong to this program")
    }

    return this.decode(Buffer.from(info.data))
  }

  static async fetchMultiple(
    rpc: Rpc<GetMultipleAccountsApi>,
    addresses: Address[],
    programId: Address = PROGRAM_ID
  ): Promise<Array<TokenMetadatas | null>> {
    const infos = await fetchEncodedAccounts(rpc, addresses)

    return infos.map((info) => {
      if (!info.exists) {
        return null
      }
      if (info.programAddress !== programId) {
        throw new Error("account doesn't belong to this program")
      }

      return this.decode(Buffer.from(info.data))
    })
  }

  static decode(data: Buffer): TokenMetadatas {
    if (!data.slice(0, 8).equals(TokenMetadatas.discriminator)) {
      throw new Error("invalid account discriminator")
    }

    const dec = TokenMetadatas.layout.decode(data.slice(8))

    return new TokenMetadatas({
      metadatasArray: dec.metadatasArray.map(
        (
          item: any /* eslint-disable-line @typescript-eslint/no-explicit-any */
        ) => types.TokenMetadata.fromDecoded(item)
      ),
    })
  }

  toJSON(): TokenMetadatasJSON {
    return {
      metadatasArray: this.metadatasArray.map((item) => item.toJSON()),
    }
  }

  static fromJSON(obj: TokenMetadatasJSON): TokenMetadatas {
    return new TokenMetadatas({
      metadatasArray: obj.metadatasArray.map((item) =>
        types.TokenMetadata.fromJSON(item)
      ),
    })
  }
}
