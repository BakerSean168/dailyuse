import { vi } from 'vitest';

type ConsoleMethod = 'warn' | 'error' | 'info' | 'log';

export interface BrowserMockOptions {
  mockFetch?: boolean;
  mockMatchMedia?: boolean;
  mockIntersectionObserver?: boolean;
  mockResizeObserver?: boolean;
  silenceConsole?: ConsoleMethod[];
}

/**
 * Local DOM-like stubs so non-DOM package typechecks (goal/reminder) can pull the
 * test-utils barrel without requiring the DOM lib.
 */
type BrowserWindowLike = {
  matchMedia?: unknown;
};

type IntersectionObserverCtor = new (
  callback?: (...args: unknown[]) => void,
  options?: unknown,
) => {
  root: null;
  rootMargin: string;
  thresholds: unknown[];
  observe: (...args: unknown[]) => void;
  unobserve: (...args: unknown[]) => void;
  disconnect: () => void;
  takeRecords: () => unknown[];
};

type ResizeObserverCtor = new (callback?: (...args: unknown[]) => void) => {
  observe: (...args: unknown[]) => void;
  unobserve: (...args: unknown[]) => void;
  disconnect: () => void;
};

/**
 * Isolated host shape — cast via unknown so packages with and without DOM lib
 * both typecheck. Intersecting `typeof globalThis` would collide with real DOM
 * constructors when DOM is present.
 */
type BrowserGlobal = {
  IntersectionObserver: IntersectionObserverCtor;
  ResizeObserver: ResizeObserverCtor;
  fetch: (...args: unknown[]) => Promise<unknown>;
  window?: BrowserWindowLike;
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

  const browserGlobal = globalThis as unknown as BrowserGlobal;
  const browserWindow = browserGlobal.window;

  if (mockMatchMedia && browserWindow) {
    Object.defineProperty(browserWindow, 'matchMedia', {
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
      MockIntersectionObserver as unknown as IntersectionObserverCtor;
  }

  if (mockResizeObserver) {
    class MockResizeObserver {
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = vi.fn();
    }

    browserGlobal.ResizeObserver = MockResizeObserver as unknown as ResizeObserverCtor;
  }

  if (mockFetch) {
    Object.defineProperty(browserGlobal, 'fetch', {
      configurable: true,
      writable: true,
      value: vi.fn() as unknown as BrowserGlobal['fetch'],
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
