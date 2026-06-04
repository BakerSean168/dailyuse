/**
 * Export User Data Use Case
 *
 * Reads all user data from repositories, converts to portable DTOs
 * with _ref allocation, strips sensitive fields, and builds the envelope.
 */

import { createLogger } from '@dailyuse/utils/logger';
import type {
  UserDataExportEnvelopeV1,
  PortableUserDataV1,
  ExportContext,
  ExportResult,
  ExportableModule,
} from '../portable-types';
import { RefAllocator, ALL_MODULES } from '../portable-types';
import type { DataPortabilityDependencies } from '../data-portability.dependencies';
import { sanitizeSensitiveFields } from '../sanitize';
import { projectGoals, projectGoalFolders, projectGoalRecords, projectFocusSessions, projectFocusModes } from './projections/goal.projection';
import { projectTaskFolders, projectTaskTemplates, projectTaskInstances, projectTaskDependencies } from './projections/task.projection';
import { projectReminderGroups, projectReminderTemplates, projectReminderResponses, projectUserReminderPreference } from './projections/reminder.projection';
import { projectRepositories, projectResourceFolders, projectResources } from './projections/repository.projection';
import { projectCalendarEntries, projectScheduleTasks } from './projections/schedule.projection';
import { projectEditorWorkspaces } from './projections/editor.projection';
import { projectAIConversations } from './projections/ai.projection';
import { projectNotificationPreference } from './projections/notification.projection';
import { projectSettings } from './projections/setting.projection';

const logger = createLogger('ExportUserData');

// ============ Use Case ============

export class ExportUserDataUseCase {
  constructor(private readonly deps: DataPortabilityDependencies) {}

  async execute(
    identityId: string,
    include?: ExportableModule[],
  ): Promise<ExportResult> {
    const modules = include ?? ALL_MODULES;
    const exportedAt = new Date().toISOString();
    const refAllocator = new RefAllocator();
    const refToIdMap = new Map<string, string>();
    const warnings: string[] = [];
    const entityCounts: Record<string, number> = {};

    const ctx: ExportContext = {
      identityId,
      exportedAt,
      refAllocator,
      warnings,
      refToIdMap,
    };

    const data: PortableUserDataV1 = {};

    // ─── Settings (singleton) ───
    if (modules.includes('settings')) {
      const setting = await this.deps.settingRepository.findByIdentityId(identityId);
      if (setting) {
        data.settings = projectSettings(setting);
        entityCounts.settings = 1;
      }
    }

    // ─── Notification Preference (singleton) ───
    if (modules.includes('notifications')) {
      const pref = await this.deps.notificationPreferenceRepository.findByIdentityId(identityId);
      if (pref) {
        data.notificationPreference = projectNotificationPreference(pref);
        entityCounts.notificationPreference = 1;
      }
    }

    // ─── User Reminder Preference (singleton) ───
    if (modules.includes('reminders')) {
      const pref = await this.deps.userReminderPreferenceRepository.findByIdentityId(identityId);
      if (pref) {
        data.userReminderPreference = projectUserReminderPreference(pref);
        entityCounts.userReminderPreference = 1;
      }
    }

    // ─── Repositories ───
    if (modules.includes('repository')) {
      const repos = await this.deps.repositoryRepository.findByIdentityId(identityId);
      const allFolders: unknown[] = [];
      const allResources: unknown[] = [];

      for (const repo of repos) {
        const r = repo as { id: string };
        const folders = await this.deps.folderRepository.findByRepositoryId(r.id);
        allFolders.push(...folders);
      }

      const resources = await this.deps.resourceRepository.findByIdentityId(identityId);
      allResources.push(...resources);

      const portableRepos = projectRepositories(repos, ctx);
      const portableFolders = projectResourceFolders(allFolders, ctx);
      const portableResources = projectResources(allResources, ctx);

      data.repositories = {
        repositories: portableRepos,
        folders: portableFolders,
        resources: portableResources,
      };
      entityCounts.repositories = portableRepos.length;
      entityCounts.resourceFolders = portableFolders.length;
      entityCounts.resources = portableResources.length;
    }

    // ─── Goal Folders ───
    if (modules.includes('goals')) {
      const goalFolders = await this.deps.goalFolderRepository.findByIdentityId(identityId);
      const goals = await this.deps.goalRepository.findByIdentityId(identityId, { includeChildren: true });

      // Collect all goal IDs for record queries
      const goalIds = (goals as { id: string }[]).map((g) => g.id);
      const allRecords: unknown[] = [];
      for (const goalId of goalIds) {
        const records = await this.deps.goalRecordRepository.findByGoalId(goalId);
        allRecords.push(...records);
      }

      const focusSessions = await this.deps.focusSessionRepository.findByIdentityId(identityId);
      const focusModes = await this.deps.focusModeRepository.findByIdentityId(identityId);

      const portableGoalFolders = projectGoalFolders(goalFolders, ctx);
      const portableGoals = projectGoals(goals, ctx);
      const portableRecords = projectGoalRecords(allRecords, ctx);
      const portableSessions = projectFocusSessions(focusSessions, ctx);
      const portableModes = projectFocusModes(focusModes, ctx);

      data.goals = {
        folders: portableGoalFolders,
        items: portableGoals,
        records: portableRecords,
        focusSessions: portableSessions,
        focusModes: portableModes,
      };
      entityCounts.goalFolders = portableGoalFolders.length;
      entityCounts.goals = portableGoals.length;
      entityCounts.goalRecords = portableRecords.length;
      entityCounts.focusSessions = portableSessions.length;
      entityCounts.focusModes = portableModes.length;
    }

    // ─── Tasks ───
    if (modules.includes('tasks')) {
      const taskFolders = await this.deps.taskFolderRepository.findByIdentityId(identityId);
      const taskTemplates = await this.deps.taskTemplateRepository.findByIdentityId(identityId);
      const taskInstances = await this.deps.taskInstanceRepository.findByIdentityId(identityId);
      const taskDeps = await this.deps.taskDependencyRepository.findAllByIdentityId(identityId);

      data.tasks = {
        folders: projectTaskFolders(taskFolders, ctx),
        templates: projectTaskTemplates(taskTemplates, ctx),
        instances: projectTaskInstances(taskInstances, ctx),
        dependencies: projectTaskDependencies(taskDeps, ctx),
      };
      entityCounts.taskFolders = data.tasks.folders.length;
      entityCounts.taskTemplates = data.tasks.templates.length;
      entityCounts.taskInstances = data.tasks.instances.length;
      entityCounts.taskDependencies = data.tasks.dependencies.length;
    }

    // ─── Reminders (groups + templates + responses) ───
    if (modules.includes('reminders')) {
      const groups = await this.deps.reminderGroupRepository.findByIdentityId(identityId);
      const templates = await this.deps.reminderTemplateRepository.findByIdentityId(identityId, { includeHistory: false });

      const allResponses: unknown[] = [];
      for (const template of templates as { id: string }[]) {
        const responses = await this.deps.reminderResponseRepository.findByTemplateId(template.id);
        allResponses.push(...responses);
      }

      if (!data.reminders) data.reminders = { groups: [], templates: [], responses: [] };
      data.reminders.groups = projectReminderGroups(groups, ctx);
      data.reminders.templates = projectReminderTemplates(templates, ctx);
      data.reminders.responses = projectReminderResponses(allResponses, ctx);
      entityCounts.reminderGroups = data.reminders.groups.length;
      entityCounts.reminderTemplates = data.reminders.templates.length;
      entityCounts.reminderResponses = data.reminders.responses.length;
    }

    // ─── Schedules ───
    if (modules.includes('schedule')) {
      const entries = await this.deps.scheduleRepository.findByIdentityId(identityId);
      const scheduleTasks = await this.deps.scheduleTaskRepository.findByIdentityId(identityId);

      data.schedules = {
        entries: projectCalendarEntries(entries, ctx),
        tasks: projectScheduleTasks(scheduleTasks, ctx),
      };
      entityCounts.calendarEntries = data.schedules.entries.length;
      entityCounts.scheduleTasks = data.schedules.tasks.length;
    }

    // ─── Editor ───
    if (modules.includes('editor')) {
      const workspaces = await this.deps.editorWorkspaceRepository.findByIdentityId(identityId);
      data.editor = {
        workspaces: await projectEditorWorkspaces(workspaces, ctx, this.deps),
      };
      entityCounts.editorWorkspaces = data.editor.workspaces.length;
    }

    // ─── AI ───
    if (modules.includes('ai')) {
      const conversations = await this.deps.aiConversationRepository.findByIdentityId(identityId, { includeChildren: true });
      data.ai = {
        conversations: projectAIConversations(conversations, ctx),
      };
      entityCounts.aiConversations = data.ai.conversations.length;
    }

    // ─── Build Envelope ───
    const envelope: UserDataExportEnvelopeV1 = {
      kind: 'memoflow.user-data-export',
      schemaVersion: 1,
      exportedAt,
      exportedBy: {
        appName: 'Memoflow',
      },
      scope: {
        includesBinaryResources: false,
        importMode: 'append-create-like',
      },
      data,
    };

    // Strip any nested sensitive fields (token, password, secret, etc.)
    const sanitized = sanitizeSensitiveFields(envelope);
    const content = JSON.stringify(sanitized, null, 2);
    const timestamp = exportedAt.replace(/[:.]/g, '-').slice(0, 19);
    const fileName = `memoflow-user-data-v1-${timestamp}.json`;

    logger.info('Export completed', { identityId, entityCounts, warnings: warnings.length });

    return {
      fileName,
      content,
      summary: { entityCounts, warnings },
    };
  }
}
