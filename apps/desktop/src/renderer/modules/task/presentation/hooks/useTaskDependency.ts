/**
 * useTaskDependency Hook
 *
 * 任务依赖管理 Hook
 * 功能：
 * 1. 获取任务依赖列表
 * 2. 创建/删除依赖
 * 3. 验证依赖关系（循环检测）
 * 4. 获取依赖链信息
 */

import { useState, useCallback, useMemo } from 'react';
import type {
  TaskDependencyClientDTO,
  TaskTemplateWithDependenciesClientDTO,
  DependencyChainClientDTO,
  CreateTaskDependencyRequest,
  ValidateDependencyRequest,
  ValidateDependencyResponse,
} from '@dailyuse/contracts/task';
import { DependencyType, DependencyStatus } from '@dailyuse/contracts/task';
import { useTaskStore } from '../stores/taskStore';

// ===================== 接口定义 =====================

interface UseTaskDependencyOptions {
  identityId?: string;
}

export interface UseTaskDependencyReturn {
  // 数据
  dependencies: TaskDependencyClientDTO[];
  dependencyChain: DependencyChainClientDTO | null;
  
  // 状态
  isLoading: boolean;
  isValidating: boolean;
  error: string | null;
  
  // 操作
  loadDependencies: (taskId: string) => Promise<void>;
  createDependency: (request: Omit<CreateTaskDependencyRequest, 'identityId'>) => Promise<TaskDependencyClientDTO | null>;
  deleteDependency: (dependencyId: string) => Promise<boolean>;
  validateDependency: (request: ValidateDependencyRequest) => Promise<ValidateDependencyResponse>;
  loadDependencyChain: (taskId: string) => Promise<void>;
  
  // 工具
  getDependencyTypeLabel: (type: DependencyType) => string;
  getDependencyTypeDescription: (type: DependencyType) => string;
  canCreateDependency: (predecessorId: string, successorId: string) => boolean;
  getBlockedTasks: () => string[];
  getCriticalPath: () => string[];
}

// ===================== 工具函数 =====================

const dependencyTypeLabels: Record<DependencyType, string> = {
  [DependencyType.FINISH_TO_START]: '完成-开始',
  [DependencyType.START_TO_START]: '开始-开始',
  [DependencyType.FINISH_TO_FINISH]: '完成-完成',
  [DependencyType.START_TO_FINISH]: '开始-完成',
};

const dependencyTypeDescriptions: Record<DependencyType, string> = {
  [DependencyType.FINISH_TO_START]: '前置任务完成后，后续任务才能开始',
  [DependencyType.START_TO_START]: '前置任务开始后，后续任务才能开始',
  [DependencyType.FINISH_TO_FINISH]: '前置任务完成后，后续任务才能完成',
  [DependencyType.START_TO_FINISH]: '前置任务开始后，后续任务才能完成',
};

// ===================== Hook =====================

export function useTaskDependency(options: UseTaskDependencyOptions = {}): UseTaskDependencyReturn {
  const [dependencies, setDependencies] = useState<TaskDependencyClientDTO[]>([]);
  const [dependencyChain, setDependencyChain] = useState<DependencyChainClientDTO | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // identityId 从 options 获取（由调用方提供）
  const identityId = options.identityId ?? '';

  /**
   * 加载任务的依赖列表
   */
  const loadDependencies = useCallback(async (taskId: string) => {
    if (!taskId) return;

    setIsLoading(true);
    setError(null);

    try {
      // TODO: 实际调用 API
      // const response = await taskApi.getDependencies(taskId);
      // setDependencies(response.dependencies);
      
      // Mock 数据 - 实际开发时替换为 API 调用
      console.log('Loading dependencies for task:', taskId);
      setDependencies([]);
    } catch (err) {
      const message = err instanceof Error ? err.message : '加载依赖失败';
      setError(message);
      console.error('Failed to load dependencies:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * 创建依赖关系
   */
  const createDependency = useCallback(async (
    request: Omit<CreateTaskDependencyRequest, 'identityId'>
  ): Promise<TaskDependencyClientDTO | null> => {
    if (!identityId) {
      setError('未设置账户ID');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const fullRequest: CreateTaskDependencyRequest = {
        ...request,
        identityId,
      };

      // TODO: 实际调用 API
      // const response = await taskApi.createDependency(fullRequest);
      // setDependencies(prev => [...prev, response.dependency]);
      // return response.dependency;

      console.log('Creating dependency:', fullRequest);
      
      // Mock 响应
      const mockDependency: TaskDependencyClientDTO = {
        id: `dep-${Date.now()}`,
        predecessorTaskId: request.predecessorTaskId,
        successorTaskId: request.successorTaskId,
        dependencyType: request.dependencyType,
        lagDays: request.lagDays,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      setDependencies(prev => [...prev, mockDependency]);
      return mockDependency;
    } catch (err) {
      const message = err instanceof Error ? err.message : '创建依赖失败';
      setError(message);
      console.error('Failed to create dependency:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [identityId]);

  /**
   * 删除依赖关系
   */
  const deleteDependency = useCallback(async (dependencyId: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      // TODO: 实际调用 API
      // await taskApi.deleteDependency(dependencyId);

      console.log('Deleting dependency:', dependencyId);
      setDependencies(prev => prev.filter(d => d.id !== dependencyId));
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : '删除依赖失败';
      setError(message);
      console.error('Failed to delete dependency:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * 验证依赖关系
   */
  const validateDependency = useCallback(async (
    request: ValidateDependencyRequest
  ): Promise<ValidateDependencyResponse> => {
    setIsValidating(true);

    try {
      // TODO: 实际调用 API
      // const response = await taskApi.validateDependency(request);
      // return response;

      console.log('Validating dependency:', request);

      // Mock 验证逻辑
      const { predecessorTaskId, successorTaskId } = request;

      // 检查是否自依赖
      if (predecessorTaskId === successorTaskId) {
        return {
          isValid: false,
          errors: ['任务不能依赖自己'],
          wouldCreateCycle: false,
        };
      }

      // 检查是否会形成循环（简化逻辑）
      const existingDependency = dependencies.find(
        d => d.predecessorTaskId === successorTaskId && 
             d.successorTaskId === predecessorTaskId
      );

      if (existingDependency) {
        return {
          isValid: false,
          errors: ['会创建循环依赖'],
          wouldCreateCycle: true,
          cyclePath: [predecessorTaskId, successorTaskId, predecessorTaskId],
        };
      }

      return {
        isValid: true,
        message: '依赖关系有效',
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : '验证失败';
      return {
        isValid: false,
        errors: [message],
      };
    } finally {
      setIsValidating(false);
    }
  }, [dependencies]);

  /**
   * 加载依赖链信息
   */
  const loadDependencyChain = useCallback(async (taskId: string) => {
    if (!taskId) return;

    setIsLoading(true);
    setError(null);

    try {
      // TODO: 实际调用 API
      // const response = await taskApi.getDependencyChain(taskId);
      // setDependencyChain(response.chain);

      console.log('Loading dependency chain for task:', taskId);

      // Mock 数据
      const mockChain: DependencyChainClientDTO = {
        taskId,
        allPredecessors: [],
        allSuccessors: [],
        depth: 0,
        isOnCriticalPath: false,
      };

      setDependencyChain(mockChain);
    } catch (err) {
      const message = err instanceof Error ? err.message : '加载依赖链失败';
      setError(message);
      console.error('Failed to load dependency chain:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * 获取依赖类型标签
   */
  const getDependencyTypeLabel = useCallback((type: DependencyType): string => {
    return dependencyTypeLabels[type] || '未知';
  }, []);

  /**
   * 获取依赖类型描述
   */
  const getDependencyTypeDescription = useCallback((type: DependencyType): string => {
    return dependencyTypeDescriptions[type] || '';
  }, []);

  /**
   * 检查是否可以创建依赖
   */
  const canCreateDependency = useCallback((
    predecessorId: string,
    successorId: string
  ): boolean => {
    // 不能自依赖
    if (predecessorId === successorId) return false;

    // 检查是否已存在相同依赖
    const exists = dependencies.some(
      d => d.predecessorTaskId === predecessorId && 
           d.successorTaskId === successorId
    );

    return !exists;
  }, [dependencies]);

  /**
   * 获取被阻塞的任务
   */
  const getBlockedTasks = useCallback((): string[] => {
    // 获取所有作为后续任务但前置任务未完成的任务
    // TODO: 需要结合任务完成状态判断
    return [];
  }, []);

  /**
   * 获取关键路径
   */
  const getCriticalPath = useCallback((): string[] => {
    if (!dependencyChain?.isOnCriticalPath) return [];
    // TODO: 返回关键路径上的任务
    return [];
  }, [dependencyChain]);

  return {
    // 数据
    dependencies,
    dependencyChain,
    
    // 状态
    isLoading,
    isValidating,
    error,
    
    // 操作
    loadDependencies,
    createDependency,
    deleteDependency,
    validateDependency,
    loadDependencyChain,
    
    // 工具
    getDependencyTypeLabel,
    getDependencyTypeDescription,
    canCreateDependency,
    getBlockedTasks,
    getCriticalPath,
  };
}

export default useTaskDependency;
