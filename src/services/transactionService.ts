import { apiClient } from '../api/client';
import type { iTransactionsResponse } from '../types/types';

export async function fetchTransactions(days?: number): Promise<iTransactionsResponse> {
  const response = await apiClient.get<iTransactionsResponse>('/api/transactions', {
    params: days !== undefined ? { days } : undefined,
  });
  return response.data;
}
