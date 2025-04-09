import {
  AccountRole,
  Address,
  generateKeyPairSigner,
  GetAccountInfoApi,
  IAccountMeta,
  IInstruction,
  Rpc,
  SolanaRpcApiMainnet,
  some,
  TransactionSigner,
} from '@solana/kit';
import Decimal from 'decimal.js';
import { Configuration, OracleMappings, OraclePrices } from './@codegen/scope/accounts';
import { OracleType, OracleTypeKind, Price } from './@codegen/scope/types';
import { SCOPE_DEVNET_CONFIG, SCOPE_LOCALNET_CONFIG, SCOPE_MAINNET_CONFIG, ScopeConfig, U16_MAX } from './constants';
import * as ScopeIx from './@codegen/scope/instructions';
import {
  getConfigurationPda,
  getJlpMintPda,
  getMintsToScopeChainPda,
  ORACLE_MAPPINGS_LEN,
  ORACLE_PRICES_LEN,
  ORACLE_TWAPS_LEN,
  TOKEN_METADATAS_LEN,
} from './utils';
import { FeedParam, PricesParam, validateFeedParam, validatePricesParam } from './model';
import { GlobalConfig, WhirlpoolStrategy } from './@codegen/kliquidity/accounts';
import { Custody, Pool } from './@codegen/jupiter-perps/accounts';
import { PROGRAM_ID as JLP_PROGRAM_ID } from './@codegen/jupiter-perps/programId';
import { getCreateAccountInstruction, SYSTEM_PROGRAM_ADDRESS } from '@solana-program/system';
import { SYSVAR_INSTRUCTIONS_ADDRESS } from '@solana/sysvars';

export type ScopeDatedPrice = {
  price: Decimal;
  timestamp: Decimal;
};

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

  private static priceToDecimal(price: Price) {
    return new Decimal(price.value.toString()).mul(new Decimal(10).pow(new Decimal(-price.exp.toString())));
  }

  /**
   * Get the deserialised OraclePrices account for a given feed
   * @param feed - either the feed PDA seed or the configuration account address
   * @returns OraclePrices
   */
  async getOraclePrices(feed?: PricesParam): Promise<OraclePrices> {
    validatePricesParam(feed);
    let oraclePrices: Address;
    if (feed?.feed || feed?.config) {
      const [, configAccount] = await this.getFeedConfiguration(feed);
      oraclePrices = configAccount.oraclePrices;
    } else if (feed?.prices) {
      oraclePrices = feed.prices;
    } else {
      oraclePrices = this._config.oraclePrices;
    }
    const prices = await OraclePrices.fetch(this._rpc, oraclePrices, this._config.programId);
    if (!prices) {
      throw Error(`Could not get scope oracle prices`);
    }
    return prices;
  }

  /**
   * Get the deserialised OraclePrices accounts for a given `OraclePrices` account pubkeys
   * Optimised to filter duplicate keys from the network request but returns the same size response as requested in the same order
   * @throws Error if any of the accounts cannot be fetched
   * @param prices - public keys of the `OraclePrices` accounts
   * @returns [Address, OraclePrices][]
   */
  async getMultipleOraclePrices(prices: Address[]): Promise<[Address, OraclePrices][]> {
    const priceStrings = prices.map((price) => price);
    const uniqueScopePrices = [...new Set(priceStrings)];
    if (uniqueScopePrices.length === 1) {
      return [[uniqueScopePrices[0], await this.getOraclePrices({ prices: uniqueScopePrices[0] })]];
    }
    const oraclePrices = await OraclePrices.fetchMultiple(this._rpc, uniqueScopePrices, this._config.programId);
    const oraclePricesMap: Record<Address, OraclePrices> = oraclePrices
      .map((price, i) => {
        if (price === null) {
          throw Error(`Could not get scope oracle prices for ${uniqueScopePrices[i]}`);
        }
        return price;
      })
      .reduce(
        (map, price, i) => {
          map[uniqueScopePrices[i]] = price;
          return map;
        },
        {} as Record<Address, OraclePrices>
      );
    return prices.map((price) => [price, oraclePricesMap[price]]);
  }

  /**
   * Get the deserialised Configuration account for a given feed
   * @param feedParam - either the feed PDA seed or the configuration account address
   * @returns [configuration account address, deserialised configuration]
   */
  async getFeedConfiguration(feedParam?: FeedParam): Promise<[Address, Configuration]> {
    validateFeedParam(feedParam);
    const { feed, config } = feedParam || {};
    let configPubkey: Address;
    if (feed) {
      configPubkey = await getConfigurationPda(feed);
    } else if (config) {
      configPubkey = config;
    } else {
      configPubkey = this._config.configurationAccount;
    }
    const configAccount = await Configuration.fetch(this._rpc, configPubkey, this._config.programId);
    if (!configAccount) {
      throw new Error(`Could not find configuration account for ${feed || configPubkey}`);
    }
    return [configPubkey, configAccount];
  }

  /**
   * Get the deserialised OracleMappings account for a given feed
   * @param feed - either the feed PDA seed or the configuration account address
   * @returns OracleMappings
   */
  async getOracleMappings(feed: FeedParam): Promise<OracleMappings> {
    const [config, configAccount] = await this.getFeedConfiguration(feed);
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
    const oracleMappings = await OracleMappings.fetch(this._rpc, configAccount.oracleMappings, this._config.programId);
    if (!oracleMappings) {
      throw Error(`Could not get scope oracle mappings account for feed ${JSON.stringify(feed)}, config ${config}`);
    }
    return oracleMappings;
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
  async getPriceFromChain(chain: Array<number>, oraclePrices?: OraclePrices): Promise<ScopeDatedPrice> {
    let prices: OraclePrices;
    if (oraclePrices) {
      prices = oraclePrices;
    } else {
      prices = await this.getOraclePrices();
    }
    return Scope.getPriceFromScopeChain(chain, prices);
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
      IInstruction[],
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
    const initScopeIx = ScopeIx.initialize(
      { feedName: feed },
      {
        admin: admin,
        configuration: config,
        oracleMappings: oracleMappings.address,
        oracleTwaps: oracleTwaps.address,
        tokenMetadatas: tokenMetadatas.address,
        oraclePrices: oraclePrices.address,
        systemProgram: SYSTEM_PROGRAM_ADDRESS,
      },
      this._config.programId
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
    oracleType: OracleTypeKind,
    mapping: Address,
    twapEnabled: boolean = false,
    twapSource: number = 0,
    refPriceIndex: number = 65_535,
    genericData: Array<number> = Array(20).fill(0)
  ): Promise<IInstruction> {
    const [config, configAccount] = await this.getFeedConfiguration({ feed });
    const updateIx = ScopeIx.updateMapping(
      {
        feedName: feed,
        token: index,
        priceType: oracleType.discriminator,
        twapEnabled,
        twapSource,
        refPriceIndex,
        genericData,
      },
      {
        admin: admin,
        configuration: config,
        oracleMappings: configAccount.oracleMappings,
        priceInfo: some(mapping),
      },
      this._config.programId
    );
    return updateIx;
  }

  async refreshPriceList(feed: FeedParam, tokens: number[]): Promise<IInstruction> {
    const [, configAccount] = await this.getFeedConfiguration(feed);
    let refreshIx = ScopeIx.refreshPriceList(
      {
        tokens,
      },
      {
        oracleMappings: configAccount.oracleMappings,
        oraclePrices: configAccount.oraclePrices,
        oracleTwaps: configAccount.oracleTwaps,
        instructionSysvarAccountInfo: SYSVAR_INSTRUCTIONS_ADDRESS,
      },
      this._config.programId
    );
    const mappings = await this.getOracleMappings(feed);
    for (const token of tokens) {
      refreshIx = {
        ...refreshIx,
        accounts: refreshIx.accounts?.concat(
          await Scope.getRefreshAccounts(this._rpc, configAccount, this._config.kliquidityProgramId, mappings, token)
        ),
      };
    }
    return refreshIx;
  }

  async refreshPriceListIx(feed: FeedParam, tokens: number[]) {
    const [config, configAccount] = await this.getFeedConfiguration(feed);
    const mappings = await this.getOracleMappingsFromConfig(feed, config, configAccount);
    return this.refreshPriceListIxWithAccounts(tokens, configAccount, mappings);
  }

  async refreshPriceListIxWithAccounts(tokens: number[], configAccount: Configuration, mappings: OracleMappings) {
    let refreshIx = ScopeIx.refreshPriceList(
      {
        tokens,
      },
      {
        oracleMappings: configAccount.oracleMappings,
        oraclePrices: configAccount.oraclePrices,
        oracleTwaps: configAccount.oracleTwaps,
        instructionSysvarAccountInfo: SYSVAR_INSTRUCTIONS_ADDRESS,
      },
      this._config.programId
    );
    for (const token of tokens) {
      refreshIx = {
        ...refreshIx,
        accounts: refreshIx.accounts?.concat(
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
  ): Promise<IAccountMeta[]> {
    const keys: IAccountMeta[] = [];
    keys.push({
      role: AccountRole.READONLY,
      address: mappings.priceInfoAccounts[token],
    });
    switch (mappings.priceTypes[token]) {
      case OracleType.KToken.discriminator: {
        keys.push(...(await Scope.getKTokenRefreshAccounts(connection, kaminoProgramId, mappings, token)));
        return keys;
      }
      case new OracleType.JupiterLpFetch().discriminator: {
        const lpMint = await getJlpMintPda(mappings.priceInfoAccounts[token]);
        keys.push({
          role: AccountRole.READONLY,
          address: lpMint,
        });
        return keys;
      }
      case OracleType.JupiterLpCompute.discriminator: {
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
      case OracleType.JupiterLpScope.discriminator: {
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
  ): Promise<IAccountMeta[]> {
    const pool = await Pool.fetch(rpc, mappings.priceInfoAccounts[token], JLP_PROGRAM_ID);
    if (!pool) {
      throw Error(`Could not get Jupiter pool ${mappings.priceInfoAccounts[token]} to refresh token index ${token}`);
    }

    const extraAccounts: IAccountMeta[] = [];

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
        const custody = await Custody.fetch(rpc, custodyPk, JLP_PROGRAM_ID);

        if (!custody) {
          throw Error(`Could not get Jupiter custody ${custodyPk} to refresh token index ${token}`);
        }

        extraAccounts.push({
          role: AccountRole.READONLY,
          address: custody.oracle.oracleAccount,
        });
      }
    }

    return extraAccounts;
  }

  static async getKTokenRefreshAccounts(
    connection: Rpc<GetAccountInfoApi>,
    kaminoProgramId: Address,
    mappings: OracleMappings,
    token: number
  ): Promise<IAccountMeta[]> {
    const strategy = await WhirlpoolStrategy.fetch(connection, mappings.priceInfoAccounts[token], kaminoProgramId);
    if (!strategy) {
      throw Error(`Could not get Kamino strategy ${mappings.priceInfoAccounts[token]} to refresh token index ${token}`);
    }
    const globalConfig = await GlobalConfig.fetch(connection, strategy.globalConfig, kaminoProgramId);
    if (!globalConfig) {
      throw Error(
        `Could not get global config for Kamino strategy ${
          mappings.priceInfoAccounts[token]
        } to refresh token index ${token}`
      );
    }
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
