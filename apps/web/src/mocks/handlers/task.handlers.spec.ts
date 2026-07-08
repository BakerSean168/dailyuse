import {
  createMockDependencyChain,
  createMockTaskDependency,
  createMockValidateDependencyResponse,
  taskMockRoutes,
} from './task.handlers';
import { createHttpClientSpy } from './_shared/contract-test-helpers';
import { describe, expect, it } from 'vitest';

describe('task handlers contracts', () => {
  it('uses the current task adapter route prefixes', () => {
    expect(taskMockRoutes.templates).toMatch(/\/task-templates$/);
    expect(taskMockRoutes.instances).toMatch(/\/task-instances$/);
    expect(taskMockRoutes.tasks).toMatch(/\/tasks$/);
  });

  it('uses the same task instance routes and query shape as the adapter', async () => {
    const { TaskTemplateHttpAdapter } = await import('@dailyuse/task/client');
    const httpClient = createHttpClientSpy();
    const adapter = new TaskTemplateHttpAdapter(httpClient);

    await adapter.getInstancesByDateRange('template-1', { from: 100, to: 200 });
    await adapter.generateInstances('template-1', {
      fromDate: 100,
      toDate: 200,
    });

    expect(httpClient.get).toHaveBeenCalledWith('/task-templates/template-1/instances', {
      params: { from: 100, to: 200 },
    });
    expect(httpClient.post).toHaveBeenCalledWith('/task-templates/template-1/generate-instances', {
      fromDate: 100,
      toDate: 200,
    });
  });

  it('uses the current task instance adapter routes and payload shapes', async () => {
    const { TaskInstanceHttpAdapter } = await import('@dailyuse/task/client');
    const httpClient = createHttpClientSpy();
    const adapter = new TaskInstanceHttpAdapter(httpClient);

    await adapter.getTaskInstances({
      page: 1,
      limit: 10,
      templateId: 'template-1',
      status: 'Pending',
      startDate: 100,
      endDate: 200,
    });
    await adapter.getTaskInstanceById('instance-1');
    await adapter.startTaskInstance('instance-1');
    await adapter.completeTaskInstance('instance-1', {
      duration: 30,
      note: 'done',
      rating: 5,
    });
    await adapter.skipTaskInstance('instance-2', { reason: 'deferred' });
    await adapter.checkExpiredInstances();
    await adapter.deleteTaskInstance('instance-3');

    expect(httpClient.get).toHaveBeenNthCalledWith(1, '/task-instances', {
      params: {
        page: 1,
        limit: 10,
        templateId: 'template-1',
        status: 'Pending',
        startDate: 100,
        endDate: 200,
      },
    });
    expect(httpClient.get).toHaveBeenNthCalledWith(2, '/task-instances/instance-1');
    expect(httpClient.post).toHaveBeenNthCalledWith(1, '/task-instances/instance-1/start');
    expect(httpClient.post).toHaveBeenNthCalledWith(2, '/task-instances/instance-1/complete', {
      duration: 30,
      note: 'done',
      rating: 5,
    });
    expect(httpClient.post).toHaveBeenNthCalledWith(3, '/task-instances/instance-2/skip', {
      reason: 'deferred',
    });
    expect(httpClient.post).toHaveBeenNthCalledWith(4, '/task-instances/check-expired');
    expect(httpClient.delete).toHaveBeenCalledWith('/task-instances/instance-3');
    expect(taskMockRoutes.instances).toMatch(/\/task-instances$/);
  });

  it('uses the current task dependency adapter routes and payload shapes', async () => {
    const { TaskDependencyHttpAdapter } = await import('@dailyuse/task/client');
    const httpClient = createHttpClientSpy();
    const adapter = new TaskDependencyHttpAdapter(httpClient);
    const createPayload = {
      identityId: 'identity-1',
      predecessorTaskId: 'task-a',
      successorTaskId: 'task-b',
      dependencyType: 'FinishToStart' as const,
      lagDays: 2,
    };
    const validatePayload = {
      predecessorTaskId: 'task-a',
      successorTaskId: 'task-b',
    };
    const updatePayload = {
      dependencyType: 'StartToStart' as const,
      lagDays: 1,
    };

    await adapter.createDependency('task-b', createPayload);
    await adapter.getDependencies('task-b');
    await adapter.getDependents('task-a');
    await adapter.getDependencyChain('task-b');
    await adapter.validateDependency(validatePayload);
    await adapter.updateDependency('dep-1', updatePayload);
    await adapter.deleteDependency('dep-1');

    expect(httpClient.post).toHaveBeenNthCalledWith(1, '/tasks/task-b/dependencies', createPayload);
    expect(httpClient.get).toHaveBeenNthCalledWith(1, '/tasks/task-b/dependencies');
    expect(httpClient.get).toHaveBeenNthCalledWith(2, '/tasks/task-a/dependents');
    expect(httpClient.get).toHaveBeenNthCalledWith(3, '/tasks/task-b/dependency-chain');
    expect(httpClient.post).toHaveBeenNthCalledWith(
      2,
      '/tasks/dependencies/validate',
      validatePayload,
    );
    expect(httpClient.put).toHaveBeenCalledWith('/tasks/dependencies/dep-1', updatePayload);
    expect(httpClient.delete).toHaveBeenCalledWith('/tasks/dependencies/dep-1');
    expect(taskMockRoutes.tasks).toMatch(/\/tasks$/);
  });

  it('builds dependency payloads with current contract keys', () => {
    expect(createMockTaskDependency()).toEqual(
      expect.objectContaining({
        predecessorTaskId: expect.any(String),
        successorTaskId: expect.any(String),
        dependencyType: expect.any(String),
      }),
    );

    expect(createMockValidateDependencyResponse()).toEqual(
      expect.objectContaining({
        isValid: true,
        wouldCreateCycle: false,
      }),
    );

    expect(createMockDependencyChain()).toEqual(
      expect.objectContaining({
        taskId: expect.any(String),
        allPredecessors: expect.any(Array),
        allSuccessors: expect.any(Array),
      }),
    );
  });

  it('uses the same template list route and query shape as the adapter', async () => {
    const { TaskTemplateHttpAdapter } = await import('@dailyuse/task/client');
    const httpClient = createHttpClientSpy();
    const adapter = new TaskTemplateHttpAdapter(httpClient);

    await adapter.getTaskTemplates({
      page: 2,
      limit: 20,
      status: 'Active',
      goalId: 'goal-1',
      tags: ['focus'],
    });

    expect(httpClient.get).toHaveBeenCalledWith('/task-templates', {
      params: {
        page: 2,
        limit: 20,
        status: 'Active',
        goalId: 'goal-1',
        tags: ['focus'],
      },
    });

    const requestConfig = httpClient.get.mock.calls[0]?.[1] as {
      params?: Record<string, unknown>;
    };
    expect(taskMockRoutes.templates).toMatch(/\/task-templates$/);
    expect(requestConfig.params).not.toHaveProperty('folderId');
    expect(requestConfig.params).not.toHaveProperty('urgency');
  });
});
