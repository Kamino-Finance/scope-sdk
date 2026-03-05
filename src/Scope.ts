import {
  AccountRole,
  Address,
  Base58EncodedBytes,
  generateKeyPairSigner,
  getBase64Encoder,
  GetAccountInfoApi,
  AccountMeta,
  Instruction,
  isSome,
  Rpc,
  SolanaRpcApiMainnet,
  TransactionSigner,
} from '@solana/kit';
import bs58 from 'bs58';
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
  OracleType,
  type Price,
  type TokenMetadata,
  getPriceDecoder,
  getMostRecentOfDataDecoder,
  getCappedFlooredDataDecoder,
  getCappedMostRecentOfDataDecoder,
} from './@codegen/scope/types';
// Re-export SCOPE_PROGRAM_ADDRESS for downstream consumers
export { SCOPE_PROGRAM_ADDRESS } from './@codegen/scope/programs';
import { SCOPE_DEVNET_CONFIG, SCOPE_LOCALNET_CONFIG, SCOPE_MAINNET_CONFIG, ScopeConfig, U16_MAX } from './constants';
import {
  getInitializeInstruction,
  getUpdateMappingInstruction,
  getRefreshPriceListInstruction,
} from './@codegen/scope/instructions';
import {
  getConfigurationPda,
  getJlpMintPda,
  getMintsToScopeChainPda,
  ORACLE_MAPPINGS_LEN,
  ORACLE_PRICES_LEN,
  ORACLE_TWAPS_LEN,
  TOKEN_METADATAS_LEN,
} from './utils';
import { FeedParam, getConfigPubkeyFromPricesParam, PricesParam, validatePricesParam } from './model';
import { fetchMaybeWhirlpoolStrategy, fetchMaybeGlobalConfig } from './@codegen/kliquidity/accounts';
import { fetchMaybeCustody, fetchMaybePool } from './@codegen/jupiter-perps/accounts';
import { getCreateAccountInstruction } from '@solana-program/system';
import { SYSVAR_INSTRUCTIONS_ADDRESS } from '@solana/sysvars';

export type ScopeDatedPrice = {
  price: Decimal;
  timestamp: Decimal;
};

export type ProviderKind = 'Pyth' | 'Switchboard' | 'Chainlink' | 'Redstone' | 'Scope';

// Build a map from numeric discriminator to { kind: string } for the OracleType enum.
const ORACLE_TYPE_BY_DISCRIMINATOR: Record<number, { kind: string }> = {};
for (const [key, val] of Object.entries(OracleType)) {
  if (typeof val === 'number') {
    ORACLE_TYPE_BY_DISCRIMINATOR[val] = { kind: key };
  }
}

const base64Encoder = getBase64Encoder();
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
    return this.mappings.priceTypes[this.priceId];
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
    let name = new TextDecoder().decode(nullIdx >= 0 ? bytes.subarray(0, nullIdx) : bytes);

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
        name = name
          .replace('Pyth Pull EMA ', '')
          .replace('Pyth EMA ', '')
          .replace('EMA Pyth ', '')
          .replace('EMA ', '');
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
        const floor =
          isSome(generic.floorEntry) ?
            new ScopeEntryMetadata(this.mappings, this.metadatas, generic.floorEntry.value)
          : null;
        const cap =
          isSome(generic.capEntry) ?
            new ScopeEntryMetadata(this.mappings, this.metadatas, generic.capEntry.value)
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
        const floor =
          isSome(generic.floorEntry)
            ? mapEntry(new ScopeEntryMetadata(this.mappings, this.metadatas, generic.floorEntry.value))
            : undefined;
        const cap =
          isSome(generic.capEntry)
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

export class Scope {
  private readonly _rpc: Rpc<SolanaRpcApiMainnet>;
  private readonly _config: ScopeConfig;

  /**
   * Create a new instance of the Scope SDK class.
   * @param cluster Name of the Solana cluster
   * @param rpc Connection to the Solana rpc
   */
  constructor(cluster: 'localnet' | 'devnet' | 'mainnet-beta', rpc: Rpc<SolanaRpcApiMainnet>) {
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
                bytes: bs58.encode(ORACLE_PRICES_DISCRIMINATOR) as Base58EncodedBytes,
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
                bytes: bs58.encode(CONFIGURATION_DISCRIMINATOR) as Base58EncodedBytes,
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
      },
    ];
  }

  /**
   * Update the price mapping of a token
   * @param admin
   * @param feed
   * @param index
   * @param oracleType
   * @param mapping
   * @param twapEnabled
   * @param twapSource
   * @param refPriceIndex
   * @param genericData
   */
  async updateFeedMapping(
    admin: TransactionSigner,
    feed: string,
    index: number,
    oracleType: OracleType,
    mapping: Address,
    twapEnabled: boolean = false,
    twapSource: number = 0,
    refPriceIndex: number = 65_535,
    genericData: Array<number> = Array(20).fill(0)
  ): Promise<Instruction> {
    const [config, configAccount] = await this.getSingleFeedConfiguration({ feed });
    return getUpdateMappingInstruction(
      {
        admin: admin,
        configuration: config,
        oracleMappings: configAccount.oracleMappings,
        priceInfo: mapping,
        feedName: feed,
        token: index,
        priceType: oracleType,
        twapEnabled,
        twapSource,
        refPriceIndex,
        genericData: new Uint8Array(genericData),
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
    // Filter out tokens that cannot be refreshed by scope
    const filteredTokens = tokens.filter((token) => {
      return !(
        mappings.priceTypes[token] === OracleType.Chainlink ||
        mappings.priceTypes[token] === OracleType.ChainlinkNAV ||
        mappings.priceTypes[token] === OracleType.ChainlinkRWA ||
        mappings.priceTypes[token] === OracleType.PythLazer ||
        mappings.priceTypes[token] === OracleType.Securitize
      );
    });

    if (filteredTokens.length === 0) {
      // No tokens to refresh, not creating an instruction
      return null;
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
          await Scope.getRefreshAccounts(this._rpc, configAccount, this._config.kliquidityProgramId, mappings, token)
        ),
      };
    }
    return refreshIx;
  }

  static async getRefreshAccounts(
    connection: Rpc<GetAccountInfoApi>,
    configAccount: Configuration,
    kaminoProgramId: Address,
    mappings: OracleMappings,
    token: number
  ): Promise<AccountMeta[]> {
    const keys: AccountMeta[] = [];
    keys.push({
      role: AccountRole.READONLY,
      address: mappings.priceInfoAccounts[token],
    });
    switch (mappings.priceTypes[token]) {
      case OracleType.KToken: {
        keys.push(...(await Scope.getKTokenRefreshAccounts(connection, kaminoProgramId, mappings, token)));
        return keys;
      }
      case OracleType.JupiterLpFetch: {
        const lpMint = await getJlpMintPda(mappings.priceInfoAccounts[token]);
        keys.push({
          role: AccountRole.READONLY,
          address: lpMint,
        });
        return keys;
      }
      case OracleType.JupiterLpCompute: {
        const lpMint = await getJlpMintPda(mappings.priceInfoAccounts[token]);

        const jlpRefreshAccounts = await this.getJlpRefreshAccounts(
          connection,
          configAccount,
          mappings,
          token,
          'compute'
        );

        jlpRefreshAccounts.unshift({
          role: AccountRole.READONLY,
          address: lpMint,
        });

        keys.push(...jlpRefreshAccounts);

        return keys;
      }
      case OracleType.JupiterLpScope: {
        const lpMint = await getJlpMintPda(mappings.priceInfoAccounts[token]);

        const jlpRefreshAccounts = await this.getJlpRefreshAccounts(
          connection,
          configAccount,
          mappings,
          token,
          'scope'
        );

        jlpRefreshAccounts.unshift({
          role: AccountRole.READONLY,
          address: lpMint,
        });

        keys.push(...jlpRefreshAccounts);

        return keys;
      }
      default: {
        return keys;
      }
    }
  }

  static async getJlpRefreshAccounts(
    rpc: Rpc<GetAccountInfoApi>,
    configAccount: Configuration,
    mappings: OracleMappings,
    token: number,
    fetchingMechanism: 'compute' | 'scope'
  ): Promise<AccountMeta[]> {
    const maybePool = await fetchMaybePool(rpc, mappings.priceInfoAccounts[token]);
    if (!maybePool.exists) {
      throw Error(`Could not get Jupiter pool ${mappings.priceInfoAccounts[token]} to refresh token index ${token}`);
    }
    const pool = maybePool.data;

    const extraAccounts: AccountMeta[] = [];

    if (fetchingMechanism === 'scope') {
      const mintsToScopeChain = await getMintsToScopeChainPda(
        configAccount.oraclePrices,
        mappings.priceInfoAccounts[token],
        token
      );

      extraAccounts.push({
        role: AccountRole.READONLY,
        address: mintsToScopeChain,
      });
    }

    extraAccounts.push(
      ...pool.custodies.map((custody) => {
        return {
          role: AccountRole.READONLY,
          address: custody,
        };
      })
    );

    if (fetchingMechanism === 'compute') {
      for (const custodyPk of pool.custodies) {
        const maybeCustody = await fetchMaybeCustody(rpc, custodyPk);

        if (!maybeCustody.exists) {
          throw Error(`Could not get Jupiter custody ${custodyPk} to refresh token index ${token}`);
        }

        extraAccounts.push({
          role: AccountRole.READONLY,
          address: maybeCustody.data.oracle.oracleAccount,
        });
      }
    }

    return extraAccounts;
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
