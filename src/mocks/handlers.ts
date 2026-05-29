import { http, HttpResponse } from 'msw';

const API = 'http://localhost:8080';

// --- Fixture data ---

const mockUser = {
  id: 'user-uuid-1',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  username: 'testuser',
};

const mockAccount = {
  name: 'Plaid Checking',
  type: 'depository',
  subtype: 'checking',
  currentBalance: 1234.56,
  availableBalance: 1100.0,
  currency: 'USD',
};

const mockTransaction = {
  date: '2025-05-01',
  name: 'Coffee Shop',
  amount: 4.5,
  currency: 'USD',
  category: ['Food and Drink', 'Coffee Shop'],
};

const mockRelinkSignal = {
  plaidItemId: 'item-uuid-1',
  institutionName: 'Chase',
  errorType: 'LOGIN_REQUIRED' as const,
  canRelink: true,
  ownerName: null,
  message: 'Your Chase connection needs to be reconnected.',
};

// --- Auth handlers ---

const auth = {
  me: {
    success: http.get(`${API}/api/auth/me`, () => HttpResponse.json(mockUser)),
    unauthorized: http.get(`${API}/api/auth/me`, () =>
      new HttpResponse(null, { status: 401 }),
    ),
    serverError: http.get(`${API}/api/auth/me`, () =>
      new HttpResponse(null, { status: 500 }),
    ),
  },
  logout: {
    success: http.post(`${API}/api/auth/logout`, () =>
      HttpResponse.json({ loggedOut: true }),
    ),
  },
};

// --- Balance handlers ---

const balance = {
  success: http.get(`${API}/api/balance`, () =>
    HttpResponse.json({ accounts: [mockAccount], relinkRequired: [] }),
  ),
  withRelinkRequired: http.get(`${API}/api/balance`, () =>
    HttpResponse.json({ accounts: [], relinkRequired: [mockRelinkSignal] }),
  ),
  unauthorized: http.get(`${API}/api/balance`, () =>
    new HttpResponse(null, { status: 401 }),
  ),
  serverError: http.get(`${API}/api/balance`, () =>
    new HttpResponse(null, { status: 500 }),
  ),
};

// --- Transactions handlers ---

const transactions = {
  success: http.get(`${API}/api/transactions`, () =>
    HttpResponse.json({ transactions: [mockTransaction], total: 1, relinkRequired: [] }),
  ),
  withRelinkRequired: http.get(`${API}/api/transactions`, () =>
    HttpResponse.json({ transactions: [], total: 0, relinkRequired: [mockRelinkSignal] }),
  ),
  empty: http.get(`${API}/api/transactions`, () =>
    HttpResponse.json({ transactions: [], total: 0, relinkRequired: [] }),
  ),
  unauthorized: http.get(`${API}/api/transactions`, () =>
    new HttpResponse(null, { status: 401 }),
  ),
  serverError: http.get(`${API}/api/transactions`, () =>
    new HttpResponse(null, { status: 500 }),
  ),
};

// --- Plaid handlers ---

const plaid = {
  status: {
    healthy: http.get(`${API}/api/plaid/status`, () =>
      HttpResponse.json({ relinkRequired: [] }),
    ),
    withRelinkRequired: http.get(`${API}/api/plaid/status`, () =>
      HttpResponse.json({ relinkRequired: [mockRelinkSignal] }),
    ),
    serverError: http.get(`${API}/api/plaid/status`, () =>
      new HttpResponse(null, { status: 500 }),
    ),
  },
  linkToken: {
    success: http.get(`${API}/api/plaid/link-token`, () =>
      HttpResponse.json({ link_token: 'link-sandbox-test-token' }),
    ),
    serverError: http.get(`${API}/api/plaid/link-token`, () =>
      new HttpResponse(null, { status: 500 }),
    ),
  },
  refreshLinkToken: {
    success: http.get(`${API}/api/plaid/link-token/refresh/:itemId`, () =>
      HttpResponse.json({ link_token: 'link-sandbox-refresh-token' }),
    ),
    forbidden: http.get(`${API}/api/plaid/link-token/refresh/:itemId`, () =>
      HttpResponse.json({ error: 'Only the bank owner can relink.' }, { status: 403 }),
    ),
    serverError: http.get(`${API}/api/plaid/link-token/refresh/:itemId`, () =>
      HttpResponse.json({ error: 'Internal server error' }, { status: 500 }),
    ),
  },
  fullRelinkToken: {
    success: http.get(`${API}/api/plaid/link-token/full-relink/:itemId`, () =>
      HttpResponse.json({ link_token: 'link-sandbox-relink-token' }),
    ),
    forbidden: http.get(`${API}/api/plaid/link-token/full-relink/:itemId`, () =>
      HttpResponse.json({ error: 'Only the bank owner can relink.' }, { status: 403 }),
    ),
    serverError: http.get(`${API}/api/plaid/link-token/full-relink/:itemId`, () =>
      HttpResponse.json({ error: 'Internal server error' }, { status: 500 }),
    ),
  },
  exchange: {
    success: http.post(`${API}/api/plaid/exchange`, () =>
      HttpResponse.json({ status: 'ok', message: 'Plaid authentication successful' }),
    ),
    serverError: http.post(`${API}/api/plaid/exchange`, () =>
      new HttpResponse(null, { status: 500 }),
    ),
  },
  share: {
    success: http.post(`${API}/api/plaid/share`, () =>
      HttpResponse.json({ status: 'ok' }),
    ),
    badRequest: http.post(`${API}/api/plaid/share`, () =>
      HttpResponse.json({ error: 'User not found.' }, { status: 400 }),
    ),
    forbidden: http.post(`${API}/api/plaid/share`, () =>
      HttpResponse.json({ error: 'Only the bank owner can share.' }, { status: 403 }),
    ),
  },
  hideAccount: {
    success: http.put(`${API}/api/plaid/account/:plaidAccountId/hide`, () =>
      HttpResponse.json({ status: 'ok' }),
    ),
    forbidden: http.put(`${API}/api/plaid/account/:plaidAccountId/hide`, () =>
      HttpResponse.json({ error: 'Forbidden' }, { status: 403 }),
    ),
    serverError: http.put(`${API}/api/plaid/account/:plaidAccountId/hide`, () =>
      HttpResponse.json({ error: 'Internal server error' }, { status: 500 }),
    ),
  },
  removeItem: {
    success: http.delete(`${API}/api/plaid/item/:plaidItemId`, () =>
      HttpResponse.json({ status: 'ok' }),
    ),
    forbidden: http.delete(`${API}/api/plaid/item/:plaidItemId`, () =>
      HttpResponse.json({ error: 'Forbidden' }, { status: 403 }),
    ),
    serverError: http.delete(`${API}/api/plaid/item/:plaidItemId`, () =>
      HttpResponse.json({ error: 'Internal server error' }, { status: 500 }),
    ),
  },
};

export const handlers = { auth, balance, transactions, plaid };

// Default handlers used by the MSW server — all happy-path success cases
export const defaultHandlers = [
  handlers.auth.me.success,
  handlers.auth.logout.success,
  handlers.balance.success,
  handlers.transactions.success,
  handlers.plaid.status.healthy,
  handlers.plaid.linkToken.success,
  handlers.plaid.refreshLinkToken.success,
  handlers.plaid.fullRelinkToken.success,
  handlers.plaid.exchange.success,
  handlers.plaid.share.success,
  handlers.plaid.hideAccount.success,
  handlers.plaid.removeItem.success,
];
