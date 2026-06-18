import { describe, it, expect, beforeEach } from 'vitest';
import { server } from '../mocks/server';
import { handlers } from '../mocks/handlers';
import { fetchScheduledDeposits } from './scheduledDepositsService';

describe('fetchScheduledDeposits', () => {
  beforeEach(() => {
    server.resetHandlers();
  });

  it('calls /api/recurring/scheduled-deposits and returns data', async () => {
    const result = await fetchScheduledDeposits();
    expect(result).toHaveLength(3);
    expect(result[0].merchantName).toBe('Acme Corp');
    expect(result.every((d) => d.isActive)).toBe(true);
  });

  it('throws on 403', async () => {
    server.use(handlers.scheduledDeposits.serverError);
    await expect(fetchScheduledDeposits()).rejects.toMatchObject({ status: 403 });
  });
});
