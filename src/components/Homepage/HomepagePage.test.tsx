import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import HomepagePage from './HomepagePage';

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

    it('should_renderAccountsSection', () => {
      renderPage();
      expect(screen.getByRole('region', { name: /account overview/i })).toBeInTheDocument();
    });
  });

  describe('removed content', () => {
    it('should_notRenderWelcomeHeading', () => {
      renderPage();
      expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    });

    it('should_notRenderNavButtons', () => {
      renderPage();
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
  });
});
