import { describe, it, expect, beforeEach } from 'vitest';
import { server } from '../mocks/server';
import { handlers } from '../mocks/handlers';
import { fetchLinkToken, exchangePublicToken, setAccountName } from './plaidService';

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

describe('setAccountName', () => {
  it('resolves on 200', async () => {
    const result = await setAccountName('plaid-account-id-1', 'My Checking');
    expect(result).toBeUndefined();
  });

  it('throws with status 404 on not found', async () => {
    server.use(handlers.plaid.setAccountName.notFound);
    await expect(setAccountName('plaid-account-id-1', 'My Checking')).rejects.toMatchObject({ status: 404 });
  });

  it('throws with status 403 on forbidden', async () => {
    server.use(handlers.plaid.setAccountName.forbidden);
    await expect(setAccountName('plaid-account-id-1', 'My Checking')).rejects.toMatchObject({ status: 403 });
  });

  it('throws with status 500 on server error', async () => {
    server.use(handlers.plaid.setAccountName.serverError);
    await expect(setAccountName('plaid-account-id-1', 'My Checking')).rejects.toMatchObject({ status: 500 });
  });
});
