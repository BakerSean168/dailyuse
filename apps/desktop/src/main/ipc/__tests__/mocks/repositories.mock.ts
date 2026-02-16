/**
 * Repository Mock 工厂
 *
 * 提供各模块 Repository 的模拟实现
 */

import { vi } from 'vitest';
import type { Goal } from '@dailyuse/domain-server/goal';
import type { GoalServerDTO, GoalStatus } from '@dailyuse/contracts/goal';
import { ImportanceLevel } from '@dailyuse/contracts/shared';

// ===== Goal Repository Mock =====

export interface MockGoalRepository {
  save: ReturnType<typeof vi.fn>;
  findById: ReturnType<typeof vi.fn>;
  findById: ReturnType<typeof vi.fn>;
  findByAccountId: ReturnType<typeof vi.fn>;
  findByFolderId: ReturnType<typeof vi.fn>;
  findByStatus: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  exists: ReturnType<typeof vi.fn>;
}

export function createMockGoalRepository(): MockGoalRepository {
  return {
    save: vi.fn().mockResolvedValue(undefined),
    findById: vi.fn().mockResolvedValue(null),
    findById: vi.fn().mockResolvedValue(null),
    findByAccountId: vi.fn().mockResolvedValue([]),
    findByFolderId: vi.fn().mockResolvedValue([]),
    findByStatus: vi.fn().mockResolvedValue([]),
    delete: vi.fn().mockResolvedValue(undefined),
    exists: vi.fn().mockResolvedValue(false),
  };
}

// ===== Goal Statistics Repository Mock =====

export interface MockGoalStatisticsRepository {
  save: ReturnType<typeof vi.fn>;
  findByAccountId: ReturnType<typeof vi.fn>;
  findById: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
}

export function createMockGoalStatisticsRepository(): MockGoalStatisticsRepository {
  return {
    save: vi.fn().mockResolvedValue(undefined),
    findByAccountId: vi.fn().mockResolvedValue(null),
    findById: vi.fn().mockResolvedValue(null),
    delete: vi.fn().mockResolvedValue(undefined),
  };
}

// ===== Goal Folder Repository Mock =====

export interface MockGoalFolderRepository {
  save: ReturnType<typeof vi.fn>;
  findById: ReturnType<typeof vi.fn>;
  findByAccountId: ReturnType<typeof vi.fn>;
  findRootFolders: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  exists: ReturnType<typeof vi.fn>;
}

export function createMockGoalFolderRepository(): MockGoalFolderRepository {
  return {
    save: vi.fn().mockResolvedValue(undefined),
    findById: vi.fn().mockResolvedValue(null),
    findByAccountId: vi.fn().mockResolvedValue([]),
    findRootFolders: vi.fn().mockResolvedValue([]),
    delete: vi.fn().mockResolvedValue(undefined),
    exists: vi.fn().mockResolvedValue(false),
  };
}

// ===== Task Repository Mocks =====

export interface MockTaskTemplateRepository {
  save: ReturnType<typeof vi.fn>;
  findById: ReturnType<typeof vi.fn>;
  findByGoalId: ReturnType<typeof vi.fn>;
  findByAccountId: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  exists: ReturnType<typeof vi.fn>;
}

export function createMockTaskTemplateRepository(): MockTaskTemplateRepository {
  return {
    save: vi.fn().mockResolvedValue(undefined),
    findById: vi.fn().mockResolvedValue(null),
    findByGoalId: vi.fn().mockResolvedValue([]),
    findByAccountId: vi.fn().mockResolvedValue([]),
    delete: vi.fn().mockResolvedValue(undefined),
    exists: vi.fn().mockResolvedValue(false),
  };
}

export interface MockTaskInstanceRepository {
  save: ReturnType<typeof vi.fn>;
  findById: ReturnType<typeof vi.fn>;
  findByTemplateId: ReturnType<typeof vi.fn>;
  findByAccountId: ReturnType<typeof vi.fn>;
  findByDateRange: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  exists: ReturnType<typeof vi.fn>;
}

export function createMockTaskInstanceRepository(): MockTaskInstanceRepository {
  return {
    save: vi.fn().mockResolvedValue(undefined),
    findById: vi.fn().mockResolvedValue(null),
    findByTemplateId: vi.fn().mockResolvedValue([]),
    findByAccountId: vi.fn().mockResolvedValue([]),
    findByDateRange: vi.fn().mockResolvedValue([]),
    delete: vi.fn().mockResolvedValue(undefined),
    exists: vi.fn().mockResolvedValue(false),
  };
}

// ===== Setting Repository Mocks =====

export interface MockSettingRepository {
  save: ReturnType<typeof vi.fn>;
  findById: ReturnType<typeof vi.fn>;
  findByKey: ReturnType<typeof vi.fn>;
  findByScope: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  exists: ReturnType<typeof vi.fn>;
}

export function createMockSettingRepository(): MockSettingRepository {
  return {
    save: vi.fn().mockResolvedValue(undefined),
    findById: vi.fn().mockResolvedValue(null),
    findByKey: vi.fn().mockResolvedValue(null),
    findByScope: vi.fn().mockResolvedValue([]),
    delete: vi.fn().mockResolvedValue(undefined),
    exists: vi.fn().mockResolvedValue(false),
  };
}

// ===== Test Data Factories =====

let goalCounter = 0;

export function createMockGoalDTO(overrides: Partial<GoalServerDTO> = {}): GoalServerDTO {
  goalCounter++;
  const now = Date.now();
  return {
    id: `goal-${goalCounter}-${now}`,
    identityId: 'test-account-uuid',
    folderId: null,
    title: `Test Goal ${goalCounter}`,
    description: 'Test goal description',
    status: 'ACTIVE' as GoalStatus,
    importance: ImportanceLevel.Moderate,
    // urgency: UrgencyLevel.Medium, // REMOVED - priority now computed from importance + targetDate
    category: null,
    color: null,
    startDate: null,
    targetDate: null,
    completedAt: null,
    archivedAt: null,
    sortOrder: goalCounter,
    tags: [],
    keyResults: [],
    reviews: [],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

export function createMockGoal(overrides: Partial<GoalServerDTO> = {}): Goal {
  // 动态导入以避免循环依赖

  const { Goal } = require('@dailyuse/domain-server/goal');
  const dto = createMockGoalDTO(overrides);
  return Goal.fromPersistenceDTO(dto);
}

/**
 * 重置所有计数器（在 beforeEach 中调用）
 */
export function resetMockCounters(): void {
  goalCounter = 0;
}
