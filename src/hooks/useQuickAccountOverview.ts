import { useState, useEffect, useMemo } from 'react';
import { fetchBalance } from '../services/balanceService';
import { fetchTransactions } from '../services/transactionService';
import { useAuth } from '../contexts/AuthContext';
import { useNotify } from '../contexts/NotificationContext';
import type { iAccount, iTransaction, iAccountWithTransactions, iRelinkSignal } from '../types/types';

type tStatus = 'idle' | 'loading' | 'error' | 'success';
type tInternalStatus = 'idle' | 'error' | 'success';

export function useQuickAccountOverview(): {
  status: tStatus;
  accounts: iAccountWithTransactions[];
  relinkRequired: iRelinkSignal[];
  retry: () => void;
  refetchBalance: () => void;
} {
  const { user } = useAuth();
  const { triggerToast } = useNotify();
  const [internalStatus, setInternalStatus] = useState<tInternalStatus>('idle');
  const [rawAccounts, setRawAccounts] = useState<iAccount[]>([]);
  const [rawTransactions, setRawTransactions] = useState<iTransaction[]>([]);
  const [balanceRelinkRequired, setBalanceRelinkRequired] = useState<iRelinkSignal[]>([]);
  const [transactionRelinkRequired, setTransactionRelinkRequired] = useState<iRelinkSignal[]>([]);
  const [fetchCount, setFetchCount] = useState(0);
  const [balanceFetchCount, setBalanceFetchCount] = useState(0);

  // Main effect: both fetches — initial load and retry
  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    Promise.all([fetchBalance(), fetchTransactions(30)])
      .then(([balanceRes, transactionsRes]) => {
        if (cancelled) return;
        setRawAccounts(balanceRes.accounts);
        setRawTransactions(transactionsRes.transactions);
        setBalanceRelinkRequired(balanceRes.relinkRequired);
        setTransactionRelinkRequired(transactionsRes.relinkRequired);
        setInternalStatus('success');
      })
      .catch(() => {
        if (cancelled) return;
        setInternalStatus('error');
        triggerToast({
          severity: 'error',
          summary: 'Error',
          detail: 'There was a problem loading account data, please try again',
        });
      });

    return () => { cancelled = true; };
  }, [user, fetchCount, triggerToast]);

  // Balance-only effect: silent refetch after a name save
  useEffect(() => {
    if (!user || balanceFetchCount === 0) return;

    let cancelled = false;

    fetchBalance()
      .then((res) => {
        if (cancelled) return;
        setRawAccounts(res.accounts);
        setBalanceRelinkRequired(res.relinkRequired);
      })
      .catch(() => {
        if (cancelled) return;
        triggerToast({
          severity: 'error',
          summary: 'Error',
          detail: 'Could not refresh account data, please reload the page',
        });
      });

    return () => { cancelled = true; };
  }, [user, balanceFetchCount, triggerToast]);

  const accounts = useMemo<iAccountWithTransactions[]>(
    () =>
      rawAccounts.map((account) => {
        const txns = rawTransactions
          .filter((t) => t.accountId === account.accountId)
          .sort((a, b) => b.date.localeCompare(a.date));
        const lastDeposit = txns.find((t) => t.amount < 0) ?? null;
        return { ...account, transactions: txns, lastDeposit };
      }),
    [rawAccounts, rawTransactions],
  );

  const relinkRequired = useMemo(
    () => [...balanceRelinkRequired, ...transactionRelinkRequired],
    [balanceRelinkRequired, transactionRelinkRequired],
  );

  function retry() {
    setInternalStatus('idle');
    setFetchCount((c) => c + 1);
  }

  function refetchBalance() {
    setBalanceFetchCount((c) => c + 1);
  }

  // 'idle' with a user means a fetch is in flight — surface it as 'loading'
  const status: tStatus = !user
    ? 'idle'
    : internalStatus === 'idle'
    ? 'loading'
    : internalStatus;

  return { status, accounts, relinkRequired, retry, refetchBalance };
}
