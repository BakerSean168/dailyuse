/**
 * Goal module importer — handles goal folders, goals, key results, records, focus sessions/modes.
 */

import type { ImportContext } from '../../portable-runtime';
import type { PortableGoalData } from '@dailyuse/contracts/data-portability';
import type { TxClient } from './import-helpers';
import { allocateId, resolveRef, optRef, jsonStringify, inc, rec, timestamps } from './import-helpers';

export async function importGoals(
  tx: TxClient, ctx: ImportContext, data: PortableGoalData,
): Promise<void> {
  // Goal folders
  for (const folder of data.folders) {
    const f = rec(folder);
    const id = allocateId(ctx, f._ref as string);
    await tx.createGoalFolder({
      id, identityId: ctx.identityId,
      name: f.name as string, description: f.description as string | null ?? null,
      icon: f.icon as string | null ?? null, color: f.color as string | null ?? null,
      parentFolderId: optRef(f.parentRef as string | null, ctx),
      sortOrder: (f.sortOrder as number) ?? 0,
      isSystemFolder: (f.isSystemFolder as boolean) ?? false,
      folderType: f.folderType as string | null ?? null,
      ...timestamps(f),
    });
    inc(ctx, 'goalFolders');
  }

  // Goals with nested key results and reviews
  for (const goal of data.items) {
    const g = rec(goal);
    const goalId = allocateId(ctx, g._ref as string);
    await tx.createGoal({
      id: goalId, identityId: ctx.identityId,
      name: g.name as string, description: g.description as string | null ?? null,
      color: (g.color as string) ?? '#3B82F6',
      feasibilityAnalysis: g.feasibilityAnalysis as string | null ?? null,
      motivation: g.motivation as string | null ?? null,
      status: (g.status as string) ?? 'pending',
      importance: (g.importance as string) ?? 'moderate',
      priority: (g.priority as number) ?? 0,
      category: g.category as string | null ?? null,
      tags: (g.tags as string[]) ?? [],
      startDate: g.startDate ? String(g.startDate) : null,
      targetDate: g.targetDate ? String(g.targetDate) : null,
      completedAt: g.completedAt ? String(g.completedAt) : null,
      folderId: optRef(g.folderRef as string | null, ctx),
      parentGoalId: optRef(g.parentGoalRef as string | null, ctx),
      sortOrder: (g.sortOrder as number) ?? 0,
      reminderConfig: g.reminderConfig ? jsonStringify(g.reminderConfig) : null,
      ...timestamps(g),
    });

    for (const kr of (g.keyResults as unknown[] ?? [])) {
      const k = rec(kr);
      const krId = allocateId(ctx, k._ref as string);
      const progress = k.progress as Record<string, unknown> | undefined;
      await tx.createKeyResult({
        id: krId, identityId: ctx.identityId, goalId,
        title: k.title as string, description: k.description as string | null ?? null,
        valueType: (progress?.valueType as string) ?? 'numeric',
        aggregationMethod: (progress?.aggregationMethod as string) ?? 'sum',
        initialValue: (progress?.initialValue as number) ?? 0,
        targetValue: (progress?.targetValue as number) ?? 1,
        currentValue: (progress?.currentValue as number) ?? 0,
        unit: progress?.unit as string | null ?? null,
        weight: (k.weight as number) ?? 1,
        order: (k.sortOrder as number) ?? 0,
        ...timestamps(k),
      });
    }

    for (const review of (g.goalReviews as unknown[] ?? [])) {
      const r = rec(review);
      const reviewId = allocateId(ctx, r._ref as string);
      await tx.createGoalReview({
        id: reviewId, identityId: ctx.identityId, goalId,
        reviewType: (r.reviewType as string) ?? 'completion',
        rating: r.rating as number | null ?? null,
        content: r.content as string ?? '',
        achievements: r.achievements as string | null ?? null,
        challenges: r.challenges as string | null ?? null,
        lessonsLearned: r.lessonsLearned as string | null ?? null,
        nextSteps: r.nextSteps as string | null ?? null,
        ...timestamps(r),
      });
    }
    inc(ctx, 'goals');
  }

  // Goal records
  for (const record of data.records) {
    const r = rec(record);
    const id = allocateId(ctx, r._ref as string);
    await tx.createGoalRecord({
      id, identityId: ctx.identityId,
      keyResultId: resolveRef(r.keyResultRef as string, ctx),
      value: r.value as number,
      note: r.note as string | null ?? null,
      recordedAt: String(r.recordedAt),
      ...timestamps(r),
    });
    inc(ctx, 'goalRecords');
  }

  // Focus sessions
  for (const session of data.focusSessions) {
    const s = rec(session);
    const id = allocateId(ctx, s._ref as string);
    await tx.createFocusSession({
      id, identityId: ctx.identityId,
      goalId: optRef(s.goalRef as string | null, ctx),
      status: (s.status as string) ?? 'Active',
      durationMinutes: s.durationMinutes as number,
      actualDurationMinutes: (s.actualDurationMinutes as number) ?? 0,
      description: s.description as string | null ?? null,
      startedAt: s.startedAt ? String(s.startedAt) : null,
      completedAt: s.completedAt ? String(s.completedAt) : null,
      pauseCount: (s.pauseCount as number) ?? 0,
      pausedDurationMinutes: (s.pausedDurationMinutes as number) ?? 0,
      ...timestamps(s),
    });
    inc(ctx, 'focusSessions');
  }

  // Focus modes
  for (const mode of data.focusModes) {
    const m = rec(mode);
    const id = allocateId(ctx, m._ref as string);
    await tx.createFocusMode({
      id, identityId: ctx.identityId,
      focusedGoalIds: ((m.focusedGoalRefs as string[]) ?? []).map((ref) => resolveRef(ref, ctx)),
      hiddenGoalsMode: (m.hiddenGoalsMode as string) ?? 'dim',
      startTime: String(m.startTime),
      endTime: String(m.endTime),
      actualEndTime: m.actualEndTime ? String(m.actualEndTime) : null,
      isActive: (m.isActive as boolean) ?? false,
      ...timestamps(m),
    });
    inc(ctx, 'focusModes');
  }
}
