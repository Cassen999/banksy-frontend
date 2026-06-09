import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LinkAccount from './LinkAccount';

const mockInitiateLinkFlow = vi.fn();
const mockUseLinkAccount = vi.fn();

vi.mock('../../hooks/useLinkAccount', () => ({
  useLinkAccount: () => mockUseLinkAccount(),
}));

describe('LinkAccount', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseLinkAccount.mockReturnValue({ isLoading: false, initiateLinkFlow: mockInitiateLinkFlow });
  });

  it('renders a button with label "Link Account"', () => {
    render(<LinkAccount />);
    expect(screen.getByRole('button', { name: /link account/i })).toBeInTheDocument();
  });

  it('button is enabled in default state', () => {
    render(<LinkAccount />);
    expect(screen.getByRole('button', { name: /link account/i })).not.toBeDisabled();
  });

  it('button is disabled when loading', () => {
    mockUseLinkAccount.mockReturnValue({ isLoading: true, initiateLinkFlow: mockInitiateLinkFlow });
    render(<LinkAccount />);
    expect(screen.getByRole('button', { name: /link account/i })).toBeDisabled();
  });

  it('shows loading spinner when loading', () => {
    mockUseLinkAccount.mockReturnValue({ isLoading: true, initiateLinkFlow: mockInitiateLinkFlow });
    render(<LinkAccount />);
    expect(document.querySelector('.p-button-loading-icon')).toBeInTheDocument();
  });

  it('calls initiateLinkFlow on click', async () => {
    render(<LinkAccount />);
    await userEvent.click(screen.getByRole('button', { name: /link account/i }));
    expect(mockInitiateLinkFlow).toHaveBeenCalledTimes(1);
  });

  it('does not call initiateLinkFlow when disabled', async () => {
    mockUseLinkAccount.mockReturnValue({ isLoading: true, initiateLinkFlow: mockInitiateLinkFlow });
    render(<LinkAccount />);
    await userEvent.click(screen.getByRole('button', { name: /link account/i }));
    expect(mockInitiateLinkFlow).not.toHaveBeenCalled();
  });
});
