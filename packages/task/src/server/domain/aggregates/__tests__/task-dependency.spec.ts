import { DependencyType } from '../../value-objects';
import { IdentityId } from '@memoflow/domain-shared';
import { TaskDependency } from '../task-dependency';

describe('TaskDependency', () => {
  it('creates a dependency with defaults and serializes updates', () => {
    const dependency = TaskDependency.create({
      identityId: IdentityId.generate(),
      predecessorTaskId: 'Task_1',
      successorTaskId: 'Task_2',
    });

    expect(dependency.dependencyType).toBe(DependencyType.FinishToStart);
    expect(dependency.isSelfDependency()).toBe(false);

    dependency.updateDependencyType(DependencyType.StartToStart);
    dependency.updateLagDays(2);

    expect(dependency.toServerDTO()).toMatchObject({
      identityId: dependency.identityId,
      predecessorTaskId: 'Task_1',
      successorTaskId: 'Task_2',
      dependencyType: DependencyType.StartToStart,
      lagDays: 2,
    });
  });

  it('rejects invalid dependency creation', () => {
    expect(() =>
      TaskDependency.create({
        identityId: IdentityId.generate(),
        predecessorTaskId: 'Task_1',
        successorTaskId: 'Task_1',
      }),
    ).toThrow('Task cannot depend on itself');
  });

  it('emits a dependency-deleted event', () => {
    const dependency = TaskDependency.create({
      identityId: IdentityId.generate(),
      predecessorTaskId: 'Task_1',
      successorTaskId: 'Task_2',
    });

    dependency.pullDomainEvents();
    dependency.delete();

    const [event] = dependency.pullDomainEvents();
    expect(event?.eventType).toBe('task:dependency-deleted');
    expect(event?.payload).toEqual({
      dependencyId: dependency.id,
      predecessorTaskId: dependency.predecessorTaskId,
      successorTaskId: dependency.successorTaskId,
    });
  });
});
