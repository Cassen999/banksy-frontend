import { describe, it, expect, afterEach } from 'vitest';
import { isDesktop } from './isDesktop';

describe('isDesktop', () => {
  const originalWidth = window.innerWidth;

  afterEach(() => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: originalWidth });
  });

  it('returns true when innerWidth is exactly 1024', () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1024 });
    expect(isDesktop()).toBe(true);
  });

  it('returns true when innerWidth is greater than 1024', () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1440 });
    expect(isDesktop()).toBe(true);
  });

  it('returns false when innerWidth is less than 1024', () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1023 });
    expect(isDesktop()).toBe(false);
  });
});
