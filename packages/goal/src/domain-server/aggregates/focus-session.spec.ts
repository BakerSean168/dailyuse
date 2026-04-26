import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { FocusSession } from './focus-session';
import { FocusSessionStatus } from '@dailyuse/contracts/goal';

describe('FocusSession aggregate', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-26T09:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('creates an active session and validates creation invariants', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const session = FocusSession.create({
      identityId: 'IdentityId_1' as never,
      goalId: 'GoalId_1' as never,
      durationMinutes: 27,
      description: 'Deep work',
    });

    expect(session.status).toBe(FocusSessionStatus.Active);
    expect(session.startedAt?.toISOString()).toBe('2026-04-26T09:00:00.000Z');
    expect(session.goalId).toBe('GoalId_1');
    expect(session.description).toBe('Deep work');
    expect(session.progressPercentage).toBe(0);
    expect(session.remainingMinutes).toBe(27);
    expect(warn).toHaveBeenCalledOnce();

    expect(() =>
      FocusSession.create({
        identityId: 'IdentityId_1' as never,
        durationMinutes: 0,
      }),
    ).toThrow('专注时长必须在 1-240 分钟之间');
    expect(() =>
      FocusSession.create({
        identityId: 'IdentityId_1' as never,
        durationMinutes: 25,
        description: 'x'.repeat(501),
      }),
    ).toThrow('会话描述不能超过 500 个字符');
  });

  it('supports starting a restored draft-like session and rejects invalid starts', () => {
    const session = FocusSession.load({
      id: 'FocusSessionId_1' as never,
      identityId: 'IdentityId_1' as never,
      goalId: null,
      status: FocusSessionStatus.Active,
      durationMinutes: 25,
      actualDurationMinutes: 0,
      description: null,
      startedAt: null,
      pausedAt: null,
      resumedAt: null,
      completedAt: null,
      cancelledAt: null,
      pauseCount: 0,
      pausedDurationMinutes: 0,
      createdAt: new Date('2026-04-26T08:00:00.000Z'),
      updatedAt: new Date('2026-04-26T08:00:00.000Z'),
      version: 1,
      deletedAt: null,
    });

    session.start();
    expect(session.startedAt?.toISOString()).toBe('2026-04-26T09:00:00.000Z');

    expect(() => session.start()).toThrow('专注周期已开始');
    expect(() =>
      FocusSession.load({
        ...session.toServerDTO(),
        id: session.id,
        identityId: session.identityId,
        goalId: session.goalId,
        startedAt: session.startedAt,
        pausedAt: session.pausedAt,
        resumedAt: session.resumedAt,
        completedAt: session.completedAt,
        cancelledAt: session.cancelledAt,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
        deletedAt: session.deletedAt,
      } as never),
    ).toBeTruthy();
  });

  it('pauses, resumes, completes, and reports progress', () => {
    const session = FocusSession.create({
      identityId: 'IdentityId_1' as never,
      goalId: 'GoalId_1' as never,
      durationMinutes: 30,
    });
    session.pullDomainEvents();

    vi.setSystemTime(new Date('2026-04-26T09:10:00.000Z'));
    expect(session.remainingMinutes).toBe(20);
    expect(session.progressPercentage).toBe(33);

    session.pause();
    expect(session.pauseCount).toBe(1);
    expect(session.pausedAt?.toISOString()).toBe('2026-04-26T09:10:00.000Z');
    expect(session.getPauseWarning(0)).toContain('超过推荐值');
    expect(() => session.pause()).toThrow('专注周期已暂停');

    vi.setSystemTime(new Date('2026-04-26T09:15:00.000Z'));
    session.resume();
    expect(session.pausedAt).toBeNull();
    expect(session.resumedAt?.toISOString()).toBe('2026-04-26T09:15:00.000Z');
    expect(session.pausedDurationMinutes).toBe(5);
    expect(session.getPauseWarning()).toBeNull();

    vi.setSystemTime(new Date('2026-04-26T09:35:00.000Z'));
    session.complete();
    expect(session.status).toBe(FocusSessionStatus.Completed);
    expect(session.actualDurationMinutes).toBe(30);
    expect(session.completedAt?.toISOString()).toBe('2026-04-26T09:35:00.000Z');
    expect(session.progressPercentage).toBe(100);
    expect(session.remainingMinutes).toBe(0);
    expect(session.isActive()).toBe(false);
    expect(session.toClientDTO()).toMatchObject({
      status: FocusSessionStatus.Completed,
      actualDurationMinutes: 30,
      isActive: false,
      progressPercentage: 100,
    });
  });

  it('cancels, enforces ownership and deletability, and handles paused completion', () => {
    const session = FocusSession.create({
      identityId: 'IdentityId_1' as never,
      durationMinutes: 25,
    });

    expect(() => session.assertOwnedBy('IdentityId_2' as never)).toThrow(
      '无权操作此专注周期，会话不属于当前账户',
    );
    expect(() => session.assertDeletable()).toThrow(
      '只能删除已完成或已取消的专注周期，当前状态：Active',
    );

    vi.setSystemTime(new Date('2026-04-26T09:05:00.000Z'));
    session.pause();
    vi.setSystemTime(new Date('2026-04-26T09:12:00.000Z'));
    session.complete();
    expect(session.actualDurationMinutes).toBe(5);
    session.assertDeletable();

    const other = FocusSession.create({
      identityId: 'IdentityId_3' as never,
      durationMinutes: 25,
    });
    vi.setSystemTime(new Date('2026-04-26T09:01:00.000Z'));
    other.cancel();
    expect(other.status).toBe(FocusSessionStatus.Cancelled);
    expect(other.cancelledAt?.toISOString()).toBe('2026-04-26T09:01:00.000Z');
    other.assertDeletable();
    expect(() => other.cancel()).toThrow('不能取消已完成或已取消的专注周期');

    expect(() =>
      FocusSession.load({
        id: 'FocusSessionId_2' as never,
        identityId: 'IdentityId_1' as never,
        goalId: null,
        status: FocusSessionStatus.Active,
        durationMinutes: 25,
        actualDurationMinutes: 0,
        description: null,
        startedAt: null,
        pausedAt: null,
        resumedAt: null,
        completedAt: null,
        cancelledAt: null,
        pauseCount: 0,
        pausedDurationMinutes: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1,
        deletedAt: null,
      }).complete(),
    ).toThrow('开始时间不存在，无法计算实际时长');
    expect(() =>
      FocusSession.load({
        id: 'FocusSessionId_3' as never,
        identityId: 'IdentityId_1' as never,
        goalId: null,
        status: FocusSessionStatus.Active,
        durationMinutes: 25,
        actualDurationMinutes: 0,
        description: null,
        startedAt: null,
        pausedAt: null,
        resumedAt: null,
        completedAt: null,
        cancelledAt: null,
        pauseCount: 0,
        pausedDurationMinutes: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1,
        deletedAt: null,
      }).resume(),
    ).toThrow('专注周期未暂停，无法恢复');
  });
});
