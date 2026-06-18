import { useState, useEffect } from 'react';
import { fetchScheduledDeposits } from '../services/scheduledDepositsService';
import { useAuth } from '../contexts/AuthContext';
import { useNotify } from '../contexts/NotificationContext';
import type { iScheduledDeposit } from '../types/types';

type tStatus = 'idle' | 'loading' | 'error' | 'success';
type tInternalStatus = 'idle' | 'error' | 'success';

export function useScheduledDeposits(): {
  status: tStatus;
  deposits: iScheduledDeposit[];
  retry: () => void;
} {
  const { user } = useAuth();
  const { triggerToast } = useNotify();
  const [internalStatus, setInternalStatus] = useState<tInternalStatus>('idle');
  const [deposits, setDeposits] = useState<iScheduledDeposit[]>([]);
  const [fetchCount, setFetchCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    fetchScheduledDeposits()
      .then((response) => {
        if (cancelled) return;
        setDeposits(response.filter((d) => d.isActive));
        setInternalStatus('success');
      })
      .catch(() => {
        if (cancelled) return;
        setInternalStatus('error');
        triggerToast({
          severity: 'error',
          summary: 'Error',
          detail: 'There was a problem loading scheduled deposits, please try again',
        });
      });

    return () => { cancelled = true; };
  }, [user, fetchCount, triggerToast]);

  function retry() {
    setInternalStatus('idle');
    setFetchCount((c) => c + 1);
  }

  // 'idle' with a user means a fetch is in flight — surface it as 'loading'
  const status: tStatus = !user
    ? 'idle'
    : internalStatus === 'idle'
    ? 'loading'
    : internalStatus;

  return { status, deposits, retry };
}
