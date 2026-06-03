import { apiClient } from '../api/client';
import type { iUser } from '../types/types';

export async function fetchMe(): Promise<iUser> {
  const response = await apiClient.get<iUser>('/api/auth/me');
  return response.data;
}
