import {
  type GoalAutomationExecutionInput,
  type IAIAutomationToolExecutorPort,
} from '@dailyuse/ai/application-server';
import type { IdentityId } from '@dailyuse/contracts';
import type { GoalAutomationExecutedAction } from '@dailyuse/contracts/ai';
import type { IElectronDatabase } from '@dailyuse/contracts/electron';
import type { GoalId, KeyResultId } from '@dailyuse/contracts/goal';
import {
  createGoalModule,
  GoalFolderPowerSyncRepository,
  GoalPowerSyncRepository,
  GoalRecordPowerSyncRepository,
} from '@dailyuse/goal';
import {
  createTaskModule,
  PowerSyncTaskDependencyRepository,
  PowerSyncTaskInstanceRepository,
  PowerSyncTaskTemplateRepository,
} from '@dailyuse/task';
import {
  DayOfWeek,
  RecurrenceFrequency,
  TaskGoalBindingTrigger,
  TaskType,
} from '@dailyuse/contracts/task';
import { createLogger } from '@dailyuse/utils';

import { DesktopAnalyticsReadAdapter } from './desktop-analytics-read.adapter';
import { DesktopKnowledgeSourceAdapter } from './desktop-knowledge-source.adapter';

const logger = createLogger('DesktopAutomationToolExecutor');

function readNestedNumber(source: unknown, path: readonly string[]): number {
  let current = source;

  for (const segment of path) {
    if (!current || typeof current !== 'object' || !(segment in current)) {
      return 0;
    }
    current = (current as Record<string, unknown>)[segment];
  }

  return typeof current === 'number' ? current : 0;
}

export class DesktopAutomationToolExecutorAdapter implements IAIAutomationToolExecutorPort {
  private readonly goalModule;
  private readonly taskModule;
  private readonly knowledgeSource;
  private readonly analyticsRead;

  constructor(db: IElectronDatabase) {
    this.goalModule = createGoalModule({
      goalRepository: new GoalPowerSyncRepository(db),
      goalFolderRepository: new GoalFolderPowerSyncRepository(db),
      goalRecordRepository: new GoalRecordPowerSyncRepository(db),
    });
    this.taskModule = createTaskModule({
      taskTemplateRepository: new PowerSyncTaskTemplateRepository(db),
      taskInstanceRepository: new PowerSyncTaskInstanceRepository(db),
      taskDependencyRepository: new PowerSyncTaskDependencyRepository(db),
    });
    this.knowledgeSource = new DesktopKnowledgeSourceAdapter(db);
    this.analyticsRead = new DesktopAnalyticsReadAdapter();
  }

  async executeGoalAutomation(
    input: GoalAutomationExecutionInput,
  ): Promise<GoalAutomationExecutedAction[]> {
    const actions: GoalAutomationExecutedAction[] = [];
    let createdGoalId: GoalId | null = null;
    const createdKeyResultIds = new Map<number, KeyResultId>();

    for (const action of input.actions) {
      try {
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
              deviceId: 'ai-automation',
            },
          );

          if (!result.ok) {
            throw new Error(result.error.message);
          }

          createdGoalId = result.data.id as GoalId;
          actions.push({
            tool: action.tool,
            status: 'executed',
            entityId: createdGoalId,
            message: `Created goal "${result.data.name}"`,
          });
          continue;
        }

        if (action.tool === 'create_key_result') {
          if (!createdGoalId) {
            throw new Error('Cannot create key result before goal creation');
          }
          const keyResult = input.plan.keyResults?.[action.index ?? -1];
          if (!keyResult) {
            throw new Error(`Missing key result draft for index ${action.index ?? -1}`);
          }

          const result = await this.goalModule.api.addKeyResult(createdGoalId, {
            title: keyResult.title,
            valueType: 'Incremental',
            aggregationMethod: 'Last',
            startValue: 0,
            currentValue: 0,
            targetValue: keyResult.targetValue,
            unit: keyResult.unit,
            weight: this.resolveWeight(input.plan.keyResults?.length ?? 1),
          });

          if (!result.ok) {
            throw new Error(result.error.message);
          }

          createdKeyResultIds.set(action.index ?? 0, result.data.id as KeyResultId);
          actions.push({
            tool: action.tool,
            status: 'executed',
            entityId: result.data.id,
            message: `Created key result "${result.data.title}"`,
          });
          continue;
        }

        if (action.tool === 'create_task_template') {
          const taskTemplate = input.plan.taskTemplates?.[action.index ?? -1];
          if (!taskTemplate) {
            throw new Error(`Missing task template draft for index ${action.index ?? -1}`);
          }

          const result = await this.taskModule.api.createTaskTemplate.execute({
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

          if (!result.ok) {
            throw new Error(result.error.message);
          }

          actions.push({
            tool: action.tool,
            status: 'executed',
            entityId: result.data.template.id,
            message: `Created task template "${result.data.template.name}"`,
          });
          continue;
        }

        if (action.tool === 'search_notes') {
          const resources = await this.knowledgeSource.listRelevantResources(
            input.identityId,
            input.request.idea,
            5,
          );
          actions.push({
            tool: action.tool,
            status: 'executed',
            message: `Found ${resources.length} relevant note(s)`,
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
          continue;
        }

        actions.push({
          tool: action.tool,
          status: 'skipped',
          message: `Skipped unsupported tool ${action.tool}`,
        });
      } catch (error) {
        logger.warn('Goal automation action failed', {
          error,
          action,
          identityId: input.identityId,
        });
        actions.push({
          tool: action.tool,
          status: 'failed',
          message: error instanceof Error ? error.message : 'Unknown automation failure',
        });
      }
    }

    return actions;
  }

  private resolveWeight(count: number): number {
    if (count <= 1) {
      return 1;
    }

    return Math.max(1, Math.round(10 / count));
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
