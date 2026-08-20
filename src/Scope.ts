import {
  AccountRole,
  Address,
  Base58EncodedBytes,
  generateKeyPairSigner,
  getBase58Decoder,
  getBase64Encoder,
  getUtf8Decoder,
  GetAccountInfoApi,
  GetMinimumBalanceForRentExemptionApi,
  GetMultipleAccountsApi,
  GetProgramAccountsApi,
  AccountMeta,
  Instruction,
  isSome,
  none,
  Rpc,
  some,
  TransactionSigner,
} from '@solana/kit';
import Decimal from 'decimal.js';
import {
  type Configuration,
  type OracleMappings,
  type OraclePrices,
  type TokenMetadatas,
  fetchMaybeConfiguration,
  fetchMaybeOracleMappings,
  fetchMaybeOraclePrices,
  fetchMaybeTokenMetadatas,
  fetchAllMaybeConfiguration,
  fetchAllMaybeOraclePrices,
  getOraclePricesDecoder,
  getConfigurationDecoder,
  getOraclePricesSize,
  getConfigurationSize,
  ORACLE_PRICES_DISCRIMINATOR,
  CONFIGURATION_DISCRIMINATOR,
} from './@codegen/scope/accounts';
import {
  type CappedFlooredData,
  type CappedMostRecentOfData,
  type MostRecentOfData,
  EmaType,
  OracleType,
  type Price,
  type TokenMetadata,
  getPriceDecoder,
  getMostRecentOfDataDecoder,
  getCappedFlooredDataDecoder,
  getCappedMostRecentOfDataDecoder,
  updateOracleMappingAndMetadataEntry,
  type UpdateOracleMappingAndMetadataEntryArgs,
} from './@codegen/scope/types';
// Re-export SCOPE_PROGRAM_ADDRESS and EmaType for downstream consumers
export { SCOPE_PROGRAM_ADDRESS } from './@codegen/scope/programs';
export { EmaType } from './@codegen/scope/types';
import {
  SCOPE_DEVNET_CONFIG,
  SCOPE_LOCALNET_CONFIG,
  SCOPE_MAINNET_CONFIG,
  ScopeConfig,
  TOKEN_METADATA_NAME_LEN,
  U16_MAX,
} from './constants';
import {
  getInitializeInstruction,
  getUpdateMappingAndMetadataInstruction,
  getRefreshPriceListInstruction,
} from './@codegen/scope/instructions';
import {
  getConfigurationPda,
  getJlpMintPda,
  getKlendCTokenRefreshAccounts,
  getSecuritizeRefreshAccounts,
  getSplBalanceRefreshAccounts,
  ORACLE_MAPPINGS_LEN,
  ORACLE_PRICES_LEN,
  ORACLE_TWAPS_LEN,
  TOKEN_METADATAS_LEN,
} from './utils';
import { FeedParam, getConfigPubkeyFromPricesParam, PricesParam, validatePricesParam } from './model';
import { fetchMaybeWhirlpoolStrategy, fetchMaybeGlobalConfig } from './@codegen/kliquidity/accounts';
import { getCreateAccountInstruction } from '@solana-program/system';
import { SYSVAR_INSTRUCTIONS_ADDRESS } from '@solana/sysvars';

export type ScopeDatedPrice = {
  price: Decimal;
  timestamp: Decimal;
};

/**
 * Token metadata fields to update on a feed entry; only the provided fields are written.
 */
export type FeedMetadataUpdate = {
  index: number;
  name?: string;
  maxPriceAgeSlots?: number | bigint;
  groupIdsBitset?: number | bigint;
};

export type ProviderKind = 'Pyth' | 'Switchboard' | 'Chainlink' | 'Redstone' | 'Scope';

/**
 * Build the TWAP-enabled bitmask expected by the scope program from a list of EMA types
 * (each EMA type is a bit index of the bitmask).
 */
export function twapEnabledBitmask(...emaTypes: EmaType[]): number {
  return emaTypes.reduce((mask, emaType) => mask | (1 << emaType), 0);
}

/**
 * Bit of a raw `OracleMappings.priceTypes` byte marking the entry as frozen
 * (see `FROZEN_FLAG` in the scope program).
 */
export const FROZEN_FLAG = 0x80;

/**
 * Get the `OracleType` of a raw `OracleMappings.priceTypes` byte, stripping the frozen flag.
 */
export function stripFrozenFlag(rawPriceType: number): OracleType {
  return rawPriceType & ~FROZEN_FLAG;
}

/**
 * Whether a raw `OracleMappings.priceTypes` byte has the frozen flag set.
 */
export function isPriceFrozen(rawPriceType: number): boolean {
  return (rawPriceType & FROZEN_FLAG) !== 0;
}

/**
 * Oracle types whose price is a TWAP of another scope entry.
 * These are configured with `MappingTwapEntry` instead of `MappingConfig` and use no price account.
 */
export const TWAP_ORACLE_TYPES: ReadonlySet<OracleType> = new Set([
  OracleType.ScopeTwap1h,
  OracleType.ScopeTwap8h,
  OracleType.ScopeTwap24h,
  OracleType.ScopeTwap7d,
]);

/**
 * Oracle types that cannot be refreshed with the `refreshPriceList` instruction:
 * the Chainlink & PythLazer types are refreshed by their dedicated instructions carrying a signed off-chain report.
 */
export const NON_REFRESHABLE_ORACLE_TYPES: ReadonlySet<OracleType> = new Set([
  OracleType.Chainlink,
  OracleType.ChainlinkNAV,
  OracleType.ChainlinkRWA,
  OracleType.ChainlinkX,
  OracleType.ChainlinkExchangeRate,
  OracleType.PythLazer,
]);

// Build a map from numeric discriminator to { kind: string } for the OracleType enum.
const ORACLE_TYPE_BY_DISCRIMINATOR: Record<number, { kind: string }> = {};
for (const [key, val] of Object.entries(OracleType)) {
  if (typeof val === 'number') {
    ORACLE_TYPE_BY_DISCRIMINATOR[val] = { kind: key };
  }
}

const base58Decoder = getBase58Decoder();
const base64Encoder = getBase64Encoder();
const utf8Decoder = getUtf8Decoder();
const oraclePricesDecoder = getOraclePricesDecoder();
const configurationDecoder = getConfigurationDecoder();
const priceDecoder = getPriceDecoder();
const mostRecentOfDataDecoder = getMostRecentOfDataDecoder();
const cappedFlooredDataDecoder = getCappedFlooredDataDecoder();
const cappedMostRecentOfDataDecoder = getCappedMostRecentOfDataDecoder();

export class ScopeEntryMetadata {
  constructor(
    public mappings: OracleMappings,
    public metadatas: TokenMetadatas,
    public priceId: number
  ) {}

  private get priceTypeId(): number {
    return stripFrozenFlag(this.mappings.priceTypes[this.priceId]);
  }

  get isFrozen(): boolean {
    return isPriceFrozen(this.mappings.priceTypes[this.priceId]);
  }

  private get refPriceId(): number {
    return this.mappings.refPrice[this.priceId];
  }

  /**
   * Get the oracle type string (e.g., "PythPull", "CappedFloored", "ChainlinkX")
   */
  get oracleType(): string {
    const oracleType = ORACLE_TYPE_BY_DISCRIMINATOR[this.priceTypeId];
    return oracleType?.kind ?? 'Unknown';
  }

  private get generic(): Price | MostRecentOfData | CappedFlooredData | CappedMostRecentOfData | null {
    const bytes = new Uint8Array(this.mappings.generic[this.priceId]);

    switch (this.priceTypeId) {
      case OracleType.FixedPrice:
        return priceDecoder.decode(bytes);
      case OracleType.MostRecentOf:
        return mostRecentOfDataDecoder.decode(bytes);
      case OracleType.CappedFloored:
        return cappedFlooredDataDecoder.decode(bytes);
      case OracleType.CappedMostRecentOf:
        return cappedMostRecentOfDataDecoder.decode(bytes);
      default:
        return null;
    }
  }

  private get metadata(): TokenMetadata {
    return this.metadatas.metadatasArray[this.priceId];
  }

  /**
   * Get a simple base name without nested oracle details.
   * Use this for display in UI components that show nested details separately via tooltips.
   */
  get simpleName(): string {
    const bytes = new Uint8Array(this.metadata.name);
    const nullIdx = bytes.indexOf(0);
    let name = utf8Decoder.decode(nullIdx >= 0 ? bytes.subarray(0, nullIdx) : bytes);

    switch (this.priceTypeId) {
      case OracleType.SplStake: {
        name = name.replace('Stake pool ', '').replace('Stake rate ', '');
        name = `SPL Stake Rate ${name}`;
        break;
      }

      case OracleType.PythPull: {
        name = name.replace('Pyth Pull ', '');
        name = `Pyth Pull ${name}`;
        break;
      }

      case OracleType.PythLazer: {
        name = name.replace('PythLazer ', '');
        name = `Pyth Lazer ${name}`;
        break;
      }

      case OracleType.PythPullEMA: {
        name = name.replace('Pyth Pull EMA ', '').replace('Pyth EMA ', '').replace('EMA Pyth ', '').replace('EMA ', '');
        name = `Pyth Pull EMA ${name}`;
        break;
      }

      case OracleType.FixedPrice: {
        const price = this.generic as Price;
        const decimalPrice = new Decimal(price.value.toString()).mul(
          new Decimal(10).pow(new Decimal(-price.exp.toString()))
        );
        name = `Fixed ${decimalPrice.toString()}`;
        break;
      }

      default:
        break;
    }

    if (this.refPriceId !== U16_MAX) {
      const refMetadata = new ScopeEntryMetadata(this.mappings, this.metadatas, this.refPriceId);
      name = `${name}, Referenced by ${refMetadata.simpleName}`;
    }

    if (this.provider !== 'Scope' && name !== '' && !name.toLowerCase().includes(this.provider.toLowerCase())) {
      name = `${this.provider} ${name}`;
    }

    return name;
  }

  /**
   * Get the full verbose name including nested oracle details for composite types.
   * This is the default name getter for backward compatibility.
   */
  get name(): string {
    let name = this.simpleName;

    switch (this.priceTypeId) {
      case OracleType.MostRecentOf: {
        const generic = this.generic as MostRecentOfData;
        const sources = generic.sourceEntries
          .filter((idx) => idx !== 512 && idx !== U16_MAX)
          .map((idx) => new ScopeEntryMetadata(this.mappings, this.metadatas, idx));
        name = `${name} (${sources.map((entry) => entry.simpleName).join(', ')})`;
        break;
      }

      case OracleType.CappedFloored: {
        const generic = this.generic as CappedFlooredData;

        const source = new ScopeEntryMetadata(this.mappings, this.metadatas, generic.sourceEntry);
        const floor = isSome(generic.floorEntry)
          ? new ScopeEntryMetadata(this.mappings, this.metadatas, generic.floorEntry.value)
          : null;
        const cap = isSome(generic.capEntry)
          ? new ScopeEntryMetadata(this.mappings, this.metadatas, generic.capEntry.value)
          : null;

        const segments = [
          source ? source.simpleName : null,
          floor ? `Floored by ${floor.simpleName}` : null,
          cap ? `Capped by ${cap.simpleName}` : null,
        ].filter(Boolean);

        if (segments.length > 0) {
          name = `${name} (${segments.join(', ')})`;
        }
        break;
      }

      case OracleType.CappedMostRecentOf: {
        const generic = this.generic as CappedMostRecentOfData;
        const sources = generic.sourceEntries
          .filter((idx) => idx !== 512 && idx !== U16_MAX)
          .map((idx) => new ScopeEntryMetadata(this.mappings, this.metadatas, idx));
        const cap = new ScopeEntryMetadata(this.mappings, this.metadatas, generic.capEntry);

        const sourceNames = sources.map((entry) => entry.simpleName).join(', ');
        name = `${name} (${sourceNames}, Capped by ${cap.simpleName})`;
        break;
      }

      default:
        break;
    }

    return name;
  }

  get provider(): ProviderKind {
    const oracleType = ORACLE_TYPE_BY_DISCRIMINATOR[this.priceTypeId];
    if (!oracleType?.kind) {
      // Unknown oracle type (discriminator not in SDK or kind undefined), fallback to Scope
      return 'Scope';
    }
    const kind = oracleType.kind.toLowerCase();
    if (kind.includes('pyth')) {
      return 'Pyth';
    } else if (kind.includes('switchboard')) {
      return 'Switchboard';
    } else if (kind.includes('chainlink')) {
      return 'Chainlink';
    } else if (kind.includes('redstone')) {
      return 'Redstone';
    }
    return 'Scope';
  }

  /**
   * Get nested oracle references for composite oracle types (CappedFloored, MostRecentOf, CappedMostRecentOf)
   * Returns null for non-composite oracle types
   */
  get nestedOracles(): {
    type: 'CappedFloored' | 'MostRecentOf' | 'CappedMostRecentOf';
    source?: { name: string; oracleType: string; provider: ProviderKind };
    sources?: Array<{ name: string; oracleType: string; provider: ProviderKind }>;
    cap?: { name: string; oracleType: string; provider: ProviderKind };
    floor?: { name: string; oracleType: string; provider: ProviderKind };
  } | null {
    const mapEntry = (entry: ScopeEntryMetadata) => ({
      name: entry.simpleName,
      oracleType: entry.oracleType,
      provider: entry.provider,
    });

    switch (this.priceTypeId) {
      case OracleType.MostRecentOf: {
        const generic = this.generic as MostRecentOfData;
        const sources = generic.sourceEntries
          .filter((idx) => idx !== 512 && idx !== U16_MAX)
          .map((idx) => new ScopeEntryMetadata(this.mappings, this.metadatas, idx))
          .map(mapEntry);
        return { type: 'MostRecentOf', sources };
      }

      case OracleType.CappedFloored: {
        const generic = this.generic as CappedFlooredData;
        const source = mapEntry(new ScopeEntryMetadata(this.mappings, this.metadatas, generic.sourceEntry));
        const floor = isSome(generic.floorEntry)
          ? mapEntry(new ScopeEntryMetadata(this.mappings, this.metadatas, generic.floorEntry.value))
          : undefined;
        const cap = isSome(generic.capEntry)
          ? mapEntry(new ScopeEntryMetadata(this.mappings, this.metadatas, generic.capEntry.value))
          : undefined;
        return { type: 'CappedFloored', source, floor, cap };
      }

      case OracleType.CappedMostRecentOf: {
        const generic = this.generic as CappedMostRecentOfData;
        const sources = generic.sourceEntries
          .filter((idx) => idx !== 512 && idx !== U16_MAX)
          .map((idx) => new ScopeEntryMetadata(this.mappings, this.metadatas, idx))
          .map(mapEntry);
        const cap = mapEntry(new ScopeEntryMetadata(this.mappings, this.metadatas, generic.capEntry));
        return { type: 'CappedMostRecentOf', sources, cap };
      }

      default:
        return null;
    }
  }
}

export type ScopeRpcApi = GetAccountInfoApi &
  GetMultipleAccountsApi &
  GetProgramAccountsApi &
  GetMinimumBalanceForRentExemptionApi;

export class Scope {
  private readonly _rpc: Rpc<ScopeRpcApi>;
  private readonly _config: ScopeConfig;

  /**
   * Create a new instance of the Scope SDK class.
   * @param cluster Name of the Solana cluster
   * @param rpc Connection to the Solana rpc
   */
  constructor(cluster: 'localnet' | 'devnet' | 'mainnet-beta', rpc: Rpc<ScopeRpcApi>) {
    this._rpc = rpc;
    switch (cluster) {
      case 'localnet':
        this._config = SCOPE_LOCALNET_CONFIG;
        break;
      case 'devnet':
        this._config = SCOPE_DEVNET_CONFIG;
        break;
      case 'mainnet-beta': {
        this._config = SCOPE_MAINNET_CONFIG;
        break;
      }
      default: {
        throw Error('Invalid cluster');
      }
    }
  }

  get config(): ScopeConfig {
    return this._config;
  }

  private static priceToDecimal(price: Price) {
    return new Decimal(price.value.toString()).mul(new Decimal(10).pow(new Decimal(-price.exp.toString())));
  }

  /**
   * Get the deserialised OraclePrices account for a single feed
   * @param feed - either the feed PDA seed, configuration account address or OraclePrices account pubkey
   * @returns OraclePrices
   */
  async getSingleOraclePrices(feed: PricesParam): Promise<OraclePrices> {
    validatePricesParam(feed);
    let oraclePrices: Address;
    if (feed.feed || feed.config) {
      const [, configAccount] = await this.getSingleFeedConfiguration(feed);
      oraclePrices = configAccount.oraclePrices;
    } else if (feed.prices) {
      oraclePrices = feed.prices;
    } else {
      throw Error('Must supply one of feed PDA, config pubkey, or oracle prices pubkey.');
    }
    const maybeAccount = await fetchMaybeOraclePrices(this._rpc, oraclePrices);
    if (!maybeAccount.exists) {
      throw Error(`Could not get scope oracle prices`);
    }
    return maybeAccount.data;
  }

  /**
   * Get the deserialised OraclePrices accounts for the given `OraclePrices` account pubkeys
   * Optimised to filter duplicate keys from the network request but returns the same size response as requested in the same order
   * @throws Error if any of the accounts cannot be fetched
   * @param prices - public keys of the `OraclePrices` accounts
   * @returns [Address, OraclePrices][]
   */
  async getOraclePrices(prices: Address[]): Promise<[Address, OraclePrices][]> {
    return this.getMultipleOraclePrices(prices);
  }

  /**
   * Get the deserialised OraclePrices accounts for the given `OraclePrices` account pubkeys
   * Optimised to filter duplicate keys from the network request but returns the same size response as requested in the same order
   * @throws Error if any of the accounts cannot be fetched
   * @param prices - public keys of the `OraclePrices` accounts
   * @returns [Address, OraclePrices][]
   */
  async getMultipleOraclePrices(prices: Address[]): Promise<[Address, OraclePrices][]> {
    const priceStrings = prices.map((price) => price);
    const uniqueScopePrices = [...new Set(priceStrings)];
    if (uniqueScopePrices.length === 1) {
      return [[uniqueScopePrices[0], await this.getSingleOraclePrices({ prices: uniqueScopePrices[0] })]];
    }
    const maybeAccounts = await fetchAllMaybeOraclePrices(this._rpc, uniqueScopePrices);
    const oraclePricesMap: Record<Address, OraclePrices> = maybeAccounts.reduce(
      (map, maybeAccount, i) => {
        if (!maybeAccount.exists) {
          throw Error(`Could not get scope oracle prices for ${uniqueScopePrices[i]}`);
        }
        map[uniqueScopePrices[i]] = maybeAccount.data;
        return map;
      },
      {} as Record<Address, OraclePrices>
    );
    return prices.map((price) => [price, oraclePricesMap[price]]);
  }

  async getAllOraclePrices(): Promise<[Address, OraclePrices][]> {
    return (
      await this._rpc
        .getProgramAccounts(this._config.programId, {
          filters: [
            { dataSize: BigInt(getOraclePricesSize()) },
            {
              memcmp: {
                offset: 0n,
                bytes: base58Decoder.decode(ORACLE_PRICES_DISCRIMINATOR) as Base58EncodedBytes,
                encoding: 'base58',
              },
            },
          ],
          encoding: 'base64',
        })
        .send()
    ).map((x) => {
      const data = new Uint8Array(base64Encoder.encode(x.account.data[0]));
      return [x.pubkey, oraclePricesDecoder.decode(data)];
    });
  }

  /**
   * Get the deserialised Configuration account for a given feed
   * @param feedParam - either the feed PDA seed or the configuration account address
   * @returns [configuration account address, deserialised configuration]
   */
  async getSingleFeedConfiguration(pricesParam: PricesParam): Promise<[Address, Configuration]> {
    validatePricesParam(pricesParam);
    const { feed } = pricesParam;
    const configPubkey = await getConfigPubkeyFromPricesParam(pricesParam, this._rpc, this._config.programId);
    const maybeAccount = await fetchMaybeConfiguration(this._rpc, configPubkey);
    if (!maybeAccount.exists) {
      throw new Error(`Could not find configuration account for ${feed || configPubkey}`);
    }
    return [configPubkey, maybeAccount.data];
  }

  /**
   * Get the deserialised Configuration accounts for given feeds
   * @param feedParams - either the feed PDA seed or the configuration account address
   * @returns [configuration account address, deserialised configuration]
   */
  async getFeedConfiguration(pricesParams: PricesParam[]): Promise<[Address, Configuration][]> {
    if (pricesParams.length === 0) {
      throw Error('Must supply at least one feed');
    }
    if (pricesParams.length === 1) {
      return [await this.getSingleFeedConfiguration(pricesParams[0])];
    }
    const configPubkeyPromises: Promise<Address>[] = [];
    for (const pricesParam of pricesParams) {
      validatePricesParam(pricesParam);
      configPubkeyPromises.push(getConfigPubkeyFromPricesParam(pricesParam, this._rpc, this._config.programId));
    }
    const configPubkeys = await Promise.all(configPubkeyPromises);
    const maybeAccounts = await fetchAllMaybeConfiguration(this._rpc, configPubkeys);
    const configurations: [Address, Configuration][] = [];
    for (let i = 0; i < maybeAccounts.length; i++) {
      const maybeAccount = maybeAccounts[i];
      const configPubkey = configPubkeys[i];
      if (!maybeAccount.exists) {
        throw new Error(
          `Could not find configuration account for config pubkey ${configPubkey} and program id ${this._config.programId}`
        );
      }
      configurations.push([configPubkey, maybeAccount.data]);
    }
    return configurations;
  }

  async getAllConfigurations(): Promise<[Address, Configuration][]> {
    return (
      await this._rpc
        .getProgramAccounts(this._config.programId, {
          filters: [
            { dataSize: BigInt(getConfigurationSize()) },
            {
              memcmp: {
                offset: 0n,
                bytes: base58Decoder.decode(CONFIGURATION_DISCRIMINATOR) as Base58EncodedBytes,
                encoding: 'base58',
              },
            },
          ],
          encoding: 'base64',
        })
        .send()
    ).map((x) => {
      const data = new Uint8Array(base64Encoder.encode(x.account.data[0]));
      return [x.pubkey, configurationDecoder.decode(data)];
    });
  }

  /**
   * Get the deserialised OracleMappings account for a given feed
   * @param feed - either the feed PDA seed or the configuration account address
   * @returns OracleMappings
   */
  async getOracleMappings(feed: FeedParam): Promise<OracleMappings> {
    const [config, configAccount] = await this.getSingleFeedConfiguration(feed);
    return this.getOracleMappingsFromConfig(feed, config, configAccount);
  }

  /**
   * Get the deserialized OracleMappings account for a given feed and config
   * @param feed - either the feed PDA seed or the configuration account address
   * @param config - the configuration account address
   * @param configAccount - the deserialized configuration account
   * @returns OracleMappings
   */
  async getOracleMappingsFromConfig(
    feed: FeedParam,
    config: Address,
    configAccount: Configuration
  ): Promise<OracleMappings> {
    const maybeAccount = await fetchMaybeOracleMappings(this._rpc, configAccount.oracleMappings);
    if (!maybeAccount.exists) {
      throw Error(`Could not get scope oracle mappings account for feed ${JSON.stringify(feed)}, config ${config}`);
    }
    return maybeAccount.data;
  }

  /**
   * Get the price of a token from a chain of token prices
   * @param chain
   * @param prices
   */
  public static getPriceFromScopeChain(chain: Array<number>, prices: OraclePrices): ScopeDatedPrice {
    // Protect from bad defaults
    if (chain.every((tokenId) => tokenId === 0)) {
      throw new Error('Token chain cannot be all 0s');
    }
    // Protect from bad defaults
    const filteredChain = chain.filter((tokenId) => tokenId !== U16_MAX);
    if (filteredChain.length === 0) {
      throw new Error(`Token chain cannot be all ${U16_MAX}s (u16 max)`);
    }
    let oldestTimestamp = new Decimal('0');
    const priceChain = filteredChain.map((tokenId) => {
      const datedPrice = prices.prices[tokenId];
      if (!datedPrice) {
        throw Error(`Could not get price for token ${tokenId}`);
      }
      const currentPxTs = new Decimal(datedPrice.unixTimestamp.toString());
      if (oldestTimestamp.eq(new Decimal('0'))) {
        oldestTimestamp = currentPxTs;
      } else if (!currentPxTs.eq(new Decimal('0'))) {
        oldestTimestamp = Decimal.min(oldestTimestamp, currentPxTs);
      }
      const priceInfo = datedPrice.price;
      return Scope.priceToDecimal(priceInfo);
    });

    if (priceChain.length === 1) {
      return {
        price: priceChain[0],
        timestamp: oldestTimestamp,
      };
    }

    // Compute token value by multiplying all values of the chain
    const pxFromChain = priceChain.reduce((acc, price) => acc.mul(price), new Decimal(1));
    return {
      price: pxFromChain,
      timestamp: oldestTimestamp,
    };
  }

  /**
   * Verify if the scope chain is valid
   * @param chain
   */
  public static isScopeChainValid(chain: Array<number>) {
    return !(
      chain.length === 0 ||
      chain.every((tokenId) => tokenId === 0) ||
      chain.every((tokenId) => tokenId === U16_MAX)
    );
  }

  /**
   * Get the price of a token from a chain of token prices
   * @param chain
   * @param oraclePrices
   */
  async getPriceFromChain(chain: Array<number>, oraclePrices: OraclePrices): Promise<ScopeDatedPrice> {
    return Scope.getPriceFromScopeChain(chain, oraclePrices);
  }

  static getChainMetadataSync(
    mappings: OracleMappings,
    metadatas: TokenMetadatas,
    chain: number[]
  ): ScopeEntryMetadata[] {
    return chain.filter((idx) => idx !== U16_MAX).map((idx) => new ScopeEntryMetadata(mappings, metadatas, idx));
  }

  /**
   * Fetch the oracle mapping and metadata information for a chain of token indices
   * @param feed The feed, configuration or prices account describing the scope feed
   * @param chain Token indices describing the scope chain
   */
  async getChainMetadata(feed: PricesParam, chain: number[]): Promise<ScopeEntryMetadata[]> {
    const [_address, configAccount] = await this.getSingleFeedConfiguration(feed);

    const [oracleMappingsResult, tokensMetadataResult] = await Promise.all([
      fetchMaybeOracleMappings(this._rpc, configAccount.oracleMappings),
      fetchMaybeTokenMetadatas(this._rpc, configAccount.tokensMetadata),
    ]);

    if (!oracleMappingsResult.exists) {
      throw new Error(`Could not get scope oracle mappings account`);
    } else if (!tokensMetadataResult.exists) {
      throw new Error(`Could not get scope token metadatas account`);
    }

    return Scope.getChainMetadataSync(oracleMappingsResult.data, tokensMetadataResult.data, chain);
  }

  /**
   * Create a new scope price feed
   * @param admin
   * @param feed
   */
  async initialise(
    admin: TransactionSigner,
    feed: string
  ): Promise<
    [
      Instruction[],
      TransactionSigner[],
      {
        configuration: Address;
        oracleMappings: Address;
        oraclePrices: Address;
        oracleTwaps: Address;
        tokenMetadatas: Address;
      },
    ]
  > {
    const config = await getConfigurationPda(feed);
    const oraclePrices = await generateKeyPairSigner();
    const createOraclePricesIx = getCreateAccountInstruction({
      payer: admin,
      newAccount: oraclePrices,
      lamports: await this._rpc.getMinimumBalanceForRentExemption(ORACLE_PRICES_LEN).send(),
      space: ORACLE_PRICES_LEN,
      programAddress: this._config.programId,
    });
    const oracleMappings = await generateKeyPairSigner();
    const createOracleMappingsIx = getCreateAccountInstruction({
      payer: admin,
      newAccount: oracleMappings,
      lamports: await this._rpc.getMinimumBalanceForRentExemption(ORACLE_MAPPINGS_LEN).send(),
      space: ORACLE_MAPPINGS_LEN,
      programAddress: this._config.programId,
    });
    const tokenMetadatas = await generateKeyPairSigner();
    const createTokenMetadatasIx = getCreateAccountInstruction({
      payer: admin,
      newAccount: tokenMetadatas,
      lamports: await this._rpc.getMinimumBalanceForRentExemption(TOKEN_METADATAS_LEN).send(),
      space: TOKEN_METADATAS_LEN,
      programAddress: this._config.programId,
    });
    const oracleTwaps = await generateKeyPairSigner();
    const createOracleTwapsIx = getCreateAccountInstruction({
      payer: admin,
      newAccount: oracleTwaps,
      lamports: await this._rpc.getMinimumBalanceForRentExemption(ORACLE_TWAPS_LEN).send(),
      space: ORACLE_TWAPS_LEN,
      programAddress: this._config.programId,
    });
    const initScopeIx = getInitializeInstruction(
      {
        admin: admin,
        configuration: config,
        oracleMappings: oracleMappings.address,
        oracleTwaps: oracleTwaps.address,
        tokenMetadatas: tokenMetadatas.address,
        oraclePrices: oraclePrices.address,
        feedName: feed,
      },
      { programAddress: this._config.programId }
    );

    return [
      [createOraclePricesIx, createOracleMappingsIx, createOracleTwapsIx, createTokenMetadatasIx, initScopeIx],
      [admin, oraclePrices, oracleMappings, oracleTwaps, tokenMetadatas],
      {
        configuration: config,
        oracleMappings: oracleMappings.address,
        oraclePrices: oraclePrices.address,
        oracleTwaps: oracleTwaps.address,
        tokenMetadatas: tokenMetadatas.address,
      },
    ];
  }

  /**
   * Update the price mapping of a token.
   *
   * This is a full-entry setter: every call writes the mapping config, the TWAP-enabled bitmask and the ref price
   * from the given parameters, so omitted parameters actively reset their fields to the defaults (like the legacy
   * `updateMapping` instruction did). To update a single field while leaving the others untouched, build the
   * instruction with `getUpdateMappingAndMetadataInstruction` and only the wanted update entries instead.
   * @param admin
   * @param feed
   * @param index
   * @param oracleType
   * @param mapping - price info account of the oracle, or null for oracle types that use no account.
   * Ignored for TWAP oracle types.
   * @param twapEnabledBitmask - bitmask of the EMA types enabled for this entry (see {@link twapEnabledBitmask})
   * @param twapSource - entry index the TWAP is computed from (only used for TWAP oracle types)
   * @param refPriceIndex
   * @param genericData
   * @param refPriceToleranceBps - max deviation from the ref price in bps; only valid for non-TWAP oracle types
   */
  async updateFeedMapping(
    admin: TransactionSigner,
    feed: string,
    index: number,
    oracleType: OracleType,
    mapping: Address | null,
    twapEnabledBitmask: number = 0,
    twapSource: number = 0,
    refPriceIndex: number = U16_MAX,
    genericData: Array<number> = Array(20).fill(0),
    refPriceToleranceBps?: number
  ): Promise<Instruction> {
    const [config, configAccount] = await this.getSingleFeedConfiguration({ feed });
    const isTwapType = TWAP_ORACLE_TYPES.has(oracleType);
    const entryUpdates: UpdateOracleMappingAndMetadataEntryArgs[] = [];
    if (isTwapType) {
      entryUpdates.push(updateOracleMappingAndMetadataEntry('MappingTwapEntry', { priceType: oracleType, twapSource }));
    } else {
      entryUpdates.push(
        updateOracleMappingAndMetadataEntry('MappingConfig', {
          priceType: oracleType,
          genericData: new Uint8Array(genericData),
        })
      );
    }
    entryUpdates.push(updateOracleMappingAndMetadataEntry('MappingTwapEnabledBitmask', [twapEnabledBitmask]));
    entryUpdates.push(
      updateOracleMappingAndMetadataEntry('MappingRefPrice', {
        refPriceIndex: refPriceIndex === U16_MAX ? none() : some(refPriceIndex),
        refPriceToleranceBps: refPriceToleranceBps === undefined ? none() : some(refPriceToleranceBps),
      })
    );
    const ix = getUpdateMappingAndMetadataInstruction(
      {
        admin: admin,
        configuration: config,
        oracleMappings: configAccount.oracleMappings,
        tokensMetadata: configAccount.tokensMetadata,
        oraclePrices: configAccount.oraclePrices,
        oracleTwaps: configAccount.oracleTwaps,
        feedName: feed,
        updates: [{ entryId: index, updates: entryUpdates }],
      },
      { programAddress: this._config.programId }
    );
    if (isTwapType) {
      return ix;
    }
    // Each `MappingConfig` update consumes one remaining account: the price info account of the oracle.
    // The scope program address is the on-chain sentinel for "no account" (see `maybe_account` in the program).
    return {
      ...ix,
      accounts: [...(ix.accounts ?? []), { role: AccountRole.READONLY, address: mapping ?? this._config.programId }],
    };
  }

  /**
   * Update the token metadata of feed entries; only the fields provided in each update are written.
   * @param admin
   * @param feed
   * @param updates
   */
  async updateFeedMetadata(
    admin: TransactionSigner,
    feed: string,
    updates: FeedMetadataUpdate[]
  ): Promise<Instruction> {
    const [config, configAccount] = await this.getSingleFeedConfiguration({ feed });
    return getUpdateMappingAndMetadataInstruction(
      {
        admin: admin,
        configuration: config,
        oracleMappings: configAccount.oracleMappings,
        tokensMetadata: configAccount.tokensMetadata,
        oraclePrices: configAccount.oraclePrices,
        oracleTwaps: configAccount.oracleTwaps,
        feedName: feed,
        updates: updates.map(({ index, name, maxPriceAgeSlots, groupIdsBitset }) => {
          const entryUpdates: UpdateOracleMappingAndMetadataEntryArgs[] = [];
          if (name !== undefined) {
            // The program stores the name in a fixed 32-byte field and panics on a longer one
            const nameLength = new TextEncoder().encode(name).length;
            if (nameLength > TOKEN_METADATA_NAME_LEN) {
              throw Error(
                `Token metadata name "${name}" is ${nameLength} bytes long, max is ${TOKEN_METADATA_NAME_LEN}`
              );
            }
            entryUpdates.push(updateOracleMappingAndMetadataEntry('MetadataName', [name]));
          }
          if (maxPriceAgeSlots !== undefined) {
            entryUpdates.push(updateOracleMappingAndMetadataEntry('MetadataMaxPriceAgeSlots', [maxPriceAgeSlots]));
          }
          if (groupIdsBitset !== undefined) {
            entryUpdates.push(updateOracleMappingAndMetadataEntry('MetadataGroupIdsBitset', [groupIdsBitset]));
          }
          return { entryId: index, updates: entryUpdates };
        }),
      },
      { programAddress: this._config.programId }
    );
  }

  async refreshPriceListIx(feed: FeedParam, tokens: number[]): Promise<Instruction | null> {
    const [config, configAccount] = await this.getSingleFeedConfiguration(feed);
    const mappings = await this.getOracleMappingsFromConfig(feed, config, configAccount);
    return this.refreshPriceListIxWithAccounts(tokens, configAccount, mappings);
  }

  async refreshPriceListIxWithAccounts(
    tokens: number[],
    configAccount: Configuration,
    mappings: OracleMappings
  ): Promise<Instruction | null> {
    // Filter out tokens that cannot be refreshed with the `refreshPriceList` instruction
    const filteredTokens = tokens.filter(
      (token) => !NON_REFRESHABLE_ORACLE_TYPES.has(stripFrozenFlag(mappings.priceTypes[token]))
    );

    if (filteredTokens.length === 0) {
      // No tokens to refresh, not creating an instruction
      return null;
    }

    if (
      filteredTokens.length > 1 &&
      filteredTokens.some((token) => stripFrozenFlag(mappings.priceTypes[token]) === OracleType.KlendCTokenExchangeRate)
    ) {
      // A CPI failure aborts the whole transaction and cannot be skipped per-entry, so the program
      // requires CPI-refreshing entries to not be batched with other tokens
      throw Error(
        'A KlendCTokenExchangeRate entry must be refreshed in its own single-entry refreshPriceList call as its refresh CPIs into klend'
      );
    }

    let refreshIx: Instruction = getRefreshPriceListInstruction(
      {
        oracleMappings: configAccount.oracleMappings,
        oraclePrices: configAccount.oraclePrices,
        oracleTwaps: configAccount.oracleTwaps,
        instructionSysvarAccountInfo: SYSVAR_INSTRUCTIONS_ADDRESS,
        tokens: filteredTokens,
      },
      { programAddress: this._config.programId }
    );
    for (const token of filteredTokens) {
      refreshIx = {
        ...refreshIx,
        accounts: (refreshIx.accounts ?? []).concat(
          await Scope.getRefreshAccounts(
            this._rpc,
            this._config.kliquidityProgramId,
            this._config.klendProgramId,
            mappings,
            token
          )
        ),
      };
    }
    return refreshIx;
  }

  static async getRefreshAccounts(
    connection: Rpc<GetAccountInfoApi>,
    kaminoProgramId: Address,
    klendProgramId: Address,
    mappings: OracleMappings,
    token: number
  ): Promise<AccountMeta[]> {
    const priceType = stripFrozenFlag(mappings.priceTypes[token]);
    const priceInfoAccount = mappings.priceInfoAccounts[token];
    const keys: AccountMeta[] = [
      {
        // The KlendCTokenExchangeRate refresh CPIs into klend to refresh the reserve, so the reserve must be writable
        role: priceType === OracleType.KlendCTokenExchangeRate ? AccountRole.WRITABLE : AccountRole.READONLY,
        address: priceInfoAccount,
      },
    ];
    switch (priceType) {
      case OracleType.KToken: {
        keys.push(...(await Scope.getKTokenRefreshAccounts(connection, kaminoProgramId, mappings, token)));
        return keys;
      }
      case OracleType.JupiterLpFetch: {
        const lpMint = await getJlpMintPda(priceInfoAccount);
        keys.push({
          role: AccountRole.READONLY,
          address: lpMint,
        });
        return keys;
      }
      case OracleType.Securitize: {
        keys.push(...(await getSecuritizeRefreshAccounts(connection, priceInfoAccount)));
        return keys;
      }
      case OracleType.SplBalance: {
        keys.push(...(await getSplBalanceRefreshAccounts(connection, priceInfoAccount)));
        return keys;
      }
      case OracleType.KlendCTokenExchangeRate: {
        keys.push(...(await getKlendCTokenRefreshAccounts(connection, klendProgramId, priceInfoAccount)));
        return keys;
      }
      default: {
        return keys;
      }
    }
  }

  static async getKTokenRefreshAccounts(
    connection: Rpc<GetAccountInfoApi>,
    _kaminoProgramId: Address,
    mappings: OracleMappings,
    token: number
  ): Promise<AccountMeta[]> {
    const maybeStrategy = await fetchMaybeWhirlpoolStrategy(connection, mappings.priceInfoAccounts[token]);
    if (!maybeStrategy.exists) {
      throw Error(`Could not get Kamino strategy ${mappings.priceInfoAccounts[token]} to refresh token index ${token}`);
    }
    const strategy = maybeStrategy.data;
    const maybeGlobalConfig = await fetchMaybeGlobalConfig(connection, strategy.globalConfig);
    if (!maybeGlobalConfig.exists) {
      throw Error(
        `Could not get global config for Kamino strategy ${
          mappings.priceInfoAccounts[token]
        } to refresh token index ${token}`
      );
    }
    const globalConfig = maybeGlobalConfig.data;
    return [strategy.globalConfig, globalConfig.tokenInfos, strategy.pool, strategy.position, strategy.scopePrices].map(
      (acc) => {
        return {
          role: AccountRole.READONLY,
          address: acc,
        };
      }
    );
  }
}

export default Scope;
