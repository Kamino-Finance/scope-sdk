import { Scope } from '../src';
import * as chai from 'chai';
import { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import chaiDecimalJs from 'chai-decimaljs';
import { Decimal } from 'decimal.js';
import { Env, initEnv } from './runner/env';
import { beforeEach } from 'mocha';
import { address } from '@solana/kit';
import { OracleType } from '../src/@codegen/scope/types';
import { sendAndConfirmTx } from './runner/tx';

chai.use(chaiAsPromised);
chai.use(chaiDecimalJs(Decimal));

describe('Scope SDK Tests', () => {
  let env: Env;
  let scope: Scope;
  const ethTokenIndex = 1;
  const hubbleOraclePrices = address('3NJYftD5sjVfxSnUdZ1wVML8f3aC6mp1CXCL6L7TnU8C');
  beforeEach(async () => {
    env = await initEnv();
    scope = new Scope('localnet', env.c.rpc);
  });

  it('should throw on invalid cluster', async () => {
    const cluster = 'invalid-clusters';
    // @ts-ignore
    const init = () => new Scope(cluster, undefined);
    expect(init).to.throw(Error);
  });

  it('should initialise a new scope feed', async () => {
    try {
      const [ixs, signers] = await scope.initialise(env.admin, env.priceFeed);
      const tx = await sendAndConfirmTx(env.c, env.admin, ixs, signers);
      console.log(`Initialised feed transaction: ${tx}`);
    } catch (e) {
      console.log('Error:', e);
      throw e;
    }
    const [, config] = await scope.getSingleFeedConfiguration({ feed: env.priceFeed });
    expect(config).to.not.be.null;
  });

  it('should fetch all scope configurations', async () => {
    let configs = await scope.getAllConfigurations();
    expect(configs).to.not.be.empty;
    const numberOfConfigs = configs.length;
    const [ixs, signers] = await scope.initialise(env.admin, env.priceFeed);
    const tx = await sendAndConfirmTx(env.c, env.admin, ixs, signers);
    console.log(`Initialised feed transaction: ${tx}`);
    configs = await scope.getAllConfigurations();
    expect(configs.length).to.eq(numberOfConfigs + 1);
  });

  it('should update a feed mapping', async () => {
    const [ixs, signers] = await scope.initialise(env.admin, env.priceFeed);
    await sendAndConfirmTx(env.c, env.admin, ixs, signers);
    try {
      const ix = await scope.updateFeedMapping(
        env.admin,
        env.priceFeed,
        ethTokenIndex,
        new OracleType.Pyth(),
        address('Gnt27xtC473ZT2Mw5u8wZ68Z3gULkSTb5DuxJy7eJotD')
      );
      await sendAndConfirmTx(env.c, env.admin, [ix]);
    } catch (e) {
      console.log('Error:', e);
      throw e;
    }

    const newMappings = await scope.getOracleMappings({ feed: env.priceFeed });
    const newPriceTypeMapping = newMappings.priceTypes[ethTokenIndex];
    const newPriceAccountMapping = newMappings.priceInfoAccounts[ethTokenIndex];
    expect(newPriceTypeMapping).to.equal(new OracleType.Pyth().discriminator);
    expect(newPriceAccountMapping).to.equal('Gnt27xtC473ZT2Mw5u8wZ68Z3gULkSTb5DuxJy7eJotD');
  });

  it('should refresh a price list', async () => {
    const [ixs, signers] = await scope.initialise(env.admin, env.priceFeed);
    await sendAndConfirmTx(env.c, env.admin, ixs, signers);
    const ix = await scope.updateFeedMapping(
      env.admin,
      env.priceFeed,
      ethTokenIndex,
      new OracleType.Pyth(),
      address('Gnt27xtC473ZT2Mw5u8wZ68Z3gULkSTb5DuxJy7eJotD')
    );
    await sendAndConfirmTx(env.c, env.admin, [ix]);
    const originalOraclePrices = await scope.getSingleOraclePrices({ feed: env.priceFeed });
    const originalPrice = originalOraclePrices.prices[ethTokenIndex];
    try {
      const ix = await scope.refreshPriceListIx({ feed: env.priceFeed }, [ethTokenIndex]);
      if (ix) {
        await sendAndConfirmTx(env.c, env.admin, [ix]);
      }
    } catch (e) {
      console.log('Error:', e);
      throw e;
    }
    const newOraclePrices = await scope.getSingleOraclePrices({ feed: env.priceFeed });
    const newPrice = newOraclePrices.prices[ethTokenIndex];
    expect(newPrice.lastUpdatedSlot.toNumber()).gt(originalPrice.lastUpdatedSlot.toNumber());
    expect(newPrice.price.value).not.to.equal(originalPrice.price.value);
  });

  it('should get prices by chain', async () => {
    const oraclePrices = await scope.getSingleOraclePrices({ prices: hubbleOraclePrices });
    // 88 = HNT/USD
    const price = await scope.getPriceFromChain([88, 65_535, 65_535, 65_535], oraclePrices);
    expect(price.price.toNumber()).greaterThan(0);
    expect(price.timestamp.toNumber()).greaterThan(0);
  });

  it('should get prices by chain when multiple steps', async () => {
    const oraclePrices = await scope.getSingleOraclePrices({ prices: hubbleOraclePrices });
    // 88 = HNT/USD
    // 84 = IOT/HNT
    // gives us the price of IOT/USD
    const price = await scope.getPriceFromChain([88, 84, 65_535, 65_535], oraclePrices);
    expect(price.price.toNumber()).gt(0);
    expect(price.timestamp.toNumber()).gt(0);
  });

  it('should throw on default 0 chain', async () => {
    const oraclePrices = await scope.getSingleOraclePrices({ prices: hubbleOraclePrices });
    await expect(scope.getPriceFromChain([0, 0, 0, 0], oraclePrices)).to.be.rejected;
  });

  it('should throw on default u16 chain', async () => {
    const oraclePrices = await scope.getSingleOraclePrices({ prices: hubbleOraclePrices });
    await expect(scope.getPriceFromChain([65_535, 65_535, 65_535, 65_535], oraclePrices)).to.be.rejected;
  });

  it('should verify if scope chain is valid', () => {
    expect(Scope.isScopeChainValid([0, 0, 0, 0])).to.be.false;
    expect(Scope.isScopeChainValid([65_535, 65_535, 65_535, 65_535])).to.be.false;
    expect(Scope.isScopeChainValid([0, 65_535, 65_535, 65_535])).to.be.true;
    expect(Scope.isScopeChainValid([0, 0, 65_535, 65_535])).to.be.true;
    expect(Scope.isScopeChainValid([0, 0, 0, 65_535])).to.be.true;
    expect(Scope.isScopeChainValid([0, 15, 0, 20])).to.be.true;
    expect(Scope.isScopeChainValid([0, 15])).to.be.true;
    expect(Scope.isScopeChainValid([0])).to.be.false;
    expect(Scope.isScopeChainValid([])).to.be.false;
  });

  it('should throw on missing feed', async () => {
    await expect(scope.getSingleOraclePrices({})).to.be.rejected;
  });

  it('should throw on both feed and config supplied', async () => {
    await expect(scope.getSingleOraclePrices({ feed: 'foo', config: address('11111111111111111111111111111111') })).to
      .be.rejected;
  });

  it('should throw on feed, config and prices supplied', async () => {
    await expect(
      scope.getSingleOraclePrices({
        feed: 'foo',
        config: address('11111111111111111111111111111111'),
        prices: address('11111111111111111111111111111111'),
      })
    ).to.be.rejected;
  });

  it('should throw on feed and prices supplied', async () => {
    await expect(scope.getSingleOraclePrices({ feed: 'foo', prices: address('11111111111111111111111111111111') })).to
      .be.rejected;
  });

  it('should throw on feed and prices supplied', async () => {
    await expect(
      scope.getSingleOraclePrices({
        config: address('11111111111111111111111111111111'),
        prices: address('11111111111111111111111111111111'),
      })
    ).to.be.rejected;
  });
});
