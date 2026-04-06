import { createPinia, setActivePinia } from 'pinia';
import { vi } from 'vitest';
import { config } from '@vue/test-utils';

const globalWithMocks = globalThis as typeof globalThis & {
  IntersectionObserver: typeof IntersectionObserver;
  ResizeObserver: typeof ResizeObserver;
  fetch: typeof fetch;
};

// 创建全局 Pinia 实例
const pinia = createPinia();
setActivePinia(pinia);

// 配置 Vue Test Utils 全局属性
config.global.plugins = [pinia];

// Mock browser APIs
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver
globalWithMocks.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
})) as unknown as typeof IntersectionObserver;

// Mock ResizeObserver
globalWithMocks.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
})) as unknown as typeof ResizeObserver;

// Mock fetch
globalWithMocks.fetch = vi.fn() as unknown as typeof fetch;

// Mock console methods to reduce noise in tests
console.warn = vi.fn();
console.error = vi.fn();
