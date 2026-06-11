import { useEffect, useRef } from 'react';
import { ProgressSpinner } from 'primereact/progressspinner';
import { useAuth } from '../../contexts/AuthContext';
import { useNotify } from '../../contexts/NotificationContext';
import AuthButton from '../AuthButton/AuthButton';
import type { iAuthButtonHandle } from '../AuthButton/AuthButton';

export default function ViewportMask() {
  const { user, isLoading } = useAuth();
  const { triggerToast } = useNotify();
  const loginButtonRef = useRef<iAuthButtonHandle>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      const flag = sessionStorage.getItem('banksy_login_pending');
      if (flag) {
        sessionStorage.removeItem('banksy_login_pending');
        triggerToast({
          severity: 'error',
          summary: 'Something went wrong, please try to login again',
        });
        loginButtonRef.current?.focus();
      }
    }
  }, [isLoading, user, triggerToast]);

  if (user) return null;

  return (
    <div
      className="viewport-mask"
      role="dialog"
      aria-label="Authentication required"
      aria-modal="true"
    >
      {isLoading ? (
        <ProgressSpinner aria-label="Loading" />
      ) : (
        <>
          <p className="viewport-mask__message">Please login to be finance guy</p>
          <AuthButton ref={loginButtonRef} />
        </>
      )}
    </div>
  );
}
