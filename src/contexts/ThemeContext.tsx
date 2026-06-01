import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import lightThemeUrl from 'primereact/resources/themes/lara-light-blue/theme.css?url';
import darkThemeUrl from 'primereact/resources/themes/lara-dark-blue/theme.css?url';

type tTheme = 'light' | 'dark';

interface iThemeContextValue {
  theme: tTheme;
  toggleTheme: () => void;
}

interface iThemeProviderProps {
  children: ReactNode;
}

const STORAGE_KEY = 'theme';
const LINK_ID = 'primereact-theme';

const themeUrls: Record<tTheme, string> = {
  light: lightThemeUrl,
  dark: darkThemeUrl,
};

const ThemeContext = createContext<iThemeContextValue | null>(null);

function getInitialTheme(): tTheme {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme: tTheme): void {
  document.documentElement.setAttribute('data-theme', theme);
  let link = document.getElementById(LINK_ID) as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement('link');
    link.id = LINK_ID;
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }
  link.href = themeUrls[theme];
}

export function ThemeProvider({ children }: iThemeProviderProps) {
  const [theme, setTheme] = useState<tTheme>(getInitialTheme);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem(STORAGE_KEY)) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const value = useMemo<iThemeContextValue>(
    () => ({
      theme,
      toggleTheme: () => {
        setTheme((prev) => {
          const next: tTheme = prev === 'light' ? 'dark' : 'light';
          localStorage.setItem(STORAGE_KEY, next);
          return next;
        });
      },
    }),
    [theme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme(): iThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
