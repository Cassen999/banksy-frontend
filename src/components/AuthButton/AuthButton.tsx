import { forwardRef, useRef, useImperativeHandle } from 'react';
import { Button } from 'primereact/button';
import { useAuth } from '../../contexts/AuthContext';

export interface iAuthButtonHandle {
  focus: () => void;
}

const AuthButton = forwardRef<iAuthButtonHandle>((_, ref) => {
  const { user } = useAuth();
  const wrapperRef = useRef<HTMLSpanElement>(null);

  useImperativeHandle(ref, () => ({
    focus: () => wrapperRef.current?.querySelector<HTMLButtonElement>('button')?.focus(),
  }));

  function handleLogin() {
    sessionStorage.setItem('banksy_login_pending', '1');
    window.location.href = `${import.meta.env.VITE_API_BASE_URL}/oauth2/authorization/google`;
  }

  function handleLogout() {
    window.location.href = `${import.meta.env.VITE_API_BASE_URL}/logout`;
  }

  return (
    // display:contents removes the span from layout so it has no visual effect
    <span ref={wrapperRef} style={{ display: 'contents' }}>
      <Button
        label={user ? 'Logout' : 'Login'}
        rounded
        onClick={user ? handleLogout : handleLogin}
        className="auth-button"
      />
    </span>
  );
});

AuthButton.displayName = 'AuthButton';

export default AuthButton;
