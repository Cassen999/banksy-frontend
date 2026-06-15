import { apiClient } from '../api/client';
import type { iMonthlyGlanceResponse } from '../types/types';

export async function fetchMonthlyGlance(): Promise<iMonthlyGlanceResponse> {
  const response = await apiClient.get<iMonthlyGlanceResponse>('/api/monthly-glance');
  return response.data;
}
