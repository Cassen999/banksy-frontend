import { describe, it, expect, beforeEach } from 'vitest';
import { server } from '../mocks/server';
import { handlers } from '../mocks/handlers';
import { fetchMonthlyGlance } from './monthlyGlanceService';

describe('fetchMonthlyGlance', () => {
  beforeEach(() => {
    server.resetHandlers();
  });

  it('calls /api/monthly-glance and returns dailyTotals', async () => {
    const result = await fetchMonthlyGlance();
    expect(result.dailyTotals).toEqual([
      { transactionDate: '2026-06-01', total: 10.0 },
      { transactionDate: '2026-06-02', total: 25.0 },
      { transactionDate: '2026-06-03', total: 15.0 },
    ]);
  });

  it('returns relinkRequired array', async () => {
    const result = await fetchMonthlyGlance();
    expect(result.relinkRequired).toEqual([]);
  });

  it('throws on 500', async () => {
    server.use(handlers.monthlyGlance.serverError);
    await expect(fetchMonthlyGlance()).rejects.toMatchObject({ status: 500 });
  });
});
