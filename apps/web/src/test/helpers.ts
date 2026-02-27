import { createPinia, setActivePinia } from 'pinia';
import { mount, VueWrapper } from '@vue/test-utils';
import { vi } from 'vitest';
import type { Component } from 'vue';

/**
 * 创建测试用的 Pinia 实例
 */
export function createTestPinia() {
  const pinia = createPinia();
  setActivePinia(pinia);
  return pinia;
}

/**
 * 挂载 Vue 组件的测试工具
 */
export function mountWithPinia<T extends Component>(
  component: T,
  options: any = {},
): VueWrapper<any> {
  const pinia = createTestPinia();

  return mount(component, {
    global: {
      plugins: [pinia],
      ...options.global,
    },
    ...options,
  });
}

/**
 * 创建 mock 应用服务
 */
export function createMockApplicationService() {
  return {
    // 通用方法
    initialize: vi.fn().mockResolvedValue(undefined),
    cleanup: vi.fn().mockResolvedValue(undefined),

    // CRUD 操作
    create: vi.fn().mockResolvedValue({ success: true }),
    update: vi.fn().mockResolvedValue({ success: true }),
    delete: vi.fn().mockResolvedValue({ success: true }),
    getById: vi.fn().mockResolvedValue(null),
    getAll: vi.fn().mockResolvedValue([]),

    // 查询操作
    search: vi.fn().mockResolvedValue([]),
    count: vi.fn().mockResolvedValue(0),
  };
}

/**
 * 创建 mock store
 */
export function createMockStore(initialState: any = {}) {
  return {
    ...initialState,
    $reset: vi.fn(),
    $patch: vi.fn(),
    $subscribe: vi.fn(),
    $dispose: vi.fn(),
  };
}

/**
 * 创建 mock Editor Store
 */
export function createMockEditorStore() {
  return {
    // 基础属性
    files: [],
    editorGroups: [],
    ui: {
      activePanel: null,
      sidebarVisible: true,
    },
    settings: {
      theme: 'light',
      fontSize: 14,
    },
    isLoading: false,
    error: null,

    // Store 基础方法
    $reset: vi.fn(),
    $patch: vi.fn(),
    $subscribe: vi.fn(),
    $dispose: vi.fn(),

    // Editor Store 特定方法
    toggleSidebarVisibility: vi.fn(),
    setActivePanel: vi.fn(),
    updateSettings: vi.fn(),
    setError: vi.fn(),

    // 其他可能需要的方法
    addFile: vi.fn(),
    removeFile: vi.fn(),
    createEditorGroup: vi.fn(),
    removeEditorGroup: vi.fn(),
  };
}

/**
 * 创建 mock 实体
 */
export function createMockEntity(overrides: any = {}) {
  return {
    id: 'mock-uuid',
    name: 'Mock Entity',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/**
 * 创建 mock 路由器
 */
export function createMockRouter() {
  return {
    push: vi.fn().mockResolvedValue(undefined),
    replace: vi.fn().mockResolvedValue(undefined),
    go: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    beforeEach: vi.fn(),
    afterEach: vi.fn(),
    currentRoute: {
      value: {
        path: '/mock-path',
        name: 'MockRoute',
        params: {},
        query: {},
        hash: '',
        fullPath: '/mock-path',
        matched: [],
        meta: {},
        redirectedFrom: undefined,
      },
    },
  };
}

/**
 * 异步测试工具 - 等待下一个 tick
 */
export async function nextTick() {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

/**
 * 模拟时间工具
 */
export function mockTime(date: string | Date = '2025-09-25T10:00:00Z') {
  const mockDate = new Date(date);
  vi.setSystemTime(mockDate);
  return mockDate;
}

/**
 * 恢复时间
 */
export function restoreTime() {
  vi.useRealTimers();
}
