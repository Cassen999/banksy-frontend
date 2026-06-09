import { describe, it, expect, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { NotificationProvider, useNotify } from '../NotificationContext';
import type { ToastMessage } from 'primereact/toast';
import type { MessageProps } from 'primereact/message';

function wrapper({ children }: { children: ReactNode }) {
  return <NotificationProvider>{children}</NotificationProvider>;
}

describe('useNotify', () => {
  it('throws when used outside provider', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useNotify())).toThrow(
      'useNotify must be used within NotificationProvider',
    );
    consoleSpy.mockRestore();
  });
});

describe('NotificationContext — initial state', () => {
  it('starts with toast hidden and no config', () => {
    const { result } = renderHook(() => useNotify(), { wrapper });
    expect(result.current.showToast).toBe(false);
    expect(result.current.toastConfig).toBeNull();
  });

  it('starts with banner hidden and no config', () => {
    const { result } = renderHook(() => useNotify(), { wrapper });
    expect(result.current.showBanner).toBe(false);
    expect(result.current.bannerConfig).toBeNull();
  });

  it('exports a toastRef object', () => {
    const { result } = renderHook(() => useNotify(), { wrapper });
    expect(result.current.toastRef).toBeDefined();
    expect(typeof result.current.toastRef).toBe('object');
    expect('current' in result.current.toastRef).toBe(true);
  });
});

describe('NotificationContext — toast', () => {
  const config: ToastMessage = { summary: 'Test', detail: 'Hello' };

  it('triggerToast sets showToast to true and stores config', () => {
    const { result } = renderHook(() => useNotify(), { wrapper });
    act(() => { result.current.triggerToast(config); });
    expect(result.current.showToast).toBe(true);
    expect(result.current.toastConfig).toMatchObject(config);
  });

  it('applies default duration of 3000 as life', () => {
    const { result } = renderHook(() => useNotify(), { wrapper });
    act(() => { result.current.triggerToast(config); });
    expect(result.current.toastConfig?.life).toBe(3000);
  });

  it('applies custom duration as life', () => {
    const { result } = renderHook(() => useNotify(), { wrapper });
    act(() => { result.current.triggerToast(config, 5000); });
    expect(result.current.toastConfig?.life).toBe(5000);
  });

  it('calls toastRef.current.show() with config including life', () => {
    const { result } = renderHook(() => useNotify(), { wrapper });
    const mockShow = vi.fn();
    Object.defineProperty(result.current.toastRef, 'current', {
      value: { show: mockShow },
      writable: true,
    });
    act(() => { result.current.triggerToast(config, 4000); });
    expect(mockShow).toHaveBeenCalledWith({ ...config, life: 4000 });
  });

  it('hideToast resets showToast and toastConfig', () => {
    const { result } = renderHook(() => useNotify(), { wrapper });
    act(() => { result.current.triggerToast(config); });
    act(() => { result.current.hideToast(); });
    expect(result.current.showToast).toBe(false);
    expect(result.current.toastConfig).toBeNull();
  });
});

describe('NotificationContext — banner', () => {
  const config: MessageProps = { severity: 'error', text: 'Something went wrong' };

  it('triggerBanner sets showBanner to true and stores config', () => {
    const { result } = renderHook(() => useNotify(), { wrapper });
    act(() => { result.current.triggerBanner(config); });
    expect(result.current.showBanner).toBe(true);
    expect(result.current.bannerConfig).toEqual(config);
  });

  it('hideBanner resets showBanner and bannerConfig', () => {
    const { result } = renderHook(() => useNotify(), { wrapper });
    act(() => { result.current.triggerBanner(config); });
    act(() => { result.current.hideBanner(); });
    expect(result.current.showBanner).toBe(false);
    expect(result.current.bannerConfig).toBeNull();
  });
});

describe('NotificationContext — independence', () => {
  it('hideToast does not affect banner state', () => {
    const { result } = renderHook(() => useNotify(), { wrapper });
    act(() => { result.current.triggerBanner({ text: 'banner' }); });
    act(() => { result.current.hideToast(); });
    expect(result.current.showBanner).toBe(true);
    expect(result.current.bannerConfig).toEqual({ text: 'banner' });
  });

  it('hideBanner does not affect toast state', () => {
    const { result } = renderHook(() => useNotify(), { wrapper });
    act(() => { result.current.triggerToast({ summary: 'toast' }); });
    act(() => { result.current.hideBanner(); });
    expect(result.current.showToast).toBe(true);
    expect(result.current.toastConfig).toMatchObject({ summary: 'toast' });
  });
});

describe('NotificationContext — memoization', () => {
  it('context value reference is stable when state has not changed', () => {
    const { result, rerender } = renderHook(() => useNotify(), { wrapper });
    const first = result.current;
    rerender();
    expect(result.current).toBe(first);
  });
});
