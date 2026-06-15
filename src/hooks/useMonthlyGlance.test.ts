import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { createElement } from 'react';
import { NotificationProvider } from '../contexts/NotificationContext';

const mockFetchMonthlyGlance = vi.fn();
vi.mock('../services/monthlyGlanceService', () => ({
  fetchMonthlyGlance: () => mockFetchMonthlyGlance(),
}));

const mockTriggerToast = vi.fn();
vi.mock('../contexts/NotificationContext', () => ({
  NotificationProvider: ({ children }: { children: ReactNode }) => children,
  useNotify: () => ({ triggerToast: mockTriggerToast }),
}));

const mockUseAuth = vi.fn();
vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

const mockUser = { id: 'user-1', email: 'test@example.com', firstName: 'Test', lastName: 'User', username: 'testuser' };

const mockDailyTotals = [
  { transactionDate: '2026-06-01', total: 1 },
  { transactionDate: '2026-06-02', total: 2 },
  { transactionDate: '2026-06-03', total: 3 },
];

function wrapper({ children }: { children: ReactNode }) {
  return createElement(NotificationProvider, null, children);
}

import { useMonthlyGlance } from './useMonthlyGlance';

describe('useMonthlyGlance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({ user: mockUser, isLoading: false });
    mockFetchMonthlyGlance.mockResolvedValue({ dailyTotals: mockDailyTotals, relinkRequired: [] });
  });

  it('does not fetch when user is null', () => {
    mockUseAuth.mockReturnValue({ user: null, isLoading: false });
    renderHook(() => useMonthlyGlance(), { wrapper });
    expect(mockFetchMonthlyGlance).not.toHaveBeenCalled();
  });

  it('does not fetch while auth is loading', () => {
    mockUseAuth.mockReturnValue({ user: null, isLoading: true });
    renderHook(() => useMonthlyGlance(), { wrapper });
    expect(mockFetchMonthlyGlance).not.toHaveBeenCalled();
  });

  it('sets status to loading on mount when user is set', () => {
    mockFetchMonthlyGlance.mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useMonthlyGlance(), { wrapper });
    expect(result.current.status).toBe('loading');
  });

  it('sets status to success on 200', async () => {
    const { result } = renderHook(() => useMonthlyGlance(), { wrapper });
    await waitFor(() => expect(result.current.status).toBe('success'));
  });

  it('transforms dailyTotals to cumulative values', async () => {
    const { result } = renderHook(() => useMonthlyGlance(), { wrapper });
    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(result.current.data[0].cumulative).toBe(1);
    expect(result.current.data[1].cumulative).toBe(3);
    expect(result.current.data[2].cumulative).toBe(6);
  });

  it('preserves daily value on each data point', async () => {
    const { result } = renderHook(() => useMonthlyGlance(), { wrapper });
    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(result.current.data[1].daily).toBe(2);
  });

  it('preserves date on each data point', async () => {
    const { result } = renderHook(() => useMonthlyGlance(), { wrapper });
    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(result.current.data[0].date).toBe('2026-06-01');
  });

  it('sets status to error on fetch failure', async () => {
    mockFetchMonthlyGlance.mockRejectedValue(new Error('Network error'));
    const { result } = renderHook(() => useMonthlyGlance(), { wrapper });
    await waitFor(() => expect(result.current.status).toBe('error'));
  });

  it('triggers error toast on failure', async () => {
    mockFetchMonthlyGlance.mockRejectedValue(new Error('Network error'));
    renderHook(() => useMonthlyGlance(), { wrapper });
    await waitFor(() => expect(mockTriggerToast).toHaveBeenCalledWith({
      severity: 'error',
      summary: 'Error',
      detail: 'There was a problem loading the Monthly Glance, please try again',
    }));
  });

  it('retry() triggers a re-fetch', async () => {
    const { result } = renderHook(() => useMonthlyGlance(), { wrapper });
    await waitFor(() => expect(result.current.status).toBe('success'));
    act(() => { result.current.retry(); });
    await waitFor(() => expect(mockFetchMonthlyGlance).toHaveBeenCalledTimes(2));
  });

  it('status resets to loading when retry() is called from error state', async () => {
    mockFetchMonthlyGlance.mockRejectedValue(new Error('fail'));
    const { result } = renderHook(() => useMonthlyGlance(), { wrapper });
    await waitFor(() => expect(result.current.status).toBe('error'));
    mockFetchMonthlyGlance.mockReturnValue(new Promise(() => {}));
    act(() => { result.current.retry(); });
    expect(result.current.status).toBe('loading');
  });
});
