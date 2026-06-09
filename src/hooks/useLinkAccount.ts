import { useState, useEffect } from 'react';
import { usePlaidLink } from 'react-plaid-link';
import type { PlaidLinkOnSuccess, PlaidLinkOnExit } from 'react-plaid-link';
import { fetchLinkToken, exchangePublicToken } from '../services/plaidService';
import { useNotify } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';

const ERROR_MESSAGE = 'Something went wrong linking your bank. Please try again';

export function useLinkAccount() {
  const [isLoading, setIsLoading] = useState(false);
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const { triggerToast } = useNotify();
  const { user } = useAuth();

  const onSuccess: PlaidLinkOnSuccess = async (publicToken, metadata) => {
    try {
      const response = await exchangePublicToken({
        publicToken,
        institutionId: metadata.institution?.institution_id ?? '',
        institutionName: metadata.institution?.name ?? '',
        expiredItemId: null,
      });
      triggerToast({ severity: 'success', summary: response.message });
    } catch {
      triggerToast({ severity: 'error', summary: ERROR_MESSAGE });
    } finally {
      setIsLoading(false);
      setLinkToken(null);
    }
  };

  const onExit: PlaidLinkOnExit = (error) => {
    if (error) {
      triggerToast({ severity: 'error', summary: ERROR_MESSAGE });
    }
    setIsLoading(false);
    setLinkToken(null);
  };

  const { open, ready } = usePlaidLink({ token: linkToken, onSuccess, onExit });

  useEffect(() => {
    if (ready && linkToken) {
      open();
    }
  }, [ready, linkToken, open]);

  async function initiateLinkFlow() {
    if (!user) {
      triggerToast({ severity: 'info', summary: 'Please login to add a bank account' });
      return;
    }
    setIsLoading(true);
    try {
      const { link_token } = await fetchLinkToken();
      setLinkToken(link_token);
    } catch {
      triggerToast({ severity: 'error', summary: ERROR_MESSAGE });
      setIsLoading(false);
    }
  }

  return { isLoading, initiateLinkFlow };
}
