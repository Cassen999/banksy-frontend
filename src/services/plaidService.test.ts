import { describe, it, expect, beforeEach } from 'vitest';
import { server } from '../mocks/server';
import { handlers } from '../mocks/handlers';
import { fetchLinkToken, exchangePublicToken } from './plaidService';

describe('fetchLinkToken', () => {
  it('returns link_token on 200', async () => {
    const result = await fetchLinkToken();
    expect(result).toEqual({ link_token: 'link-sandbox-test-token' });
  });

  it('throws on 500', async () => {
    server.use(handlers.plaid.linkToken.serverError);
    await expect(fetchLinkToken()).rejects.toMatchObject({ status: 500 });
  });
});

describe('exchangePublicToken', () => {
  const payload = {
    publicToken: 'public-token-abc',
    institutionId: 'ins_123',
    institutionName: 'Test Bank',
    expiredItemId: null,
  };

  it('returns status and message on 200', async () => {
    const result = await exchangePublicToken(payload);
    expect(result).toEqual({ status: 'ok', message: 'Plaid authentication successful' });
  });

  it('sends correct request body', async () => {
    let capturedBody: unknown;
    server.use(
      handlers.plaid.exchange.success,
    );
    // Capture body via a one-time override
    const { http, HttpResponse } = await import('msw');
    server.use(
      http.post('http://localhost:8080/api/plaid/exchange', async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json({ status: 'ok', message: 'Plaid authentication successful' });
      }),
    );
    await exchangePublicToken(payload);
    expect(capturedBody).toEqual(payload);
  });

  it('throws on 500', async () => {
    server.use(handlers.plaid.exchange.serverError);
    await expect(exchangePublicToken(payload)).rejects.toMatchObject({ status: 500 });
  });

  beforeEach(() => {
    server.resetHandlers();
  });
});
