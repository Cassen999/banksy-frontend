import { describe, it, expect } from 'vitest';
import { apiClient } from './client';

describe('apiClient', () => {
  it('should_haveWithCredentials_setToTrue', () => {
    expect(apiClient.defaults.withCredentials).toBe(true);
  });

  it('should_useViteApiBaseUrl_asBaseURL', () => {
    expect(apiClient.defaults.baseURL).toBe(import.meta.env.VITE_API_BASE_URL);
  });
});
