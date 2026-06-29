import { useState } from 'react';
import { Button } from 'primereact/button';
import type { ButtonProps } from 'primereact/button';
import CustomAccountNameModal from '../CustomAccountNameModal/CustomAccountNameModal';

interface iCustomAccountNameButtonProps {
  accountId: string;
  institutionName: string;
  subtype: string | null;
  currentCustomName: string | null;
  onSuccess: (newName: string) => void;
  buttonProps?: Omit<ButtonProps, 'label' | 'onClick'>;
}

export default function CustomAccountNameButton({
  accountId,
  institutionName,
  subtype,
  currentCustomName,
  onSuccess,
  buttonProps,
}: iCustomAccountNameButtonProps) {
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <>
      <Button
        text
        rounded
        {...buttonProps}
        className={`custom-account-name-button${buttonProps?.className ? ` ${buttonProps.className}` : ''}`}
        icon="pi pi-pen-to-square"
        aria-label={currentCustomName !== null ? 'Edit account name' : 'Add account name'}
        onClick={() => setModalVisible(true)}
      />
      <CustomAccountNameModal
        visible={modalVisible}
        onHide={() => setModalVisible(false)}
        accountId={accountId}
        institutionName={institutionName}
        subtype={subtype}
        currentCustomName={currentCustomName}
        onSuccess={onSuccess}
      />
    </>
  );
}
