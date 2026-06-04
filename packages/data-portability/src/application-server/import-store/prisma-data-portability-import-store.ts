/**
 * Prisma implementation of DataPortabilityImportStore.
 *
 * Wraps prisma.$transaction() and delegates each create/upsert
 * to the corresponding Prisma model.
 */

import type { PrismaClient, Prisma } from '@dailyuse/database';
import type {
  DataPortabilityImportStore,
  DataPortabilityImportTx,
  UpsertUserSettingInput,
  UpsertNotificationPreferenceInput,
  UpsertUserReminderPreferenceInput,
  CreateRepositoryInput,
  CreateResourceFolderInput,
  CreateResourceInput,
  CreateGoalFolderInput,
  CreateGoalInput,
  CreateKeyResultInput,
  CreateGoalReviewInput,
  CreateGoalRecordInput,
  CreateFocusSessionInput,
  CreateFocusModeInput,
  CreateTaskFolderInput,
  CreateTaskTemplateInput,
  CreateTaskInstanceInput,
  CreateTaskDependencyInput,
  CreateScheduleInput,
  CreateScheduleTaskInput,
  CreateReminderGroupInput,
  CreateReminderTemplateInput,
  CreateReminderResponseInput,
  CreateEditorWorkspaceInput,
  CreateEditorSessionInput,
  CreateEditorGroupInput,
  CreateEditorTabInput,
  CreateAIConversationInput,
  CreateAIMessageInput,
} from './data-portability-import-store';

class PrismaDataPortabilityImportTx implements DataPortabilityImportTx {
  constructor(private readonly tx: Prisma.TransactionClient) {}

  // --- Singletons ---

  async upsertUserSetting(input: UpsertUserSettingInput): Promise<void> {
    await this.tx.userSetting.upsert({
      where: { identityId: input.identityId },
      create: { identityId: input.identityId, preferences: input.preferences as never },
      update: { preferences: input.preferences as never },
    });
  }

  async upsertNotificationPreference(input: UpsertNotificationPreferenceInput): Promise<void> {
    await this.tx.notificationPreference.upsert({
      where: { identityId: input.identityId },
      create: {
        id: input.id,
        identityId: input.identityId,
        channels: input.channels,
        categories: input.categories,
        doNotDisturb: input.doNotDisturb,
        rateLimit: input.rateLimit,
        enabled: input.enabled,
      },
      update: {
        channels: input.channels,
        categories: input.categories,
        doNotDisturb: input.doNotDisturb,
        rateLimit: input.rateLimit,
        enabled: input.enabled,
      },
    });
  }

  async upsertUserReminderPreference(input: UpsertUserReminderPreferenceInput): Promise<void> {
    await this.tx.userReminderPreference.upsert({
      where: { identityId: input.identityId },
      create: {
        id: input.id,
        identityId: input.identityId,
        bestTimeSlots: input.bestTimeSlots,
        worstTimeSlots: input.worstTimeSlots,
        globalReminderEnabled: input.globalReminderEnabled,
        globalSmartFrequency: input.globalSmartFrequency,
      },
      update: {
        bestTimeSlots: input.bestTimeSlots,
        worstTimeSlots: input.worstTimeSlots,
        globalReminderEnabled: input.globalReminderEnabled,
        globalSmartFrequency: input.globalSmartFrequency,
      },
    });
  }

  // --- Repository ---

  async createRepository(input: CreateRepositoryInput): Promise<void> {
    await this.tx.repository.create({ data: input as Prisma.RepositoryUncheckedCreateInput });
  }

  async createResourceFolder(input: CreateResourceFolderInput): Promise<void> {
    await this.tx.folder.create({ data: input as Prisma.FolderUncheckedCreateInput });
  }

  async createResource(input: CreateResourceInput): Promise<void> {
    await this.tx.resource.create({ data: input as Prisma.ResourceUncheckedCreateInput });
  }

  // --- Goal ---

  async createGoalFolder(input: CreateGoalFolderInput): Promise<void> {
    await this.tx.goalFolder.create({ data: input });
  }

  async createGoal(input: CreateGoalInput): Promise<void> {
    await this.tx.goal.create({ data: input });
  }

  async createKeyResult(input: CreateKeyResultInput): Promise<void> {
    await this.tx.keyResult.create({ data: input });
  }

  async createGoalReview(input: CreateGoalReviewInput): Promise<void> {
    await this.tx.goalReview.create({ data: input });
  }

  async createGoalRecord(input: CreateGoalRecordInput): Promise<void> {
    await this.tx.goalRecord.create({ data: input });
  }

  async createFocusSession(input: CreateFocusSessionInput): Promise<void> {
    await this.tx.focusSession.create({ data: input });
  }

  async createFocusMode(input: CreateFocusModeInput): Promise<void> {
    await this.tx.focusMode.create({ data: input });
  }

  // --- Task ---

  async createTaskFolder(input: CreateTaskFolderInput): Promise<void> {
    await this.tx.taskFolder.create({ data: input });
  }

  async createTaskTemplate(input: CreateTaskTemplateInput): Promise<void> {
    await this.tx.taskTemplate.create({ data: input });
  }

  async createTaskInstance(input: CreateTaskInstanceInput): Promise<void> {
    await this.tx.taskInstance.create({ data: input });
  }

  async createTaskDependency(input: CreateTaskDependencyInput): Promise<void> {
    await this.tx.taskDependency.create({ data: input });
  }

  // --- Schedule ---

  async createSchedule(input: CreateScheduleInput): Promise<void> {
    await this.tx.schedule.create({ data: input });
  }

  async createScheduleTask(input: CreateScheduleTaskInput): Promise<void> {
    await this.tx.scheduleTask.create({ data: input as Prisma.ScheduleTaskUncheckedCreateInput });
  }

  // --- Reminder ---

  async createReminderGroup(input: CreateReminderGroupInput): Promise<void> {
    await this.tx.reminderGroup.create({ data: input });
  }

  async createReminderTemplate(input: CreateReminderTemplateInput): Promise<void> {
    await this.tx.reminderTemplate.create({ data: input });
  }

  async createReminderResponse(input: CreateReminderResponseInput): Promise<void> {
    await this.tx.reminderResponse.create({ data: input as Prisma.ReminderResponseUncheckedCreateInput });
  }

  // --- Editor ---

  async createEditorWorkspace(input: CreateEditorWorkspaceInput): Promise<void> {
    await this.tx.editorWorkspace.create({ data: input as Prisma.EditorWorkspaceUncheckedCreateInput });
  }

  async createEditorSession(input: CreateEditorSessionInput): Promise<void> {
    await this.tx.editorWorkspaceSession.create({
      data: input as Prisma.EditorWorkspaceSessionUncheckedCreateInput,
    });
  }

  async createEditorGroup(input: CreateEditorGroupInput): Promise<void> {
    await this.tx.editorWorkspaceSessionGroup.create({
      data: input as Prisma.EditorWorkspaceSessionGroupUncheckedCreateInput,
    });
  }

  async createEditorTab(input: CreateEditorTabInput): Promise<void> {
    await this.tx.editorWorkspaceSessionGroupTab.create({
      data: input as Prisma.EditorWorkspaceSessionGroupTabUncheckedCreateInput,
    });
  }

  // --- AI ---

  async createAIConversation(input: CreateAIConversationInput): Promise<void> {
    await this.tx.aiConversation.create({ data: input as Prisma.AiConversationUncheckedCreateInput });
  }

  async createAIMessage(input: CreateAIMessageInput): Promise<void> {
    await this.tx.aiMessage.create({ data: input as Prisma.AiMessageUncheckedCreateInput });
  }
}

export class PrismaDataPortabilityImportStore implements DataPortabilityImportStore {
  constructor(private readonly prisma: PrismaClient) {}

  async transaction<T>(fn: (tx: DataPortabilityImportTx) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(async (prismaTx) => {
      const tx = new PrismaDataPortabilityImportTx(prismaTx);
      return fn(tx);
    });
  }
}
