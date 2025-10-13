import { Address, Base58EncodedBytes, getAddressEncoder, Rpc, SolanaRpcApiMainnet } from '@solana/kit';
import bs58 from 'bs58';
import { Configuration } from '../@codegen/scope/accounts';
import { getConfigurationPda } from '../utils';

export type FeedParam = {
  /**
   * The feed configuration account PDA seed
   */
  feed?: string;

  /**
   * Scope feed configuration account pubkey
   */
  config?: Address;
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
  prices?: Address;
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
  rpc: Rpc<SolanaRpcApiMainnet>,
  programId: Address
) {
  const { feed, config, prices } = pricesParam;
  let configPubkey: Address;
  if (feed) {
    configPubkey = await getConfigurationPda(feed);
  } else if (config) {
    configPubkey = config;
  } else if (prices) {
    const addressEncoder = getAddressEncoder();
    const configs = await rpc
      .getProgramAccounts(programId, {
        filters: [
          {
            memcmp: {
              offset: 0n,
              bytes: bs58.encode(Configuration.discriminator) as Base58EncodedBytes,
              encoding: 'base58',
            },
          },
          {
            memcmp: {
              offset: 72n,
              bytes: bs58.encode(Buffer.from(addressEncoder.encode(prices))) as Base58EncodedBytes,
              encoding: 'base58',
            },
          },
        ],
        encoding: 'base64',
      })
      .send();
    if (configs.length === 0) {
      throw new Error(`Could not find configuration account for prices ${prices}`);
    }
    configPubkey = configs[0].pubkey as Address;
  } else {
    throw new Error('Must supply at least one of feed PDA or config pubkey, received none of those two');
  }
  return configPubkey;
}
