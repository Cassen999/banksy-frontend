import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import HomepagePage from './HomepagePage';
import type { iUser } from '../../types/types';

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from '../../contexts/AuthContext';

const mockUser: iUser = {
  id: '1',
  email: 'test@test.com',
  firstName: 'Test',
  lastName: 'User',
  username: 'testuser',
};

function renderPage() {
  return render(
    <BrowserRouter>
      <HomepagePage />
    </BrowserRouter>,
  );
}

describe('HomepagePage', () => {
  describe('logged-out state', () => {
    beforeEach(() => {
      (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
        user: null,
        isLoading: false,
        clearUser: vi.fn(),
      });
    });

    it('should_renderLoggedOutMessage_whenUserIsNull', () => {
      renderPage();
      expect(
        screen.getByRole('heading', { level: 1, name: /please log in to be finance guy/i }),
      ).toBeInTheDocument();
    });

    it('should_notRenderBanksyLogo_whenLoggedOut', () => {
      renderPage();
      expect(screen.queryByRole('img', { name: /banksy/i })).not.toBeInTheDocument();
    });

    it('should_notRenderLoggedInMessage_whenLoggedOut', () => {
      renderPage();
      expect(screen.queryByText(/welcome to/i)).not.toBeInTheDocument();
    });

    it('should_notRenderNavButtons_whenLoggedOut', () => {
      renderPage();
      expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    });
  });

  describe('logged-in state', () => {
    beforeEach(() => {
      (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
        user: mockUser,
        isLoading: false,
        clearUser: vi.fn(),
      });
    });

    it('should_renderWelcomeHeading_whenUserIsLoggedIn', () => {
      renderPage();
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/welcome to/i);
    });

    it('should_renderBanksyLogo_whenLoggedIn', () => {
      renderPage();
      expect(screen.getByRole('img', { name: /banksy/i })).toBeInTheDocument();
    });

    it('should_notRenderLoggedOutMessage_whenLoggedIn', () => {
      renderPage();
      expect(
        screen.queryByText(/please log in to be finance guy/i),
      ).not.toBeInTheDocument();
    });

    it('should_renderAllFiveNavButtons_whenLoggedIn', () => {
      renderPage();
      expect(screen.getAllByRole('button')).toHaveLength(5);
    });

    it('should_renderNavWithAccessibleLabel_whenLoggedIn', () => {
      renderPage();
      expect(screen.getByRole('navigation', { name: /main navigation/i })).toBeInTheDocument();
    });

    it('should_navigateToAccountsPage_whenAccountsButtonIsClicked', async () => {
      const { container } = renderPage();
      const accountsButton = screen.getByRole('button', { name: /accounts/i });
      await userEvent.click(accountsButton);
      expect(container.ownerDocument.location.pathname).toBe('/account');
    });
  });

  describe('structure', () => {
    beforeEach(() => {
      (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
        user: null,
        isLoading: false,
        clearUser: vi.fn(),
      });
    });

    it('should_haveExactlyOneH1', () => {
      renderPage();
      expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    });
  });
});
