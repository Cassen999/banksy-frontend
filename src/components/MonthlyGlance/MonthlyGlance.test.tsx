import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('chart.js', () => ({
  Chart: { register: vi.fn() },
  CategoryScale: class {},
  LinearScale: class {},
  PointElement: class {},
  LineElement: class {},
  Title: class {},
  Tooltip: class {},
  Filler: class {},
}));
vi.mock('react-chartjs-2', () => ({
  Line: () => <canvas data-testid="monthly-glance-chart" />,
}));

const mockUseAuth = vi.fn();
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('../../contexts/NotificationContext', () => ({
  useNotify: () => ({ triggerToast: vi.fn() }),
}));

const mockRetry = vi.fn();
const mockUseMonthlyGlance = vi.fn();
vi.mock('../../hooks/useMonthlyGlance', () => ({
  useMonthlyGlance: () => mockUseMonthlyGlance(),
}));

const mockUser = { id: 'user-1', email: 'test@example.com', firstName: 'Test', lastName: 'User', username: 'testuser' };

const mockData = [
  { date: '2026-06-01', cumulative: 10, daily: 10 },
  { date: '2026-06-02', cumulative: 35, daily: 25 },
];

import MonthlyGlance from './MonthlyGlance';

function setup() {
  return render(<MonthlyGlance />);
}

describe('MonthlyGlance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({ user: mockUser, isLoading: false });
    mockUseMonthlyGlance.mockReturnValue({ status: 'success', data: mockData, retry: mockRetry });
  });

  describe('auth gate', () => {
    it('renders skeleton when user is null', () => {
      mockUseAuth.mockReturnValue({ user: null, isLoading: false });
      setup();
      expect(document.querySelector('.p-skeleton')).toBeInTheDocument();
      expect(screen.queryByTestId('monthly-glance-chart')).not.toBeInTheDocument();
    });

    it('renders skeleton while auth is loading', () => {
      mockUseAuth.mockReturnValue({ user: null, isLoading: true });
      setup();
      expect(document.querySelector('.p-skeleton')).toBeInTheDocument();
    });

    it('does not render skeleton when user is set', () => {
      setup();
      expect(document.querySelector('.p-skeleton')).not.toBeInTheDocument();
    });
  });

  describe('loading state', () => {
    beforeEach(() => {
      mockUseMonthlyGlance.mockReturnValue({ status: 'loading', data: [], retry: mockRetry });
    });

    it('renders the mask overlay', () => {
      setup();
      expect(document.querySelector('.monthly-glance__mask')).toBeInTheDocument();
    });

    it('renders a progress spinner', () => {
      setup();
      expect(document.querySelector('.p-progress-spinner')).toBeInTheDocument();
    });

    it('does not render the chart', () => {
      setup();
      expect(screen.queryByTestId('monthly-glance-chart')).not.toBeInTheDocument();
    });
  });

  describe('error state', () => {
    beforeEach(() => {
      mockUseMonthlyGlance.mockReturnValue({ status: 'error', data: [], retry: mockRetry });
    });

    it('renders the mask overlay', () => {
      setup();
      expect(document.querySelector('.monthly-glance__mask')).toBeInTheDocument();
    });

    it('renders the retry button with label', () => {
      setup();
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

    it('renders the pi-undo icon', () => {
      setup();
      expect(document.querySelector('.pi-undo')).toBeInTheDocument();
    });

    it('does not render the chart', () => {
      setup();
      expect(screen.queryByTestId('monthly-glance-chart')).not.toBeInTheDocument();
    });

    it('clicking retry calls retry()', async () => {
      setup();
      await userEvent.click(screen.getByRole('button', { name: /retry/i }));
      expect(mockRetry).toHaveBeenCalledOnce();
    });
  });

  describe('success state', () => {
    it('renders the chart', () => {
      setup();
      expect(screen.getByTestId('monthly-glance-chart')).toBeInTheDocument();
    });

    it('does not render the mask', () => {
      setup();
      expect(document.querySelector('.monthly-glance__mask')).not.toBeInTheDocument();
    });

    it('does not render a retry button', () => {
      setup();
      expect(screen.queryByRole('button', { name: /retry/i })).not.toBeInTheDocument();
    });
  });
});
