import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { createElement } from 'react';
import { NotificationProvider } from '../contexts/NotificationContext';

const mockOpen = vi.fn();
const mockUsePlaidLink = vi.fn();

vi.mock('react-plaid-link', () => ({
  usePlaidLink: (config: { onSuccess: (...args: unknown[]) => void; onExit: (...args: unknown[]) => void; token: string | null }) => {
    mockUsePlaidLink(config);
    return { open: mockOpen, ready: !!config.token };
  },
}));

const mockFetchLinkToken = vi.fn();
const mockExchangePublicToken = vi.fn();

vi.mock('../services/plaidService', () => ({
  fetchLinkToken: () => mockFetchLinkToken(),
  exchangePublicToken: (body: unknown) => mockExchangePublicToken(body),
}));

const mockTriggerToast = vi.fn();
vi.mock('../contexts/NotificationContext', () => ({
  NotificationProvider: ({ children }: { children: ReactNode }) => children,
  useNotify: () => ({ triggerToast: mockTriggerToast }),
}));

const mockUseAuth = vi.fn();
vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

function wrapper({ children }: { children: ReactNode }) {
  return createElement(NotificationProvider, null, children);
}

// Helper to get the onSuccess/onExit callbacks passed to usePlaidLink
function getPlaidCallbacks() {
  const lastCall = mockUsePlaidLink.mock.calls[mockUsePlaidLink.mock.calls.length - 1];
  return lastCall?.[0] as { onSuccess: (...args: unknown[]) => void; onExit: (...args: unknown[]) => void };
}

import { useLinkAccount } from './useLinkAccount';

describe('useLinkAccount', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchLinkToken.mockResolvedValue({ link_token: 'link-sandbox-test-token' });
    mockExchangePublicToken.mockResolvedValue({ status: 'ok', message: 'Plaid authentication successful' });
    mockUseAuth.mockReturnValue({ user: { id: 'test-user' }, isLoading: false, clearUser: vi.fn() });
  });

  it('starts with isLoading false', () => {
    const { result } = renderHook(() => useLinkAccount(), { wrapper });
    expect(result.current.isLoading).toBe(false);
  });

  it('sets isLoading to true when initiateLinkFlow is called', async () => {
    const { result } = renderHook(() => useLinkAccount(), { wrapper });
    act(() => { result.current.initiateLinkFlow(); });
    expect(result.current.isLoading).toBe(true);
  });

  it('calls open() after token is fetched', async () => {
    const { result } = renderHook(() => useLinkAccount(), { wrapper });
    await act(async () => { result.current.initiateLinkFlow(); });
    await waitFor(() => expect(mockOpen).toHaveBeenCalled());
  });

  it('onSuccess calls exchangePublicToken with correct payload', async () => {
    const { result } = renderHook(() => useLinkAccount(), { wrapper });
    await act(async () => { result.current.initiateLinkFlow(); });
    await waitFor(() => expect(mockOpen).toHaveBeenCalled());

    const { onSuccess } = getPlaidCallbacks();
    await act(async () => {
      onSuccess('public-token-xyz', {
        institution: { institution_id: 'ins_123', name: 'Test Bank' },
      });
    });

    expect(mockExchangePublicToken).toHaveBeenCalledWith({
      publicToken: 'public-token-xyz',
      institutionId: 'ins_123',
      institutionName: 'Test Bank',
      expiredItemId: null,
    });
  });

  it('onSuccess with 200 sets isLoading to false', async () => {
    const { result } = renderHook(() => useLinkAccount(), { wrapper });
    await act(async () => { result.current.initiateLinkFlow(); });
    await waitFor(() => expect(mockOpen).toHaveBeenCalled());

    const { onSuccess } = getPlaidCallbacks();
    await act(async () => {
      onSuccess('public-token-xyz', {
        institution: { institution_id: 'ins_123', name: 'Test Bank' },
      });
    });

    expect(result.current.isLoading).toBe(false);
  });

  it('onSuccess with exchange 500 sets isLoading to false', async () => {
    mockExchangePublicToken.mockRejectedValue({ status: 500 });
    const { result } = renderHook(() => useLinkAccount(), { wrapper });
    await act(async () => { result.current.initiateLinkFlow(); });
    await waitFor(() => expect(mockOpen).toHaveBeenCalled());

    const { onSuccess } = getPlaidCallbacks();
    await act(async () => {
      onSuccess('public-token-xyz', {
        institution: { institution_id: 'ins_123', name: 'Test Bank' },
      });
    });

    expect(result.current.isLoading).toBe(false);
  });

  it('onExit with no error sets isLoading to false and shows no toast', async () => {
    const { result } = renderHook(() => useLinkAccount(), { wrapper });
    await act(async () => { result.current.initiateLinkFlow(); });
    await waitFor(() => expect(mockOpen).toHaveBeenCalled());

    const { onExit } = getPlaidCallbacks();
    act(() => { onExit(null, {}); });

    expect(result.current.isLoading).toBe(false);
    expect(mockExchangePublicToken).not.toHaveBeenCalled();
  });

  it('onExit with error sets isLoading to false', async () => {
    const { result } = renderHook(() => useLinkAccount(), { wrapper });
    await act(async () => { result.current.initiateLinkFlow(); });
    await waitFor(() => expect(mockOpen).toHaveBeenCalled());

    const { onExit } = getPlaidCallbacks();
    act(() => { onExit({ error_code: 'INSTITUTION_DOWN', error_message: 'Down' }, {}); });

    expect(result.current.isLoading).toBe(false);
  });

  it('fetchLinkToken 500 sets isLoading to false', async () => {
    mockFetchLinkToken.mockRejectedValue({ status: 500 });
    const { result } = renderHook(() => useLinkAccount(), { wrapper });
    await act(async () => { result.current.initiateLinkFlow(); });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
  });

  it('fetchLinkToken 500 does not call open()', async () => {
    mockFetchLinkToken.mockRejectedValue({ status: 500 });
    const { result } = renderHook(() => useLinkAccount(), { wrapper });
    await act(async () => { result.current.initiateLinkFlow(); });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(mockOpen).not.toHaveBeenCalled();
  });

  it('shows info toast and does not set isLoading when user is not logged in', async () => {
    mockUseAuth.mockReturnValue({ user: null, isLoading: false, clearUser: vi.fn() });
    const { result } = renderHook(() => useLinkAccount(), { wrapper });
    act(() => { result.current.initiateLinkFlow(); });
    expect(mockTriggerToast).toHaveBeenCalledWith({
      severity: 'info',
      summary: 'Please login to add a bank account',
    });
    expect(result.current.isLoading).toBe(false);
    expect(mockFetchLinkToken).not.toHaveBeenCalled();
  });
});
