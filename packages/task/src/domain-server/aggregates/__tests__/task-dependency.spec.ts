import { DependencyType } from '../../value-objects';
import { TaskDependency } from '../task-dependency';

describe('TaskDependency', () => {
  it('creates a dependency with defaults and serializes updates', () => {
    const dependency = TaskDependency.create({
      identityId: 'IdentityId_1',
      predecessorTaskId: 'Task_1',
      successorTaskId: 'Task_2',
    });

    expect(dependency.dependencyType).toBe(DependencyType.FinishToStart);
    expect(dependency.isSelfDependency()).toBe(false);

    dependency.updateDependencyType(DependencyType.StartToStart);
    dependency.updateLagDays(2);

    expect(dependency.toServerDTO()).toMatchObject({
      identityId: 'IdentityId_1',
      predecessorTaskId: 'Task_1',
      successorTaskId: 'Task_2',
      dependencyType: DependencyType.StartToStart,
      lagDays: 2,
    });
  });

  it('rejects invalid dependency creation', () => {
    expect(() =>
      TaskDependency.create({
        identityId: 'IdentityId_1',
        predecessorTaskId: 'Task_1',
        successorTaskId: 'Task_1',
      }),
    ).toThrow('Task cannot depend on itself');
  });
});
