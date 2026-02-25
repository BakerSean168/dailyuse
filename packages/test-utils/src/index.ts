/**
 * @dailyuse/test-utils
 *
 * 统一测试工具包 — 为 DailyUse monorepo 提供：
 * - 测试数据工厂 (Factories)
 * - Mock 仓储 (Mock Repositories)
 * - 通用辅助函数 (Helpers)
 * - 数据库测试工具 (Database Setup)
 */

// Factories
export {
  createGoalInput,
  createTestContext,
  createGoalDTO,
  createTaskInstanceInput,
  createAccountData,
} from './factories';

// Mock Repositories
export {
  createBaseMockRepository,
  createMockGoalRepository,
  createMockGoalFolderRepository,
  createMockTaskTemplateRepository,
  createMockTaskInstanceRepository,
  resetAllMocks,
  type MockGoalRepository,
  type MockGoalFolderRepository,
  type MockTaskTemplateRepository,
  type MockTaskInstanceRepository,
} from './mocks';

// Helpers
export {
  generateUUID,
  randomString,
  randomEmail,
  randomNumber,
  waitFor,
  createDate,
  createTimestamp,
} from './helpers';
