import { vi } from 'vitest';

type ConsoleMethod = 'warn' | 'error' | 'info' | 'log';

export interface BrowserMockOptions {
  mockFetch?: boolean;
  mockMatchMedia?: boolean;
  mockIntersectionObserver?: boolean;
  mockResizeObserver?: boolean;
  silenceConsole?: ConsoleMethod[];
}

type BrowserGlobal = typeof globalThis & {
  IntersectionObserver: typeof IntersectionObserver;
  ResizeObserver: typeof ResizeObserver;
  fetch: typeof fetch;
};

/**
 * Install common browser-facing mocks for fast UI tests.
 *
 * This keeps app-local setup files small while making the mocked browser
 * surface explicit at the call site.
 */
export function installCommonBrowserMocks(options: BrowserMockOptions = {}) {
  const {
    mockFetch = true,
    mockMatchMedia = true,
    mockIntersectionObserver = true,
    mockResizeObserver = true,
    silenceConsole = [],
  } = options;

  const browserGlobal = globalThis as BrowserGlobal;

  if (mockMatchMedia && typeof window !== 'undefined') {
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      writable: true,
      value: createMatchMediaMock(),
    });
  }

  if (mockIntersectionObserver) {
    class MockIntersectionObserver {
      readonly root = null;
      readonly rootMargin = '';
      readonly thresholds = [];
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = vi.fn();
      takeRecords = vi.fn(() => []);
    }

    browserGlobal.IntersectionObserver =
      MockIntersectionObserver as unknown as typeof IntersectionObserver;
  }

  if (mockResizeObserver) {
    class MockResizeObserver {
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = vi.fn();
    }

    browserGlobal.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;
  }

  if (mockFetch) {
    Object.defineProperty(browserGlobal, 'fetch', {
      configurable: true,
      writable: true,
      value: vi.fn() as unknown as typeof fetch,
    });
  }

  for (const method of silenceConsole) {
    console[method] = vi.fn();
  }
}

export function createMatchMediaMock() {
  return vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}
