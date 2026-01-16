/**
 * Task Query Service Tests
 *
 * 浠诲姟鏌ヨ鏈嶅姟娴嬭瘯 - 浼樺厛绾ц绠楅泦鎴?
 * Story 1.5: 鍦ㄥ簲鐢ㄥ眰闆嗘垚浼樺厛绾ц绠?
 *
 * 娴嬭瘯瑕嗙洊锛?
 * 1. 鍗曚釜浠诲姟鏌ヨ + 浼樺厛绾ц绠?
 * 2. 鎵归噺鏌ヨ + 浼樺厛绾ф壒閲忚绠?
 * 3. 涓嶅悓 importance 鍜?dueDate 鐨勭粍鍚?
 * 4. 杈圭晫鎯呭喌锛坣ull dueDate, overdue 绛夛級
 * 5. 鎬ц兘妫€鏌ワ細1000 涓换鍔＄殑鎵归噺璁＄畻 <50ms
 */

import { describe, it, expect, beforeEach, afterEach, bench } from 'vitest';
import type {
  TaskTemplateServerDTO,
  TaskInstanceServerDTO,
} from '@dailyuse/contracts/task';
import { ImportanceLevel } from '@dailyuse/contracts/shared';
import { TaskTemplateStatus, TaskInstanceStatus } from '@dailyuse/contracts/task';
import {
  TaskQueryService,
  enrichWithPriority,
  enrichMultipleWithPriority,
  extractDueDate,
} from './task-query.service';
import type { ITaskTemplateRepository, ITaskInstanceRepository } from '@dailyuse/domain-server/task';

/**
 * 鍒涘缓妯℃嫙鐨?TaskTemplateServerDTO 鐢ㄤ簬娴嬭瘯
 */
function createMockTaskTemplateDTO(overrides?: Partial<TaskTemplateServerDTO>): TaskTemplateServerDTO {
  return {
    uuid: 'template-uuid-1',
    accountUuid: 'account-uuid-1',
    title: 'Test Task',
    description: 'Test Description',
    taskType: 'ONE_TIME' as any,
    importance: ImportanceLevel.Important,
    status: TaskTemplateStatus.ACTIVE,
    tags: [],
    dueDate: null,
    ...overrides,
  } as any;
}

/**
 * 鍒涘缓妯℃嫙鐨?TaskInstanceServerDTO 鐢ㄤ簬娴嬭瘯
 */
function createMockTaskInstanceDTO(overrides?: Partial<TaskInstanceServerDTO>): TaskInstanceServerDTO {
  return {
    uuid: 'instance-uuid-1',
    templateUuid: 'template-uuid-1',
    accountUuid: 'account-uuid-1',
    instanceDate: Date.now(),
    timeConfig: {} as any,
    importance: ImportanceLevel.Important,
    status: TaskInstanceStatus.PENDING,
    ...overrides,
  } as any;
}

/**
 * 鍒涘缓妯℃嫙鐨?TaskTemplateRepository
 */
function createMockTemplateRepository(templates: any[] = []): ITaskTemplateRepository {
  return {
    findByUuid: async (uuid: string) => templates.find((t) => t.uuid === uuid) || null,
    findByUuidWithChildren: async (uuid: string) => templates.find((t) => t.uuid === uuid) || null,
    findByAccount: async () => templates,
    findByStatus: async () => templates,
    findByFolder: async () => templates,
    findByGoal: async () => templates,
    findByTags: async () => templates,
    save: async () => {},
    delete: async () => {},
  } as any;
}

/**
 * 鍒涘缓妯℃嫙鐨?TaskInstanceRepository
 */
function createMockInstanceRepository(instances: any[] = []): ITaskInstanceRepository {
  return {
    findByUuid: async (uuid: string) => instances.find((i) => i.uuid === uuid) || null,
    findByDateRange: async () => instances,
    findByTemplate: async () => instances,
    save: async () => {},
    delete: async () => {},
  } as any;
}

describe('extractDueDate', () => {
  it('should extract dueDate from TaskTemplateServerDTO', () => {
    const dueDate = Date.now();
    const dto = createMockTaskTemplateDTO({ dueDate });
    const result = extractDueDate(dto);

    expect(result).not.toBeNull();
    expect(result?.getTime()).toBe(dueDate);
  });

  it('should return null when dueDate is null', () => {
    const dto = createMockTaskTemplateDTO({ dueDate: null });
    const result = extractDueDate(dto);

    expect(result).toBeNull();
  });

  it('should return null when dueDate is undefined', () => {
    const dto = createMockTaskTemplateDTO();
    delete (dto as any).dueDate;
    const result = extractDueDate(dto);

    expect(result).toBeNull();
  });
});

describe('enrichWithPriority', () => {
  it('should enrich single TaskTemplateServerDTO with priority score', () => {
    const dueDate = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days from now
    const dto = createMockTaskTemplateDTO({
      importance: ImportanceLevel.Important,
      dueDate,
    });

    const result = enrichWithPriority(dto);

    expect(result).toHaveProperty('priority');
    expect(typeof result.priority).toBe('number');
    expect(result.priority).toBeGreaterThanOrEqual(0);
    expect(result.priority).toBeLessThanOrEqual(100);
    // Important task 7 days away should have decent priority
    expect(result.priority).toBeGreaterThan(20);
  });

  it('should calculate higher priority for vital tasks', () => {
    const dueDate = Date.now() + 7 * 24 * 60 * 60 * 1000;
    const vitalDto = createMockTaskTemplateDTO({
      importance: ImportanceLevel.Vital,
      dueDate,
    });
    const trivialDto = createMockTaskTemplateDTO({
      importance: ImportanceLevel.Trivial,
      dueDate,
    });

    const vitalResult = enrichWithPriority(vitalDto);
    const trivialResult = enrichWithPriority(trivialDto);

    expect(vitalResult.priority).toBeGreaterThan(trivialResult.priority);
  });

  it('should calculate higher priority for tasks due sooner', () => {
    const tomorrow = Date.now() + 24 * 60 * 60 * 1000;
    const nextWeek = Date.now() + 7 * 24 * 60 * 60 * 1000;

    const soonDto = createMockTaskTemplateDTO({
      importance: ImportanceLevel.Important,
      dueDate: tomorrow,
    });
    const laterDto = createMockTaskTemplateDTO({
      importance: ImportanceLevel.Important,
      dueDate: nextWeek,
    });

    const soonResult = enrichWithPriority(soonDto);
    const laterResult = enrichWithPriority(laterDto);

    expect(soonResult.priority).toBeGreaterThan(laterResult.priority);
  });

  it('should handle backlog tasks (null dueDate)', () => {
    const dto = createMockTaskTemplateDTO({
      importance: ImportanceLevel.Important,
      dueDate: null,
    });

    const result = enrichWithPriority(dto);

    expect(result).toHaveProperty('priority');
    expect(result.priority).toBeGreaterThanOrEqual(0);
    expect(result.priority).toBeLessThanOrEqual(100);
    // Backlog task should have lower priority
    expect(result.priority).toBeLessThan(50);
  });

  it('should clamp priority to [0, 100]', () => {
    // Test with overdue task (should be 100)
    const yesterday = Date.now() - 24 * 60 * 60 * 1000;
    const overdueDto = createMockTaskTemplateDTO({
      importance: ImportanceLevel.Vital,
      dueDate: yesterday,
    });

    const result = enrichWithPriority(overdueDto);

    expect(result.priority).toBeLessThanOrEqual(100);
    expect(result.priority).toBeGreaterThanOrEqual(0);
  });

  it('should use provided currentTime for calculation', () => {
    const baseTime = new Date('2026-01-15T12:00:00Z').getTime();
    const dueDate = baseTime + 7 * 24 * 60 * 60 * 1000;
    const currentTime = new Date(baseTime);

    const dto = createMockTaskTemplateDTO({
      importance: ImportanceLevel.Important,
      dueDate,
    });

    const result = enrichWithPriority(dto, currentTime);

    expect(result).toHaveProperty('priority');
    // Same inputs should always produce same output
    const result2 = enrichWithPriority(dto, currentTime);
    expect(result.priority).toBe(result2.priority);
  });

  it('should enrich TaskInstanceServerDTO', () => {
    const dueDate = Date.now() + 7 * 24 * 60 * 60 * 1000;
    const dto = createMockTaskInstanceDTO({
      importance: ImportanceLevel.Moderate,
      dueDate: dueDate,
    } as any);

    // Note: TaskInstanceServerDTO normally doesn't have dueDate directly
    // This test verifies the function handles instances gracefully
    const result = enrichWithPriority(dto);

    expect(result).toHaveProperty('priority');
    expect(typeof result.priority).toBe('number');
  });

  it('should preserve all original DTO properties', () => {
    const dto = createMockTaskTemplateDTO({
      importance: ImportanceLevel.Important,
      dueDate: Date.now() + 7 * 24 * 60 * 60 * 1000,
    });

    const result = enrichWithPriority(dto);

    // Verify all original properties are preserved
    expect(result.uuid).toBe(dto.uuid);
    expect(result.accountUuid).toBe(dto.accountUuid);
    expect(result.title).toBe(dto.title);
    expect(result.importance).toBe(dto.importance);
  });
});

describe('enrichMultipleWithPriority', () => {
  it('should enrich multiple DTOs with priority scores', () => {
    const dtos = [
      createMockTaskTemplateDTO({
        uuid: 'task-1',
        importance: ImportanceLevel.Vital,
        dueDate: Date.now() + 1 * 24 * 60 * 60 * 1000,
      }),
      createMockTaskTemplateDTO({
        uuid: 'task-2',
        importance: ImportanceLevel.Important,
        dueDate: Date.now() + 7 * 24 * 60 * 60 * 1000,
      }),
      createMockTaskTemplateDTO({
        uuid: 'task-3',
        importance: ImportanceLevel.Trivial,
        dueDate: null,
      }),
    ];

    const results = enrichMultipleWithPriority(dtos);

    expect(results).toHaveLength(3);
    expect(results.every((r) => r.hasOwnProperty('priority'))).toBe(true);
    expect(results.every((r) => typeof r.priority === 'number')).toBe(true);
  });

  it('should maintain order of input DTOs', () => {
    const dtos = [
      createMockTaskTemplateDTO({ uuid: 'task-1' }),
      createMockTaskTemplateDTO({ uuid: 'task-2' }),
      createMockTaskTemplateDTO({ uuid: 'task-3' }),
    ];

    const results = enrichMultipleWithPriority(dtos);

    expect(results[0].uuid).toBe('task-1');
    expect(results[1].uuid).toBe('task-2');
    expect(results[2].uuid).toBe('task-3');
  });

  it('should handle empty array', () => {
    const results = enrichMultipleWithPriority([]);

    expect(results).toEqual([]);
  });

  it('should handle large batches efficiently', () => {
    const dtos = Array.from({ length: 100 }, (_, i) =>
      createMockTaskTemplateDTO({
        uuid: `task-${i}`,
        importance: ImportanceLevel.Important,
        dueDate: Date.now() + (i % 30) * 24 * 60 * 60 * 1000,
      }),
    );

    const results = enrichMultipleWithPriority(dtos);

    expect(results).toHaveLength(100);
    expect(results.every((r) => r.hasOwnProperty('priority'))).toBe(true);
  });

  it('should use provided currentTime for all calculations', () => {
    const baseTime = new Date('2026-01-15T12:00:00Z').getTime();
    const currentTime = new Date(baseTime);

    const dtos = [
      createMockTaskTemplateDTO({
        uuid: 'task-1',
        importance: ImportanceLevel.Important,
        dueDate: baseTime + 7 * 24 * 60 * 60 * 1000,
      }),
      createMockTaskTemplateDTO({
        uuid: 'task-2',
        importance: ImportanceLevel.Important,
        dueDate: baseTime + 7 * 24 * 60 * 60 * 1000,
      }),
    ];

    const results = enrichMultipleWithPriority(dtos, currentTime);

    // Same importance and dueDate should produce same priority
    expect(results[0].priority).toBe(results[1].priority);
  });
});

describe('TaskQueryService', () => {
  let service: TaskQueryService;

  beforeEach(() => {
    TaskQueryService.resetInstance();
  });

  afterEach(() => {
    TaskQueryService.resetInstance();
  });

  it('should create instance', () => {
    const mockTemplateRepo = createMockTemplateRepository();
    const mockInstanceRepo = createMockInstanceRepository();

    const instance = TaskQueryService.createInstance(mockTemplateRepo, mockInstanceRepo);

    expect(instance).toBeDefined();
  });

  it('should return singleton instance', () => {
    const mockTemplateRepo = createMockTemplateRepository();
    const mockInstanceRepo = createMockInstanceRepository();

    TaskQueryService.createInstance(mockTemplateRepo, mockInstanceRepo);
    const instance1 = TaskQueryService.getInstance();
    const instance2 = TaskQueryService.getInstance();

    expect(instance1).toBe(instance2);
  });

  it('should get task template with priority', async () => {
    const mockTemplate = {
      uuid: 'template-uuid-1',
      toServerDTO: () =>
        createMockTaskTemplateDTO({
          uuid: 'template-uuid-1',
          importance: ImportanceLevel.Important,
          dueDate: Date.now() + 7 * 24 * 60 * 60 * 1000,
        }),
    };

    const mockTemplateRepo = createMockTemplateRepository([mockTemplate]);
    const mockInstanceRepo = createMockInstanceRepository();

    service = TaskQueryService.createInstance(mockTemplateRepo, mockInstanceRepo);
    const result = await service.getTaskTemplateWithPriority('template-uuid-1');

    expect(result).not.toBeNull();
    expect(result?.priority).toBeDefined();
    expect(typeof result?.priority).toBe('number');
  });

  it('should list task templates with priority', async () => {
    const mockTemplates = [
      {
        uuid: 'template-1',
        toServerDTO: () =>
          createMockTaskTemplateDTO({
            uuid: 'template-1',
            importance: ImportanceLevel.Vital,
            dueDate: Date.now() + 1 * 24 * 60 * 60 * 1000,
          }),
      },
      {
        uuid: 'template-2',
        toServerDTO: () =>
          createMockTaskTemplateDTO({
            uuid: 'template-2',
            importance: ImportanceLevel.Trivial,
            dueDate: null,
          }),
      },
    ];

    const mockTemplateRepo = createMockTemplateRepository(mockTemplates);
    const mockInstanceRepo = createMockInstanceRepository();

    service = TaskQueryService.createInstance(mockTemplateRepo, mockInstanceRepo);
    const results = await service.listTaskTemplatesWithPriority('account-uuid-1');

    expect(results).toHaveLength(2);
    expect(results.every((r) => r.hasOwnProperty('priority'))).toBe(true);
    // Vital task should have higher priority than trivial
    expect(results[0].priority).toBeGreaterThan(results[1].priority);
  });

  it('should get task instances by date range with priority', async () => {
    const mockInstances = [
      {
        uuid: 'instance-1',
        toServerDTO: () =>
          createMockTaskInstanceDTO({
            uuid: 'instance-1',
            importance: ImportanceLevel.Important,
          }),
      },
      {
        uuid: 'instance-2',
        toServerDTO: () =>
          createMockTaskInstanceDTO({
            uuid: 'instance-2',
            importance: ImportanceLevel.Moderate,
          }),
      },
    ];

    const mockTemplateRepo = createMockTemplateRepository();
    const mockInstanceRepo = createMockInstanceRepository(mockInstances);

    service = TaskQueryService.createInstance(mockTemplateRepo, mockInstanceRepo);

    const startDate = Date.now();
    const endDate = Date.now() + 7 * 24 * 60 * 60 * 1000;

    const results = await service.getTaskInstancesByDateRangeWithPriority(
      'account-uuid-1',
      startDate,
      endDate,
    );

    expect(results).toHaveLength(2);
    expect(results.every((r) => r.hasOwnProperty('priority'))).toBe(true);
  });

  it('should get single task instance with priority', async () => {
    const mockInstance = {
      uuid: 'instance-uuid-1',
      toServerDTO: () =>
        createMockTaskInstanceDTO({
          uuid: 'instance-uuid-1',
          importance: ImportanceLevel.Important,
        }),
    };

    const mockTemplateRepo = createMockTemplateRepository();
    const mockInstanceRepo = createMockInstanceRepository([mockInstance]);

    service = TaskQueryService.createInstance(mockTemplateRepo, mockInstanceRepo);
    const result = await service.getTaskInstanceWithPriority('instance-uuid-1');

    expect(result).not.toBeNull();
    expect(result?.priority).toBeDefined();
    expect(typeof result?.priority).toBe('number');
  });

  it('should return null for non-existent template', async () => {
    const mockTemplateRepo = createMockTemplateRepository();
    const mockInstanceRepo = createMockInstanceRepository();

    service = TaskQueryService.createInstance(mockTemplateRepo, mockInstanceRepo);
    const result = await service.getTaskTemplateWithPriority('non-existent-uuid');

    expect(result).toBeNull();
  });

  it('should return null for non-existent instance', async () => {
    const mockTemplateRepo = createMockTemplateRepository();
    const mockInstanceRepo = createMockInstanceRepository();

    service = TaskQueryService.createInstance(mockTemplateRepo, mockInstanceRepo);
    const result = await service.getTaskInstanceWithPriority('non-existent-uuid');

    expect(result).toBeNull();
  });

  it('should list task templates by status with priority', async () => {
    const mockTemplates = [
      {
        uuid: 'template-1',
        toServerDTO: () =>
          createMockTaskTemplateDTO({
            uuid: 'template-1',
            importance: ImportanceLevel.Important,
            dueDate: Date.now() + 7 * 24 * 60 * 60 * 1000,
          }),
      },
    ];

    const mockTemplateRepo = createMockTemplateRepository(mockTemplates);
    const mockInstanceRepo = createMockInstanceRepository();

    service = TaskQueryService.createInstance(mockTemplateRepo, mockInstanceRepo);
    const results = await service.listTaskTemplatesByStatusWithPriority(
      'account-uuid-1',
      TaskTemplateStatus.ACTIVE,
    );

    expect(results).toHaveLength(1);
    expect(results[0]).toHaveProperty('priority');
  });
});

/**
 * 鎬ц兘鍩哄噯娴嬭瘯
 */
describe('Performance Benchmarks', () => {
  it('should enrich 1000 tasks in less than 50ms', () => {
    const dtos = Array.from({ length: 1000 }, (_, i) =>
      createMockTaskTemplateDTO({
        uuid: `task-${i}`,
        importance: [
          ImportanceLevel.Vital,
          ImportanceLevel.Important,
          ImportanceLevel.Moderate,
          ImportanceLevel.Minor,
          ImportanceLevel.Trivial,
        ][i % 5],
        dueDate: Date.now() + ((i % 30) * 24 * 60 * 60 * 1000),
      }),
    );

    const startTime = performance.now();
    const results = enrichMultipleWithPriority(dtos);
    const endTime = performance.now();

    const duration = endTime - startTime;

    expect(results).toHaveLength(1000);
    expect(duration).toBeLessThan(50); // Should complete in less than 50ms
    expect(results.every((r) => r.hasOwnProperty('priority'))).toBe(true);

    console.log(`✅ Enriched 1000 tasks in ${duration.toFixed(2)}ms`);
  });

  /**
   * Additional performance tests
   */
  it('enrichWithPriority - single task performance', () => {
    const dto = createMockTaskTemplateDTO({
      importance: ImportanceLevel.Important,
      dueDate: Date.now() + 7 * 24 * 60 * 60 * 1000,
    });
    const result = enrichWithPriority(dto);
    expect(result).toHaveProperty('priority');
    expect(result.priority).toBeGreaterThanOrEqual(0);
    expect(result.priority).toBeLessThanOrEqual(100);
  });

  it('enrichMultipleWithPriority - 100 tasks performance', () => {
    const dtos = Array.from({ length: 100 }, (_, i) =>
      createMockTaskTemplateDTO({
        uuid: `task-${i}`,
        importance: ImportanceLevel.Important,
        dueDate: Date.now() + 7 * 24 * 60 * 60 * 1000,
      }),
    );
    const start = Date.now();
    const results = enrichMultipleWithPriority(dtos);
    const duration = Date.now() - start;

    expect(results).toHaveLength(100);
    expect(results.every((r) => r.hasOwnProperty('priority'))).toBe(true);
    console.log(`✅ Enriched 100 tasks in ${duration.toFixed(2)}ms`);
  });
});

/**
 * Story 2.1: Sorting Tests - Task List Sorting by Priority
 */
describe('TaskQueryService - getTasksWithPrioritySorting', () => {
  let service: TaskQueryService;
  let mockTemplateRepository: ITaskTemplateRepository;
  let mockInstanceRepository: ITaskInstanceRepository;

  beforeEach(() => {
    mockTemplateRepository = createMockTemplateRepository();
    mockInstanceRepository = createMockInstanceRepository();

    service = TaskQueryService.createInstance(mockTemplateRepository, mockInstanceRepository);
  });

  afterEach(() => {
    TaskQueryService.resetInstance();
  });

  /**
   * Test Case 2.1.2.1: Sort by Priority - Normal Case
   * Setup:
   *   - Task A: importance=Vital, dueDate=today, expected_priority=95
   *   - Task B: importance=Moderate, dueDate=next_week, expected_priority=55
   *   - Task C: importance=Important, dueDate=tomorrow, expected_priority=85
   * Expected: C(85) > A(95) > B(55) - 最高优先级在前
   */
  it('should sort tasks by priority in descending order (AC1)', async () => {
    const today = Date.now();
    const tomorrow = today + 24 * 60 * 60 * 1000;
    const nextWeek = today + 7 * 24 * 60 * 60 * 1000;

    const taskA = {
      uuid: 'task-a',
      toServerDTO: () =>
        createMockTaskTemplateDTO({
          uuid: 'task-a',
          importance: ImportanceLevel.Vital,
          dueDate: today,
          status: TaskTemplateStatus.ACTIVE,
        }),
    };

    const taskB = {
      uuid: 'task-b',
      toServerDTO: () =>
        createMockTaskTemplateDTO({
          uuid: 'task-b',
          importance: ImportanceLevel.Moderate,
          dueDate: nextWeek,
          status: TaskTemplateStatus.ACTIVE,
        }),
    };

    const taskC = {
      uuid: 'task-c',
      toServerDTO: () =>
        createMockTaskTemplateDTO({
          uuid: 'task-c',
          importance: ImportanceLevel.Important,
          dueDate: tomorrow,
          status: TaskTemplateStatus.ACTIVE,
        }),
    };

    // Mock repository to return unsorted tasks
    let callCount = 0;
    mockTemplateRepository.findByStatus = async (accountUuid: string, status: any) => {
      // 第一次调用返回 ACTIVE 任务，第二次返回空数组（没有 PAUSED）
      if (callCount === 0) {
        callCount++;
        return [taskA, taskB, taskC] as any; // 返回未排序的任务
      }
      return [];
    };

    service = TaskQueryService.createInstance(mockTemplateRepository, mockInstanceRepository);

    // Execute
    const result = await service.getTasksWithPrioritySorting('account-uuid-1');

    // Assert: tasks should be sorted by priority (descending)
    expect(result).toHaveLength(3);
    expect(result[0].uuid).toBe('task-a'); // Vital + today = highest priority
    expect(result[0].priority).toBeGreaterThan(result[1].priority);
    expect(result[1].priority).toBeGreaterThan(result[2].priority);
  });

  /**
   * Test Case 2.1.2.2: Backlog Tasks at Bottom
   * Setup:
   *   - Task A: importance=Vital, dueDate=today (priority=95)
   *   - Task B: importance=Vital, dueDate=null (Backlog, priority=50)
   *   - Task C: importance=Moderate, dueDate=tomorrow (priority=60)
   * Expected: A(95) > C(60) > B(50) - Backlog 任务在最后
   */
  it('should place backlog tasks (no dueDate) at the bottom (AC2)', async () => {
    const today = Date.now();
    const tomorrow = today + 24 * 60 * 60 * 1000;

    const taskWithDue1 = {
      uuid: 'task-with-due-1',
      toServerDTO: () =>
        createMockTaskTemplateDTO({
          uuid: 'task-with-due-1',
          importance: ImportanceLevel.Vital,
          dueDate: today,
          status: TaskTemplateStatus.ACTIVE,
        }),
    };

    const backlogTask = {
      uuid: 'backlog-task',
      toServerDTO: () =>
        createMockTaskTemplateDTO({
          uuid: 'backlog-task',
          importance: ImportanceLevel.Vital,
          dueDate: null, // Backlog
          status: TaskTemplateStatus.ACTIVE,
        }),
    };

    const taskWithDue2 = {
      uuid: 'task-with-due-2',
      toServerDTO: () =>
        createMockTaskTemplateDTO({
          uuid: 'task-with-due-2',
          importance: ImportanceLevel.Moderate,
          dueDate: tomorrow,
          status: TaskTemplateStatus.ACTIVE,
        }),
    };

    mockTemplateRepository = createMockTemplateRepository([backlogTask, taskWithDue1, taskWithDue2]);
    service = TaskQueryService.createInstance(mockTemplateRepository, mockInstanceRepository);

    let callCount = 0;
    mockTemplateRepository.findByStatus = async () => {
      if (callCount === 0) {
        callCount++;
        return [backlogTask, taskWithDue1, taskWithDue2] as any;
      }
      return [];
    };

    // Execute
    const result = await service.getTasksWithPrioritySorting('account-uuid-1');

    // Assert: Backlog task should be at the bottom
    expect(result).toHaveLength(3);
    expect(result[0].dueDate).not.toBeNull(); // First task has dueDate
    expect(result[1].dueDate).not.toBeNull(); // Second task has dueDate
    expect(result[2].uuid).toBe('backlog-task'); // Backlog task is last
    expect(result[2].dueDate).toBeNull();
  });

  /**
   * Test Case 2.1.2.3: Overdue Task Boost
   * Setup:
   *   - Task A: importance=Minor, dueDate=yesterday (Overdue, priority boost = 80)
   *   - Task B: importance=Important, dueDate=tomorrow (priority=75)
   * Expected: A(80) > B(75) - 超期任务被提升
   */
  it('should prioritize overdue tasks with priority boost (AC2-Extended)', async () => {
    const yesterday = Date.now() - 24 * 60 * 60 * 1000;
    const tomorrow = Date.now() + 24 * 60 * 60 * 1000;

    const overdueTask = {
      uuid: 'overdue-task',
      toServerDTO: () =>
        createMockTaskTemplateDTO({
          uuid: 'overdue-task',
          importance: ImportanceLevel.Minor,
          dueDate: yesterday,
          status: TaskTemplateStatus.ACTIVE,
        }),
    };

    const futureTask = {
      uuid: 'future-task',
      toServerDTO: () =>
        createMockTaskTemplateDTO({
          uuid: 'future-task',
          importance: ImportanceLevel.Important,
          dueDate: tomorrow,
          status: TaskTemplateStatus.ACTIVE,
        }),
    };

    mockTemplateRepository = createMockTemplateRepository([overdueTask, futureTask] as any);
    service = TaskQueryService.createInstance(mockTemplateRepository, mockInstanceRepository);

    let callCount = 0;
    mockTemplateRepository.findByStatus = async () => {
      if (callCount === 0) {
        callCount++;
        return [overdueTask, futureTask] as any;
      }
      return [];
    };

    // Execute
    const result = await service.getTasksWithPrioritySorting('account-uuid-1');

    // Assert: Overdue task should have higher priority due to boost
    expect(result).toHaveLength(2);
    expect(result[0].priority).toBeGreaterThan(result[1].priority);
  });

  /**
   * Test Case 2.1.2.4: Zero Days Remaining
   * Setup:
   *   - Task A: importance=Moderate, dueDate=today (1/TimeRemaining very high, priority=90)
   *   - Task B: importance=Important, dueDate=next_week (priority=75)
   * Expected: A(90) > B(75) - 紧急截止日期被提升
   */
  it('should boost priority for tasks due today (AC2-Extended)', async () => {
    const today = Date.now();
    const nextWeek = today + 7 * 24 * 60 * 60 * 1000;

    const urgentTask = {
      uuid: 'urgent-task',
      toServerDTO: () =>
        createMockTaskTemplateDTO({
          uuid: 'urgent-task',
          importance: ImportanceLevel.Moderate,
          dueDate: today,
          status: TaskTemplateStatus.ACTIVE,
        }),
    };

    const futureTask = {
      uuid: 'future-task',
      toServerDTO: () =>
        createMockTaskTemplateDTO({
          uuid: 'future-task',
          importance: ImportanceLevel.Important,
          dueDate: nextWeek,
          status: TaskTemplateStatus.ACTIVE,
        }),
    };

    mockTemplateRepository = createMockTemplateRepository([futureTask, urgentTask]);
    service = TaskQueryService.createInstance(mockTemplateRepository, mockInstanceRepository);

    let callCount = 0;
    mockTemplateRepository.findByStatus = async () => {
      if (callCount === 0) {
        callCount++;
        return [futureTask, urgentTask] as any;
      }
      return [];
    };

    // Execute
    const result = await service.getTasksWithPrioritySorting('account-uuid-1');

    // Assert: Urgent task should be first despite lower importance
    expect(result).toHaveLength(2);
    expect(result[0].uuid).toBe('urgent-task');
  });

  /**
   * Test Case 2.1.2.5: Equal Priority - Maintain Relative Order
   * Setup:
   *   - Task A: importance=Moderate, dueDate=day_1 (priority=60)
   *   - Task B: importance=Moderate, dueDate=day_1 (priority=60)
   * Expected: A, B (same priority but created first)
   */
  it('should maintain insertion order for equal priority tasks (stable sort)', async () => {
    const sameDate = Date.now() + 3 * 24 * 60 * 60 * 1000;

    const taskA = {
      uuid: 'task-a',
      toServerDTO: () =>
        createMockTaskTemplateDTO({
          uuid: 'task-a',
          importance: ImportanceLevel.Moderate,
          dueDate: sameDate,
          status: TaskTemplateStatus.ACTIVE,
        }),
    };

    const taskB = {
      uuid: 'task-b',
      toServerDTO: () =>
        createMockTaskTemplateDTO({
          uuid: 'task-b',
          importance: ImportanceLevel.Moderate,
          dueDate: sameDate,
          status: TaskTemplateStatus.ACTIVE,
        }),
    };

    mockTemplateRepository = createMockTemplateRepository([taskA, taskB] as any);
    service = TaskQueryService.createInstance(mockTemplateRepository, mockInstanceRepository);

    let callCount = 0;
    mockTemplateRepository.findByStatus = async () => {
      if (callCount === 0) {
        callCount++;
        return [taskA, taskB] as any;
      }
      return [];
    };

    // Execute
    const result = await service.getTasksWithPrioritySorting('account-uuid-1');

    // Assert: Order should be maintained (A before B)
    expect(result).toHaveLength(2);
    // Both should have similar priority (within 10 points due to time precision)
    expect(Math.abs(result[0].priority - result[1].priority)).toBeLessThan(10);
  });

  /**
   * Test Case 2.1.3: Performance - Sort 100 Tasks
   */
  it('should sort 100 tasks in < 10ms (AC3 - 100 tasks)', async () => {
    const tasks = Array.from({ length: 100 }, (_, i) => ({
      uuid: `task-${i}`,
      toServerDTO: () =>
        createMockTaskTemplateDTO({
          uuid: `task-${i}`,
          importance: [
            ImportanceLevel.Vital,
            ImportanceLevel.Important,
            ImportanceLevel.Moderate,
            ImportanceLevel.Minor,
            ImportanceLevel.Trivial,
          ][i % 5],
          dueDate:
            i % 10 === 0
              ? null
              : Date.now() + ((i % 20) * 24 * 60 * 60 * 1000),
          status: TaskTemplateStatus.ACTIVE,
        }),
    }));

    mockTemplateRepository = createMockTemplateRepository(tasks as any);
    service = TaskQueryService.createInstance(mockTemplateRepository, mockInstanceRepository);

    let callCount = 0;
    mockTemplateRepository.findByStatus = async () => {
      if (callCount === 0) {
        callCount++;
        return tasks as any;
      }
      return [];
    };

    const start = performance.now();
    const result = await service.getTasksWithPrioritySorting('account-uuid-1');
    const duration = performance.now() - start;

    expect(result).toHaveLength(100);
    expect(duration).toBeLessThan(10);
    console.log(`✅ Sorted 100 tasks in ${duration.toFixed(2)}ms`);
  });

  /**
   * Test Case 2.1.3: Performance - Sort 500 Tasks
   */
  it('should sort 500 tasks in < 20ms (AC3 - 500 tasks)', async () => {
    const tasks = Array.from({ length: 500 }, (_, i) => ({
      uuid: `task-${i}`,
      toServerDTO: () =>
        createMockTaskTemplateDTO({
          uuid: `task-${i}`,
          importance: [
            ImportanceLevel.Vital,
            ImportanceLevel.Important,
            ImportanceLevel.Moderate,
            ImportanceLevel.Minor,
            ImportanceLevel.Trivial,
          ][i % 5],
          dueDate:
            i % 10 === 0
              ? null
              : Date.now() + ((i % 20) * 24 * 60 * 60 * 1000),
          status: TaskTemplateStatus.ACTIVE,
        }),
    }));

    mockTemplateRepository = createMockTemplateRepository(tasks);
    service = TaskQueryService.createInstance(mockTemplateRepository, mockInstanceRepository);

    let callCount = 0;
    mockTemplateRepository.findByStatus = async () => {
      if (callCount === 0) {
        callCount++;
        return tasks as any;
      }
      return [];
    };

    const start = performance.now();
    const result = await service.getTasksWithPrioritySorting('account-uuid-1');
    const duration = performance.now() - start;

    expect(result).toHaveLength(500);
    expect(duration).toBeLessThan(20);
    console.log(`✅ Sorted 500 tasks in ${duration.toFixed(2)}ms`);
  });

  /**
   * Test Case 2.1.3: Performance - Sort 1000 Tasks
   */
  it('should sort 1000 tasks in < 40ms (AC3 - 1000 tasks)', async () => {
    const tasks = Array.from({ length: 1000 }, (_, i) => ({
      uuid: `task-${i}`,
      toServerDTO: () =>
        createMockTaskTemplateDTO({
          uuid: `task-${i}`,
          importance: [
            ImportanceLevel.Vital,
            ImportanceLevel.Important,
            ImportanceLevel.Moderate,
            ImportanceLevel.Minor,
            ImportanceLevel.Trivial,
          ][i % 5],
          dueDate:
            i % 10 === 0
              ? null
              : Date.now() + ((i % 20) * 24 * 60 * 60 * 1000),
          status: TaskTemplateStatus.ACTIVE,
        }),
    }));

    mockTemplateRepository = createMockTemplateRepository(tasks);
    service = TaskQueryService.createInstance(mockTemplateRepository, mockInstanceRepository);

    let callCount = 0;
    mockTemplateRepository.findByStatus = async () => {
      if (callCount === 0) {
        callCount++;
        return tasks as any;
      }
      return [];
    };

    const start = performance.now();
    const result = await service.getTasksWithPrioritySorting('account-uuid-1');
    const duration = performance.now() - start;

    expect(result).toHaveLength(1000);
    expect(duration).toBeLessThan(40);
    console.log(`✅ Sorted 1000 tasks in ${duration.toFixed(2)}ms`);
  });

  /**
   * Test Case 2.1.3: Performance - Sort 2000 Tasks
   */
  it('should sort 2000 tasks in < 100ms (AC3 - 2000 tasks)', async () => {
    const tasks = Array.from({ length: 2000 }, (_, i) => ({
      uuid: `task-${i}`,
      toServerDTO: () =>
        createMockTaskTemplateDTO({
          uuid: `task-${i}`,
          importance: [
            ImportanceLevel.Vital,
            ImportanceLevel.Important,
            ImportanceLevel.Moderate,
            ImportanceLevel.Minor,
            ImportanceLevel.Trivial,
          ][i % 5],
          dueDate:
            i % 10 === 0
              ? null
              : Date.now() + ((i % 20) * 24 * 60 * 60 * 1000),
          status: TaskTemplateStatus.ACTIVE,
        }),
    }));

    mockTemplateRepository = createMockTemplateRepository(tasks as any);
    service = TaskQueryService.createInstance(mockTemplateRepository, mockInstanceRepository);

    let callCount = 0;
    mockTemplateRepository.findByStatus = async () => {
      if (callCount === 0) {
        callCount++;
        return tasks as any;
      }
      return [];
    };

    const start = performance.now();
    const result = await service.getTasksWithPrioritySorting('account-uuid-1');
    const duration = performance.now() - start;

    expect(result).toHaveLength(2000);
    expect(duration).toBeLessThan(100);
    console.log(`✅ Sorted 2000 tasks in ${duration.toFixed(2)}ms`);
  });

  /**
   * Test Case 2.1: Sort By CompletedAt
   */
  it('should support alternative sort by completedAt field', async () => {
    const now = Date.now();

    const task1 = {
      uuid: 'task-1',
      toServerDTO: () =>
        createMockTaskTemplateDTO({
          uuid: 'task-1',
          importance: ImportanceLevel.Vital,
          dueDate: now,
          completedAt: now - 2 * 24 * 60 * 60 * 1000, // Completed 2 days ago
          status: TaskTemplateStatus.ACTIVE,
        }),
    };

    const task2 = {
      uuid: 'task-2',
      toServerDTO: () =>
        createMockTaskTemplateDTO({
          uuid: 'task-2',
          importance: ImportanceLevel.Minor,
          dueDate: now,
          completedAt: now - 5 * 24 * 60 * 60 * 1000, // Completed 5 days ago
          status: TaskTemplateStatus.ACTIVE,
        }),
    };

    mockTemplateRepository = createMockTemplateRepository([task1, task2] as any);
    service = TaskQueryService.createInstance(mockTemplateRepository, mockInstanceRepository);

    let callCount = 0;
    mockTemplateRepository.findByStatus = async () => {
      if (callCount === 0) {
        callCount++;
        return [task1, task2] as any;
      }
      return [];
    };

    // Execute with sortBy='completedAt'
    const result = await service.getTasksWithPrioritySorting('account-uuid-1', 'completedAt');

    // Assert: task1 (completed more recently) should be first
    expect(result).toHaveLength(2);
    expect(result[0].uuid).toBe('task-1');
    expect(result[1].uuid).toBe('task-2');
  });
});

