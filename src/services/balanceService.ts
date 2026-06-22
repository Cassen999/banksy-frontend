import { apiClient } from '../api/client';
import type { iBalanceResponse } from '../types/types';

export async function fetchBalance(): Promise<iBalanceResponse> {
  const response = await apiClient.get<iBalanceResponse>('/api/balance');
  return response.data;
}
