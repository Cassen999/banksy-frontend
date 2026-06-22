import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import QuickAccountOverview from './QuickAccountOverview';
import type { iAccountWithTransactions } from '../../types/types';

vi.mock('../../hooks/useQuickAccountOverview', () => ({
  useQuickAccountOverview: vi.fn(),
}));
vi.mock('../../contexts/AuthContext', () => ({ useAuth: vi.fn() }));
vi.mock('../CustomAccountNameButton/CustomAccountNameButton', () => ({
  default: vi.fn(() => <button>Name Button</button>),
}));

import { useQuickAccountOverview } from '../../hooks/useQuickAccountOverview';
import { useAuth } from '../../contexts/AuthContext';

const mockUseQuickAccountOverview = vi.mocked(useQuickAccountOverview);
const mockUseAuth = vi.mocked(useAuth);
const mockRetry = vi.fn();
const mockRefetchBalance = vi.fn();

const mockUser = { id: 'u1', email: 'a@b.com', firstName: 'A', lastName: 'B', username: 'ab' };

const mockAccount1: iAccountWithTransactions = {
  accountId: 'plaid-account-id-1',
  name: 'Checking',
  type: 'depository',
  subtype: 'checking',
  currentBalance: 1234.56,
  availableBalance: 1100.0,
  isoCurrencyCode: 'USD',
  institutionName: 'Chase',
  customName: null,
  transactions: [
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
  ],
  lastDeposit: {
    accountId: 'plaid-account-id-1',
    date: '2026-06-05',
    name: 'Paycheck',
    amount: -2500.0,
    isoCurrencyCode: 'USD',
    category: [],
  },
};

const mockAccount2: iAccountWithTransactions = {
  accountId: 'plaid-account-id-2',
  name: 'Savings',
  type: 'depository',
  subtype: 'savings',
  currentBalance: 5678.9,
  availableBalance: 5678.9,
  isoCurrencyCode: 'USD',
  institutionName: 'Bank of America',
  customName: 'My Savings',
  transactions: [],
  lastDeposit: null,
};

const successHookReturn = {
  status: 'success' as const,
  accounts: [mockAccount1, mockAccount2],
  relinkRequired: [],
  retry: mockRetry,
  refetchBalance: mockRefetchBalance,
};

beforeEach(() => {
  vi.clearAllMocks();
  mockUseAuth.mockReturnValue({ user: mockUser, isLoading: false, clearUser: vi.fn() });
  mockUseQuickAccountOverview.mockReturnValue(successHookReturn);
});

describe('QuickAccountOverview', () => {
  describe('auth loading / no user', () => {
    it('renders Skeleton when auth is loading', () => {
      mockUseAuth.mockReturnValue({ user: null, isLoading: true, clearUser: vi.fn() });
      render(<QuickAccountOverview />);
      expect(document.querySelector('.p-skeleton')).toBeInTheDocument();
    });

    it('renders Skeleton when user is null', () => {
      mockUseAuth.mockReturnValue({ user: null, isLoading: false, clearUser: vi.fn() });
      render(<QuickAccountOverview />);
      expect(document.querySelector('.p-skeleton')).toBeInTheDocument();
    });
  });

  describe('loading state', () => {
    it('renders ProgressSpinner while loading', () => {
      mockUseQuickAccountOverview.mockReturnValue({
        ...successHookReturn,
        status: 'loading',
        accounts: [],
      });
      render(<QuickAccountOverview />);
      expect(document.querySelector('.p-progress-spinner')).toBeInTheDocument();
    });
  });

  describe('error state', () => {
    it('renders retry button when status is error', () => {
      mockUseQuickAccountOverview.mockReturnValue({
        ...successHookReturn,
        status: 'error',
        accounts: [],
      });
      render(<QuickAccountOverview />);
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

    it('clicking retry calls retry()', async () => {
      const user = userEvent.setup();
      mockUseQuickAccountOverview.mockReturnValue({
        ...successHookReturn,
        status: 'error',
        accounts: [],
      });
      render(<QuickAccountOverview />);
      await user.click(screen.getByRole('button', { name: /retry/i }));
      expect(mockRetry).toHaveBeenCalled();
    });
  });

  describe('success state — no accounts', () => {
    it('renders empty message when accounts is empty', () => {
      mockUseQuickAccountOverview.mockReturnValue({
        ...successHookReturn,
        accounts: [],
      });
      render(<QuickAccountOverview />);
      expect(screen.getByText('No linked accounts')).toBeInTheDocument();
    });
  });

  describe('success state — accordion headers', () => {
    it('renders one header per account', () => {
      render(<QuickAccountOverview />);
      expect(screen.getByText('Chase - Checking')).toBeInTheDocument();
      expect(screen.getByText('My Savings')).toBeInTheDocument();
    });

    it('uses customName as header when customName is set', () => {
      render(<QuickAccountOverview />);
      expect(screen.getByText('My Savings')).toBeInTheDocument();
      expect(screen.queryByText('Bank of America - Savings')).not.toBeInTheDocument();
    });

    it('formats header as institutionName alone when subtype is null', () => {
      mockUseQuickAccountOverview.mockReturnValue({
        ...successHookReturn,
        accounts: [{ ...mockAccount1, subtype: null }],
      });
      render(<QuickAccountOverview />);
      expect(screen.getByText('Chase')).toBeInTheDocument();
    });
  });

  describe('success state — panel content (first tab open)', () => {
    async function renderAndOpenFirstTab() {
      const user = userEvent.setup();
      render(<QuickAccountOverview />);
      await user.click(screen.getByRole('button', { name: 'Chase - Checking' }));
      return user;
    }

    it('renders institution name', async () => {
      await renderAndOpenFirstTab();
      expect(await screen.findByText('Chase', { selector: '.quick-account-overview__value' })).toBeInTheDocument();
    });

    it('renders balance formatted as currency', async () => {
      await renderAndOpenFirstTab();
      expect(await screen.findByText('$1,234.56')).toBeInTheDocument();
    });

    it('renders last deposit formatted as currency', async () => {
      await renderAndOpenFirstTab();
      const lastDepositValue = await screen.findByText('$2,500.00', {
        selector: '.quick-account-overview__value',
      });
      expect(lastDepositValue).toBeInTheDocument();
    });

    it('renders CustomAccountNameButton', async () => {
      await renderAndOpenFirstTab();
      expect(await screen.findByRole('button', { name: /name button/i })).toBeInTheDocument();
    });

    it('does not render customName text when customName is null', async () => {
      await renderAndOpenFirstTab();
      await screen.findByText('$1,234.56'); // wait for panel to render
      expect(document.querySelector('.quick-account-overview__custom-name')).not.toBeInTheDocument();
    });

    it('renders debit amount with leading dash', async () => {
      await renderAndOpenFirstTab();
      expect(await screen.findByText('-$5.75')).toBeInTheDocument();
    });

    it('applies debit class to debit amounts', async () => {
      await renderAndOpenFirstTab();
      const debitEl = await screen.findByText('-$5.75');
      expect(debitEl).toHaveClass('quick-account-overview__amount--debit');
    });

    it('renders credit amount as positive value', async () => {
      await renderAndOpenFirstTab();
      const creditEl = await screen.findByText('$2,500.00', { selector: '.quick-account-overview__amount--credit' });
      expect(creditEl).toBeInTheDocument();
    });

    it('applies credit class to credit amounts', async () => {
      await renderAndOpenFirstTab();
      const creditEl = await screen.findByText('$2,500.00', { selector: '.quick-account-overview__amount--credit' });
      expect(creditEl).toHaveClass('quick-account-overview__amount--credit');
    });

    it('formats transaction dates as MM/DD/YYYY', async () => {
      await renderAndOpenFirstTab();
      expect(await screen.findByText('06/10/2026')).toBeInTheDocument();
    });

    it('renders Detailed View link', async () => {
      await renderAndOpenFirstTab();
      expect(await screen.findByRole('link', { name: /detailed view/i })).toBeInTheDocument();
    });
  });

  describe('success state — panel content (second tab open)', () => {
    async function renderAndOpenSecondTab() {
      const user = userEvent.setup();
      render(<QuickAccountOverview />);
      await user.click(screen.getByRole('button', { name: 'My Savings' }));
      return user;
    }

    it('shows customName text in panel body when customName is set', async () => {
      await renderAndOpenSecondTab();
      expect(
        await screen.findByText('My Savings', { selector: '.quick-account-overview__custom-name' }),
      ).toBeInTheDocument();
    });

    it('renders -- when lastDeposit is null', async () => {
      await renderAndOpenSecondTab();
      await waitFor(() =>
        expect(screen.getByText('—')).toBeInTheDocument(),
      );
    });

    it('renders "No recent transactions" when account has no transactions', async () => {
      await renderAndOpenSecondTab();
      expect(await screen.findByText('No recent transactions')).toBeInTheDocument();
    });
  });
});
