import { apiClient } from '../api/client';
import type { iPlaidLinkTokenResponse, iPlaidExchangeRequest, iPlaidExchangeResponse, iSetAccountNameRequest } from '../types/types';

export async function fetchLinkToken(): Promise<iPlaidLinkTokenResponse> {
  const response = await apiClient.get<iPlaidLinkTokenResponse>('/api/plaid/link-token');
  return response.data;
}

export async function exchangePublicToken(body: iPlaidExchangeRequest): Promise<iPlaidExchangeResponse> {
  const response = await apiClient.post<iPlaidExchangeResponse>('/api/plaid/exchange', body);
  return response.data;
}

export async function setAccountName(plaidAccountId: string, customName: string): Promise<void> {
  const body: iSetAccountNameRequest = { customName };
  await apiClient.put(`/api/plaid/account/${plaidAccountId}/name`, body);
}
