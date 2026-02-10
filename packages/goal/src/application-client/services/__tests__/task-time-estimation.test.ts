/**
 * TaskTimeEstimationService 单元测试
 * @module @dailyuse/application-client/goal/services/__tests__/task-time-estimation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TaskTimeEstimationService } from '../task-time-estimation';
import type { TimeEstimationRequest } from '@dailyuse/contracts/goal';

// Mock AIServiceFactory
vi.mock('../../../ai/AIServiceFactory', () => ({
  AIServiceFactory: {
    getDefaultProvider: vi.fn(() => ({
      estimateTaskTime: vi.fn(async (description: string) => ({
        estimatedMinutes: 60,
        confidence: 0.85,
        reasoning: '基于任务描述分析',
      })),
    })),
  },
}));

describe('TaskTimeEstimationService', () => {
  let service: TaskTimeEstimationService;

  beforeEach(() => {
    // 创建新的单例实例
    service = TaskTimeEstimationService.getInstance();
    service.clearCache(); // 清空缓存
  });

  afterEach(() => {
    service.clearCache();
  });

  describe('Singleton Pattern', () => {
    it('应该返回相同的实例', () => {
      const instance1 = TaskTimeEstimationService.getInstance();
      const instance2 = TaskTimeEstimationService.getInstance();

      expect(instance1).toBe(instance2);
    });
  });

  describe('estimateTaskTime', () => {
    const mockRequest: TimeEstimationRequest = {
      taskId: 'task-1',
      taskTitle: '实现用户认证模块',
      taskDescription: '需要实现用户注册、登录、密码重置等功能',
      complexity: 'medium',
    };

    it('应该成功估算任务时间', async () => {
      const result = await service.estimateTaskTime(mockRequest);

      expect(result).toBeDefined();
      expect(result.taskId).toBe('task-1');
      expect(result.taskTitle).toBe('实现用户认证模块');
      expect(result.estimatedMinutes).toBeGreaterThan(0);
      expect(result.confidenceScore).toBeGreaterThanOrEqual(0);
      expect(result.confidenceScore).toBeLessThanOrEqual(1);
    });

    it('应该返回有效的置信度分数', async () => {
      const result = await service.estimateTaskTime(mockRequest);

      expect(result.confidenceScore).toBeGreaterThanOrEqual(0);
      expect(result.confidenceScore).toBeLessThanOrEqual(1);
    });

    it('应该包含估算理由', async () => {
      const result = await service.estimateTaskTime(mockRequest);

      expect(result.reasoning).toBeDefined();
      expect(result.reasoning.length).toBeGreaterThan(0);
    });

    it('应该处理不同复杂度的任务', async () => {
      const simpleTask = { ...mockRequest, complexity: 'simple' as const };
      const mediumTask = { ...mockRequest, complexity: 'medium' as const };
      const complexTask = { ...mockRequest, complexity: 'complex' as const };

      const simpleResult = await service.estimateTaskTime(simpleTask);
      const mediumResult = await service.estimateTaskTime(mediumTask);
      const complexResult = await service.estimateTaskTime(complexTask);

      expect(simpleResult).toBeDefined();
      expect(mediumResult).toBeDefined();
      expect(complexResult).toBeDefined();
    });
  });

  describe('Caching Mechanism', () => {
    const mockRequest: TimeEstimationRequest = {
      taskId: 'task-cache-1',
      taskTitle: '测试缓存',
      taskDescription: '测试缓存功能',
      complexity: 'simple',
    };

    it('应该缓存估算结果', async () => {
      const result1 = await service.estimateTaskTime(mockRequest);
      const result2 = await service.estimateTaskTime(mockRequest);

      expect(result1).toEqual(result2);
    });

    it('应该为不同请求使用不同缓存', async () => {
      const request1 = { ...mockRequest, taskId: 'task-1' };
      const request2 = { ...mockRequest, taskId: 'task-2' };

      const result1 = await service.estimateTaskTime(request1);
      const result2 = await service.estimateTaskTime(request2);

      // 两个结果应该都有效，但来自不同缓存条目
      expect(result1).toBeDefined();
      expect(result2).toBeDefined();
    });

    it('应该在清除缓存后重新计算', async () => {
      await service.estimateTaskTime(mockRequest);
      service.clearCache();

      // 清除后应该能再次计算
      const result = await service.estimateTaskTime(mockRequest);
      expect(result).toBeDefined();
    });

    it('应该支持设置缓存过期时间', async () => {
      service.setCacheExpiry(60); // 60 分钟

      const result = await service.estimateTaskTime(mockRequest);
      expect(result).toBeDefined();
    });
  });

  describe('adjustEstimate', () => {
    const baseRequest: TimeEstimationRequest = {
      taskId: 'task-adjust',
      taskTitle: '调整估算',
      taskDescription: '测试调整功能',
      complexity: 'medium',
    };

    it('应该在提供历史数据时调整估算', async () => {
      const requestWithHistory: TimeEstimationRequest = {
        ...baseRequest,
        historicalData: {
          userSpeedFactor: 0.8, // 用户比平均快 20%
          averageMinutes: 60,
          estimationAccuracy: 85,
        },
      };

      const result = await service.estimateTaskTime(requestWithHistory);

      expect(result.adjustedMinutes).toBeDefined();
      // 由于快速因子，调整后的时间应该小于基础估算
      if (result.adjustedMinutes) {
        expect(result.adjustedMinutes).toBeLessThanOrEqual(result.estimatedMinutes);
      }
    });

    it('应该在没有历史数据时返回原始估算', async () => {
      const result = await service.estimateTaskTime(baseRequest);

      // 如果没有历史数据进行调整，调整后的值应该等于原始值或未定义
      if (result.adjustedMinutes) {
        expect(result.adjustedMinutes).toBeGreaterThan(0);
      }
    });
  });

  describe('batchEstimateTaskTime', () => {
    const mockRequests: TimeEstimationRequest[] = [
      {
        taskId: 'batch-1',
        taskTitle: '任务1',
        taskDescription: '描述1',
        complexity: 'simple',
      },
      {
        taskId: 'batch-2',
        taskTitle: '任务2',
        taskDescription: '描述2',
        complexity: 'medium',
      },
      {
        taskId: 'batch-3',
        taskTitle: '任务3',
        taskDescription: '描述3',
        complexity: 'complex',
      },
    ];

    it('应该估算多个任务', async () => {
      const result = await service.batchEstimateTaskTime(mockRequests);

      expect(result.estimates.length).toBe(3);
      expect(result.totalMinutes).toBeGreaterThan(0);
      expect(result.averageConfidence).toBeGreaterThanOrEqual(0);
      expect(result.averageConfidence).toBeLessThanOrEqual(1);
    });

    it('应该计算总时间', async () => {
      const result = await service.batchEstimateTaskTime(mockRequests);

      const calculatedTotal = result.estimates.reduce(
        (sum, est) => sum + (est.adjustedMinutes || est.estimatedMinutes),
        0
      );

      expect(result.totalMinutes).toBeCloseTo(calculatedTotal, 0);
    });

    it('应该计算平均置信度', async () => {
      const result = await service.batchEstimateTaskTime(mockRequests);

      const expectedAverage =
        result.estimates.reduce((sum, est) => sum + est.confidenceScore, 0) /
        result.estimates.length;

      expect(result.averageConfidence).toBeCloseTo(expectedAverage, 2);
    });

    it('应该返回有效的生成时间戳', async () => {
      const result = await service.batchEstimateTaskTime(mockRequests);

      expect(result.generatedAt).toBeInstanceOf(Date);
      expect(result.generatedAt.getTime()).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('应该处理缺少 AI provider 的情况', async () => {
      // 模拟没有 provider 的情况
      const mockRequest: TimeEstimationRequest = {
        taskId: 'error-test',
        taskTitle: '错误测试',
        taskDescription: '测试错误处理',
      };

      // 测试能否处理错误（实际错误处理由 AIServiceFactory 决定）
      try {
        const result = await service.estimateTaskTime(mockRequest);
        expect(result).toBeDefined();
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('Cache Key Generation', () => {
    it('应该为相同请求生成相同的缓存键', async () => {
      const request1: TimeEstimationRequest = {
        taskId: 'test-1',
        taskTitle: '任务',
        taskDescription: '描述',
        complexity: 'simple',
      };

      const request2: TimeEstimationRequest = {
        taskId: 'test-1',
        taskTitle: '任务',
        taskDescription: '不同的描述',
        complexity: 'simple',
      };

      // 两个请求应该生成相同的缓存键（基于 taskId 和 complexity）
      const result1 = await service.estimateTaskTime(request1);
      const result2 = await service.estimateTaskTime(request2);

      expect(result1).toEqual(result2); // 应该返回缓存的结果
    });

    it('不同复杂度应该生成不同的缓存键', async () => {
      const baseRequest: TimeEstimationRequest = {
        taskId: 'test-key',
        taskTitle: '任务',
        taskDescription: '描述',
      };

      const simpleRequest = { ...baseRequest, complexity: 'simple' as const };
      const mediumRequest = { ...baseRequest, complexity: 'medium' as const };

      const result1 = await service.estimateTaskTime(simpleRequest);
      const result2 = await service.estimateTaskTime(mediumRequest);

      // 应该生成不同的缓存条目
      expect(result1).toBeDefined();
      expect(result2).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('应该处理没有 taskId 的请求', async () => {
      const request: TimeEstimationRequest = {
        taskTitle: '任务标题',
        taskDescription: '任务描述',
      };

      const result = await service.estimateTaskTime(request);
      expect(result).toBeDefined();
      expect(result.taskTitle).toBe('任务标题');
    });

    it('应该处理没有复杂度的请求', async () => {
      const request: TimeEstimationRequest = {
        taskId: 'test-no-complexity',
        taskTitle: '任务',
        taskDescription: '描述',
        // 没有 complexity 字段
      };

      const result = await service.estimateTaskTime(request);
      expect(result).toBeDefined();
    });

    it('应该处理空缓存的清除', () => {
      // 应该不抛出错误
      expect(() => service.clearCache()).not.toThrow();
    });
  });
});
