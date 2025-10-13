import { Connection, PublicKey } from '@solana/web3.js';
import bs58 from 'bs58';
import { getConfigurationPda } from '../utils';
import { Configuration } from '../accounts';

export type FeedParam = {
  /**
   * The feed configuration account PDA seed
   */
  feed?: string;

  /**
   * Scope feed configuration account pubkey
   */
  config?: PublicKey;
};

export function validateFeedParam(feedParam: FeedParam) {
  const { feed, config } = feedParam;
  if (feed && config) {
    throw new Error('Only one of feed or config is allowed');
  }
}

export type PricesParam = FeedParam & {
  /**
   * Scope prices account
   */
  prices?: PublicKey;
};

export function validatePricesParam(pricesParam: PricesParam) {
  const { feed, config, prices } = pricesParam;
  if ((feed && config) || (feed && prices) || (config && prices)) {
    throw new Error(`Only one of feed, config, or prices is allowed. Received ${JSON.stringify(pricesParam)}`);
  } else if (!feed && !config && !prices) {
    throw new Error(
      `Must supply one of feed PDA, config pubkey, or oracle prices pubkey. Received ${JSON.stringify(pricesParam)}`
    );
  }
}

export async function getConfigPubkeyFromPricesParam(
  pricesParam: PricesParam,
  c: Connection,
  programId: PublicKey
) {
  const { feed, config, prices } = pricesParam;
  let configPubkey: PublicKey;
  if (feed) {
    configPubkey = getConfigurationPda(feed);
  } else if (config) {
    configPubkey = config;
  } else if (prices) {
    const configs = await c
      .getProgramAccounts(programId, {
        filters: [
          { memcmp: { offset: 0, bytes: bs58.encode(Configuration.discriminator) }},
          { memcmp: { offset: 72, bytes: bs58.encode(prices.toBuffer()) }},
        ],
      });
    if (configs.length === 0) {
      throw new Error(`Could not find configuration account for prices ${prices}`);
    }
    configPubkey = configs[0].pubkey;
  } else {
    throw new Error('Must supply at least one of feed PDA or config pubkey, received none of those two');
  }
  return configPubkey;
}
