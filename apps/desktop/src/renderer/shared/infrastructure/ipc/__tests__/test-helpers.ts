/**
 * Test Helpers - IPC 测试辅助工具
 * 
 * @module renderer/shared/infrastructure/ipc/__tests__
 */

import type { IPCResponse, IPCErrorData, BatchRequestItem, BatchResponseItem } from '../ipc-types';
import { IPCErrorCode } from '../ipc-types';
import { IPCMock, createIPCMock } from './ipc-mock';

// ============ Test Data Factories ============

/**
 * 创建成功响应
 */
export function createSuccessResponse<T>(data: T): IPCResponse<T> {
  return {
    success: true,
    data,
  };
}

/**
 * 创建失败响应
 */
export function createErrorResponse(
  code: IPCErrorCode,
  message: string,
  details?: Record<string, unknown>
): IPCResponse<never> {
  return {
    success: false,
    error: {
      code,
      message,
      details,
    },
  };
}

/**
 * 创建验证错误响应
 */
export function createValidationErrorResponse(
  validationErrors: Record<string, string[]>
): IPCResponse<never> {
  return createErrorResponse(
    IPCErrorCode.VALIDATION,
    'Validation failed',
    { validationErrors }
  );
}

/**
 * 创建未找到错误响应
 */
export function createNotFoundResponse(resource: string): IPCResponse<never> {
  return createErrorResponse(
    IPCErrorCode.NOT_FOUND,
    `${resource} not found`,
    { resource }
  );
}

/**
 * 创建批量请求项
 */
export function createBatchRequestItem<T = unknown>(
  channel: string,
  payload?: unknown
): BatchRequestItem<T> {
  return { channel, payload };
}

/**
 * 创建批量响应项
 */
export function createBatchResponseItem<T>(
  request: BatchRequestItem,
  success: boolean,
  dataOrError: T | IPCErrorData
): BatchResponseItem<T> {
  if (success) {
    return { success: true, data: dataOrError as T, request };
  }
  return { success: false, error: dataOrError as IPCErrorData, request };
}

// ============ Mock Setup Helpers ============

/**
 * 创建带预设 handlers 的 mock
 */
export function createMockWithHandlers(
  handlers: Record<string, (payload?: unknown) => unknown>
): IPCMock {
  const mock = createIPCMock();
  for (const [channel, handler] of Object.entries(handlers)) {
    mock.on(channel, handler);
  }
  return mock;
}

/**
 * 创建 CRUD mock handlers
 */
export function createCRUDMockHandlers<T extends { id: string }>(
  channelPrefix: string,
  initialData: T[] = []
): {
  mock: IPCMock;
  getData: () => T[];
  setData: (data: T[]) => void;
} {
  let data = [...initialData];
  const mock = createIPCMock();

  // List
  mock.on(`${channelPrefix}:list`, () => data);

  // Get
  mock.on(`${channelPrefix}:get`, (payload) => {
    const p = payload as { id: string } | undefined;
    const item = data.find(d => d.id === p?.id);
    if (!item) {
      throw { code: IPCErrorCode.NOT_FOUND, message: 'Not found' };
    }
    return item;
  });

  // Create
  mock.on(`${channelPrefix}:create`, (payload) => {
    const p = payload as Omit<T, 'id'> | undefined;
    const newItem = { ...p, id: `mock-${Date.now()}` } as T;
    data.push(newItem);
    return newItem;
  });

  // Update
  mock.on(`${channelPrefix}:update`, (payload) => {
    const p = payload as (Partial<T> & { id: string }) | undefined;
    const index = data.findIndex(d => d.id === p?.id);
    if (index === -1) {
      throw { code: IPCErrorCode.NOT_FOUND, message: 'Not found' };
    }
    data[index] = { ...data[index], ...p };
    return data[index];
  });

  // Delete
  mock.on(`${channelPrefix}:delete`, (payload) => {
    const p = payload as { id: string } | undefined;
    const index = data.findIndex(d => d.id === p?.id);
    if (index === -1) {
      throw { code: IPCErrorCode.NOT_FOUND, message: 'Not found' };
    }
    data.splice(index, 1);
    return { success: true };
  });

  return {
    mock,
    getData: () => [...data],
    setData: (newData: T[]) => { data = [...newData]; },
  };
}

// ============ Async Helpers ============

/**
 * 等待所有 pending promises
 */
export async function flushPromises(): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 0));
}

/**
 * 等待指定时间
 */
export async function wait(ms: number): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 等待条件满足
 */
export async function waitFor(
  condition: () => boolean,
  timeout = 5000,
  interval = 100
): Promise<void> {
  const startTime = Date.now();
  while (!condition()) {
    if (Date.now() - startTime > timeout) {
      throw new Error('waitFor timeout');
    }
    await wait(interval);
  }
}

// ============ Assertion Helpers ============

/**
 * 断言异步函数抛出错误
 */
export async function expectAsyncError(
  fn: () => Promise<unknown>,
  expectedCode?: IPCErrorCode
): Promise<void> {
  let error: unknown;
  try {
    await fn();
  } catch (e) {
    error = e;
  }

  if (!error) {
    throw new Error('Expected function to throw an error, but it did not.');
  }

  if (expectedCode && (error as { code?: string }).code !== expectedCode) {
    throw new Error(
      `Expected error code '${expectedCode}', but got '${(error as { code?: string }).code}'`
    );
  }
}

/**
 * 断言调用在指定时间内完成
 */
export async function expectToCompleteWithin<T>(
  fn: () => Promise<T>,
  maxDuration: number
): Promise<T> {
  const startTime = Date.now();
  const result = await fn();
  const duration = Date.now() - startTime;

  if (duration > maxDuration) {
    throw new Error(
      `Expected to complete within ${maxDuration}ms, but took ${duration}ms`
    );
  }

  return result;
}

// ============ Test Context ============

export interface TestContext {
  mock: IPCMock;
  cleanup: () => void;
}

/**
 * 创建测试上下文
 */
export function createTestContext(config?: { logging?: boolean }): TestContext {
  const mock = createIPCMock({ logging: config?.logging });
  mock.install();

  return {
    mock,
    cleanup: () => {
      mock.uninstall();
      mock.reset();
    },
  };
}

/**
 * 用于 Jest/Vitest 的 beforeEach/afterEach 辅助
 */
export function setupTestContext(): {
  getMock: () => IPCMock;
  setup: () => void;
  teardown: () => void;
} {
  let context: TestContext | null = null;

  return {
    getMock: () => {
      if (!context) {
        throw new Error('Test context not initialized. Call setup() first.');
      }
      return context.mock;
    },
    setup: () => {
      context = createTestContext();
    },
    teardown: () => {
      if (context) {
        context.cleanup();
        context = null;
      }
    },
  };
}
