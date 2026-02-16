/**
 * IPC 测试设置文件
 *
 * 初始化测试环境，配置全局 mock
 */

import { vi, beforeEach, afterEach } from 'vitest';

// Mock electron 模块
vi.mock('electron', () => ({
  ipcMain: {
    handle: vi.fn(),
    on: vi.fn(),
    removeHandler: vi.fn(),
    removeAllListeners: vi.fn(),
  },
  app: {
    getPath: vi.fn(() => '/mock/path'),
    whenReady: vi.fn(() => Promise.resolve()),
  },
  BrowserWindow: vi.fn(),
}));

// 全局测试钩子
beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// 全局辅助函数
declare global {

  var testHelpers: {
    createMockAccountId: () => string;
    delay: (ms: number) => Promise<void>;
  };
}

globalThis.testHelpers = {
  createMockAccountId: () => `account-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  delay: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),
};
