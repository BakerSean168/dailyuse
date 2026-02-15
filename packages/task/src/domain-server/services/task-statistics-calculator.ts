import type { TaskDependencyServerDTO } from '@dailyuse/contracts/task';
import { DependencyStatus } from '@dailyuse/contracts/task';
import type { TaskTemplate } from '../aggregates/task-template';

export interface TaskDependencyStatusResult {
  status: DependencyStatus;
  isBlocked: boolean;
  blockingReason?: string;
}

/**
 * TaskStatisticsCalculator
 *
 * Read-side calculations for task dependency analytics.
 */
export class TaskStatisticsCalculator {
  calculateDependencyStatus(
    dependencies: TaskDependencyServerDTO[],
    predecessorTasks: (TaskTemplate | null)[],
  ): TaskDependencyStatusResult {
    if (dependencies.length === 0) {
      return {
        status: DependencyStatus.None,
        isBlocked: false,
      };
    }

    const notFound = predecessorTasks.some((task) => task === null);
    if (notFound) {
      return {
        status: DependencyStatus.Blocked,
        isBlocked: true,
        blockingReason: undefined,
      };
    }

    const tasks = predecessorTasks.filter(Boolean) as TaskTemplate[];
    const anyBlocked = tasks.some((task: any) => task.isBlocked === true);
    if (anyBlocked) {
      const blockedTasks = tasks
        .filter((task: any) => task.isBlocked)
        .map((task: any) => task.title)
        .join(', ');
      return {
        status: DependencyStatus.Blocked,
        isBlocked: true,
        blockingReason: `Blocked by predecessor tasks: ${blockedTasks}`,
      };
    }

    return {
      status: DependencyStatus.Waiting,
      isBlocked: true,
      blockingReason: 'Waiting for predecessor tasks to complete',
    };
  }

  calculateDependencyDepth(taskUuid: string, allDependencies: TaskDependencyServerDTO[]): number {
    const dependencies = allDependencies.filter((d) => d.successorTaskId === taskUuid);

    if (dependencies.length === 0) {
      return 0;
    }

    const depths = dependencies.map((dep) =>
      this.calculateDependencyDepth(dep.predecessorTaskId, allDependencies),
    );

    return Math.max(...depths) + 1;
  }
}
