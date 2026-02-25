/**
 * Test Data Factories
 *
 * 用于快速创建测试数据的工厂函数。
 * 每个工厂函数都支持 overrides 参数来自定义特定字段。
 */

import { generateUUID, createTimestamp } from '../helpers';

// ===== Goal Factory =====

/**
 * 创建测试用的 CreateGoalReq 输入
 */
export function createGoalInput(overrides: Record<string, unknown> = {}) {
  return {
    title: `Test Goal ${generateUUID().slice(0, 8)}`,
    description: 'A test goal description',
    color: '#3B82F6',
    importance: 'MEDIUM' as const,
    category: null,
    tags: [],
    startDate: undefined,
    targetDate: undefined,
    folderId: undefined,
    parentGoalId: undefined,
    ...overrides,
  };
}

/**
 * 创建测试用的 Context
 */
export function createTestContext(overrides: Record<string, unknown> = {}) {
  return {
    identityId: `identity-${generateUUID().slice(0, 8)}`,
    deviceId: `device-${generateUUID().slice(0, 8)}`,
    ...overrides,
  };
}

/**
 * 创建模拟的 GoalClientDTO
 */
export function createGoalDTO(overrides: Record<string, unknown> = {}) {
  const now = createTimestamp();
  const id = generateUUID();
  return {
    id,
    identityId: `identity-${generateUUID().slice(0, 8)}`,
    name: `Test Goal ${id.slice(0, 8)}`,
    description: null,
    color: '#3B82F6',
    feasibilityAnalysis: null,
    motivation: null,
    status: 'ACTIVE',
    importance: 'MEDIUM',
    priority: 50,
    category: null,
    tags: [],
    startDate: null,
    targetDate: null,
    completedAt: null,
    archivedAt: null,
    folderId: null,
    parentGoalId: null,
    sortOrder: 0,
    reminderConfig: null,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    version: 1,
    keyResults: null,
    reviews: null,
    ...overrides,
  };
}

// ===== Task Factory =====

/**
 * 创建测试用的 TaskInstance 输入数据
 */
export function createTaskInstanceInput(overrides: Record<string, unknown> = {}) {
  return {
    templateId: generateUUID(),
    identityId: `identity-${generateUUID().slice(0, 8)}`,
    instanceDate: createTimestamp(),
    importance: 'IMPORTANT' as const,
    ...overrides,
  };
}

// ===== Account Factory =====

/**
 * 创建测试用的账户数据
 */
export function createAccountData(overrides: Record<string, unknown> = {}) {
  const id = generateUUID();
  return {
    id,
    email: `user-${id.slice(0, 8)}@test.com`,
    name: `Test User ${id.slice(0, 8)}`,
    createdAt: createTimestamp(),
    updatedAt: createTimestamp(),
    ...overrides,
  };
}
