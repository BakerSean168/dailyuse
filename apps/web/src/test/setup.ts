import { createPinia, setActivePinia } from 'pinia';
import { vi } from 'vitest';
import { config } from '@vue/test-utils';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';

// 创建 Vuetify 实例
const vuetify = createVuetify({
  components,
  directives,
});

// 创建全局 Pinia 实例
const pinia = createPinia();
setActivePinia(pinia);

// 配置 Vue Test Utils 全局属性
config.global.plugins = [pinia, vuetify];

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
(globalThis as any).IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock ResizeObserver
(globalThis as any).ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock fetch
(globalThis as any).fetch = vi.fn();

// Mock console methods to reduce noise in tests
console.warn = vi.fn();
console.error = vi.fn();
