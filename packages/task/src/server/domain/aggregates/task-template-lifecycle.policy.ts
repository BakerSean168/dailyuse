/**
 * Lifecycle state transition policy for TaskTemplate.
 *
 * Pure functions for activate/pause/archive/delete/restore operations.
 * Extracted from TaskTemplate aggregate to reduce aggregate size.
 */

import type { TaskEventMap } from '@dailyuse/contracts/task';
import { TaskTemplateStatus } from '../../domain/value-objects/task-template-status';
import {
  InvalidTaskTemplateStateError,
  TaskTemplateArchivedError,
} from '../value-objects/task-errors';
import type { TaskTemplateProps } from './task-template.state';

/** Mutable context for lifecycle operations. */
export interface LifecycleContext {
  readonly id: import('../../domain/value-objects/task-template-id').TaskTemplateId;
  props: TaskTemplateProps;
  addHistory(action: string, changes?: unknown): void;
  publishDomainEvent<T>(eventName: string, payload: T): void;
  toServerDTO(): import('@dailyuse/contracts/task').TaskTemplateServerDTO;
}

/** Activates the template. */
export function activate(ctx: LifecycleContext): void {
  if (ctx.props.status === TaskTemplateStatus.Deleted) {
    throw new InvalidTaskTemplateStateError('Cannot activate a deleted template', {
      templateId: ctx.id,
      currentStatus: ctx.props.status,
      attemptedAction: 'activate',
    });
  }
  if (ctx.props.status === TaskTemplateStatus.Active) {
    throw new InvalidTaskTemplateStateError('Template is already active', {
      templateId: ctx.id,
      currentStatus: ctx.props.status,
      attemptedAction: 'activate',
    });
  }
  ctx.props.status = TaskTemplateStatus.Active;
  ctx.props.updatedAt = new Date();
  ctx.addHistory('resumed');
  ctx.publishDomainEvent<TaskEventMap['task:template-resumed']>('task:template-resumed', {
    identityId: ctx.props.identityId,
    taskTemplateId: ctx.id,
    resumedAt: ctx.props.updatedAt.getTime(),
    taskTemplate: ctx.toServerDTO(),
  });
}

/** Pauses the template. */
export function pause(ctx: LifecycleContext): void {
  if (ctx.props.status !== TaskTemplateStatus.Active) {
    throw new InvalidTaskTemplateStateError('Can only pause active templates', {
      templateId: ctx.id,
      currentStatus: ctx.props.status,
      attemptedAction: 'pause',
    });
  }
  ctx.props.status = TaskTemplateStatus.Paused;
  ctx.props.updatedAt = new Date();
  ctx.addHistory('Paused');
  ctx.publishDomainEvent<TaskEventMap['task:template-paused']>('task:template-paused', {
    identityId: ctx.props.identityId,
    taskTemplateId: ctx.id,
    pausedAt: ctx.props.updatedAt.getTime(),
    taskTemplate: ctx.toServerDTO(),
  });
}

/** Archives the template. */
export function archive(ctx: LifecycleContext): void {
  if (ctx.props.status === TaskTemplateStatus.Deleted) {
    throw new InvalidTaskTemplateStateError('Cannot archive a deleted template', {
      templateId: ctx.id,
      currentStatus: ctx.props.status,
      attemptedAction: 'archive',
    });
  }
  if (ctx.props.status === TaskTemplateStatus.Archived) {
    throw new TaskTemplateArchivedError(ctx.id);
  }
  ctx.props.status = TaskTemplateStatus.Archived;
  ctx.props.updatedAt = new Date();
  ctx.addHistory('Archived');
}

/** Soft-deletes the template. */
export function softDelete(ctx: LifecycleContext): void {
  if (ctx.props.status === TaskTemplateStatus.Deleted) {
    throw new InvalidTaskTemplateStateError('Template is already deleted', {
      templateId: ctx.id,
      currentStatus: ctx.props.status,
      attemptedAction: 'softDelete',
    });
  }
  ctx.props.status = TaskTemplateStatus.Deleted;
  ctx.props.deletedAt = new Date();
  ctx.props.updatedAt = new Date();
  ctx.addHistory('Deleted');
  ctx.publishDomainEvent<TaskEventMap['task:deleted']>('task:deleted', {
    identityId: ctx.props.identityId,
    taskTemplateId: ctx.id,
    isSoftDelete: true,
    deletedAt: ctx.props.deletedAt.getTime(),
    task: ctx.toServerDTO(),
  });
}

/** Restores a soft-deleted template. */
export function restore(ctx: LifecycleContext): void {
  if (ctx.props.status !== TaskTemplateStatus.Deleted) {
    throw new InvalidTaskTemplateStateError('Can only restore deleted templates', {
      templateId: ctx.id,
      currentStatus: ctx.props.status,
      attemptedAction: 'restore',
    });
  }
  ctx.props.status = TaskTemplateStatus.Active;
  ctx.props.deletedAt = null;
  ctx.props.updatedAt = new Date();
  ctx.addHistory('restored');
}
