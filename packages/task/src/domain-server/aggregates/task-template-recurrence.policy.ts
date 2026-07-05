/**
 * Recurrence update policy for TaskTemplate.
 *
 * Pure functions for recurrence rule and end condition updates.
 * Extracted from TaskTemplate aggregate to reduce aggregate size.
 */

import type { TaskEventMap } from '@dailyuse/contracts/task';
import { RecurrenceEndConditionType } from '@dailyuse/contracts/task';
import { TaskType } from '../value-objects';
import { InvalidTaskTemplateStateError } from '../value-objects/task-errors';
import type { RecurrenceRule } from '../value-objects';
import type { TaskTemplateId } from '../../domain-shared/value-objects/task-template-id';
import type { TaskTemplateProps } from './task-template.state';

/** Context for recurrence operations. */
export interface RecurrenceContext {
  readonly id: TaskTemplateId;
  props: TaskTemplateProps;
  addHistory(action: string, changes?: unknown): void;
  publishDomainEvent<T>(eventName: string, payload: T): void;
  toServerDTO(): import('@dailyuse/contracts/task').TaskTemplateServerDTO;
}

/** Updates the recurrence rule (Recurring tasks only). */
export function updateRecurrenceRule(ctx: RecurrenceContext, newRule: RecurrenceRule): void {
  if (ctx.props.taskType !== TaskType.Recurring) {
    throw new InvalidTaskTemplateStateError('Only Recurring tasks have recurrence rules.', {
      templateId: ctx.id,
      currentStatus: ctx.props.status,
      attemptedAction: 'updateRecurrenceRule',
    });
  }
  const oldRuleDTO = ctx.props.recurrenceRule?.toDTO() ?? null;
  ctx.props.recurrenceRule = newRule;
  ctx.props.updatedAt = new Date();
  ctx.addHistory('recurrence_rule_updated', {
    oldRule: oldRuleDTO,
    newRule: newRule.toDTO(),
  });
  ctx.publishDomainEvent<TaskEventMap['task:template-recurrence-changed']>(
    'task:template-recurrence-changed',
    {
      identityId: ctx.props.identityId,
      taskTemplate: ctx.toServerDTO(),
      oldRecurrenceRule: oldRuleDTO,
      newRecurrenceRule: newRule.toDTO(),
    },
  );
}

/** Updates the recurrence end condition using enum type and default values. */
export function updateRecurrenceEndCondition(
  ctx: RecurrenceContext,
  endConditionType: RecurrenceEndConditionType,
  customValue?: number,
): void {
  if (ctx.props.taskType !== TaskType.Recurring) {
    throw new InvalidTaskTemplateStateError('Only Recurring tasks have recurrence rules.', {
      templateId: ctx.id,
      currentStatus: ctx.props.status,
      attemptedAction: 'updateRecurrenceEndCondition',
    });
  }
  if (!ctx.props.recurrenceRule) {
    throw new InvalidTaskTemplateStateError('Recurrence rule is not set', {
      templateId: ctx.id,
      currentStatus: ctx.props.status,
      attemptedAction: 'updateRecurrenceEndCondition',
    });
  }

  let updatedRule: RecurrenceRule;

  switch (endConditionType) {
    case RecurrenceEndConditionType.Never:
      updatedRule = ctx.props.recurrenceRule.setEndDate(null).setOccurrences(null);
      break;
    case RecurrenceEndConditionType.EndDate: {
      const endDate = customValue ?? Date.now() + 30 * 86400000;
      updatedRule = ctx.props.recurrenceRule.setEndDate(new Date(endDate));
      break;
    }
    case RecurrenceEndConditionType.Occurrences: {
      const occurrences = customValue ?? 10;
      updatedRule = ctx.props.recurrenceRule.setOccurrences(occurrences);
      break;
    }
    default:
      throw new InvalidTaskTemplateStateError(`Invalid end condition type: ${endConditionType}`, {
        templateId: ctx.id,
        currentStatus: ctx.props.status,
        attemptedAction: 'updateRecurrenceEndCondition',
      });
  }

  const oldRuleDTO = ctx.props.recurrenceRule.toDTO();
  ctx.props.recurrenceRule = updatedRule;
  ctx.props.updatedAt = new Date();
  ctx.addHistory('recurrence_end_condition_updated', {
    oldRule: oldRuleDTO,
    newRule: updatedRule.toDTO(),
    endConditionType,
  });
  ctx.publishDomainEvent<TaskEventMap['task:template-recurrence-changed']>(
    'task:template-recurrence-changed',
    {
      identityId: ctx.props.identityId,
      taskTemplate: ctx.toServerDTO(),
      oldRecurrenceRule: oldRuleDTO,
      newRecurrenceRule: updatedRule.toDTO(),
    },
  );
}
