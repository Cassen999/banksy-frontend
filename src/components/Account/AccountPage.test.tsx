import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import AccountPage from './AccountPage';

vi.mock('../LinkAccount/LinkAccount', () => ({
  default: () => <button>Link Account</button>,
}));

describe('AccountPage', () => {
  it('renders H1 "Account Actions"', () => {
    render(<AccountPage />);
    expect(screen.getByRole('heading', { level: 1, name: 'Account Actions' })).toBeInTheDocument();
  });

  it('renders the description text', () => {
    render(<AccountPage />);
    expect(screen.getByText(/manage your Banksy bank links/i)).toBeInTheDocument();
  });

  it('renders the actions grid', () => {
    render(<AccountPage />);
    expect(document.querySelector('.account__actions-grid')).toBeInTheDocument();
  });

  it('renders the Link Account button', () => {
    render(<AccountPage />);
    expect(screen.getByRole('button', { name: 'Link Account' })).toBeInTheDocument();
  });
});
