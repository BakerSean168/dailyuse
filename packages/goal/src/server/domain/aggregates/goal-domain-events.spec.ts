import { describe, expect, it } from 'vitest';
import { FocusSession } from './focus-session';
import { Goal } from './goal';
import { GoalFolder } from './goal-folder';

function createGoalAggregate(): Goal {
  return Goal.create({
    identityId: 'IdentityId_550e8400-e29b-41d4-a716-446655440001' as any,
    name: 'Launch Goal',
    description: 'Ship the launch plan',
    color: '#3B82F6',
    feasibilityAnalysis: null,
    motivation: null,
    importance: 'Moderate' as any,
    category: 'Work',
    tags: ['launch'],
    startDate: null,
    targetDate: null,
    folderId: null,
    parentGoalId: null,
    reminderConfig: null,
  });
}

describe('Goal domain events', () => {
  it('emits enriched goal:update payloads', () => {
    const goal = createGoalAggregate();
    goal.pullDomainEvents();

    goal.updateBasicInfo({ name: 'Launch Goal v2', color: '#111827' });

    const [event] = goal.pullDomainEvents();
    expect(event.eventType).toBe('goal:updated');
    expect(event.payload).toMatchObject({
      identityId: goal.identityId,
      changes: ['name', 'color'],
      goal: {
        id: goal.id,
        name: 'Launch Goal v2',
        color: '#111827',
      },
    });
  });

  it('emits enriched key result and review payloads', () => {
    const goal = createGoalAggregate();
    goal.pullDomainEvents();

    const keyResult = goal.createAndAddKeyResult({
      title: 'Sign 100 users',
      valueType: 'NUMERIC',
      targetValue: 100,
      currentValue: 10,
      weight: 3,
    });

    let [event] = goal.pullDomainEvents();
    expect(event.eventType).toBe('goal:key-result-added');
    expect(event.payload).toMatchObject({
      identityId: goal.identityId,
      keyResult: {
        id: keyResult.id,
        title: 'Sign 100 users',
      },
      goal: {
        id: goal.id,
      },
    });

    goal.updateKeyResultProgress(keyResult.id as unknown as string, 40);
    [event] = goal.pullDomainEvents();
    expect(event.eventType).toBe('goal:key-result-updated');
    expect(event.payload).toMatchObject({
      identityId: goal.identityId,
      changes: ['currentValue', 'progress'],
      previousValue: 10,
      newValue: 40,
      keyResult: {
        id: keyResult.id,
      },
    });

    const review = goal.createAndAddReview({
      title: 'Weekly review',
      content: 'Good momentum',
      reviewType: 'weekly',
      rating: 4,
    });
    [event] = goal.pullDomainEvents();
    expect(event.eventType).toBe('goal:review-added');
    expect(event.payload).toMatchObject({
      identityId: goal.identityId,
      review: {
        id: review.id,
      },
      goal: {
        id: goal.id,
      },
    });

    goal.removeKeyResult(keyResult.id as unknown as string);
    [event] = goal.pullDomainEvents();
    expect(event.eventType).toBe('goal:key-result-deleted');
    expect(event.payload).toMatchObject({
      identityId: goal.identityId,
      keyResultId: keyResult.id,
      keyResult: {
        id: keyResult.id,
      },
      goal: {
        id: goal.id,
      },
    });
  });

  it('emits enriched completion and archive payloads', () => {
    const goal = createGoalAggregate();
    goal.pullDomainEvents();

    goal.markAsCompleted();

    const events = goal.pullDomainEvents();
    expect(events).toHaveLength(2);
    expect(events[0].eventType).toBe('goal:completed');
    expect(events[0].payload).toMatchObject({
      identityId: goal.identityId,
      goal: {
        id: goal.id,
      },
      finalProgress: 0,
    });
    expect(events[1].eventType).toBe('goal:archived');
    expect(events[1].payload).toMatchObject({
      identityId: goal.identityId,
      goal: {
        id: goal.id,
        archivedAt: expect.any(Number),
      },
      archivedAt: expect.any(Number),
    });
  });
});

describe('GoalFolder domain events', () => {
  it('emits standardized folder lifecycle payloads', () => {
    const folder = GoalFolder.create({
      identityId: 'IdentityId_550e8400-e29b-41d4-a716-446655440009' as any,
      name: 'Projects',
      color: '#2563EB',
      icon: 'folder',
    });

    let [event] = folder.pullDomainEvents();
    expect(event.eventType).toBe('goal:folder-created');
    expect(event.payload).toMatchObject({
      identityId: folder.identityId,
      folderId: folder.id,
      folder: {
        id: folder.id,
        name: 'Projects',
      },
    });

    folder.updateDescription('Top level projects');
    [event] = folder.pullDomainEvents();
    expect(event.eventType).toBe('goal:folder-updated');
    expect(event.payload).toMatchObject({
      changes: ['description'],
      folder: {
        description: 'Top level projects',
      },
    });

    folder.softDelete();
    [event] = folder.pullDomainEvents();
    expect(event.eventType).toBe('goal:folder-deleted');
    expect(event.payload).toMatchObject({
      identityId: folder.identityId,
      folderId: folder.id,
      isSoftDelete: true,
      deletedAt: expect.any(Number),
      folder: {
        deletedAt: expect.any(Number),
      },
    });
  });
});

describe('FocusSession domain events', () => {
  it('emits standardized focus session payloads', () => {
    const session = FocusSession.create({
      identityId: 'IdentityId_550e8400-e29b-41d4-a716-446655440010' as any,
      goalId: 'GoalId_550e8400-e29b-41d4-a716-446655440010' as any,
      durationMinutes: 25,
      description: 'Deep work',
    });

    let [event] = session.pullDomainEvents();
    expect(event.eventType).toBe('goal:focus-session-started');
    expect(event.payload).toMatchObject({
      identityId: session.identityId,
      sessionId: session.id,
      goalId: session.goalId,
      startedAt: expect.any(Number),
      session: {
        id: session.id,
        goalId: session.goalId,
      },
    });

    session.pause();
    [event] = session.pullDomainEvents();
    expect(event.eventType).toBe('goal:focus-session-paused');
    expect(event.payload).toMatchObject({
      pausedAt: expect.any(Number),
      pauseCount: 1,
      session: {
        pauseCount: 1,
      },
    });

    session.resume();
    [event] = session.pullDomainEvents();
    expect(event.eventType).toBe('goal:focus-session-resumed');
    expect(event.payload).toMatchObject({
      resumedAt: expect.any(Number),
      pausedDurationMinutes: expect.any(Number),
      session: {
        resumedAt: expect.any(Number),
      },
    });

    session.complete();
    [event] = session.pullDomainEvents();
    expect(event.eventType).toBe('goal:focus-session-completed');
    expect(event.payload).toMatchObject({
      completedAt: expect.any(Number),
      actualDurationMinutes: expect.any(Number),
      duration: expect.any(Number),
      session: {
        completedAt: expect.any(Number),
        status: 'Completed',
      },
    });
  });
});
