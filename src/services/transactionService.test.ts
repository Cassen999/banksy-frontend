import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';
import { handlers } from '../mocks/handlers';
import { fetchTransactions } from './transactionService';

describe('fetchTransactions', () => {
  it('returns transactions response on success', async () => {
    const result = await fetchTransactions(30);
    expect(result.transactions).toHaveLength(3);
    expect(result.total).toBe(3);
    expect(result.transactions[0].accountId).toBe('plaid-account-id-1');
    expect(result.transactions[0].isoCurrencyCode).toBe('USD');
    expect(result.relinkRequired).toEqual([]);
  });

  it('passes the days query param', async () => {
    let capturedUrl: string | undefined;
    server.use(
      http.get('http://localhost:8080/api/transactions', ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json({ transactions: [], total: 0, relinkRequired: [] });
      }),
    );
    await fetchTransactions(7);
    expect(capturedUrl).toContain('days=7');
  });

  it('omits the days param when not provided', async () => {
    let capturedUrl: string | undefined;
    server.use(
      http.get('http://localhost:8080/api/transactions', ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json({ transactions: [], total: 0, relinkRequired: [] });
      }),
    );
    await fetchTransactions();
    expect(capturedUrl).not.toContain('days=');
  });

  it('throws on 500', async () => {
    server.use(handlers.transactions.serverError);
    await expect(fetchTransactions(30)).rejects.toMatchObject({ status: 500 });
  });
});
