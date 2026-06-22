import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CustomAccountNameButton from './CustomAccountNameButton';

vi.mock('../CustomAccountNameModal/CustomAccountNameModal', () => ({
  default: vi.fn(({ visible, onHide }: { visible: boolean; onHide: () => void }) =>
    visible ? (
      <div data-testid="mock-modal">
        <button onClick={onHide}>close</button>
      </div>
    ) : null,
  ),
}));

import CustomAccountNameModal from '../CustomAccountNameModal/CustomAccountNameModal';
const mockModal = vi.mocked(CustomAccountNameModal);

const defaultProps = {
  accountId: 'plaid-account-id-1',
  institutionName: 'Chase',
  subtype: 'checking' as string | null,
  currentCustomName: null as string | null,
  onSuccess: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
  mockModal.mockImplementation(({ visible, onHide }) =>
    visible ? (
      <div data-testid="mock-modal">
        <button onClick={onHide}>close</button>
      </div>
    ) : null,
  );
});

describe('CustomAccountNameButton', () => {
  describe('when currentCustomName is null', () => {
    it('renders button with label "Add Name"', () => {
      render(<CustomAccountNameButton {...defaultProps} currentCustomName={null} />);
      expect(screen.getByRole('button', { name: /add name/i })).toBeInTheDocument();
    });
  });

  describe('when currentCustomName is set', () => {
    it('renders button with label "Edit Name"', () => {
      render(<CustomAccountNameButton {...defaultProps} currentCustomName="My Account" />);
      expect(screen.getByRole('button', { name: /edit name/i })).toBeInTheDocument();
    });
  });

  describe('modal interaction', () => {
    it('opens the modal when button is clicked', async () => {
      const user = userEvent.setup();
      render(<CustomAccountNameButton {...defaultProps} />);
      expect(screen.queryByTestId('mock-modal')).not.toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: /add name/i }));
      expect(screen.getByTestId('mock-modal')).toBeInTheDocument();
    });

    it('closes the modal when onHide is called', async () => {
      const user = userEvent.setup();
      render(<CustomAccountNameButton {...defaultProps} />);
      await user.click(screen.getByRole('button', { name: /add name/i }));
      await user.click(screen.getByRole('button', { name: /close/i }));
      expect(screen.queryByTestId('mock-modal')).not.toBeInTheDocument();
    });

    it('passes all required props to CustomAccountNameModal', async () => {
      const user = userEvent.setup();
      const onSuccess = vi.fn();
      render(
        <CustomAccountNameButton
          accountId="test-id"
          institutionName="Test Bank"
          subtype="savings"
          currentCustomName="My Savings"
          onSuccess={onSuccess}
        />,
      );
      await user.click(screen.getByRole('button', { name: /edit name/i }));
      expect(mockModal).toHaveBeenLastCalledWith(
        expect.objectContaining({
          accountId: 'test-id',
          institutionName: 'Test Bank',
          subtype: 'savings',
          currentCustomName: 'My Savings',
          onSuccess,
          visible: true,
        }),
        undefined,
      );
    });
  });
});
