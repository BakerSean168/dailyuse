import type { CircularDependencyValidationResult, TaskDependencyServerDTO } from '@dailyuse/contracts/task';
import type { TaskTemplateId } from '@dailyuse/contracts/primitives';

/**
 * TaskDependencyPolicy
 *
 * Cross-aggregate validation rules for task dependencies.
 */
export class TaskDependencyPolicy {
  /**
   * Ensure adding a dependency does not create a cycle.
   */
  ensureNoCircularDependency(
    predecessorId: string,
    successorId: string,
    allDependencies: TaskDependencyServerDTO[],
  ): CircularDependencyValidationResult {
    const visited = new Set<string>();
    const path: string[] = [];

    const hasCycle = this.detectCycle(
      successorId,
      predecessorId,
      visited,
      path,
      allDependencies,
    );

    if (hasCycle) {
      return {
        isValid: false,
        cycle: [...path, predecessorId] as TaskTemplateId[],
        message: `Creating this dependency would introduce a cycle: ${[...path, predecessorId].join(' -> ')}`,
      };
    }

    return { isValid: true };
  }

  private detectCycle(
    current: string,
    target: string,
    visited: Set<string>,
    path: string[],
    allDependencies: TaskDependencyServerDTO[],
  ): boolean {
    if (current === target) {
      return true;
    }

    if (visited.has(current)) {
      return false;
    }

    visited.add(current);
    path.push(current);

    const dependencies = allDependencies.filter((d) => d.predecessorTaskId === current);

    for (const dependency of dependencies) {
      if (this.detectCycle(dependency.successorTaskId, target, visited, path, allDependencies)) {
        return true;
      }
    }

    path.pop();
    return false;
  }
}
