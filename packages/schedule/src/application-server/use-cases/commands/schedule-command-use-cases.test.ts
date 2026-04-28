import { beforeEach, describe, expect, it, vi } from 'vitest';
import { eventBus } from '@dailyuse/utils';
import { DeleteScheduleTaskUseCase } from './delete-schedule-task.use-case';
import { PauseScheduleTaskUseCase } from './pause-schedule-task.use-case';
import { ResumeScheduleTaskUseCase } from './resume-schedule-task.use-case';
import { TriggerScheduleTaskUseCase } from './trigger-schedule-task.use-case';
import { UpdateScheduleTaskUseCase } from './update-schedule-task.use-case';

describe('Schedule command use-cases', () => {
  const repository = {
    findById: vi.fn(),
    save: vi.fn(),
    deleteById: vi.fn(),
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('delete throws when task is missing', async () => {
    repository.findById.mockResolvedValue(null);
    const useCase = new DeleteScheduleTaskUseCase(repository);

    await expect(useCase.execute('task-1')).rejects.toThrow('Schedule task task-1 not found');
  });

  it('delete removes task and sends event', async () => {
    repository.findById.mockResolvedValue({ id: 'task-1' });
    repository.deleteById.mockResolvedValue(undefined);
    const eventSpy = vi.spyOn(eventBus as any, 'send');
    const useCase = new DeleteScheduleTaskUseCase(repository);

    await useCase.execute('task-1');

    expect(repository.deleteById).toHaveBeenCalledWith('task-1');
    expect(eventSpy).toHaveBeenCalledWith('schedule:task:deleted', { taskId: 'task-1' });
  });

  it('pause throws when task is missing', async () => {
    repository.findById.mockResolvedValue(null);
    const useCase = new PauseScheduleTaskUseCase(repository);

    await expect(useCase.execute('task-1')).rejects.toThrow('Schedule task task-1 not found');
  });

  it('pause updates task and returns dto', async () => {
    const pause = vi.fn();
    const toClientDTO = vi.fn().mockReturnValue({ id: 'task-1', status: 'Paused' });
    repository.findById.mockResolvedValue({ pause, toClientDTO });
    repository.save.mockResolvedValue(undefined);
    const useCase = new PauseScheduleTaskUseCase(repository);

    const result = await useCase.execute('task-1');

    expect(pause).toHaveBeenCalledTimes(1);
    expect(repository.save).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ id: 'task-1', status: 'Paused' });
  });

  it('resume throws when task is missing', async () => {
    repository.findById.mockResolvedValue(null);
    const useCase = new ResumeScheduleTaskUseCase(repository);

    await expect(useCase.execute('task-1')).rejects.toThrow('Schedule task task-1 not found');
  });

  it('resume updates task and returns dto', async () => {
    const resume = vi.fn();
    const toClientDTO = vi.fn().mockReturnValue({ id: 'task-1', status: 'Active' });
    repository.findById.mockResolvedValue({ resume, toClientDTO });
    repository.save.mockResolvedValue(undefined);
    const useCase = new ResumeScheduleTaskUseCase(repository);

    const result = await useCase.execute('task-1');

    expect(resume).toHaveBeenCalledTimes(1);
    expect(repository.save).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ id: 'task-1', status: 'Active' });
  });

  it('trigger throws when task is missing', async () => {
    repository.findById.mockResolvedValue(null);
    const useCase = new TriggerScheduleTaskUseCase(repository);

    await expect(useCase.execute('task-1')).rejects.toThrow('Schedule task task-1 not found');
  });

  it('trigger recalculates next run and saves task', async () => {
    const calculateNextRun = vi.fn();
    repository.findById.mockResolvedValue({ calculateNextRun });
    repository.save.mockResolvedValue(undefined);
    const useCase = new TriggerScheduleTaskUseCase(repository);

    await useCase.execute('task-1');

    expect(calculateNextRun).toHaveBeenCalledTimes(1);
    expect(repository.save).toHaveBeenCalledTimes(1);
  });

  it('update throws when task is missing', async () => {
    repository.findById.mockResolvedValue(null);
    const useCase = new UpdateScheduleTaskUseCase(repository);

    await expect(useCase.execute({ id: 'task-1' } as any)).rejects.toThrow(
      'Schedule task task-1 not found',
    );
  });

  it('update applies all supported mutations and saves task', async () => {
    const task = {
      updateMetadata: vi.fn(),
      enable: vi.fn(),
      disable: vi.fn(),
      updateSchedule: vi.fn(),
      updateRetryPolicy: vi.fn(),
      updatePayload: vi.fn(),
      toClientDTO: vi.fn().mockReturnValue({ id: 'task-1' }),
    };
    repository.findById.mockResolvedValue(task);
    repository.save.mockResolvedValue(undefined);
    const useCase = new UpdateScheduleTaskUseCase(repository);

    const result = await useCase.execute({
      id: 'task-1',
      description: 'updated desc',
      enabled: true,
      scheduleConfig: { cronExpression: '0 9 * * *' },
      retryPolicy: { maxRetries: 3 },
      handlerPayload: { foo: 'bar' },
    } as any);

    expect(task.updateMetadata).toHaveBeenCalledWith({ description: 'updated desc' });
    expect(task.enable).toHaveBeenCalledTimes(1);
    expect(task.disable).not.toHaveBeenCalled();
    expect(task.updateSchedule).toHaveBeenCalledWith({ cronExpression: '0 9 * * *' });
    expect(task.updateRetryPolicy).toHaveBeenCalledWith({ maxRetries: 3 });
    expect(task.updatePayload).toHaveBeenCalledWith({ foo: 'bar' });
    expect(repository.save).toHaveBeenCalledWith(task);
    expect(result).toEqual({ id: 'task-1' });
  });

  it('update disables task when enabled flag is false', async () => {
    const task = {
      updateMetadata: vi.fn(),
      enable: vi.fn(),
      disable: vi.fn(),
      updateSchedule: vi.fn(),
      updateRetryPolicy: vi.fn(),
      updatePayload: vi.fn(),
      toClientDTO: vi.fn().mockReturnValue({ id: 'task-1' }),
    };
    repository.findById.mockResolvedValue(task);
    repository.save.mockResolvedValue(undefined);
    const useCase = new UpdateScheduleTaskUseCase(repository);

    await useCase.execute({
      id: 'task-1',
      enabled: false,
    } as any);

    expect(task.disable).toHaveBeenCalledTimes(1);
    expect(task.enable).not.toHaveBeenCalled();
  });
});
