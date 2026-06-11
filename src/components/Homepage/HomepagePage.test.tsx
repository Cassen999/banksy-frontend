import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import HomepagePage from './HomepagePage';

vi.mock('../../assets/banksy-logo.png', () => ({ default: 'banksy-logo.png' }));
vi.mock('../../assets/banksy-logo-dark.png', () => ({ default: 'banksy-logo-dark.png' }));

vi.mock('../../contexts/ThemeContext', () => ({
  useTheme: vi.fn(),
}));

import { useTheme } from '../../contexts/ThemeContext';

function renderPage() {
  return render(
    <BrowserRouter>
      <HomepagePage />
    </BrowserRouter>,
  );
}

describe('HomepagePage', () => {
  beforeEach(() => {
    vi.mocked(useTheme).mockReturnValue({ theme: 'light', toggleTheme: vi.fn() });
  });

  describe('content', () => {
    it('should_renderWelcomeHeading', () => {
      renderPage();
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/welcome to/i);
    });

    it('should_renderBanksyLogo', () => {
      renderPage();
      expect(screen.getByRole('img', { name: /banksy/i })).toBeInTheDocument();
    });

    it('should_notRenderLoggedOutMessage', () => {
      renderPage();
      expect(screen.queryByText(/please log in to be finance guy/i)).not.toBeInTheDocument();
    });

    it('should_renderAllFiveNavButtons', () => {
      renderPage();
      expect(screen.getAllByRole('button')).toHaveLength(5);
    });

    it('should_renderNavWithAccessibleLabel', () => {
      renderPage();
      expect(screen.getByRole('navigation', { name: /main navigation/i })).toBeInTheDocument();
    });

    it('should_haveExactlyOneH1', () => {
      renderPage();
      expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    });
  });

  describe('navigation', () => {
    it('should_navigateToAccountsPage_whenAccountsButtonClicked', async () => {
      const { container } = renderPage();
      await userEvent.click(screen.getByRole('button', { name: /accounts/i }));
      expect(container.ownerDocument.location.pathname).toBe('/account');
    });

    it('should_navigateToSettingsPage_whenSettingsButtonClicked', async () => {
      const { container } = renderPage();
      await userEvent.click(screen.getByRole('button', { name: /settings/i }));
      expect(container.ownerDocument.location.pathname).toBe('/settings');
    });
  });

  describe('dark mode logo', () => {
    it('should_useLightLogo_whenThemeIsLight', () => {
      vi.mocked(useTheme).mockReturnValue({ theme: 'light', toggleTheme: vi.fn() });
      renderPage();
      expect(screen.getByRole('img', { name: /banksy/i }).getAttribute('src')).toBe('banksy-logo.png');
    });

    it('should_useDarkLogo_whenThemeIsDark', () => {
      vi.mocked(useTheme).mockReturnValue({ theme: 'dark', toggleTheme: vi.fn() });
      renderPage();
      expect(screen.getByRole('img', { name: /banksy/i }).getAttribute('src')).toBe('banksy-logo-dark.png');
    });
  });
});
