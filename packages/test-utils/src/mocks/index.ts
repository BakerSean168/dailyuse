/**
 * Mock Repository Factories
 *
 * 为各模块仓储接口创建 Mock 实现，用于 Service/Use Case 层的单元测试。
 * 遵循 DDD 仓储接口契约。
 */

import { vi, type Mock } from 'vitest';

// ===== Generic Repository Mock Factory =====

/**
 * 创建通用的 Repository Mock
 * 适用于遵循标准 CRUD 模式的仓储
 */
export function createBaseMockRepository() {
  return {
    save: vi.fn().mockResolvedValue(undefined),
    findById: vi.fn().mockResolvedValue(null),
    delete: vi.fn().mockResolvedValue(undefined),
    exists: vi.fn().mockResolvedValue(false),
  };
}

// ===== Goal Repository Mock =====

export interface MockGoalRepository {
  save: Mock;
  findById: Mock;
  findByIdentityId: Mock;
  findByFolderId: Mock;
  delete: Mock;
  exists: Mock;
  batchUpdateStatus: Mock;
  batchMoveToFolder: Mock;
  isAncestor: Mock;
  findChildren: Mock;
}

/**
 * 创建 IGoalRepository 的完整 Mock 实现
 */
export function createMockGoalRepository(): MockGoalRepository {
  return {
    save: vi.fn().mockResolvedValue(undefined),
    findById: vi.fn().mockResolvedValue(null),
    findByIdentityId: vi.fn().mockResolvedValue([]),
    findByFolderId: vi.fn().mockResolvedValue([]),
    delete: vi.fn().mockResolvedValue(undefined),
    exists: vi.fn().mockResolvedValue(false),
    batchUpdateStatus: vi.fn().mockResolvedValue(undefined),
    batchMoveToFolder: vi.fn().mockResolvedValue(undefined),
    isAncestor: vi.fn().mockResolvedValue(false),
    findChildren: vi.fn().mockResolvedValue([]),
  };
}

// ===== Goal Folder Repository Mock =====

export interface MockGoalFolderRepository {
  save: Mock;
  findById: Mock;
  findByIdentityId: Mock;
  delete: Mock;
  exists: Mock;
}

export function createMockGoalFolderRepository(): MockGoalFolderRepository {
  return {
    save: vi.fn().mockResolvedValue(undefined),
    findById: vi.fn().mockResolvedValue(null),
    findByIdentityId: vi.fn().mockResolvedValue([]),
    delete: vi.fn().mockResolvedValue(undefined),
    exists: vi.fn().mockResolvedValue(false),
  };
}

// ===== Task Repository Mocks =====

export interface MockTaskTemplateRepository {
  save: Mock;
  findById: Mock;
  findByIdentityId: Mock;
  delete: Mock;
  exists: Mock;
}

export function createMockTaskTemplateRepository(): MockTaskTemplateRepository {
  return {
    save: vi.fn().mockResolvedValue(undefined),
    findById: vi.fn().mockResolvedValue(null),
    findByIdentityId: vi.fn().mockResolvedValue([]),
    delete: vi.fn().mockResolvedValue(undefined),
    exists: vi.fn().mockResolvedValue(false),
  };
}

export interface MockTaskInstanceRepository {
  save: Mock;
  findById: Mock;
  findByTemplateId: Mock;
  findByIdentityId: Mock;
  findByDateRange: Mock;
  delete: Mock;
  exists: Mock;
}

export function createMockTaskInstanceRepository(): MockTaskInstanceRepository {
  return {
    save: vi.fn().mockResolvedValue(undefined),
    findById: vi.fn().mockResolvedValue(null),
    findByTemplateId: vi.fn().mockResolvedValue([]),
    findByIdentityId: vi.fn().mockResolvedValue([]),
    findByDateRange: vi.fn().mockResolvedValue([]),
    delete: vi.fn().mockResolvedValue(undefined),
    exists: vi.fn().mockResolvedValue(false),
  };
}

/**
 * 重置所有 Mock 的调用历史
 */
export function resetAllMocks(...mocks: Record<string, Mock>[]): void {
  for (const mockObj of mocks) {
    for (const fn of Object.values(mockObj)) {
      if (typeof fn === 'function' && 'mockReset' in fn) {
        fn.mockReset();
      }
    }
  }
}
