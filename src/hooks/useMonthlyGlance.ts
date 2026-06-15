import { useState, useEffect } from 'react';
import { fetchMonthlyGlance } from '../services/monthlyGlanceService';
import { useAuth } from '../contexts/AuthContext';
import { useNotify } from '../contexts/NotificationContext';
import type { iMonthlyGlanceDailyTotal, iMonthlyGlanceDataPoint } from '../types/types';

type tStatus = 'idle' | 'loading' | 'error' | 'success';
type tInternalStatus = 'idle' | 'error' | 'success';

function toCumulative(dailyTotals: iMonthlyGlanceDailyTotal[]): iMonthlyGlanceDataPoint[] {
  let running = 0;
  return dailyTotals.map(({ transactionDate, total }) => {
    running += total;
    return { date: transactionDate, cumulative: running, daily: total };
  });
}

export function useMonthlyGlance(): {
  status: tStatus;
  data: iMonthlyGlanceDataPoint[];
  retry: () => void;
} {
  const { user } = useAuth();
  const { triggerToast } = useNotify();
  const [internalStatus, setInternalStatus] = useState<tInternalStatus>('idle');
  const [data, setData] = useState<iMonthlyGlanceDataPoint[]>([]);
  const [fetchCount, setFetchCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    fetchMonthlyGlance()
      .then((response) => {
        if (cancelled) return;
        setData(toCumulative(response.dailyTotals));
        setInternalStatus('success');
      })
      .catch(() => {
        if (cancelled) return;
        setInternalStatus('error');
        triggerToast({
          severity: 'error',
          summary: 'Error',
          detail: 'There was a problem loading the Monthly Glance, please try again',
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

  return { status, data, retry };
}
