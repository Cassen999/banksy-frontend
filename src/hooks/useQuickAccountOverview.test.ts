import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useQuickAccountOverview } from './useQuickAccountOverview';
import type { iAccount, iTransaction } from '../types/types';

vi.mock('../services/balanceService', () => ({ fetchBalance: vi.fn() }));
vi.mock('../services/transactionService', () => ({ fetchTransactions: vi.fn() }));
vi.mock('../contexts/AuthContext', () => ({ useAuth: vi.fn() }));
vi.mock('../contexts/NotificationContext', () => ({ useNotify: vi.fn() }));

import { fetchBalance } from '../services/balanceService';
import { fetchTransactions } from '../services/transactionService';
import { useAuth } from '../contexts/AuthContext';
import { useNotify } from '../contexts/NotificationContext';

const mockFetchBalance = vi.mocked(fetchBalance);
const mockFetchTransactions = vi.mocked(fetchTransactions);
const mockUseAuth = vi.mocked(useAuth);
const mockUseNotify = vi.mocked(useNotify);

const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  username: 'testuser',
};

const mockAccounts: iAccount[] = [
  {
    accountId: 'plaid-account-id-1',
    name: 'Checking',
    type: 'depository',
    subtype: 'checking',
    currentBalance: 1234.56,
    availableBalance: 1100.0,
    isoCurrencyCode: 'USD',
    institutionName: 'Chase',
    customName: null,
  },
  {
    accountId: 'plaid-account-id-2',
    name: 'Savings',
    type: 'depository',
    subtype: 'savings',
    currentBalance: 5678.9,
    availableBalance: 5678.9,
    isoCurrencyCode: 'USD',
    institutionName: 'Bank of America',
    customName: null,
  },
];

const mockTransactions: iTransaction[] = [
  {
    accountId: 'plaid-account-id-1',
    date: '2026-06-10',
    name: 'Coffee Shop',
    amount: 5.75,
    isoCurrencyCode: 'USD',
    category: [],
  },
  {
    accountId: 'plaid-account-id-1',
    date: '2026-06-05',
    name: 'Paycheck',
    amount: -2500.0,
    isoCurrencyCode: 'USD',
    category: [],
  },
  {
    accountId: 'plaid-account-id-2',
    date: '2026-06-08',
    name: 'Netflix',
    amount: 15.49,
    isoCurrencyCode: 'USD',
    category: [],
  },
];

const mockTriggerToast = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  mockUseAuth.mockReturnValue({ user: mockUser, isLoading: false, clearUser: vi.fn() });
  mockUseNotify.mockReturnValue({ triggerToast: mockTriggerToast } as ReturnType<typeof useNotify>);
  mockFetchBalance.mockResolvedValue({ accounts: mockAccounts, relinkRequired: [] });
  mockFetchTransactions.mockResolvedValue({ transactions: mockTransactions, total: 3, relinkRequired: [] });
});

describe('useQuickAccountOverview', () => {
  describe('when user is null', () => {
    it('returns status idle', () => {
      mockUseAuth.mockReturnValue({ user: null, isLoading: false, clearUser: vi.fn() });
      const { result } = renderHook(() => useQuickAccountOverview());
      expect(result.current.status).toBe('idle');
    });

    it('does not call fetchBalance or fetchTransactions', () => {
      mockUseAuth.mockReturnValue({ user: null, isLoading: false, clearUser: vi.fn() });
      renderHook(() => useQuickAccountOverview());
      expect(mockFetchBalance).not.toHaveBeenCalled();
      expect(mockFetchTransactions).not.toHaveBeenCalled();
    });
  });

  describe('initial load', () => {
    it('returns status loading while fetches are in flight', () => {
      mockFetchBalance.mockReturnValue(new Promise(() => {}));
      const { result } = renderHook(() => useQuickAccountOverview());
      expect(result.current.status).toBe('loading');
    });

    it('returns status success when both fetches resolve', async () => {
      const { result } = renderHook(() => useQuickAccountOverview());
      await waitFor(() => expect(result.current.status).toBe('success'));
    });

    it('groups transactions by accountId', async () => {
      const { result } = renderHook(() => useQuickAccountOverview());
      await waitFor(() => expect(result.current.status).toBe('success'));

      const acct1 = result.current.accounts.find((a) => a.accountId === 'plaid-account-id-1');
      const acct2 = result.current.accounts.find((a) => a.accountId === 'plaid-account-id-2');
      expect(acct1?.transactions).toHaveLength(2);
      expect(acct2?.transactions).toHaveLength(1);
    });

    it('sorts transactions date descending within each account', async () => {
      const { result } = renderHook(() => useQuickAccountOverview());
      await waitFor(() => expect(result.current.status).toBe('success'));

      const acct1 = result.current.accounts.find((a) => a.accountId === 'plaid-account-id-1');
      expect(acct1?.transactions[0].date).toBe('2026-06-10');
      expect(acct1?.transactions[1].date).toBe('2026-06-05');
    });

    it('sets lastDeposit to the most recent transaction where amount < 0', async () => {
      const { result } = renderHook(() => useQuickAccountOverview());
      await waitFor(() => expect(result.current.status).toBe('success'));

      const acct1 = result.current.accounts.find((a) => a.accountId === 'plaid-account-id-1');
      expect(acct1?.lastDeposit?.name).toBe('Paycheck');
      expect(acct1?.lastDeposit?.amount).toBe(-2500.0);
    });

    it('sets lastDeposit to null when no negative-amount transaction exists', async () => {
      const { result } = renderHook(() => useQuickAccountOverview());
      await waitFor(() => expect(result.current.status).toBe('success'));

      const acct2 = result.current.accounts.find((a) => a.accountId === 'plaid-account-id-2');
      expect(acct2?.lastDeposit).toBeNull();
    });

    it('unions relinkRequired from both responses', async () => {
      const balanceSignal = { plaidItemId: 'item-1', institutionName: 'Chase', errorType: 'LOGIN_REQUIRED' as const, canRelink: true, ownerName: null, message: 'Reconnect Chase' };
      const txnSignal = { plaidItemId: 'item-2', institutionName: 'BoA', errorType: 'INVALID_TOKEN' as const, canRelink: true, ownerName: null, message: 'Reconnect BoA' };
      mockFetchBalance.mockResolvedValue({ accounts: mockAccounts, relinkRequired: [balanceSignal] });
      mockFetchTransactions.mockResolvedValue({ transactions: mockTransactions, total: 3, relinkRequired: [txnSignal] });

      const { result } = renderHook(() => useQuickAccountOverview());
      await waitFor(() => expect(result.current.status).toBe('success'));
      expect(result.current.relinkRequired).toHaveLength(2);
    });
  });

  describe('error handling', () => {
    it('returns status error when fetchBalance rejects', async () => {
      mockFetchBalance.mockRejectedValue({ status: 500 });
      const { result } = renderHook(() => useQuickAccountOverview());
      await waitFor(() => expect(result.current.status).toBe('error'));
    });

    it('returns status error when fetchTransactions rejects', async () => {
      mockFetchTransactions.mockRejectedValue({ status: 500 });
      const { result } = renderHook(() => useQuickAccountOverview());
      await waitFor(() => expect(result.current.status).toBe('error'));
    });

    it('fires triggerToast with severity error on failure', async () => {
      mockFetchBalance.mockRejectedValue({ status: 500 });
      renderHook(() => useQuickAccountOverview());
      await waitFor(() =>
        expect(mockTriggerToast).toHaveBeenCalledWith(
          expect.objectContaining({ severity: 'error' }),
        ),
      );
    });
  });

  describe('retry', () => {
    it('resets to loading and re-fetches both after error', async () => {
      mockFetchBalance.mockRejectedValueOnce({ status: 500 });
      const { result } = renderHook(() => useQuickAccountOverview());
      await waitFor(() => expect(result.current.status).toBe('error'));

      act(() => { result.current.retry(); });
      await waitFor(() => expect(result.current.status).toBe('success'));
      expect(mockFetchBalance).toHaveBeenCalledTimes(2);
      expect(mockFetchTransactions).toHaveBeenCalledTimes(2);
    });
  });

  describe('refetchBalance', () => {
    it('calls fetchBalance again without changing status', async () => {
      const { result } = renderHook(() => useQuickAccountOverview());
      await waitFor(() => expect(result.current.status).toBe('success'));

      const updatedAccounts: iAccount[] = [
        { ...mockAccounts[0], customName: 'My Checking' },
        mockAccounts[1],
      ];
      mockFetchBalance.mockResolvedValueOnce({ accounts: updatedAccounts, relinkRequired: [] });

      act(() => { result.current.refetchBalance(); });

      expect(result.current.status).toBe('success');

      await waitFor(() =>
        expect(result.current.accounts[0].customName).toBe('My Checking'),
      );
    });

    it('fires triggerToast on error during refetchBalance', async () => {
      const { result } = renderHook(() => useQuickAccountOverview());
      await waitFor(() => expect(result.current.status).toBe('success'));

      mockFetchBalance.mockRejectedValueOnce({ status: 500 });
      act(() => { result.current.refetchBalance(); });

      await waitFor(() => expect(mockTriggerToast).toHaveBeenCalledTimes(1));
      expect(mockTriggerToast).toHaveBeenCalledWith(
        expect.objectContaining({ severity: 'error' }),
      );
    });
  });

  describe('cleanup', () => {
    it('does not update state after unmount', async () => {
      let resolveFetch!: (value: ReturnType<typeof fetchBalance> extends Promise<infer T> ? T : never) => void;
      mockFetchBalance.mockReturnValue(
        new Promise((resolve) => { resolveFetch = resolve; }),
      );

      const { unmount } = renderHook(() => useQuickAccountOverview());
      unmount();

      // Resolving after unmount should not cause state update errors
      act(() => {
        resolveFetch({ accounts: mockAccounts, relinkRequired: [] });
      });
    });
  });
});
