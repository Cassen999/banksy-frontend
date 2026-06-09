import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { fetchMe } from '../services/authService';
import type { iUser } from '../types/types';

interface iAuthContextValue {
  user: iUser | null;
  isLoading: boolean;
  clearUser: () => void;
}

interface iAuthProviderProps {
  children: ReactNode;
}

const AuthContext = createContext<iAuthContextValue | null>(null);

export function AuthProvider({ children }: iAuthProviderProps) {
  const [user, setUser] = useState<iUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const clearUser = useCallback(() => setUser(null), []);

  useEffect(() => {
    fetchMe()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false));
  }, []);

  const value = useMemo<iAuthContextValue>(
    () => ({ user, isLoading, clearUser }),
    [user, isLoading, clearUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): iAuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
