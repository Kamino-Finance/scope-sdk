import { Address } from '@solana/kit';

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
  validateFeedParam(pricesParam);
  const { feed, config, prices } = pricesParam;
  if ((feed || config) && prices) {
    throw new Error(`Only one of feed, config, or prices is allowed. Received ${JSON.stringify(pricesParam)}`);
  } else if (!feed && !config && !prices) {
    throw new Error(
      `Must supply one of feed PDA, config pubkey, or oracle prices pubkey. Received ${JSON.stringify(pricesParam)}`
    );
  }
}
