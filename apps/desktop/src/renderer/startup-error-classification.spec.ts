import { describe, expect, it } from 'vitest';
import { isNonFatalResizeObserverNotification } from './startup-error-classification';

describe('isNonFatalResizeObserverNotification', () => {
  it.each([
    'ResizeObserver loop completed with undelivered notifications.',
    'ResizeObserver loop limit exceeded',
  ])('accepts the exact browser ResizeObserver notification: %s', (message) => {
    expect(isNonFatalResizeObserverNotification({ message })).toBe(true);
    expect(isNonFatalResizeObserverNotification({ message, error: null })).toBe(true);
  });

  it.each([
    'ResizeObserver loop completed with undelivered notifications',
    'ResizeObserver loop limit exceeded.',
    'ResizeObserver loop completed with undelivered notifications. application failure',
    'resizeobserver loop limit exceeded',
  ])('rejects near matches so application errors remain fatal: %s', (message) => {
    expect(isNonFatalResizeObserverNotification({ message })).toBe(false);
  });

  it('rejects an exact notification when the ErrorEvent carries an application exception', () => {
    expect(
      isNonFatalResizeObserverNotification({
        message: 'ResizeObserver loop completed with undelivered notifications.',
        error: new Error('ResizeObserver loop completed with undelivered notifications.'),
      }),
    ).toBe(false);
  });
});
