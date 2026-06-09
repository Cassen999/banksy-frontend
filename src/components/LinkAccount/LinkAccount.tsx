import { Button } from 'primereact/button';
import { useLinkAccount } from '../../hooks/useLinkAccount';

export default function LinkAccount() {
  const { isLoading, initiateLinkFlow } = useLinkAccount();

  return (
    <Button
      label="Link Account"
      loading={isLoading}
      disabled={isLoading}
      onClick={initiateLinkFlow}
    />
  );
}
