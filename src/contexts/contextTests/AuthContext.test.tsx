import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from '../AuthContext';
import { server } from '../../mocks/server';
import { handlers } from '../../mocks/handlers';


function TestConsumer() {
  const { user, isLoading, clearUser } = useAuth();
  return (
    <div>
      <span data-testid="loading">{isLoading ? 'loading' : 'done'}</span>
      <span data-testid="user">{user ? `${user.firstName} ${user.lastName}` : 'no-user'}</span>
      <button onClick={clearUser}>clear</button>
    </div>
  );
}

function renderWithProvider() {
  return render(
    <AuthProvider>
      <TestConsumer />
    </AuthProvider>,
  );
}

describe('AuthProvider', () => {
  it('should_renderChildren', () => {
    renderWithProvider();
    expect(screen.getByTestId('loading')).toBeInTheDocument();
  });

  it('should_startWithLoadingTrue', () => {
    renderWithProvider();
    expect(screen.getByTestId('loading').textContent).toBe('loading');
  });

  it('should_setUserFromResponse_onSuccessfulFetch', async () => {
    renderWithProvider();
    await waitFor(() =>
      expect(screen.getByTestId('user').textContent).toBe('Test User'),
    );
  });

  it('should_setLoadingFalse_afterFetchCompletes', async () => {
    renderWithProvider();
    await waitFor(() =>
      expect(screen.getByTestId('loading').textContent).toBe('done'),
    );
  });

  it('should_setUserToNull_whenFetchFails', async () => {
    server.use(handlers.auth.me.unauthorized);
    renderWithProvider();
    await waitFor(() =>
      expect(screen.getByTestId('user').textContent).toBe('no-user'),
    );
  });

  it('should_setLoadingFalse_evenWhenFetchFails', async () => {
    server.use(handlers.auth.me.unauthorized);
    renderWithProvider();
    await waitFor(() =>
      expect(screen.getByTestId('loading').textContent).toBe('done'),
    );
  });

  it('should_clearUser_whenClearUserIsCalled', async () => {
    renderWithProvider();
    await waitFor(() =>
      expect(screen.getByTestId('user').textContent).toBe('Test User'),
    );
    await userEvent.click(screen.getByRole('button', { name: 'clear' }));
    expect(screen.getByTestId('user').textContent).toBe('no-user');
  });
});

describe('useAuth', () => {
  it('should_throwDescriptiveError_whenUsedOutsideProvider', () => {
    const BadConsumer = () => {
      useAuth();
      return null;
    };
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<BadConsumer />)).toThrow('useAuth must be used within AuthProvider');
    spy.mockRestore();
  });
});
