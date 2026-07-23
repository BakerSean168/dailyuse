import {
  type GoalAutomationExecutionInput,
  type IAIAutomationToolExecutorPort,
} from '@dailyuse/ai/ports';
import type { IdentityId } from '@dailyuse/contracts';
import type {
  GoalAutomationExecutedAction,
  GoalAutomationReminderPreview,
} from '@dailyuse/contracts/ai';
import type { GoalId, KeyResultId } from '@dailyuse/contracts/goal';
import type { PrismaClient } from '@dailyuse/database';
import { createGoalPrismaModule } from '@dailyuse/goal';
import { createReminderPrismaModule } from '@dailyuse/reminder';
import { createTaskPrismaModule } from '@dailyuse/task';
import {
  NotificationChannel,
  ReminderType,
  TriggerType,
} from '@dailyuse/contracts/reminder';
import {
  DayOfWeek,
  RecurrenceFrequency,
  TaskGoalBindingTrigger,
  TaskType,
} from '@dailyuse/contracts/task';
import { unwrapOrThrowError } from '@dailyuse/contracts/result';
import { createLogger } from '@dailyuse/utils/logger';
// Residual 1007: sole reminder time helpers (local dual retired).
// Residual 1009: sole readNestedNumber (local dual retired).
// Residual 1011: sole previewText (local dual retired; call sites keep maxLength 200).
import {
  buildReminderStartTimestamp,
  normalizeReminderTimeOfDay,
  previewText,
  readNestedNumber,
} from '@dailyuse/utils/shared';

import { ControlledAnalyticsReadAdapter } from './controlled-analytics-read.adapter';
import { RepositoryKnowledgeSourceAdapter } from './repository-knowledge-source.adapter';

const logger = createLogger('BackendAutomationToolExecutor');
const DAILY_REVIEW_INTERVAL_MINUTES = 24 * 60;
const WEEKLY_REVIEW_INTERVAL_MINUTES = 7 * DAILY_REVIEW_INTERVAL_MINUTES;

// Residual 1011: previewText elevated to @dailyuse/utils/shared.
// Residual 1009: readNestedNumber elevated to @dailyuse/utils/shared.
// Residual 1007: reminder time helpers elevated to @dailyuse/utils/shared.

function buildReminderTemplateInput(reminder: GoalAutomationReminderPreview, now = Date.now()) {
  const isOneTime = reminder.cadence === 'once';
  const timeOfDay = normalizeReminderTimeOfDay(reminder.timeOfDay);
  const startTime = buildReminderStartTimestamp(timeOfDay, now);
  return {
    title: reminder.title,
    description: reminder.description,
    type: isOneTime ? ReminderType.OneTime : ReminderType.Recurring,
    trigger: isOneTime
      ? {
          type: TriggerType.FixedTime,
          fixedTime: {
            time: timeOfDay,
            timezone: null,
          },
          interval: null,
        }
      : {
          type: TriggerType.Interval,
          fixedTime: null,
          interval: {
            minutes:
              reminder.cadence === 'daily'
                ? DAILY_REVIEW_INTERVAL_MINUTES
                : WEEKLY_REVIEW_INTERVAL_MINUTES,
            startTime,
          },
        },
    activeTime: {
      startDate: startTime,
      endDate: null,
    },
    notificationConfig: {
      channels: [NotificationChannel.InApp],
      title: reminder.title,
      body: reminder.description ?? null,
      sound: null,
      vibration: null,
      actions: null,
    },
    importanceLevel: reminder.importance,
    tags: ['goal-agent'],
  };
}

export class BackendAutomationToolExecutorAdapter implements IAIAutomationToolExecutorPort {
  private readonly goalModule;
  private readonly taskModule;
  private readonly reminderModule;
  private readonly knowledgeSource;
  private readonly analyticsRead;

  constructor(
    db: PrismaClient,
    storageBaseDir: string,
  ) {
    this.goalModule = createGoalPrismaModule(db);
    this.taskModule = createTaskPrismaModule(db);
    this.reminderModule = createReminderPrismaModule(db);
    this.knowledgeSource = new RepositoryKnowledgeSourceAdapter(db, storageBaseDir);
    this.analyticsRead = new ControlledAnalyticsReadAdapter(db);
  }

  async executeGoalAutomation(
    input: GoalAutomationExecutionInput,
  ): Promise<GoalAutomationExecutedAction[]> {
    const actions: GoalAutomationExecutedAction[] = [];
    let createdGoalId: GoalId | null = null;
    const createdKeyResultIds = new Map<number, KeyResultId>();
    let goalCreationFailed = false;
    const failedKeyResultIndexes = new Set<number>();
    const skipAction = (
      action: GoalAutomationExecutionInput['actions'][number],
      message: string,
    ) => {
      actions.push({
        tool: action.tool,
        status: 'skipped',
        message,
      });
      logger.info('Goal automation executor action skipped', {
        identityId: input.identityId,
        tool: action.tool,
        index: action.index ?? null,
        message,
      });
    };

    logger.info('Goal automation executor started', {
      identityId: input.identityId,
      actionCount: input.actions.length,
      actionTools: input.actions.map((action) => action.tool),
      goalTitle: input.plan.goal.title,
      keyResultCount: input.plan.keyResults?.length ?? 0,
      taskTemplateCount: input.plan.taskTemplates?.length ?? 0,
      reminderCount: input.plan.reminders?.length ?? 0,
      requestIdeaPreview: previewText(input.request.idea, 200),
    });

    for (const action of input.actions) {
      try {
        logger.info('Goal automation executor action started', {
          identityId: input.identityId,
          tool: action.tool,
          index: action.index ?? null,
          rationale: previewText(action.rationale, 200),
          hasCreatedGoal: Boolean(createdGoalId),
        });
        if (action.tool === 'create_goal') {
          const result = await this.goalModule.api.createGoal(
            {
              name: input.plan.goal.title,
              description: input.plan.goal.description,
              feasibilityAnalysis: input.plan.goal.feasibilityAnalysis,
              motivation: input.plan.goal.motivation,
              importance: input.plan.goal.importance,
              category: input.plan.goal.category,
              tags: input.plan.goal.tags,
              startDate: input.plan.goal.suggestedStartDate,
              targetDate: input.plan.goal.suggestedEndDate,
            },
            {
              identityId: input.identityId as IdentityId,
            },
          );

          const goal = unwrapOrThrowError(result);
          createdGoalId = goal.id as GoalId;
          actions.push({
            tool: action.tool,
            status: 'executed',
            entityId: createdGoalId,
            message: `Created goal "${goal.name}"`,
          });
          logger.info('Goal automation executor action succeeded', {
            identityId: input.identityId,
            tool: action.tool,
            entityId: createdGoalId,
            message: `Created goal "${goal.name}"`,
          });
          continue;
        }

        if (action.tool === 'create_key_result') {
          if (goalCreationFailed) {
            skipAction(action, 'Skipped because goal creation failed.');
            continue;
          }
          if (!createdGoalId) {
            throw new Error('Cannot create key result before goal creation');
          }
          const keyResult = input.plan.keyResults?.[action.index ?? -1];
          if (!keyResult) {
            throw new Error(`Missing key result draft for index ${action.index ?? -1}`);
          }

          const result = await this.goalModule.api.addKeyResult(createdGoalId, {
            title: keyResult.title,
            valueType: keyResult.valueType,
            aggregationMethod: keyResult.calculationMethod,
            startValue: keyResult.startValue,
            currentValue: keyResult.currentValue,
            targetValue: keyResult.targetValue,
            unit: keyResult.unit,
            weight: keyResult.weight,
          });

          const createdKeyResult = unwrapOrThrowError(result);
          createdKeyResultIds.set(action.index ?? 0, createdKeyResult.id as KeyResultId);
          actions.push({
            tool: action.tool,
            status: 'executed',
            entityId: createdKeyResult.id,
            message: `Created key result "${createdKeyResult.title}"`,
          });
          logger.info('Goal automation executor action succeeded', {
            identityId: input.identityId,
            tool: action.tool,
            index: action.index ?? null,
            entityId: createdKeyResult.id,
            message: `Created key result "${createdKeyResult.title}"`,
          });
          continue;
        }

        if (action.tool === 'create_task_template') {
          if (goalCreationFailed) {
            skipAction(action, 'Skipped because goal creation failed.');
            continue;
          }
          if (
            typeof action.index === 'number' &&
            failedKeyResultIndexes.has(action.index)
          ) {
            skipAction(
              action,
              `Skipped because key result ${action.index} creation failed.`,
            );
            continue;
          }
          const taskTemplate = input.plan.taskTemplates?.[action.index ?? -1];
          if (!taskTemplate) {
            throw new Error(`Missing task template draft for index ${action.index ?? -1}`);
          }

          const result = await this.taskModule.api.createTaskTemplate({
            identityId: input.identityId as IdentityId,
            name: taskTemplate.name,
            description: taskTemplate.description ?? null,
            taskType:
              taskTemplate.cadence === 'once' ? TaskType.OneTime : TaskType.Recurring,
            timeConfig: {
              timeType: 'AllDay',
              startDate: Date.now(),
              timePoint: null,
              timeRange: null,
            },
            recurrenceRule: this.buildRecurrenceRule(taskTemplate.cadence),
            reminderConfig: null,
            importance: taskTemplate.importance,
            folderId: null,
            tags: [],
            color: null,
            goalBinding:
              createdGoalId && createdKeyResultIds.has(action.index ?? 0)
                ? {
                    goalId: createdGoalId,
                    keyResultId: createdKeyResultIds.get(action.index ?? 0)!,
                    goalRecordValue: 1,
                    progressTrigger: TaskGoalBindingTrigger.PerInstance,
                  }
                : null,
          });

          const taskTemplateResult = unwrapOrThrowError(result);
          actions.push({
            tool: action.tool,
            status: 'executed',
            entityId: taskTemplateResult.template.id,
            message: `Created task template "${taskTemplateResult.template.name}"`,
          });
          logger.info('Goal automation executor action succeeded', {
            identityId: input.identityId,
            tool: action.tool,
            index: action.index ?? null,
            entityId: taskTemplateResult.template.id,
            message: `Created task template "${taskTemplateResult.template.name}"`,
          });
          continue;
        }

        if (action.tool === 'create_reminder') {
          if (goalCreationFailed) {
            skipAction(action, 'Skipped because goal creation failed.');
            continue;
          }
          const reminder = input.plan.reminders?.[action.index ?? -1];
          if (!reminder) {
            throw new Error(`Missing reminder draft for index ${action.index ?? -1}`);
          }

          const result = await this.reminderModule.api.createTemplate(
            buildReminderTemplateInput(reminder),
            {
              identityId: input.identityId,
            },
          );
          const createdReminder = unwrapOrThrowError(result) as {
            id?: string;
            name?: string;
          };
          actions.push({
            tool: action.tool,
            status: 'executed',
            entityId: createdReminder.id,
            message: `Created reminder "${createdReminder.name ?? reminder.title}"`,
          });
          logger.info('Goal automation executor action succeeded', {
            identityId: input.identityId,
            tool: action.tool,
            index: action.index ?? null,
            entityId: createdReminder.id,
            message: `Created reminder "${createdReminder.name ?? reminder.title}"`,
          });
          continue;
        }

        if (action.tool === 'search_notes') {
          const resources = await this.knowledgeSource.listRelevantNotes(
            input.identityId,
            input.request.idea,
            5,
          );
          actions.push({
            tool: action.tool,
            status: 'executed',
            message: `Found ${resources.length} relevant note(s)`,
          });
          logger.info('Goal automation executor action succeeded', {
            identityId: input.identityId,
            tool: action.tool,
            resourceCount: resources.length,
          });
          continue;
        }

        if (action.tool === 'fetch_stats') {
          const context = await this.analyticsRead.buildContext(input.identityId, input.request.idea);
          const activeGoals = readNestedNumber(context.dashboard, ['stats', 'activeGoals']);
          const overdue = readNestedNumber(context.taskDashboard, ['summary', 'overdue']);
          actions.push({
            tool: action.tool,
            status: 'executed',
            message: `Fetched stats: activeGoals=${activeGoals}, overdue=${overdue}`,
          });
          logger.info('Goal automation executor action succeeded', {
            identityId: input.identityId,
            tool: action.tool,
            activeGoals,
            overdue,
          });
          continue;
        }

        actions.push({
          tool: action.tool,
          status: 'skipped',
          message: `Skipped unsupported tool ${action.tool}`,
        });
        logger.info('Goal automation executor action skipped', {
          identityId: input.identityId,
          tool: action.tool,
        });
      } catch (error) {
        logger.warn('Goal automation action failed', {
          error,
          action,
          identityId: input.identityId,
        });
        if (action.tool === 'create_goal') {
          goalCreationFailed = true;
        }
        if (action.tool === 'create_key_result' && typeof action.index === 'number') {
          failedKeyResultIndexes.add(action.index);
        }
        actions.push({
          tool: action.tool,
          status: 'failed',
          message: error instanceof Error ? error.message : 'Unknown automation failure',
        });
      }
    }

    logger.info('Goal automation executor completed', {
      identityId: input.identityId,
      actionCount: actions.length,
      executedCount: actions.filter((action) => action.status === 'executed').length,
      skippedCount: actions.filter((action) => action.status === 'skipped').length,
      failedCount: actions.filter((action) => action.status === 'failed').length,
      actions,
    });

    return actions;
  }

  private buildRecurrenceRule(cadence: 'daily' | 'weekly' | 'once') {
    if (cadence === 'once') {
      return null;
    }

    if (cadence === 'weekly') {
      return {
        frequency: RecurrenceFrequency.Weekly,
        interval: 1,
        daysOfWeek: [new Date().getDay() as (typeof DayOfWeek)[keyof typeof DayOfWeek]],
        endDate: null,
        occurrences: null,
      };
    }

    return {
      frequency: RecurrenceFrequency.Daily,
      interval: 1,
      daysOfWeek: [],
      endDate: null,
      occurrences: null,
    };
  }
}
