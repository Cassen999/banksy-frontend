import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('../../assets/Piggy Bank.svg', () => ({ default: 'piggy-bank-mock.svg' }));

const mockUseAuth = vi.fn();
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('../../contexts/NotificationContext', () => ({
  useNotify: () => ({ triggerToast: vi.fn() }),
}));

const mockRetry = vi.fn();
const mockUseScheduledDeposits = vi.fn();
vi.mock('../../hooks/useScheduledDeposits', () => ({
  useScheduledDeposits: () => mockUseScheduledDeposits(),
}));

const mockUser = { id: 'user-1', email: 'test@example.com', firstName: 'Test', lastName: 'User', username: 'testuser' };

const makeDeposit = (overrides = {}) => ({
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
  ...overrides,
});

import ScheduledDeposits from './ScheduledDeposits';

function setup() {
  return render(<ScheduledDeposits />);
}

describe('ScheduledDeposits', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1440 });
    mockUseAuth.mockReturnValue({ user: mockUser, isLoading: false });
    mockUseScheduledDeposits.mockReturnValue({
      status: 'success',
      deposits: [makeDeposit()],
      retry: mockRetry,
    });
  });

  describe('skeleton state', () => {
    it('renders skeleton when user is null', () => {
      mockUseAuth.mockReturnValue({ user: null, isLoading: false });
      setup();
      expect(document.querySelector('.p-skeleton')).toBeInTheDocument();
      expect(document.querySelector('.p-accordion')).not.toBeInTheDocument();
    });

    it('renders skeleton while auth is loading', () => {
      mockUseAuth.mockReturnValue({ user: null, isLoading: true });
      setup();
      expect(document.querySelector('.p-skeleton')).toBeInTheDocument();
    });

    it('does not render skeleton when authenticated', () => {
      setup();
      expect(document.querySelector('.p-skeleton')).not.toBeInTheDocument();
    });
  });

  describe('loading state', () => {
    beforeEach(() => {
      mockUseScheduledDeposits.mockReturnValue({ status: 'loading', deposits: [], retry: mockRetry });
    });

    it('renders the mask overlay', () => {
      setup();
      expect(document.querySelector('.scheduled-deposits__mask')).toBeInTheDocument();
    });

    it('renders a ProgressSpinner', () => {
      setup();
      expect(document.querySelector('.p-progress-spinner')).toBeInTheDocument();
    });

    it('does not render the accordion', () => {
      setup();
      expect(document.querySelector('.p-accordion')).not.toBeInTheDocument();
    });
  });

  describe('error state', () => {
    beforeEach(() => {
      mockUseScheduledDeposits.mockReturnValue({ status: 'error', deposits: [], retry: mockRetry });
    });

    it('renders the mask overlay', () => {
      setup();
      expect(document.querySelector('.scheduled-deposits__mask')).toBeInTheDocument();
    });

    it('renders the retry button with label', () => {
      setup();
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

    it('renders the pi-undo icon', () => {
      setup();
      expect(document.querySelector('.pi-undo')).toBeInTheDocument();
    });

    it('does not render the accordion', () => {
      setup();
      expect(document.querySelector('.p-accordion')).not.toBeInTheDocument();
    });

    it('clicking retry calls retry()', async () => {
      setup();
      await userEvent.click(screen.getByRole('button', { name: /retry/i }));
      expect(mockRetry).toHaveBeenCalledOnce();
    });
  });

  describe('empty state', () => {
    beforeEach(() => {
      mockUseScheduledDeposits.mockReturnValue({ status: 'success', deposits: [], retry: mockRetry });
    });

    it('renders empty message', () => {
      setup();
      expect(screen.getByText('No upcoming deposits this month.')).toBeInTheDocument();
    });

    it('does not render the accordion', () => {
      setup();
      expect(document.querySelector('.p-accordion')).not.toBeInTheDocument();
    });
  });

  describe('success state — desktop', () => {
    it('renders up to 5 items when more than 5 deposits exist', () => {
      mockUseScheduledDeposits.mockReturnValue({
        status: 'success',
        deposits: Array.from({ length: 6 }, (_, i) => makeDeposit({ predictedNextDate: `2026-06-${20 + i}` })),
        retry: mockRetry,
      });
      setup();
      expect(document.querySelectorAll('.p-accordion-header')).toHaveLength(5);
    });

    it('renders fewer items when fewer than 5 deposits exist', () => {
      mockUseScheduledDeposits.mockReturnValue({
        status: 'success',
        deposits: Array.from({ length: 3 }, (_, i) => makeDeposit({ predictedNextDate: `2026-06-${20 + i}` })),
        retry: mockRetry,
      });
      setup();
      expect(document.querySelectorAll('.p-accordion-header')).toHaveLength(3);
    });
  });

  describe('success state — mobile', () => {
    beforeEach(() => {
      Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 800 });
    });

    it('renders only 1 item when multiple deposits exist', () => {
      mockUseScheduledDeposits.mockReturnValue({
        status: 'success',
        deposits: Array.from({ length: 3 }, (_, i) => makeDeposit({ predictedNextDate: `2026-06-${20 + i}` })),
        retry: mockRetry,
      });
      setup();
      expect(document.querySelectorAll('.p-accordion-header')).toHaveLength(1);
    });
  });

  describe('accordion header content', () => {
    it('shows merchant name in header', () => {
      setup();
      expect(screen.getByText(/employer inc/i)).toBeInTheDocument();
    });

    it('shows formatted amount in header', () => {
      setup();
      expect(screen.getByText(/\$2,500\.00/)).toBeInTheDocument();
    });

    it('shows predictedNextDate in header', () => {
      setup();
      expect(screen.getByText(/2026-06-20/)).toBeInTheDocument();
    });

    it('renders piggy bank image with aria-hidden', () => {
      setup();
      const img = document.querySelector('.scheduled-deposits__piggy') as HTMLImageElement;
      expect(img).toBeInTheDocument();
      expect(img.getAttribute('aria-hidden')).toBe('true');
      expect(img.getAttribute('alt')).toBe('');
    });
  });

  describe('accordion panel content', () => {
    it('shows formatted frequency as title-case', async () => {
      setup();
      await userEvent.click(document.querySelector('.p-accordion-header-link')!);
      expect(screen.getByText('Biweekly')).toBeInTheDocument();
    });

    it('shows null merchantName as em-dash in header', () => {
      mockUseScheduledDeposits.mockReturnValue({
        status: 'success',
        deposits: [makeDeposit({ merchantName: null })],
        retry: mockRetry,
      });
      setup();
      expect(screen.getByText(/Next upcoming deposit from — for/)).toBeInTheDocument();
    });

    it('shows null averageAmount as em-dash in header', () => {
      mockUseScheduledDeposits.mockReturnValue({
        status: 'success',
        deposits: [makeDeposit({ averageAmount: null })],
        retry: mockRetry,
      });
      setup();
      expect(screen.getByText(/Next upcoming deposit from .+ for — on/)).toBeInTheDocument();
    });
  });
});
