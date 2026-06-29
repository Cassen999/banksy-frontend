import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import HomepagePage from './HomepagePage';

vi.mock('../MonthlyGlance/MonthlyGlance', () => ({
  default: () => <div data-testid="monthly-glance-mock" />,
}));

vi.mock('../ScheduledDeposits/ScheduledDeposits', () => ({
  default: () => <div data-testid="scheduled-deposits-mock" />,
}));

vi.mock('../QuickAccountOverview/QuickAccountOverview', () => ({
  default: () => <div data-testid="quick-account-overview-mock" />,
}));

function renderPage() {
  return render(
    <BrowserRouter>
      <HomepagePage />
    </BrowserRouter>,
  );
}

describe('HomepagePage', () => {
  describe('structure', () => {
    it('should_renderGraphSection', () => {
      renderPage();
      expect(screen.getByRole('region', { name: /spending trend graph/i })).toBeInTheDocument();
    });

    it('should_renderNextDepositSection', () => {
      renderPage();
      expect(screen.getByRole('region', { name: /next scheduled deposit/i })).toBeInTheDocument();
    });

    it('should_renderScheduledDeposits', () => {
      renderPage();
      expect(screen.getByTestId('scheduled-deposits-mock')).toBeInTheDocument();
    });

    it('should_renderAccountsSection', () => {
      renderPage();
      expect(screen.getByRole('region', { name: /account overview/i })).toBeInTheDocument();
    });
  });

  describe('removed content', () => {
    it('should_renderDashboardHeading', () => {
      renderPage();
      expect(screen.getByRole('heading', { name: /dashboard/i })).toBeInTheDocument();
    });

    it('should_notRenderNavButtons', () => {
      renderPage();
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
  });
});
