import { address, Address } from "@solana/kit" // eslint-disable-line @typescript-eslint/no-unused-vars
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as types from "../types" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh"
import { borshAddress } from "../utils"

export interface AggregatorAccountDataFields {
  name: Array<number>
  metadata: Array<number>
  authorWallet: Address
  queuePubkey: Address
  oracleRequestBatchSize: number
  minOracleResults: number
  minJobResults: number
  minUpdateDelaySeconds: number
  startAfter: BN
  varianceThreshold: types.SwitchboardDecimalFields
  forceReportPeriod: BN
  expiration: BN
  consecutiveFailureCount: BN
  nextAllowedUpdateTime: BN
  isLocked: boolean
  schedule: Array<number>
  latestConfirmedRound: types.AggregatorRoundFields
  currentRound: types.AggregatorRoundFields
  jobPubkeysData: Array<Address>
  jobHashes: Array<types.HashFields>
  jobPubkeysSize: number
  jobsChecksum: Array<number>
  authority: Address
  ebuf: Array<number>
}

export interface AggregatorAccountDataJSON {
  name: Array<number>
  metadata: Array<number>
  authorWallet: string
  queuePubkey: string
  oracleRequestBatchSize: number
  minOracleResults: number
  minJobResults: number
  minUpdateDelaySeconds: number
  startAfter: string
  varianceThreshold: types.SwitchboardDecimalJSON
  forceReportPeriod: string
  expiration: string
  consecutiveFailureCount: string
  nextAllowedUpdateTime: string
  isLocked: boolean
  schedule: Array<number>
  latestConfirmedRound: types.AggregatorRoundJSON
  currentRound: types.AggregatorRoundJSON
  jobPubkeysData: Array<string>
  jobHashes: Array<types.HashJSON>
  jobPubkeysSize: number
  jobsChecksum: Array<number>
  authority: string
  ebuf: Array<number>
}

export class AggregatorAccountData {
  readonly name: Array<number>
  readonly metadata: Array<number>
  readonly authorWallet: Address
  readonly queuePubkey: Address
  readonly oracleRequestBatchSize: number
  readonly minOracleResults: number
  readonly minJobResults: number
  readonly minUpdateDelaySeconds: number
  readonly startAfter: BN
  readonly varianceThreshold: types.SwitchboardDecimal
  readonly forceReportPeriod: BN
  readonly expiration: BN
  readonly consecutiveFailureCount: BN
  readonly nextAllowedUpdateTime: BN
  readonly isLocked: boolean
  readonly schedule: Array<number>
  readonly latestConfirmedRound: types.AggregatorRound
  readonly currentRound: types.AggregatorRound
  readonly jobPubkeysData: Array<Address>
  readonly jobHashes: Array<types.Hash>
  readonly jobPubkeysSize: number
  readonly jobsChecksum: Array<number>
  readonly authority: Address
  readonly ebuf: Array<number>

  constructor(fields: AggregatorAccountDataFields) {
    this.name = fields.name
    this.metadata = fields.metadata
    this.authorWallet = fields.authorWallet
    this.queuePubkey = fields.queuePubkey
    this.oracleRequestBatchSize = fields.oracleRequestBatchSize
    this.minOracleResults = fields.minOracleResults
    this.minJobResults = fields.minJobResults
    this.minUpdateDelaySeconds = fields.minUpdateDelaySeconds
    this.startAfter = fields.startAfter
    this.varianceThreshold = new types.SwitchboardDecimal({
      ...fields.varianceThreshold,
    })
    this.forceReportPeriod = fields.forceReportPeriod
    this.expiration = fields.expiration
    this.consecutiveFailureCount = fields.consecutiveFailureCount
    this.nextAllowedUpdateTime = fields.nextAllowedUpdateTime
    this.isLocked = fields.isLocked
    this.schedule = fields.schedule
    this.latestConfirmedRound = new types.AggregatorRound({
      ...fields.latestConfirmedRound,
    })
    this.currentRound = new types.AggregatorRound({ ...fields.currentRound })
    this.jobPubkeysData = fields.jobPubkeysData
    this.jobHashes = fields.jobHashes.map((item) => new types.Hash({ ...item }))
    this.jobPubkeysSize = fields.jobPubkeysSize
    this.jobsChecksum = fields.jobsChecksum
    this.authority = fields.authority
    this.ebuf = fields.ebuf
  }

  static layout(property?: string) {
    return borsh.struct(
      [
        borsh.array(borsh.u8(), 32, "name"),
        borsh.array(borsh.u8(), 128, "metadata"),
        borshAddress("authorWallet"),
        borshAddress("queuePubkey"),
        borsh.u32("oracleRequestBatchSize"),
        borsh.u32("minOracleResults"),
        borsh.u32("minJobResults"),
        borsh.u32("minUpdateDelaySeconds"),
        borsh.i64("startAfter"),
        types.SwitchboardDecimal.layout("varianceThreshold"),
        borsh.i64("forceReportPeriod"),
        borsh.i64("expiration"),
        borsh.u64("consecutiveFailureCount"),
        borsh.i64("nextAllowedUpdateTime"),
        borsh.bool("isLocked"),
        borsh.array(borsh.u8(), 32, "schedule"),
        types.AggregatorRound.layout("latestConfirmedRound"),
        types.AggregatorRound.layout("currentRound"),
        borsh.array(borshAddress(), 16, "jobPubkeysData"),
        borsh.array(types.Hash.layout(), 16, "jobHashes"),
        borsh.u32("jobPubkeysSize"),
        borsh.array(borsh.u8(), 32, "jobsChecksum"),
        borshAddress("authority"),
        borsh.array(borsh.u8(), 224, "ebuf"),
      ],
      property
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static fromDecoded(obj: any) {
    return new AggregatorAccountData({
      name: obj.name,
      metadata: obj.metadata,
      authorWallet: obj.authorWallet,
      queuePubkey: obj.queuePubkey,
      oracleRequestBatchSize: obj.oracleRequestBatchSize,
      minOracleResults: obj.minOracleResults,
      minJobResults: obj.minJobResults,
      minUpdateDelaySeconds: obj.minUpdateDelaySeconds,
      startAfter: obj.startAfter,
      varianceThreshold: types.SwitchboardDecimal.fromDecoded(
        obj.varianceThreshold
      ),
      forceReportPeriod: obj.forceReportPeriod,
      expiration: obj.expiration,
      consecutiveFailureCount: obj.consecutiveFailureCount,
      nextAllowedUpdateTime: obj.nextAllowedUpdateTime,
      isLocked: obj.isLocked,
      schedule: obj.schedule,
      latestConfirmedRound: types.AggregatorRound.fromDecoded(
        obj.latestConfirmedRound
      ),
      currentRound: types.AggregatorRound.fromDecoded(obj.currentRound),
      jobPubkeysData: obj.jobPubkeysData,
      jobHashes: obj.jobHashes.map(
        (
          item: any /* eslint-disable-line @typescript-eslint/no-explicit-any */
        ) => types.Hash.fromDecoded(item)
      ),
      jobPubkeysSize: obj.jobPubkeysSize,
      jobsChecksum: obj.jobsChecksum,
      authority: obj.authority,
      ebuf: obj.ebuf,
    })
  }

  static toEncodable(fields: AggregatorAccountDataFields) {
    return {
      name: fields.name,
      metadata: fields.metadata,
      authorWallet: fields.authorWallet,
      queuePubkey: fields.queuePubkey,
      oracleRequestBatchSize: fields.oracleRequestBatchSize,
      minOracleResults: fields.minOracleResults,
      minJobResults: fields.minJobResults,
      minUpdateDelaySeconds: fields.minUpdateDelaySeconds,
      startAfter: fields.startAfter,
      varianceThreshold: types.SwitchboardDecimal.toEncodable(
        fields.varianceThreshold
      ),
      forceReportPeriod: fields.forceReportPeriod,
      expiration: fields.expiration,
      consecutiveFailureCount: fields.consecutiveFailureCount,
      nextAllowedUpdateTime: fields.nextAllowedUpdateTime,
      isLocked: fields.isLocked,
      schedule: fields.schedule,
      latestConfirmedRound: types.AggregatorRound.toEncodable(
        fields.latestConfirmedRound
      ),
      currentRound: types.AggregatorRound.toEncodable(fields.currentRound),
      jobPubkeysData: fields.jobPubkeysData,
      jobHashes: fields.jobHashes.map((item) => types.Hash.toEncodable(item)),
      jobPubkeysSize: fields.jobPubkeysSize,
      jobsChecksum: fields.jobsChecksum,
      authority: fields.authority,
      ebuf: fields.ebuf,
    }
  }

  toJSON(): AggregatorAccountDataJSON {
    return {
      name: this.name,
      metadata: this.metadata,
      authorWallet: this.authorWallet,
      queuePubkey: this.queuePubkey,
      oracleRequestBatchSize: this.oracleRequestBatchSize,
      minOracleResults: this.minOracleResults,
      minJobResults: this.minJobResults,
      minUpdateDelaySeconds: this.minUpdateDelaySeconds,
      startAfter: this.startAfter.toString(),
      varianceThreshold: this.varianceThreshold.toJSON(),
      forceReportPeriod: this.forceReportPeriod.toString(),
      expiration: this.expiration.toString(),
      consecutiveFailureCount: this.consecutiveFailureCount.toString(),
      nextAllowedUpdateTime: this.nextAllowedUpdateTime.toString(),
      isLocked: this.isLocked,
      schedule: this.schedule,
      latestConfirmedRound: this.latestConfirmedRound.toJSON(),
      currentRound: this.currentRound.toJSON(),
      jobPubkeysData: this.jobPubkeysData,
      jobHashes: this.jobHashes.map((item) => item.toJSON()),
      jobPubkeysSize: this.jobPubkeysSize,
      jobsChecksum: this.jobsChecksum,
      authority: this.authority,
      ebuf: this.ebuf,
    }
  }

  static fromJSON(obj: AggregatorAccountDataJSON): AggregatorAccountData {
    return new AggregatorAccountData({
      name: obj.name,
      metadata: obj.metadata,
      authorWallet: address(obj.authorWallet),
      queuePubkey: address(obj.queuePubkey),
      oracleRequestBatchSize: obj.oracleRequestBatchSize,
      minOracleResults: obj.minOracleResults,
      minJobResults: obj.minJobResults,
      minUpdateDelaySeconds: obj.minUpdateDelaySeconds,
      startAfter: new BN(obj.startAfter),
      varianceThreshold: types.SwitchboardDecimal.fromJSON(
        obj.varianceThreshold
      ),
      forceReportPeriod: new BN(obj.forceReportPeriod),
      expiration: new BN(obj.expiration),
      consecutiveFailureCount: new BN(obj.consecutiveFailureCount),
      nextAllowedUpdateTime: new BN(obj.nextAllowedUpdateTime),
      isLocked: obj.isLocked,
      schedule: obj.schedule,
      latestConfirmedRound: types.AggregatorRound.fromJSON(
        obj.latestConfirmedRound
      ),
      currentRound: types.AggregatorRound.fromJSON(obj.currentRound),
      jobPubkeysData: obj.jobPubkeysData.map((item) => address(item)),
      jobHashes: obj.jobHashes.map((item) => types.Hash.fromJSON(item)),
      jobPubkeysSize: obj.jobPubkeysSize,
      jobsChecksum: obj.jobsChecksum,
      authority: address(obj.authority),
      ebuf: obj.ebuf,
    })
  }

  toEncodable() {
    return AggregatorAccountData.toEncodable(this)
  }
}
