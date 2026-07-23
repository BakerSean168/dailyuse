/**
 * Goal Module — Export Projections
 */

import type { ExportContext } from '../../portable-runtime';
import type { PortableGoal, PortableGoalFolder, PortableGoalRecord, PortableKeyResult, PortableGoalReview, PortableFocusSession, PortableFocusMode } from '@dailyuse/contracts/data-portability';
// Residual 1017: sole resolveExportRef/OrThrow (local resolveRef dual retired).
import {
  parseJsonField,
  toBoolean,
  toDateString,
  toRecord,
  toStringArray,
  resolveExportRef,
  resolveExportRefOrThrow,
} from './projection-helpers';

// ─── Goal Folders ───

export function projectGoalFolders(folders: unknown[], ctx: ExportContext): PortableGoalFolder[] {
  return folders.map((f) => {
    const folder = f as Record<string, unknown>;
    const ref = ctx.refAllocator.allocate('goalFolder');
    ctx.refToIdMap.set(folder.id as string, ref);
    return {
      _ref: ref,
      name: folder.name as string,
      description: folder.description as string | null | undefined,
      icon: folder.icon as string | null | undefined,
      color: folder.color as string | null | undefined,
      parentRef: resolveExportRef(folder.parentFolderId as string | null, ctx, 'goal'),
      sortOrder: (folder.sortOrder as number) ?? 0,
      isSystemFolder: toBoolean(folder.isSystemFolder, false),
      folderType: folder.folderType as string | null | undefined,
      createdAt: toDateString(folder.createdAt),
      updatedAt: toDateString(folder.updatedAt),
    };
  });
}

// ─── Goals ───

export function projectGoals(goals: unknown[], ctx: ExportContext): PortableGoal[] {
  return goals.map((g) => {
    const goal = g as Record<string, unknown>;
    const ref = ctx.refAllocator.allocate('goal');
    ctx.refToIdMap.set(goal.id as string, ref);

    const keyResults = (goal.keyResults as unknown[] ?? []).map((kr) => projectKeyResult(kr, ctx));
    const goalReviews = (goal.goalReviews as unknown[] ?? []).map((gr) => projectGoalReview(gr, ctx));

    return {
      _ref: ref,
      name: goal.name as string,
      description: goal.description as string | null | undefined,
      color: (goal.color as string) ?? '#3B82F6',
      feasibilityAnalysis: goal.feasibilityAnalysis as string | null | undefined,
      motivation: goal.motivation as string | null | undefined,
      status: goal.status as string,
      importance: goal.importance as string,
      priority: (goal.priority as number) ?? 0,
      category: goal.category as string | null | undefined,
      tags: toStringArray(goal.tags),
      startDate: toDateString(goal.startDate),
      targetDate: toDateString(goal.targetDate),
      completedAt: toDateString(goal.completedAt),
      folderRef: resolveExportRef(goal.folderId as string | null, ctx, 'goal'),
      parentGoalRef: resolveExportRef(goal.parentGoalId as string | null, ctx, 'goal'),
      sortOrder: (goal.sortOrder as number) ?? 0,
      reminderConfig: parseJsonField(goal.reminderConfig),
      keyResults,
      goalReviews,
      createdAt: toDateString(goal.createdAt),
      updatedAt: toDateString(goal.updatedAt),
    };
  });
}

function projectKeyResult(kr: unknown, ctx: ExportContext): PortableKeyResult {
  const entity = kr as Record<string, unknown>;
  const ref = ctx.refAllocator.allocate('keyResult');
  ctx.refToIdMap.set(entity.id as string, ref);
  const progress =
    toRecord(entity.progress) ?? {
      valueType: entity.valueType ?? 'numeric',
      aggregationMethod: entity.aggregationMethod ?? 'sum',
      initialValue: entity.initialValue ?? 0,
      targetValue: entity.targetValue ?? 1,
      currentValue: entity.currentValue ?? 0,
      unit: entity.unit ?? null,
    };
  return {
    _ref: ref,
    title: entity.title as string,
    description: entity.description as string | null | undefined,
    progress,
    weight: (entity.weight as number) ?? 1,
    sortOrder: ((entity.sortOrder as number | undefined) ?? (entity.order as number | undefined)) ?? 0,
    createdAt: toDateString(entity.createdAt),
    updatedAt: toDateString(entity.updatedAt),
  };
}

function projectGoalReview(gr: unknown, ctx: ExportContext): PortableGoalReview {
  const entity = gr as Record<string, unknown>;
  const ref = ctx.refAllocator.allocate('goalReview');
  ctx.refToIdMap.set(entity.id as string, ref);
  return {
    _ref: ref,
    reviewType: ((entity.reviewType as string | undefined) ?? (entity.type as string | undefined)) ?? 'completion',
    rating: entity.rating as number | undefined,
    content: ((entity.content as string | undefined) ?? (entity.summary as string | undefined)) ?? '',
    achievements: entity.achievements as string | null | undefined,
    challenges: entity.challenges as string | null | undefined,
    lessonsLearned: entity.lessonsLearned as string | null | undefined,
    nextSteps: entity.nextSteps as string | null | undefined,
    createdAt: toDateString(entity.createdAt),
    updatedAt: toDateString(entity.updatedAt),
  };
}

// ─── Goal Records ───

export function projectGoalRecords(records: unknown[], ctx: ExportContext): PortableGoalRecord[] {
  return records.map((r) => {
    const entity = r as Record<string, unknown>;
    const ref = ctx.refAllocator.allocate('goalRecord');
    ctx.refToIdMap.set(entity.id as string, ref);
    return {
      _ref: ref,
      keyResultRef: resolveExportRefOrThrow(entity.keyResultId as string, ctx, 'goal'),
      value: entity.value as number,
      note: entity.note as string | null | undefined,
      recordedAt: toDateString(entity.recordedAt) ?? new Date().toISOString(),
      createdAt: toDateString(entity.createdAt),
      updatedAt: toDateString(entity.updatedAt),
    };
  });
}

// ─── Focus Sessions ───

export function projectFocusSessions(sessions: unknown[], ctx: ExportContext): PortableFocusSession[] {
  return sessions.map((s) => {
    const entity = s as Record<string, unknown>;
    const ref = ctx.refAllocator.allocate('focusSession');
    ctx.refToIdMap.set(entity.id as string, ref);
    return {
      _ref: ref,
      goalRef: resolveExportRef(entity.goalId as string | null, ctx, 'goal'),
      status: entity.status as string,
      durationMinutes: entity.durationMinutes as number,
      actualDurationMinutes: entity.actualDurationMinutes as number,
      description: entity.description as string | null | undefined,
      startedAt: toDateString(entity.startedAt),
      completedAt: toDateString(entity.completedAt),
      pauseCount: (entity.pauseCount as number) ?? 0,
      pausedDurationMinutes: (entity.pausedDurationMinutes as number) ?? 0,
      createdAt: toDateString(entity.createdAt),
      updatedAt: toDateString(entity.updatedAt),
    };
  });
}

// ─── Focus Modes ───

export function projectFocusModes(modes: unknown[], ctx: ExportContext): PortableFocusMode[] {
  return modes.map((m) => {
    const entity = m as Record<string, unknown>;
    const ref = ctx.refAllocator.allocate('focusMode');
    ctx.refToIdMap.set(entity.id as string, ref);
    const focusedGoalRefs = toStringArray(entity.focusedGoalIds).flatMap((id) => {
      const resolved = resolveExportRef(id, ctx, 'goal');
      return resolved ? [resolved] : [];
    });

    return {
      _ref: ref,
      focusedGoalRefs,
      startTime: toDateString(entity.startTime) ?? new Date().toISOString(),
      endTime: toDateString(entity.endTime) ?? new Date().toISOString(),
      hiddenGoalsMode: (entity.hiddenGoalsMode as string) ?? 'dim',
      isActive: toBoolean(entity.isActive, false),
      actualEndTime: toDateString(entity.actualEndTime),
      createdAt: toDateString(entity.createdAt),
      updatedAt: toDateString(entity.updatedAt),
    };
  });
}

// Residual 1017: resolveExportRef/OrThrow elevated to projection-helpers.
