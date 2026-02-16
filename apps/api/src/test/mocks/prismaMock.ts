/**
 * Prisma Mock for Testing
 * @description 为API测试提供Prisma客户端的完整Mock实现
 */

import { vi } from 'vitest';
import type { PrismaClient } from '@prisma/client';

// Mock数据存储
const mockDataStore = {
  scheduleTask: new Map(),
  scheduleExecution: new Map(),
  account: new Map(),
  // Authentication相关表
  authCredential: new Map(),
  authSession: new Map(),
  // Task相关表
  taskTemplate: new Map(),
  taskInstance: new Map(),
  taskMetaTemplate: new Map(),
  // Goal相关表
  goal: new Map(),
  GoalFolder: new Map(),
  keyResult: new Map(),
  progressRecord: new Map(),
  // Reminder相关表
  reminderTemplate: new Map(),
  reminderExecution: new Map(),
  // Repository相关表
  repository: new Map(), // ✅ 添加：Repository 主表
  repositoryStatistic: new Map(), // ✅ 修正：单数形式，与 Prisma Schema 一致
  // Goal Statistics
  goalStatistic: new Map(), // ✅ 修正：单数形式，与 Prisma Schema 一致
  // Setting相关表
  userSetting: new Map(),
  // 添加其他需要的表...
};

// 用于防止并发更新的锁
const locks = new Map<string, Promise<any>>();

// 获取锁并执行操作
async function withLock<T>(key: string, operation: () => Promise<T>): Promise<T> {
  // 等待之前的操作完成
  while (locks.has(key)) {
    await locks.get(key);
  }

  // 创建新的锁
  const promise = operation();
  locks.set(key, promise);

  try {
    return await promise;
  } finally {
    locks.delete(key);
  }
}

// 生成测试用的UUID
function generateTestId(prefix = 'test'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// ✅ 处理关联数据加载（include）
function includeRelations(tableName: keyof typeof mockDataStore, record: any, include: any): any {
  const result = { ...record };

  // 处理 goal 表的关联
  if (tableName === 'goal') {
    // ✅ 支持 keyResults 和 keyResult (单复数都支持)
    if (include.keyResults || include.keyResult) {
      const keyResults = Array.from(mockDataStore.keyResult.values()).filter(
        (kr: any) => kr.goalId === record.id,
      );

      // 如果 keyResults 也有 include，递归处理
      const includeConfig = include.keyResults || include.keyResult;
      if (includeConfig === true || includeConfig.include?.records) {
        result.keyResults = keyResults.map((kr: any) => {
          if (includeConfig.include?.records) {
            const records = Array.from(mockDataStore.progressRecord.values()).filter(
              (r: any) => r.keyResultId === kr.id,
            );
            return { ...kr, records };
          }
          return kr;
        });
      } else {
        result.keyResults = keyResults;
      }
      
      // ✅ 如果使用 keyResult (单数)，也返回到 keyResult 字段
      if (include.keyResult) {
        result.keyResult = result.keyResults;
      }
    }

    if (include.reviews) {
      const reviews = Array.from(mockDataStore.GoalFolder.values()).filter(
        (review: any) => review.goalId === record.id,
      );
      result.reviews = reviews;
    }
  }

  // 处理 keyResult 表的关联
  if (tableName === 'keyResult') {
    if (include.records) {
      const records = Array.from(mockDataStore.progressRecord.values()).filter(
        (r: any) => r.keyResultId === record.id,
      );
      result.records = records;
    }
  }

  return result;
}

// 创建Mock的Prisma模型操作
function createMockModel(tableName: keyof typeof mockDataStore) {
  const store = mockDataStore[tableName];

  return {
    findMany: vi.fn(async (args?: any) => {
      const allRecords = Array.from(store.values());

      // 简单的where条件处理
      let filteredRecords = allRecords;
      if (args?.where) {
        filteredRecords = allRecords.filter((record) => {
          return Object.entries(args.where).every(([key, value]) => {
            if (typeof value === 'object' && value !== null) {
              // 处理复杂条件，比如 { gte: date }
              const valueObj = value as any;
              if (valueObj.gte && record[key]) {
                return new Date(record[key]) >= new Date(valueObj.gte);
              }
              if (valueObj.lte && record[key]) {
                return new Date(record[key]) <= new Date(valueObj.lte);
              }
              if (valueObj.in && Array.isArray(valueObj.in)) {
                return valueObj.in.includes(record[key]);
              }
            }
            return record[key] === value;
          });
        });
      }

      // 处理分页
      if (args?.skip || args?.take) {
        const skip = args.skip || 0;
        const take = args.take || filteredRecords.length;
        filteredRecords = filteredRecords.slice(skip, skip + take);
      }

      // 处理排序
      if (args?.orderBy) {
        const orderBy = Array.isArray(args.orderBy) ? args.orderBy[0] : args.orderBy;
        const field = Object.keys(orderBy)[0];
        const direction = orderBy[field];

        filteredRecords.sort((a, b) => {
          const aVal = a[field];
          const bVal = b[field];

          if (aVal < bVal) return direction === 'asc' ? -1 : 1;
          if (aVal > bVal) return direction === 'asc' ? 1 : -1;
          return 0;
        });
      }

      // ✅ 处理 include 参数
      if (args?.include) {
        filteredRecords = filteredRecords.map((record) =>
          includeRelations(tableName, record, args.include),
        );
      }

      return filteredRecords;
    }),

    findUnique: vi.fn(async (args?: any) => {
      if (!args?.where) return null;

      const key = Object.keys(args.where)[0];
      const value = args.where[key];

      const record = Array.from(store.values()).find((record) => record[key] === value) || null;

      // ✅ 处理 include 参数
      if (record && args?.include) {
        return includeRelations(tableName, record, args.include);
      }

      return record;
    }),

    findFirst: vi.fn(async (args?: any) => {
      const allRecords = Array.from(store.values());

      if (!args?.where) {
        const firstRecord = allRecords[0] || null;
        // ✅ 处理 include 参数
        if (firstRecord && args?.include) {
          return includeRelations(tableName, firstRecord, args.include);
        }
        return firstRecord;
      }

      const foundRecord =
        allRecords.find((record) => {
          return Object.entries(args.where).every(([key, value]) => {
            // 处理嵌套关系（例如 goal: { identityId: 'xxx' }）
            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
              // 跳过嵌套关系，仅匹配直接字段
              if (key === 'goal' || key === 'keyResult' || key === 'task' || key === 'reminder') {
                return true; // 忽略嵌套关系条件（在实际实现中应该通过关联查询）
              }
              // 处理其他对象条件（如 { gte, lte, in }）
              const valueObj = value as any;
              if (valueObj.gte && record[key]) {
                return new Date(record[key]) >= new Date(valueObj.gte);
              }
              if (valueObj.lte && record[key]) {
                return new Date(record[key]) <= new Date(valueObj.lte);
              }
              if (valueObj.in && Array.isArray(valueObj.in)) {
                return valueObj.in.includes(record[key]);
              }
            }
            return record[key] === value;
          });
        }) || null;

      // ✅ 处理 include 参数
      if (foundRecord && args?.include) {
        return includeRelations(tableName, foundRecord, args.include);
      }

      return foundRecord;
    }),

    create: vi.fn(async (args?: any) => {
      // 处理 upsert 的情况
      const data = args?.data || args?.create || {};
      const id = data.id || generateTestId();
      const now = new Date();

      const newRecord = {
        id,
        createdAt: now,
        updatedAt: now,
        ...data,
      };

      store.set(id, newRecord);
      return newRecord;
    }),

    update: vi.fn(async (args?: any) => {
      const where = args?.where || {};
      const data = args?.data || {};

      const key = Object.keys(where)[0];
      const value = where[key];

      const existingRecord = Array.from(store.values()).find((record) => record[key] === value);
      if (!existingRecord) {
        throw new Error(`Record not found`);
      }

      const updatedRecord = {
        ...existingRecord,
        ...data,
        updatedAt: new Date(),
      };

      store.set(existingRecord.id, updatedRecord);
      return updatedRecord;
    }),

    delete: vi.fn(async (args?: any) => {
      const where = args?.where || {};
      const key = Object.keys(where)[0];
      const value = where[key];

      const recordToDelete = Array.from(store.values()).find((record) => record[key] === value);
      if (!recordToDelete) {
        throw new Error(`Record not found`);
      }

      store.delete(recordToDelete.id);
      return recordToDelete;
    }),

    deleteMany: vi.fn(async (args?: any) => {
      const where = args?.where || {};
      let deletedCount = 0;

      if (Object.keys(where).length === 0) {
        // 删除所有记录
        deletedCount = store.size;
        store.clear();
      } else {
        // 根据条件删除
        const recordsToDelete = Array.from(store.values()).filter((record) => {
          return Object.entries(where).every(([key, value]) => {
            if (Array.isArray(value)) {
              return value.includes(record[key]);
            }
            return record[key] === value;
          });
        });

        recordsToDelete.forEach((record) => {
          store.delete(record.id);
          deletedCount++;
        });
      }

      return { count: deletedCount };
    }),

    count: vi.fn(async (args?: any) => {
      if (!args?.where) {
        return store.size;
      }

      const filteredRecords = Array.from(store.values()).filter((record) => {
        return Object.entries(args.where).every(([key, value]) => {
          if (typeof value === 'object' && value !== null) {
            // 处理复杂条件
            const valueObj = value as any;
            if (valueObj.gte && record[key]) {
              return new Date(record[key]) >= new Date(valueObj.gte);
            }
            if (valueObj.lte && record[key]) {
              return new Date(record[key]) <= new Date(valueObj.lte);
            }
            if (valueObj.in && Array.isArray(valueObj.in)) {
              return valueObj.in.includes(record[key]);
            }
          }
          return record[key] === value;
        });
      });

      return filteredRecords.length;
    }),

    aggregate: vi.fn(async (args?: any) => {
      // 简单的聚合实现
      const allRecords = Array.from(store.values());

      return {
        _count: { _all: allRecords.length },
        _avg: {},
        _sum: {},
        _min: {},
        _max: {},
      };
    }),

    groupBy: vi.fn(async (args?: any) => {
      // 简单的分组实现
      return [];
    }),

    upsert: vi.fn(async (args?: any) => {
      const where = args?.where || {};
      const create = args?.create || {};
      const update = args?.update || {};

      const key = Object.keys(where)[0];
      const value = where[key];

      // 使用锁确保 upsert 操作的原子性
      const lockKey = `${tableName}:${key}:${value}`;

      return withLock(lockKey, async () => {
        // 重新查找以确保获取最新的记录
        const existingRecord = Array.from(store.values()).find((record) => record[key] === value);

        if (existingRecord) {
          // 更新
          const updatedRecord = {
            ...existingRecord,
            ...update,
            updatedAt: new Date(),
          };

          // 使用记录的主键或唯一键来存储
          const storageKey =
            existingRecord.id || existingRecord.id || existingRecord[key] || value;
          store.set(storageKey, updatedRecord);
          return updatedRecord;
        } else {
          // 创建
          const now = new Date();
          const newRecord = {
            createdAt: now,
            updatedAt: now,
            ...create,
          };

          // 如果create中没有id或id,但有where条件的key,则使用它作为存储键
          const storageKey = newRecord.id || newRecord.id || newRecord[key] || value;
          store.set(storageKey, newRecord);
          return newRecord;
        }
      });
    }),
  };
}

// 创建Mock的Prisma客户端
export const mockPrismaClient = {
  // Schedule相关表
  scheduleTask: createMockModel('scheduleTask'),
  scheduleExecution: createMockModel('scheduleExecution'),

  // Account相关表
  account: createMockModel('account'),

  // Authentication相关表
  authCredential: createMockModel('authCredential'),
  authSession: createMockModel('authSession'),

  // Task相关表
  taskTemplate: createMockModel('taskTemplate'),
  taskInstance: createMockModel('taskInstance'),
  taskMetaTemplate: createMockModel('taskMetaTemplate'),

  // Goal相关表
  goal: createMockModel('goal'),
  GoalFolder: createMockModel('GoalFolder'),
  keyResult: createMockModel('keyResult'),
  progressRecord: createMockModel('progressRecord'),
  goalRecord: createMockModel('progressRecord'), // 别名：goalRecord 指向 progressRecord

  // Reminder相关表
  reminderTemplate: createMockModel('reminderTemplate'),
  reminderExecution: createMockModel('reminderExecution'),

  // Repository相关表
  repository: createMockModel('repository'), // ✅ 添加：Repository 主表
  repositoryStatistic: createMockModel('repositoryStatistic'), // ✅ 修正：单数形式

  // Goal Statistics
  goalStatistic: createMockModel('goalStatistic'), // ✅ 修正：单数形式

  // Setting相关表
  userSetting: createMockModel('userSetting'),

  // 事务和连接操作 - 先定义为 null，稍后初始化
  $transaction: null as any,

  $connect: vi.fn(async () => {
    // 模拟连接成功
  }),

  $disconnect: vi.fn(async () => {
    // 模拟断开连接
  }),

  $executeRaw: vi.fn(async () => {
    return 0;
  }),

  $queryRaw: vi.fn(async () => {
    return [];
  }),
} as unknown as PrismaClient;

// 初始化 $transaction 函数（需要在 mockPrismaClient 定义后）
mockPrismaClient.$transaction = vi.fn(async (operations: any) => {
  // 支持两种事务模式：
  // 1. 数组形式：prisma.$transaction([op1, op2])
  // 2. 回调形式：prisma.$transaction(async (tx) => { ... })

  if (typeof operations === 'function') {
    // 回调形式：传递 mockPrismaClient 作为事务上下文
    return await operations(mockPrismaClient);
  }

  // 数组形式：依次执行所有操作
  if (Array.isArray(operations)) {
    const results = [];
    for (const operation of operations) {
      results.push(await operation);
    }
    return results;
  }

  throw new Error('$transaction expects either a function or an array');
}) as any;

// 工具函数：重置Mock数据
export function resetMockData() {
  Object.values(mockDataStore).forEach((store) => store.clear());
}

// 工具函数：设置测试数据
export function setMockData<T>(tableName: keyof typeof mockDataStore, data: T[]) {
  const store = mockDataStore[tableName];
  store.clear();

  data.forEach((item: any) => {
    const id = item.id || generateTestId();
    store.set(id, { ...item, id });
  });
}

// 工具函数：获取Mock数据
export function getMockData(tableName: keyof typeof mockDataStore) {
  return Array.from(mockDataStore[tableName].values());
}
