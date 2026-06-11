import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import SettingsPage from './SettingsPage';

vi.mock('../AuthButton/AuthButton', () => ({
  default: vi.fn(() => <button>Logout</button>),
}));

describe('SettingsPage', () => {
  it('should_renderSettingsHeading', () => {
    render(<SettingsPage />);
    expect(screen.getByRole('heading', { name: /settings/i })).toBeInTheDocument();
  });

  it('should_renderAuthButton', () => {
    render(<SettingsPage />);
    expect(screen.getByRole('button', { name: 'Logout' })).toBeInTheDocument();
  });
});
