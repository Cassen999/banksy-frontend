import { describe, it, expect } from 'vitest';
import { server } from '../mocks/server';
import { handlers } from '../mocks/handlers';
import { fetchBalance } from './balanceService';

describe('fetchBalance', () => {
  it('returns balance response on success', async () => {
    const result = await fetchBalance();
    expect(result.accounts).toHaveLength(2);
    expect(result.accounts[0].accountId).toBe('plaid-account-id-1');
    expect(result.accounts[0].institutionName).toBe('Chase');
    expect(result.accounts[0].isoCurrencyCode).toBe('USD');
    expect(result.relinkRequired).toEqual([]);
  });

  it('throws on 500', async () => {
    server.use(handlers.balance.serverError);
    await expect(fetchBalance()).rejects.toMatchObject({ status: 500 });
  });

  it('throws on 401', async () => {
    server.use(handlers.balance.unauthorized);
    await expect(fetchBalance()).rejects.toMatchObject({ status: 401 });
  });
});
