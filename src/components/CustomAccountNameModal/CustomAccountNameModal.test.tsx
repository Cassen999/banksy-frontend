import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CustomAccountNameModal from './CustomAccountNameModal';
import type { iCustomAccountNameModalProps } from './CustomAccountNameModal';

vi.mock('../../services/plaidService', () => ({ setAccountName: vi.fn() }));
vi.mock('../../contexts/NotificationContext', () => ({ useNotify: vi.fn() }));

import { setAccountName } from '../../services/plaidService';
import { useNotify } from '../../contexts/NotificationContext';

const mockSetAccountName = vi.mocked(setAccountName);
const mockUseNotify = vi.mocked(useNotify);
const mockTriggerToast = vi.fn();
const mockOnHide = vi.fn();
const mockOnSuccess = vi.fn();

const defaultProps: iCustomAccountNameModalProps = {
  visible: true,
  onHide: mockOnHide,
  accountId: 'plaid-account-id-1',
  institutionName: 'Chase',
  subtype: 'checking',
  currentCustomName: null,
  onSuccess: mockOnSuccess,
};

function renderModal(props: Partial<iCustomAccountNameModalProps> = {}) {
  render(<CustomAccountNameModal {...defaultProps} {...props} />);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockUseNotify.mockReturnValue({ triggerToast: mockTriggerToast } as ReturnType<typeof useNotify>);
  mockSetAccountName.mockResolvedValue(undefined);
});

describe('CustomAccountNameModal', () => {
  describe('when visible is true', () => {
    it('renders the dialog title', () => {
      renderModal();
      expect(screen.getByText('Custom Account Name')).toBeInTheDocument();
    });

    it('prefills input with currentCustomName when set', async () => {
      renderModal({ currentCustomName: 'My Account' });
      const input = screen.getByRole('textbox');
      await waitFor(() => expect(input).toHaveValue('My Account'));
    });

    it('prefills input with "institutionName - Subtype" when customName is null and subtype exists', async () => {
      renderModal({ currentCustomName: null, institutionName: 'Chase', subtype: 'checking' });
      const input = screen.getByRole('textbox');
      await waitFor(() => expect(input).toHaveValue('Chase - Checking'));
    });

    it('capitalizes the first letter of subtype in the prefill', async () => {
      renderModal({ currentCustomName: null, subtype: 'savings' });
      const input = screen.getByRole('textbox');
      await waitFor(() => expect(input).toHaveValue('Chase - Savings'));
    });

    it('prefills input with institutionName alone when customName is null and subtype is null', async () => {
      renderModal({ currentCustomName: null, subtype: null });
      const input = screen.getByRole('textbox');
      await waitFor(() => expect(input).toHaveValue('Chase'));
    });
  });

  describe('Save button', () => {
    it('is disabled when input is empty', async () => {
      renderModal();
      const user = userEvent.setup();
      const input = screen.getByRole('textbox');
      await user.clear(input);
      expect(screen.getByRole('button', { name: /save/i })).toBeDisabled();
    });

    it('is enabled when input has text', async () => {
      renderModal({ currentCustomName: 'My Account' });
      await waitFor(() =>
        expect(screen.getByRole('button', { name: /save/i })).not.toBeDisabled(),
      );
    });

    it('calls setAccountName with accountId and trimmed input value on click', async () => {
      const user = userEvent.setup();
      renderModal({ currentCustomName: 'My Account' });
      await waitFor(() => expect(screen.getByRole('textbox')).toHaveValue('My Account'));
      await user.click(screen.getByRole('button', { name: /save/i }));
      expect(mockSetAccountName).toHaveBeenCalledWith('plaid-account-id-1', 'My Account');
    });

    it('calls onHide and onSuccess on successful save', async () => {
      const user = userEvent.setup();
      renderModal({ currentCustomName: 'My Account' });
      await waitFor(() => expect(screen.getByRole('textbox')).toHaveValue('My Account'));
      await user.click(screen.getByRole('button', { name: /save/i }));
      await waitFor(() => {
        expect(mockOnHide).toHaveBeenCalled();
        expect(mockOnSuccess).toHaveBeenCalledWith('My Account');
      });
    });

    it('shows success toast with the custom name on successful save', async () => {
      const user = userEvent.setup();
      renderModal({ currentCustomName: 'My Account' });
      await waitFor(() => expect(screen.getByRole('textbox')).toHaveValue('My Account'));
      await user.click(screen.getByRole('button', { name: /save/i }));
      await waitFor(() =>
        expect(mockTriggerToast).toHaveBeenCalledWith(
          expect.objectContaining({
            severity: 'success',
            detail: 'Account successfully named My Account',
          }),
        ),
      );
    });

    it('shows "Account not found" toast on 404', async () => {
      mockSetAccountName.mockRejectedValueOnce({ status: 404 });
      const user = userEvent.setup();
      renderModal({ currentCustomName: 'My Account' });
      await waitFor(() => expect(screen.getByRole('textbox')).toHaveValue('My Account'));
      await user.click(screen.getByRole('button', { name: /save/i }));
      await waitFor(() =>
        expect(mockTriggerToast).toHaveBeenCalledWith(
          expect.objectContaining({ severity: 'error', detail: 'Account not found' }),
        ),
      );
    });

    it('shows generic error toast on 403', async () => {
      mockSetAccountName.mockRejectedValueOnce({ status: 403 });
      const user = userEvent.setup();
      renderModal({ currentCustomName: 'My Account' });
      await waitFor(() => expect(screen.getByRole('textbox')).toHaveValue('My Account'));
      await user.click(screen.getByRole('button', { name: /save/i }));
      await waitFor(() =>
        expect(mockTriggerToast).toHaveBeenCalledWith(
          expect.objectContaining({
            severity: 'error',
            detail: 'Error saving account name, please try again',
          }),
        ),
      );
    });

    it('shows generic error toast on 500', async () => {
      mockSetAccountName.mockRejectedValueOnce({ status: 500 });
      const user = userEvent.setup();
      renderModal({ currentCustomName: 'My Account' });
      await waitFor(() => expect(screen.getByRole('textbox')).toHaveValue('My Account'));
      await user.click(screen.getByRole('button', { name: /save/i }));
      await waitFor(() =>
        expect(mockTriggerToast).toHaveBeenCalledWith(
          expect.objectContaining({
            severity: 'error',
            detail: 'Error saving account name, please try again',
          }),
        ),
      );
    });

    it('keeps modal open on error', async () => {
      mockSetAccountName.mockRejectedValueOnce({ status: 500 });
      const user = userEvent.setup();
      renderModal({ currentCustomName: 'My Account' });
      await waitFor(() => expect(screen.getByRole('textbox')).toHaveValue('My Account'));
      await user.click(screen.getByRole('button', { name: /save/i }));
      await waitFor(() => expect(mockTriggerToast).toHaveBeenCalled());
      expect(mockOnHide).not.toHaveBeenCalled();
    });

    it('re-enables Save button after error', async () => {
      mockSetAccountName.mockRejectedValueOnce({ status: 500 });
      const user = userEvent.setup();
      renderModal({ currentCustomName: 'My Account' });
      await waitFor(() => expect(screen.getByRole('textbox')).toHaveValue('My Account'));
      await user.click(screen.getByRole('button', { name: /save/i }));
      await waitFor(() => expect(mockTriggerToast).toHaveBeenCalled());
      expect(screen.getByRole('button', { name: /save/i })).not.toBeDisabled();
    });
  });

  describe('Cancel button', () => {
    it('calls onHide on click', async () => {
      const user = userEvent.setup();
      renderModal({ currentCustomName: 'My Account' });
      await user.click(screen.getByRole('button', { name: /cancel/i }));
      expect(mockOnHide).toHaveBeenCalled();
    });
  });
});
