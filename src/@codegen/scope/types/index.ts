import * as UpdateTokenMetadataMode from "./UpdateTokenMetadataMode"
import * as ReportDataV8MarketStatus from "./ReportDataV8MarketStatus"
import * as MarketStatusBehavior from "./MarketStatusBehavior"
import * as ReportDataV9RipcordFlag from "./ReportDataV9RipcordFlag"
import * as TokenTypes from "./TokenTypes"
import * as OracleType from "./OracleType"
import * as EmaType from "./EmaType"
import * as ScopeChainError from "./ScopeChainError"

export { CappedFlooredData } from "./CappedFlooredData"
export type {
  CappedFlooredDataFields,
  CappedFlooredDataJSON,
} from "./CappedFlooredData"
export { DiscountToMaturityData } from "./DiscountToMaturityData"
export type {
  DiscountToMaturityDataFields,
  DiscountToMaturityDataJSON,
} from "./DiscountToMaturityData"
export { MostRecentOfData } from "./MostRecentOfData"
export type {
  MostRecentOfDataFields,
  MostRecentOfDataJSON,
} from "./MostRecentOfData"
export { Fee } from "./Fee"
export type { FeeFields, FeeJSON } from "./Fee"
export { LiqPool } from "./LiqPool"
export type { LiqPoolFields, LiqPoolJSON } from "./LiqPool"
export { List } from "./List"
export type { ListFields, ListJSON } from "./List"
export { StakeSystem } from "./StakeSystem"
export type { StakeSystemFields, StakeSystemJSON } from "./StakeSystem"
export { ValidatorSystem } from "./ValidatorSystem"
export type {
  ValidatorSystemFields,
  ValidatorSystemJSON,
} from "./ValidatorSystem"
export { State } from "./State"
export type { StateFields, StateJSON } from "./State"
export { PythLazerData } from "./PythLazerData"
export type { PythLazerDataFields, PythLazerDataJSON } from "./PythLazerData"
export { SwitchboardDecimal } from "./SwitchboardDecimal"
export type {
  SwitchboardDecimalFields,
  SwitchboardDecimalJSON,
} from "./SwitchboardDecimal"
export { AggregatorAccountData } from "./AggregatorAccountData"
export type {
  AggregatorAccountDataFields,
  AggregatorAccountDataJSON,
} from "./AggregatorAccountData"
export { AggregatorRound } from "./AggregatorRound"
export type {
  AggregatorRoundFields,
  AggregatorRoundJSON,
} from "./AggregatorRound"
export { Hash } from "./Hash"
export type { HashFields, HashJSON } from "./Hash"
export { Price } from "./Price"
export type { PriceFields, PriceJSON } from "./Price"
export { DatedPrice } from "./DatedPrice"
export type { DatedPriceFields, DatedPriceJSON } from "./DatedPrice"
export { EmaTwap } from "./EmaTwap"
export type { EmaTwapFields, EmaTwapJSON } from "./EmaTwap"
export { TokenMetadata } from "./TokenMetadata"
export type { TokenMetadataFields, TokenMetadataJSON } from "./TokenMetadata"
export { MintToScopeChain } from "./MintToScopeChain"
export type {
  MintToScopeChainFields,
  MintToScopeChainJSON,
} from "./MintToScopeChain"
export { UpdateTokenMetadataMode }

export type UpdateTokenMetadataModeKind =
  | UpdateTokenMetadataMode.Name
  | UpdateTokenMetadataMode.MaxPriceAgeSlots
  | UpdateTokenMetadataMode.GroupIds
export type UpdateTokenMetadataModeJSON =
  | UpdateTokenMetadataMode.NameJSON
  | UpdateTokenMetadataMode.MaxPriceAgeSlotsJSON
  | UpdateTokenMetadataMode.GroupIdsJSON

export { ReportDataV8MarketStatus }

export type ReportDataV8MarketStatusKind =
  | ReportDataV8MarketStatus.Unknown
  | ReportDataV8MarketStatus.Closed
  | ReportDataV8MarketStatus.Open
export type ReportDataV8MarketStatusJSON =
  | ReportDataV8MarketStatus.UnknownJSON
  | ReportDataV8MarketStatus.ClosedJSON
  | ReportDataV8MarketStatus.OpenJSON

export { MarketStatusBehavior }

export type MarketStatusBehaviorKind =
  | MarketStatusBehavior.AllUpdates
  | MarketStatusBehavior.Open
  | MarketStatusBehavior.OpenAndPrePost
export type MarketStatusBehaviorJSON =
  | MarketStatusBehavior.AllUpdatesJSON
  | MarketStatusBehavior.OpenJSON
  | MarketStatusBehavior.OpenAndPrePostJSON

export { ReportDataV9RipcordFlag }

/**
 * # Ripcord Flag
 * - `0` (false): Feed's data provider is OK. Fund's data provider and accuracy is as expected.
 * - `1` (true): Feed's data provider is flagging a pause. Data provider detected outliers,
 * deviated thresholds, or operational issues. **DO NOT consume NAV data when ripcord=1.**
 */
export type ReportDataV9RipcordFlagKind =
  | ReportDataV9RipcordFlag.Normal
  | ReportDataV9RipcordFlag.Paused
export type ReportDataV9RipcordFlagJSON =
  | ReportDataV9RipcordFlag.NormalJSON
  | ReportDataV9RipcordFlag.PausedJSON

export { TokenTypes }

export type TokenTypesKind = TokenTypes.TokenA | TokenTypes.TokenB
export type TokenTypesJSON = TokenTypes.TokenAJSON | TokenTypes.TokenBJSON

export { OracleType }

export type OracleTypeKind =
  | OracleType.Pyth
  | OracleType.DeprecatedPlaceholder1
  | OracleType.SwitchboardV2
  | OracleType.DeprecatedPlaceholder2
  | OracleType.CToken
  | OracleType.SplStake
  | OracleType.KToken
  | OracleType.PythEMA
  | OracleType.MsolStake
  | OracleType.KTokenToTokenA
  | OracleType.KTokenToTokenB
  | OracleType.JupiterLpFetch
  | OracleType.ScopeTwap
  | OracleType.OrcaWhirlpoolAtoB
  | OracleType.OrcaWhirlpoolBtoA
  | OracleType.RaydiumAmmV3AtoB
  | OracleType.RaydiumAmmV3BtoA
  | OracleType.JupiterLpCompute
  | OracleType.MeteoraDlmmAtoB
  | OracleType.MeteoraDlmmBtoA
  | OracleType.JupiterLpScope
  | OracleType.PythPull
  | OracleType.PythPullEMA
  | OracleType.FixedPrice
  | OracleType.SwitchboardOnDemand
  | OracleType.JitoRestaking
  | OracleType.Chainlink
  | OracleType.DiscountToMaturity
  | OracleType.MostRecentOf
  | OracleType.PythLazer
  | OracleType.RedStone
  | OracleType.AdrenaLp
  | OracleType.Securitize
  | OracleType.CappedFloored
  | OracleType.ChainlinkRWA
  | OracleType.ChainlinkNAV
export type OracleTypeJSON =
  | OracleType.PythJSON
  | OracleType.DeprecatedPlaceholder1JSON
  | OracleType.SwitchboardV2JSON
  | OracleType.DeprecatedPlaceholder2JSON
  | OracleType.CTokenJSON
  | OracleType.SplStakeJSON
  | OracleType.KTokenJSON
  | OracleType.PythEMAJSON
  | OracleType.MsolStakeJSON
  | OracleType.KTokenToTokenAJSON
  | OracleType.KTokenToTokenBJSON
  | OracleType.JupiterLpFetchJSON
  | OracleType.ScopeTwapJSON
  | OracleType.OrcaWhirlpoolAtoBJSON
  | OracleType.OrcaWhirlpoolBtoAJSON
  | OracleType.RaydiumAmmV3AtoBJSON
  | OracleType.RaydiumAmmV3BtoAJSON
  | OracleType.JupiterLpComputeJSON
  | OracleType.MeteoraDlmmAtoBJSON
  | OracleType.MeteoraDlmmBtoAJSON
  | OracleType.JupiterLpScopeJSON
  | OracleType.PythPullJSON
  | OracleType.PythPullEMAJSON
  | OracleType.FixedPriceJSON
  | OracleType.SwitchboardOnDemandJSON
  | OracleType.JitoRestakingJSON
  | OracleType.ChainlinkJSON
  | OracleType.DiscountToMaturityJSON
  | OracleType.MostRecentOfJSON
  | OracleType.PythLazerJSON
  | OracleType.RedStoneJSON
  | OracleType.AdrenaLpJSON
  | OracleType.SecuritizeJSON
  | OracleType.CappedFlooredJSON
  | OracleType.ChainlinkRWAJSON
  | OracleType.ChainlinkNAVJSON

export { EmaType }

export type EmaTypeKind = EmaType.Ema1h
export type EmaTypeJSON = EmaType.Ema1hJSON

export { ScopeChainError }

/** Errors that can be raised while creating or manipulating a scope chain */
export type ScopeChainErrorKind =
  | ScopeChainError.PriceChainTooLong
  | ScopeChainError.PriceChainConversionFailure
  | ScopeChainError.NoChainForToken
  | ScopeChainError.InvalidPricesInChain
  | ScopeChainError.MathOverflow
  | ScopeChainError.IntegerConversionOverflow
export type ScopeChainErrorJSON =
  | ScopeChainError.PriceChainTooLongJSON
  | ScopeChainError.PriceChainConversionFailureJSON
  | ScopeChainError.NoChainForTokenJSON
  | ScopeChainError.InvalidPricesInChainJSON
  | ScopeChainError.MathOverflowJSON
  | ScopeChainError.IntegerConversionOverflowJSON
