import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ThemeProvider, useTheme } from '../ThemeContext';

vi.mock('primereact/resources/themes/lara-light-blue/theme.css?url', () => ({
  default: '/mock-light.css',
}));
vi.mock('primereact/resources/themes/lara-dark-blue/theme.css?url', () => ({
  default: '/mock-dark.css',
}));

let mediaQueryHandlers: Array<(e: MediaQueryListEvent) => void> = [];

function setupMatchMedia(systemPrefersDark: boolean) {
  mediaQueryHandlers = [];
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: vi.fn().mockReturnValue({
      matches: systemPrefersDark,
      addEventListener: vi.fn((_: string, handler: (e: MediaQueryListEvent) => void) => {
        mediaQueryHandlers.push(handler);
      }),
      removeEventListener: vi.fn(),
    }),
  });
}

function fireSystemThemeChange(prefersDark: boolean) {
  act(() => {
    mediaQueryHandlers.forEach((h) => h({ matches: prefersDark } as MediaQueryListEvent));
  });
}

function TestConsumer() {
  const { theme, toggleTheme } = useTheme();
  return (
    <>
      <span data-testid="theme">{theme}</span>
      <button onClick={toggleTheme}>toggle</button>
    </>
  );
}

describe('ThemeContext', () => {
  beforeEach(() => {
    localStorage.clear();
    setupMatchMedia(false);
    vi.spyOn(document.documentElement, 'setAttribute');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.getElementById('primereact-theme')?.remove();
  });

  // Initialisation — no stored preference

  it('defaults to light when system prefers light and no stored preference', () => {
    render(<ThemeProvider><TestConsumer /></ThemeProvider>);
    expect(screen.getByTestId('theme').textContent).toBe('light');
  });

  it('defaults to dark when system prefers dark and no stored preference', () => {
    setupMatchMedia(true);
    render(<ThemeProvider><TestConsumer /></ThemeProvider>);
    expect(screen.getByTestId('theme').textContent).toBe('dark');
  });

  // Initialisation — stored preference overrides system

  it('uses stored "light" preference even when system prefers dark', () => {
    localStorage.setItem('theme', 'light');
    setupMatchMedia(true);
    render(<ThemeProvider><TestConsumer /></ThemeProvider>);
    expect(screen.getByTestId('theme').textContent).toBe('light');
  });

  it('uses stored "dark" preference even when system prefers light', () => {
    localStorage.setItem('theme', 'dark');
    render(<ThemeProvider><TestConsumer /></ThemeProvider>);
    expect(screen.getByTestId('theme').textContent).toBe('dark');
  });

  // Toggle

  it('toggles from light to dark', async () => {
    render(<ThemeProvider><TestConsumer /></ThemeProvider>);
    await userEvent.click(screen.getByRole('button'));
    expect(screen.getByTestId('theme').textContent).toBe('dark');
  });

  it('toggles from dark to light', async () => {
    localStorage.setItem('theme', 'dark');
    render(<ThemeProvider><TestConsumer /></ThemeProvider>);
    await userEvent.click(screen.getByRole('button'));
    expect(screen.getByTestId('theme').textContent).toBe('light');
  });

  it('persists new theme to localStorage on toggle', async () => {
    render(<ThemeProvider><TestConsumer /></ThemeProvider>);
    await userEvent.click(screen.getByRole('button'));
    expect(localStorage.getItem('theme')).toBe('dark');
  });

  it('sets data-theme attribute on document root when theme changes', async () => {
    render(<ThemeProvider><TestConsumer /></ThemeProvider>);
    await userEvent.click(screen.getByRole('button'));
    expect(document.documentElement.setAttribute).toHaveBeenCalledWith('data-theme', 'dark');
  });

  // System preference change

  it('updates to dark when system switches to dark and no user override exists', () => {
    render(<ThemeProvider><TestConsumer /></ThemeProvider>);
    expect(screen.getByTestId('theme').textContent).toBe('light');
    fireSystemThemeChange(true);
    expect(screen.getByTestId('theme').textContent).toBe('dark');
  });

  it('ignores system preference change when user has a stored override', () => {
    localStorage.setItem('theme', 'light');
    render(<ThemeProvider><TestConsumer /></ThemeProvider>);
    fireSystemThemeChange(true);
    expect(screen.getByTestId('theme').textContent).toBe('light');
  });

  // Error boundary

  it('throws a descriptive error when useTheme is used outside ThemeProvider', () => {
    const BadConsumer = () => { useTheme(); return null; };
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<BadConsumer />)).toThrow('useTheme must be used within ThemeProvider');
    spy.mockRestore();
  });
});
