import {
  createMockDependencyChain,
  createMockTaskDependency,
  createMockValidateDependencyResponse,
  taskMockRoutes,
} from './task.handlers';

describe('task handlers contracts', () => {
  it('uses the current task adapter route prefixes', () => {
    expect(taskMockRoutes.templates).toMatch(/\/task-templates$/);
    expect(taskMockRoutes.instances).toMatch(/\/task-instances$/);
    expect(taskMockRoutes.tasks).toMatch(/\/tasks$/);
  });

  it('builds dependency payloads with current contract keys', () => {
    expect(createMockTaskDependency()).toEqual(
      expect.objectContaining({
        predecessorTaskId: expect.any(String),
        successorTaskId: expect.any(String),
        dependencyType: expect.any(String),
        version: expect.any(Number),
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
});
