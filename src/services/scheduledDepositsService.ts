import { apiClient } from '../api/client';
import type { iScheduledDeposit } from '../types/types';

export async function fetchScheduledDeposits(): Promise<iScheduledDeposit[]> {
  const response = await apiClient.get<iScheduledDeposit[]>('/api/recurring/scheduled-deposits');
  return response.data;
}
