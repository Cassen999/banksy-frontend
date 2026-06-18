import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { createElement } from 'react';
import { NotificationProvider } from '../contexts/NotificationContext';

const mockFetchScheduledDeposits = vi.fn();
vi.mock('../services/scheduledDepositsService', () => ({
  fetchScheduledDeposits: () => mockFetchScheduledDeposits(),
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

const activeDeposit = {
  merchantName: 'Employer Inc',
  description: 'DIRECT DEPOSIT',
  frequency: 'BIWEEKLY',
  firstDate: '2025-01-03',
  lastDate: '2026-06-01',
  predictedNextDate: '2026-06-20',
  averageAmount: { amount: 2500.00, isoCurrencyCode: 'USD' },
  lastAmount: { amount: 2500.00, isoCurrencyCode: 'USD' },
  isActive: true,
  personalFinanceCategory: null,
  status: 'MATURE',
};

const inactiveDeposit = { ...activeDeposit, isActive: false, predictedNextDate: '2026-06-15' };

function wrapper({ children }: { children: ReactNode }) {
  return createElement(NotificationProvider, null, children);
}

import { useScheduledDeposits } from './useScheduledDeposits';

describe('useScheduledDeposits', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({ user: mockUser, isLoading: false });
    mockFetchScheduledDeposits.mockResolvedValue([activeDeposit]);
  });

  it('does not fetch when user is null', () => {
    mockUseAuth.mockReturnValue({ user: null, isLoading: false });
    renderHook(() => useScheduledDeposits(), { wrapper });
    expect(mockFetchScheduledDeposits).not.toHaveBeenCalled();
  });

  it('does not fetch while auth is loading', () => {
    mockUseAuth.mockReturnValue({ user: null, isLoading: true });
    renderHook(() => useScheduledDeposits(), { wrapper });
    expect(mockFetchScheduledDeposits).not.toHaveBeenCalled();
  });

  it('status is loading on mount when user is set', () => {
    mockFetchScheduledDeposits.mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useScheduledDeposits(), { wrapper });
    expect(result.current.status).toBe('loading');
  });

  it('status is success on 200', async () => {
    const { result } = renderHook(() => useScheduledDeposits(), { wrapper });
    await waitFor(() => expect(result.current.status).toBe('success'));
  });

  it('filters out isActive: false items', async () => {
    mockFetchScheduledDeposits.mockResolvedValue([activeDeposit, inactiveDeposit]);
    const { result } = renderHook(() => useScheduledDeposits(), { wrapper });
    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(result.current.deposits).toHaveLength(1);
    expect(result.current.deposits[0].isActive).toBe(true);
  });

  it('status is error on fetch failure', async () => {
    mockFetchScheduledDeposits.mockRejectedValue(new Error('Network error'));
    const { result } = renderHook(() => useScheduledDeposits(), { wrapper });
    await waitFor(() => expect(result.current.status).toBe('error'));
  });

  it('triggers error toast on failure', async () => {
    mockFetchScheduledDeposits.mockRejectedValue(new Error('Network error'));
    renderHook(() => useScheduledDeposits(), { wrapper });
    await waitFor(() => expect(mockTriggerToast).toHaveBeenCalledWith({
      severity: 'error',
      summary: 'Error',
      detail: 'There was a problem loading scheduled deposits, please try again',
    }));
  });

  it('retry() triggers a re-fetch', async () => {
    const { result } = renderHook(() => useScheduledDeposits(), { wrapper });
    await waitFor(() => expect(result.current.status).toBe('success'));
    act(() => { result.current.retry(); });
    await waitFor(() => expect(mockFetchScheduledDeposits).toHaveBeenCalledTimes(2));
  });

  it('status resets to loading when retry() is called from error state', async () => {
    mockFetchScheduledDeposits.mockRejectedValue(new Error('fail'));
    const { result } = renderHook(() => useScheduledDeposits(), { wrapper });
    await waitFor(() => expect(result.current.status).toBe('error'));
    mockFetchScheduledDeposits.mockReturnValue(new Promise(() => {}));
    act(() => { result.current.retry(); });
    expect(result.current.status).toBe('loading');
  });
});
