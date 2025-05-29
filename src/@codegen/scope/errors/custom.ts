export type CustomError =
  | IntegerOverflow
  | ConversionFailure
  | MathOverflow
  | OutOfRangeIntegralConversion
  | UnexpectedAccount
  | PriceNotValid
  | AccountsAndTokenMismatch
  | BadTokenNb
  | BadTokenType
  | SwitchboardV2Error
  | InvalidAccountDiscriminator
  | UnableToDeserializeAccount
  | BadScopeChainOrPrices
  | RefreshInCPI
  | RefreshWithUnexpectedIxs
  | InvalidTokenUpdateMode
  | UnableToDerivePDA
  | BadTimestamp
  | BadSlot
  | PriceAccountNotExpected
  | TwapSourceIndexOutOfRange
  | TwapSampleTooFrequent
  | UnexpectedJlpConfiguration
  | TwapNotEnoughSamplesInPeriod
  | EmptyTokenList
  | StakeFeeTooHigh
  | KTokenUnderlyingPriceNotValid
  | KTokenHoldingsCalculationError
  | CannotResizeAccount
  | FixedPriceInvalid
  | SwitchboardOnDemandError
  | ConfidenceIntervalCheckFailed
  | InvalidGenericData
  | NoChainlinkReportData
  | InvalidChainlinkReportData
  | MostRecentOfInvalidSourceIndices
  | MostRecentOfInvalidMaxDivergence
  | MostRecentOfInvalidMaxAge
  | MostRecentOfMaxAgeViolated
  | MostRecentOfMaxDivergenceBpsViolated
  | PythLazerVerifyIxFailed
  | PythLazerInvalidFeedID
  | PythLazerInvalidExponent
  | PythLazerInvalidConfidenceFactor
  | PythLazerInvalidMessagePayload
  | PythLazerInvalidChannel
  | PythLazerInvalidFeedsLength
  | PythLazerInvalidFeedId
  | PythLazerPriceNotPresent
  | PythLazerBestBidPriceNotPresent
  | PythLazerBestAskPriceNotPresent
  | PythLazerInvalidAskBidPrices

export class IntegerOverflow extends Error {
  static readonly code = 6000
  readonly code = 6000
  readonly name = "IntegerOverflow"
  readonly msg = "Integer overflow"

  constructor(readonly logs?: string[]) {
    super("6000: Integer overflow")
  }
}

export class ConversionFailure extends Error {
  static readonly code = 6001
  readonly code = 6001
  readonly name = "ConversionFailure"
  readonly msg = "Conversion failure"

  constructor(readonly logs?: string[]) {
    super("6001: Conversion failure")
  }
}

export class MathOverflow extends Error {
  static readonly code = 6002
  readonly code = 6002
  readonly name = "MathOverflow"
  readonly msg = "Mathematical operation with overflow"

  constructor(readonly logs?: string[]) {
    super("6002: Mathematical operation with overflow")
  }
}

export class OutOfRangeIntegralConversion extends Error {
  static readonly code = 6003
  readonly code = 6003
  readonly name = "OutOfRangeIntegralConversion"
  readonly msg = "Out of range integral conversion attempted"

  constructor(readonly logs?: string[]) {
    super("6003: Out of range integral conversion attempted")
  }
}

export class UnexpectedAccount extends Error {
  static readonly code = 6004
  readonly code = 6004
  readonly name = "UnexpectedAccount"
  readonly msg = "Unexpected account in instruction"

  constructor(readonly logs?: string[]) {
    super("6004: Unexpected account in instruction")
  }
}

export class PriceNotValid extends Error {
  static readonly code = 6005
  readonly code = 6005
  readonly name = "PriceNotValid"
  readonly msg = "Price is not valid"

  constructor(readonly logs?: string[]) {
    super("6005: Price is not valid")
  }
}

export class AccountsAndTokenMismatch extends Error {
  static readonly code = 6006
  readonly code = 6006
  readonly name = "AccountsAndTokenMismatch"
  readonly msg =
    "The number of tokens is different from the number of received accounts"

  constructor(readonly logs?: string[]) {
    super(
      "6006: The number of tokens is different from the number of received accounts"
    )
  }
}

export class BadTokenNb extends Error {
  static readonly code = 6007
  readonly code = 6007
  readonly name = "BadTokenNb"
  readonly msg = "The token index received is out of range"

  constructor(readonly logs?: string[]) {
    super("6007: The token index received is out of range")
  }
}

export class BadTokenType extends Error {
  static readonly code = 6008
  readonly code = 6008
  readonly name = "BadTokenType"
  readonly msg = "The token type received is invalid"

  constructor(readonly logs?: string[]) {
    super("6008: The token type received is invalid")
  }
}

export class SwitchboardV2Error extends Error {
  static readonly code = 6009
  readonly code = 6009
  readonly name = "SwitchboardV2Error"
  readonly msg = "There was an error with the Switchboard V2 retrieval"

  constructor(readonly logs?: string[]) {
    super("6009: There was an error with the Switchboard V2 retrieval")
  }
}

export class InvalidAccountDiscriminator extends Error {
  static readonly code = 6010
  readonly code = 6010
  readonly name = "InvalidAccountDiscriminator"
  readonly msg = "Invalid account discriminator"

  constructor(readonly logs?: string[]) {
    super("6010: Invalid account discriminator")
  }
}

export class UnableToDeserializeAccount extends Error {
  static readonly code = 6011
  readonly code = 6011
  readonly name = "UnableToDeserializeAccount"
  readonly msg = "Unable to deserialize account"

  constructor(readonly logs?: string[]) {
    super("6011: Unable to deserialize account")
  }
}

export class BadScopeChainOrPrices extends Error {
  static readonly code = 6012
  readonly code = 6012
  readonly name = "BadScopeChainOrPrices"
  readonly msg = "Error while computing price with ScopeChain"

  constructor(readonly logs?: string[]) {
    super("6012: Error while computing price with ScopeChain")
  }
}

export class RefreshInCPI extends Error {
  static readonly code = 6013
  readonly code = 6013
  readonly name = "RefreshInCPI"
  readonly msg = "Refresh price instruction called in a CPI"

  constructor(readonly logs?: string[]) {
    super("6013: Refresh price instruction called in a CPI")
  }
}

export class RefreshWithUnexpectedIxs extends Error {
  static readonly code = 6014
  readonly code = 6014
  readonly name = "RefreshWithUnexpectedIxs"
  readonly msg = "Refresh price instruction preceded by unexpected ixs"

  constructor(readonly logs?: string[]) {
    super("6014: Refresh price instruction preceded by unexpected ixs")
  }
}

export class InvalidTokenUpdateMode extends Error {
  static readonly code = 6015
  readonly code = 6015
  readonly name = "InvalidTokenUpdateMode"
  readonly msg = "Invalid token metadata update mode"

  constructor(readonly logs?: string[]) {
    super("6015: Invalid token metadata update mode")
  }
}

export class UnableToDerivePDA extends Error {
  static readonly code = 6016
  readonly code = 6016
  readonly name = "UnableToDerivePDA"
  readonly msg = "Unable to derive PDA address"

  constructor(readonly logs?: string[]) {
    super("6016: Unable to derive PDA address")
  }
}

export class BadTimestamp extends Error {
  static readonly code = 6017
  readonly code = 6017
  readonly name = "BadTimestamp"
  readonly msg = "Invalid timestamp"

  constructor(readonly logs?: string[]) {
    super("6017: Invalid timestamp")
  }
}

export class BadSlot extends Error {
  static readonly code = 6018
  readonly code = 6018
  readonly name = "BadSlot"
  readonly msg = "Invalid slot"

  constructor(readonly logs?: string[]) {
    super("6018: Invalid slot")
  }
}

export class PriceAccountNotExpected extends Error {
  static readonly code = 6019
  readonly code = 6019
  readonly name = "PriceAccountNotExpected"
  readonly msg = "TWAP price account is different than Scope ID"

  constructor(readonly logs?: string[]) {
    super("6019: TWAP price account is different than Scope ID")
  }
}

export class TwapSourceIndexOutOfRange extends Error {
  static readonly code = 6020
  readonly code = 6020
  readonly name = "TwapSourceIndexOutOfRange"
  readonly msg = "TWAP source index out of range"

  constructor(readonly logs?: string[]) {
    super("6020: TWAP source index out of range")
  }
}

export class TwapSampleTooFrequent extends Error {
  static readonly code = 6021
  readonly code = 6021
  readonly name = "TwapSampleTooFrequent"
  readonly msg = "TWAP sample is too close to the previous one"

  constructor(readonly logs?: string[]) {
    super("6021: TWAP sample is too close to the previous one")
  }
}

export class UnexpectedJlpConfiguration extends Error {
  static readonly code = 6022
  readonly code = 6022
  readonly name = "UnexpectedJlpConfiguration"
  readonly msg = "Unexpected JLP configuration"

  constructor(readonly logs?: string[]) {
    super("6022: Unexpected JLP configuration")
  }
}

export class TwapNotEnoughSamplesInPeriod extends Error {
  static readonly code = 6023
  readonly code = 6023
  readonly name = "TwapNotEnoughSamplesInPeriod"
  readonly msg = "Not enough price samples in period to compute TWAP"

  constructor(readonly logs?: string[]) {
    super("6023: Not enough price samples in period to compute TWAP")
  }
}

export class EmptyTokenList extends Error {
  static readonly code = 6024
  readonly code = 6024
  readonly name = "EmptyTokenList"
  readonly msg = "The provided token list to refresh is empty"

  constructor(readonly logs?: string[]) {
    super("6024: The provided token list to refresh is empty")
  }
}

export class StakeFeeTooHigh extends Error {
  static readonly code = 6025
  readonly code = 6025
  readonly name = "StakeFeeTooHigh"
  readonly msg = "The stake pool fee is higher than the maximum allowed"

  constructor(readonly logs?: string[]) {
    super("6025: The stake pool fee is higher than the maximum allowed")
  }
}

export class KTokenUnderlyingPriceNotValid extends Error {
  static readonly code = 6026
  readonly code = 6026
  readonly name = "KTokenUnderlyingPriceNotValid"
  readonly msg = "Cannot get a valid price for the tokens composing the Ktoken"

  constructor(readonly logs?: string[]) {
    super("6026: Cannot get a valid price for the tokens composing the Ktoken")
  }
}

export class KTokenHoldingsCalculationError extends Error {
  static readonly code = 6027
  readonly code = 6027
  readonly name = "KTokenHoldingsCalculationError"
  readonly msg = "Error while computing the Ktoken pool holdings"

  constructor(readonly logs?: string[]) {
    super("6027: Error while computing the Ktoken pool holdings")
  }
}

export class CannotResizeAccount extends Error {
  static readonly code = 6028
  readonly code = 6028
  readonly name = "CannotResizeAccount"
  readonly msg = "Cannot resize the account we only allow it to grow in size"

  constructor(readonly logs?: string[]) {
    super("6028: Cannot resize the account we only allow it to grow in size")
  }
}

export class FixedPriceInvalid extends Error {
  static readonly code = 6029
  readonly code = 6029
  readonly name = "FixedPriceInvalid"
  readonly msg = "The provided fixed price is invalid"

  constructor(readonly logs?: string[]) {
    super("6029: The provided fixed price is invalid")
  }
}

export class SwitchboardOnDemandError extends Error {
  static readonly code = 6030
  readonly code = 6030
  readonly name = "SwitchboardOnDemandError"
  readonly msg = "Switchboard On Demand price derive error"

  constructor(readonly logs?: string[]) {
    super("6030: Switchboard On Demand price derive error")
  }
}

export class ConfidenceIntervalCheckFailed extends Error {
  static readonly code = 6031
  readonly code = 6031
  readonly name = "ConfidenceIntervalCheckFailed"
  readonly msg = "Confidence interval check failed"

  constructor(readonly logs?: string[]) {
    super("6031: Confidence interval check failed")
  }
}

export class InvalidGenericData extends Error {
  static readonly code = 6032
  readonly code = 6032
  readonly name = "InvalidGenericData"
  readonly msg = "Invalid generic data"

  constructor(readonly logs?: string[]) {
    super("6032: Invalid generic data")
  }
}

export class NoChainlinkReportData extends Error {
  static readonly code = 6033
  readonly code = 6033
  readonly name = "NoChainlinkReportData"
  readonly msg = "No valid Chainlink report data found"

  constructor(readonly logs?: string[]) {
    super("6033: No valid Chainlink report data found")
  }
}

export class InvalidChainlinkReportData extends Error {
  static readonly code = 6034
  readonly code = 6034
  readonly name = "InvalidChainlinkReportData"
  readonly msg = "Invalid Chainlink report data format"

  constructor(readonly logs?: string[]) {
    super("6034: Invalid Chainlink report data format")
  }
}

export class MostRecentOfInvalidSourceIndices extends Error {
  static readonly code = 6035
  readonly code = 6035
  readonly name = "MostRecentOfInvalidSourceIndices"
  readonly msg =
    "MostRecentOf config must contain at least one valid source index"

  constructor(readonly logs?: string[]) {
    super(
      "6035: MostRecentOf config must contain at least one valid source index"
    )
  }
}

export class MostRecentOfInvalidMaxDivergence extends Error {
  static readonly code = 6036
  readonly code = 6036
  readonly name = "MostRecentOfInvalidMaxDivergence"
  readonly msg = "Invalid max divergence (bps) for MostRecentOf oracle"

  constructor(readonly logs?: string[]) {
    super("6036: Invalid max divergence (bps) for MostRecentOf oracle")
  }
}

export class MostRecentOfInvalidMaxAge extends Error {
  static readonly code = 6037
  readonly code = 6037
  readonly name = "MostRecentOfInvalidMaxAge"
  readonly msg = "Invalid max age (s) for MostRecentOf oracle"

  constructor(readonly logs?: string[]) {
    super("6037: Invalid max age (s) for MostRecentOf oracle")
  }
}

export class MostRecentOfMaxAgeViolated extends Error {
  static readonly code = 6038
  readonly code = 6038
  readonly name = "MostRecentOfMaxAgeViolated"
  readonly msg = "Max age diff constraint violated for MostRecentOf oracle"

  constructor(readonly logs?: string[]) {
    super("6038: Max age diff constraint violated for MostRecentOf oracle")
  }
}

export class MostRecentOfMaxDivergenceBpsViolated extends Error {
  static readonly code = 6039
  readonly code = 6039
  readonly name = "MostRecentOfMaxDivergenceBpsViolated"
  readonly msg =
    "Max divergence bps constraint violated for MostRecentOf oracle"

  constructor(readonly logs?: string[]) {
    super(
      "6039: Max divergence bps constraint violated for MostRecentOf oracle"
    )
  }
}

export class PythLazerVerifyIxFailed extends Error {
  static readonly code = 6040
  readonly code = 6040
  readonly name = "PythLazerVerifyIxFailed"
  readonly msg = "The invoked pyth lazer verify instruction failed"

  constructor(readonly logs?: string[]) {
    super("6040: The invoked pyth lazer verify instruction failed")
  }
}

export class PythLazerInvalidFeedID extends Error {
  static readonly code = 6041
  readonly code = 6041
  readonly name = "PythLazerInvalidFeedID"
  readonly msg = "Invalid feed id passed in to PythLazer oracle"

  constructor(readonly logs?: string[]) {
    super("6041: Invalid feed id passed in to PythLazer oracle")
  }
}

export class PythLazerInvalidExponent extends Error {
  static readonly code = 6042
  readonly code = 6042
  readonly name = "PythLazerInvalidExponent"
  readonly msg = "Invalid exponent passed in to PythLazer oracle"

  constructor(readonly logs?: string[]) {
    super("6042: Invalid exponent passed in to PythLazer oracle")
  }
}

export class PythLazerInvalidConfidenceFactor extends Error {
  static readonly code = 6043
  readonly code = 6043
  readonly name = "PythLazerInvalidConfidenceFactor"
  readonly msg = "Invalid confidence factor passed in to PythLazer oracle"

  constructor(readonly logs?: string[]) {
    super("6043: Invalid confidence factor passed in to PythLazer oracle")
  }
}

export class PythLazerInvalidMessagePayload extends Error {
  static readonly code = 6044
  readonly code = 6044
  readonly name = "PythLazerInvalidMessagePayload"
  readonly msg =
    "Received an invalid message payload in the PythLazer oracle when refreshing price"

  constructor(readonly logs?: string[]) {
    super(
      "6044: Received an invalid message payload in the PythLazer oracle when refreshing price"
    )
  }
}

export class PythLazerInvalidChannel extends Error {
  static readonly code = 6045
  readonly code = 6045
  readonly name = "PythLazerInvalidChannel"
  readonly msg =
    "Received an invalid channel in the PythLazer payload when refreshing price"

  constructor(readonly logs?: string[]) {
    super(
      "6045: Received an invalid channel in the PythLazer payload when refreshing price"
    )
  }
}

export class PythLazerInvalidFeedsLength extends Error {
  static readonly code = 6046
  readonly code = 6046
  readonly name = "PythLazerInvalidFeedsLength"
  readonly msg =
    "Payload should have a single feed in the PythLazer payload when refreshing price"

  constructor(readonly logs?: string[]) {
    super(
      "6046: Payload should have a single feed in the PythLazer payload when refreshing price"
    )
  }
}

export class PythLazerInvalidFeedId extends Error {
  static readonly code = 6047
  readonly code = 6047
  readonly name = "PythLazerInvalidFeedId"
  readonly msg =
    "Invalid feed id in the PythLazer payload when refreshing price"

  constructor(readonly logs?: string[]) {
    super(
      "6047: Invalid feed id in the PythLazer payload when refreshing price"
    )
  }
}

export class PythLazerPriceNotPresent extends Error {
  static readonly code = 6048
  readonly code = 6048
  readonly name = "PythLazerPriceNotPresent"
  readonly msg =
    "Property fields in the feed of the PythLazer payload do not contain a price"

  constructor(readonly logs?: string[]) {
    super(
      "6048: Property fields in the feed of the PythLazer payload do not contain a price"
    )
  }
}

export class PythLazerBestBidPriceNotPresent extends Error {
  static readonly code = 6049
  readonly code = 6049
  readonly name = "PythLazerBestBidPriceNotPresent"
  readonly msg =
    "Property fields in the feed of the PythLazer payload do not contain a best bid price"

  constructor(readonly logs?: string[]) {
    super(
      "6049: Property fields in the feed of the PythLazer payload do not contain a best bid price"
    )
  }
}

export class PythLazerBestAskPriceNotPresent extends Error {
  static readonly code = 6050
  readonly code = 6050
  readonly name = "PythLazerBestAskPriceNotPresent"
  readonly msg =
    "Property fields in the feed of the PythLazer payload do not contain a best ask price"

  constructor(readonly logs?: string[]) {
    super(
      "6050: Property fields in the feed of the PythLazer payload do not contain a best ask price"
    )
  }
}

export class PythLazerInvalidAskBidPrices extends Error {
  static readonly code = 6051
  readonly code = 6051
  readonly name = "PythLazerInvalidAskBidPrices"
  readonly msg =
    "Invalid ask/bid prices provided in the feed of the PythLazer payload"

  constructor(readonly logs?: string[]) {
    super(
      "6051: Invalid ask/bid prices provided in the feed of the PythLazer payload"
    )
  }
}

export function fromCode(code: number, logs?: string[]): CustomError | null {
  switch (code) {
    case 6000:
      return new IntegerOverflow(logs)
    case 6001:
      return new ConversionFailure(logs)
    case 6002:
      return new MathOverflow(logs)
    case 6003:
      return new OutOfRangeIntegralConversion(logs)
    case 6004:
      return new UnexpectedAccount(logs)
    case 6005:
      return new PriceNotValid(logs)
    case 6006:
      return new AccountsAndTokenMismatch(logs)
    case 6007:
      return new BadTokenNb(logs)
    case 6008:
      return new BadTokenType(logs)
    case 6009:
      return new SwitchboardV2Error(logs)
    case 6010:
      return new InvalidAccountDiscriminator(logs)
    case 6011:
      return new UnableToDeserializeAccount(logs)
    case 6012:
      return new BadScopeChainOrPrices(logs)
    case 6013:
      return new RefreshInCPI(logs)
    case 6014:
      return new RefreshWithUnexpectedIxs(logs)
    case 6015:
      return new InvalidTokenUpdateMode(logs)
    case 6016:
      return new UnableToDerivePDA(logs)
    case 6017:
      return new BadTimestamp(logs)
    case 6018:
      return new BadSlot(logs)
    case 6019:
      return new PriceAccountNotExpected(logs)
    case 6020:
      return new TwapSourceIndexOutOfRange(logs)
    case 6021:
      return new TwapSampleTooFrequent(logs)
    case 6022:
      return new UnexpectedJlpConfiguration(logs)
    case 6023:
      return new TwapNotEnoughSamplesInPeriod(logs)
    case 6024:
      return new EmptyTokenList(logs)
    case 6025:
      return new StakeFeeTooHigh(logs)
    case 6026:
      return new KTokenUnderlyingPriceNotValid(logs)
    case 6027:
      return new KTokenHoldingsCalculationError(logs)
    case 6028:
      return new CannotResizeAccount(logs)
    case 6029:
      return new FixedPriceInvalid(logs)
    case 6030:
      return new SwitchboardOnDemandError(logs)
    case 6031:
      return new ConfidenceIntervalCheckFailed(logs)
    case 6032:
      return new InvalidGenericData(logs)
    case 6033:
      return new NoChainlinkReportData(logs)
    case 6034:
      return new InvalidChainlinkReportData(logs)
    case 6035:
      return new MostRecentOfInvalidSourceIndices(logs)
    case 6036:
      return new MostRecentOfInvalidMaxDivergence(logs)
    case 6037:
      return new MostRecentOfInvalidMaxAge(logs)
    case 6038:
      return new MostRecentOfMaxAgeViolated(logs)
    case 6039:
      return new MostRecentOfMaxDivergenceBpsViolated(logs)
    case 6040:
      return new PythLazerVerifyIxFailed(logs)
    case 6041:
      return new PythLazerInvalidFeedID(logs)
    case 6042:
      return new PythLazerInvalidExponent(logs)
    case 6043:
      return new PythLazerInvalidConfidenceFactor(logs)
    case 6044:
      return new PythLazerInvalidMessagePayload(logs)
    case 6045:
      return new PythLazerInvalidChannel(logs)
    case 6046:
      return new PythLazerInvalidFeedsLength(logs)
    case 6047:
      return new PythLazerInvalidFeedId(logs)
    case 6048:
      return new PythLazerPriceNotPresent(logs)
    case 6049:
      return new PythLazerBestBidPriceNotPresent(logs)
    case 6050:
      return new PythLazerBestAskPriceNotPresent(logs)
    case 6051:
      return new PythLazerInvalidAskBidPrices(logs)
  }

  return null
}
