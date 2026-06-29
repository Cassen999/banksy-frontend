import { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { setAccountName } from '../../services/plaidService';
import { useNotify } from '../../contexts/NotificationContext';

export interface iCustomAccountNameModalProps {
  visible: boolean;
  onHide: () => void;
  accountId: string;
  institutionName: string;
  subtype: string | null;
  currentCustomName: string | null;
  onSuccess: (newName: string) => void;
}

export default function CustomAccountNameModal({
  visible,
  onHide,
  accountId,
  institutionName,
  subtype,
  currentCustomName,
  onSuccess,
}: iCustomAccountNameModalProps) {
  const { triggerToast } = useNotify();
  const [inputValue, setInputValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    let defaultValue: string;
    if (currentCustomName !== null) {
      defaultValue = currentCustomName;
    } else if (subtype) {
      defaultValue = `${institutionName} - ${subtype.charAt(0).toUpperCase()}${subtype.slice(1)}`;
    } else {
      defaultValue = institutionName;
    }
    setInputValue(defaultValue);
    setIsSaving(false);
  }, [visible, currentCustomName, institutionName, subtype]);

  async function handleSave() {
    const trimmed = inputValue.trim();
    setIsSaving(true);
    try {
      await setAccountName(accountId, trimmed);
      onHide();
      onSuccess(trimmed);
      triggerToast({
        severity: 'success',
        summary: 'Success',
        detail: `Account successfully named ${trimmed}`,
      });
    } catch (err: unknown) {
      setIsSaving(false);
      const status = (err as { status?: number }).status;
      const detail =
        status === 404 ? 'Account not found' : 'Error saving account name, please try again';
      triggerToast({ severity: 'error', summary: 'Error', detail });
    }
  }

  const footer = (
    <div className="custom-account-name-modal__footer">
      <Button
        label="Cancel"
        outlined
        severity="secondary"
        disabled={isSaving}
        onClick={onHide}
      />
      <Button
        label="Save"
        disabled={inputValue.trim() === '' || isSaving}
        loading={isSaving}
        onClick={handleSave}
      />
    </div>
  );

  return (
    <Dialog
      header="Custom Account Name"
      visible={visible}
      onHide={onHide}
      footer={footer}
      draggable={false}
      resizable={false}
      dismissableMask
      className="custom-account-name-modal"
    >
      <div className="custom-account-name-modal__body">
        <InputText
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="custom-account-name-modal__input"
          aria-label="Account name"
        />
      </div>
    </Dialog>
  );
}
