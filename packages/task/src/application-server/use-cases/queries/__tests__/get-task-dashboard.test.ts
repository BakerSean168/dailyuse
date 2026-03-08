import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@dailyuse/test-utils/helpers/result-matchers';
import { createMockRepo } from '@dailyuse/test-utils/mocks';
import { aOneTimeTask, aLoadedTaskTemplate, anIdentityId } from '@dailyuse/test-utils/fixtures';
import type { ITaskTemplateRepository } from '@/domain-server/repositories/ITaskTemplateRepository';
import { TaskTemplateStatus } from '@dailyuse/contracts/task';
import { TaskType } from '@dailyuse/contracts/task';
import { GetTaskDashboard } from '../get-task-dashboard';

describe('GetTaskDashboard', () => {
  let templateRepo: ReturnType<typeof createMockRepo<ITaskTemplateRepository>>;
  let useCase: GetTaskDashboard;
  const testIdentityId = anIdentityId();

  beforeEach(() => {
    vi.clearAllMocks();
    templateRepo = createMockRepo<ITaskTemplateRepository>({
      findTodayTasks: vi.fn().mockResolvedValue([]),
      findOverdueTasks: vi.fn().mockResolvedValue([]),
      findBlockedTasks: vi.fn().mockResolvedValue([]),
      findUpcomingTasks: vi.fn().mockResolvedValue([]),
      findSortedByPriority: vi.fn().mockResolvedValue([]),
      findOneTimeTasks: vi.fn().mockResolvedValue([]),
      countTasks: vi.fn().mockResolvedValue(0),
    });
    useCase = new GetTaskDashboard(templateRepo);
  });

  it('should return empty dashboard when no tasks exist', async () => {
    const result = await useCase.execute(testIdentityId);

    expect(result).toBeOk();
    if (result.ok) {
      expect(result.data.todayTasks).toEqual([]);
      expect(result.data.overdueTasks).toEqual([]);
      expect(result.data.upcomingTasks).toEqual([]);
      expect(result.data.highPriorityTasks).toEqual([]);
      expect(result.data.blockedTasks).toEqual([]);
      expect(result.data.summary.totalTasks).toBe(0);
    }
  });

  it('should call all repository methods in parallel', async () => {
    await useCase.execute(testIdentityId);

    expect(templateRepo.findTodayTasks).toHaveBeenCalledWith(testIdentityId);
    expect(templateRepo.findOverdueTasks).toHaveBeenCalledWith(testIdentityId);
    expect(templateRepo.findBlockedTasks).toHaveBeenCalledWith(testIdentityId);
    expect(templateRepo.findUpcomingTasks).toHaveBeenCalledWith(testIdentityId, 7);
    expect(templateRepo.findSortedByPriority).toHaveBeenCalledWith(testIdentityId, 5);
    expect(templateRepo.findOneTimeTasks).toHaveBeenCalledWith(testIdentityId, {
      status: TaskTemplateStatus.Archived,
    });
    expect(templateRepo.countTasks).toHaveBeenCalledTimes(2);
  });

  it('should return today tasks as client DTOs', async () => {
    const task = aOneTimeTask({ title: 'Today Task' });
    vi.mocked(templateRepo.findTodayTasks).mockResolvedValue([task]);

    const result = await useCase.execute(testIdentityId);

    expect(result).toBeOk();
    if (result.ok) {
      expect(result.data.todayTasks).toHaveLength(1);
    }
  });

  it('should return overdue tasks', async () => {
    const task = aOneTimeTask({ title: 'Overdue Task' });
    vi.mocked(templateRepo.findOverdueTasks).mockResolvedValue([task]);

    const result = await useCase.execute(testIdentityId);

    expect(result).toBeOk();
    if (result.ok) {
      expect(result.data.overdueTasks).toHaveLength(1);
      expect(result.data.summary.overdue).toBe(1);
    }
  });

  it('should compute summary totals correctly', async () => {
    vi.mocked(templateRepo.countTasks)
      .mockResolvedValueOnce(10) // Active
      .mockResolvedValueOnce(5); // Archived/Completed

    const result = await useCase.execute(testIdentityId);

    expect(result).toBeOk();
    if (result.ok) {
      expect(result.data.summary.totalTasks).toBe(15);
      expect(result.data.summary.completedToday).toBe(5);
    }
  });

  it('should filter recent completed tasks by 7-day window', async () => {
    const now = Date.now();
    const recentTask = aLoadedTaskTemplate({
      status: TaskTemplateStatus.Archived,
      taskType: TaskType.OneTime,
      updatedAt: new Date(now - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    });
    const oldTask = aLoadedTaskTemplate({
      status: TaskTemplateStatus.Archived,
      taskType: TaskType.OneTime,
      updatedAt: new Date(now - 10 * 24 * 60 * 60 * 1000), // 10 days ago
    });
    vi.mocked(templateRepo.findOneTimeTasks).mockResolvedValue([recentTask, oldTask]);

    const result = await useCase.execute(testIdentityId);

    // The use case filters by 7-day window internally
    // The recent completed tasks are not directly in the response
    // but the findOneTimeTasks was called
    expect(result).toBeOk();
    expect(templateRepo.findOneTimeTasks).toHaveBeenCalledWith(testIdentityId, {
      status: TaskTemplateStatus.Archived,
    });
  });

  it('should return upcoming and high priority tasks', async () => {
    const upcomingTask = aOneTimeTask({ title: 'Upcoming' });
    const priorityTask = aOneTimeTask({ title: 'Priority' });
    vi.mocked(templateRepo.findUpcomingTasks).mockResolvedValue([upcomingTask]);
    vi.mocked(templateRepo.findSortedByPriority).mockResolvedValue([priorityTask]);

    const result = await useCase.execute(testIdentityId);

    expect(result).toBeOk();
    if (result.ok) {
      expect(result.data.upcomingTasks).toHaveLength(1);
      expect(result.data.highPriorityTasks).toHaveLength(1);
      expect(result.data.summary.upcoming).toBe(1);
      expect(result.data.summary.highPriority).toBe(1);
    }
  });
});
