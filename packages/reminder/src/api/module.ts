/**
 * Reminder API Module Definition
 *
 * Implements IApiModule standard interface:
 * 1. Composition Root (ReminderModule → Repositories → Handlers)
 * 2. Route definition and mounting
 *
 * Middleware comes from context.middleware, no dependency on apps/api internals.
 */

import { Router } from 'express';
import type { PrismaClient } from '@dailyuse/database';
import { ok, fail } from '@dailyuse/contracts/result';
import { ReminderModule } from '../infrastructure-server';
import { ReminderContainer } from '../infrastructure-server/di/reminder-container';
import { registerReminderRoutes } from './routes';
import type { ReminderUseCases } from '../controllers/reminder.controller';
import { registerReminderInitializationTasks } from './initialization';
import { ReminderTemplate } from '../domain-server/aggregates/reminder-template';
import { ReminderGroup } from '../domain-server/aggregates/reminder-group';
import { ReminderDomainService } from '../domain-server/services/ReminderDomainService';
import { RecordReminderResponse } from '../application-server/use-cases/commands/record-reminder-response';
import { AnalyzeReminderFrequency } from '../application-server/use-cases/queries/analyze-reminder-frequency';
import { AdjustReminderFrequency } from '../application-server/use-cases/commands/adjust-reminder-frequency';
import { IdentityId } from '@dailyuse/domain-shared';

export interface ReminderApiModuleContext {
  readonly app: import('express').Express;
  readonly router: Router;
  readonly db: unknown;
  readonly middleware: {
    readonly auth: import('express').RequestHandler;
    requireRole(roles: string[]): import('express').RequestHandler;
  };
  readonly openApiRegistry?: import('@dailyuse/utils/result').OpenApiRegistryLike;
}

export interface ReminderApiModuleDef {
  readonly name: string;
  register(context: ReminderApiModuleContext): Promise<void> | void;
  destroy?(): Promise<void> | void;
}

export const ReminderApiModule: ReminderApiModuleDef = {
  name: 'Reminder',

  register(context) {
    const { router, middleware, db } = context;

    // 1. Composition Root — initialize repositories via ReminderModule
    const reminderModule = new ReminderModule(db as PrismaClient);

    // Initialize application services
    const reminderDomainService = new ReminderDomainService(
      reminderModule.reminderTemplateRepository,
      reminderModule.reminderGroupRepository,
    );
    const recordReminderResponse = new RecordReminderResponse(
      reminderModule.reminderResponseRepository,
    );
    const analyzeReminderFrequency = new AnalyzeReminderFrequency(
      reminderModule.reminderTemplateRepository,
      reminderModule.reminderResponseRepository,
    );
    const adjustReminderFrequency = new AdjustReminderFrequency(
      reminderModule.reminderTemplateRepository,
    );

    // 2. Wire route handlers directly to repositories
    const handlers: ReminderUseCases = {
      // Template CRUD
      createTemplate: async (data, ctx) => {
        const normalizedInput = {
          ...data,
          activeTime: {
            activatedAt: data.activeTime?.startDate,
          },
          activeHours: data.activeHours
            ? {
                enabled: true,
                startHour: data.activeHours.startHour,
                endHour: data.activeHours.endHour,
              }
            : undefined,
          recurrence: data.recurrence
            ? { ...data.recurrence, weekly: data.recurrence.weekly ?? null }
            : undefined,
          notificationConfig: {
            ...data.notificationConfig,
            actions: data.notificationConfig?.actions ?? null,
          },
        };
        const template = ReminderTemplate.create({
          ...normalizedInput,
          identityId: IdentityId.of(ctx.identityId),
        });
        await reminderModule.reminderTemplateRepository.save(template);
        return ok(template.toClientDTO());
      },
      listTemplates: async (ctx) => {
        const templates = await reminderModule.reminderTemplateRepository.findByIdentityId(
          ctx.identityId,
        );
        const data = templates.map((t) => t.toClientDTO());
        return ok({
          templates: data,
          total: data.length,
          page: 1,
          pageSize: data.length,
          hasMore: false,
        });
      },
      getUpcomingReminders: async (params, ctx) =>
        ok(
          await reminderModule.reminderTemplateRepository.findByNextTriggerBefore(
            params.beforeTime
              ? new Date(params.beforeTime as string | number).getTime()
              : Date.now(),
            ctx.identityId,
          ),
        ),
      getTemplate: async (id) => ok(await reminderModule.reminderTemplateRepository.findById(id)),
      updateTemplate: async (id, data) => {
        const existing = await reminderModule.reminderTemplateRepository.findById(id);
        if (!existing) throw new Error('Template not found');
        const normalizedUpdates: Record<string, unknown> = { ...data };
        if (data.activeTime) {
          normalizedUpdates.activeTime = { activatedAt: data.activeTime.startDate };
        }
        if (data.activeHours) {
          normalizedUpdates.activeHours = {
            enabled: true,
            startHour: data.activeHours.startHour,
            endHour: data.activeHours.endHour,
          };
        }
        if (data.recurrence) {
          normalizedUpdates.recurrence = {
            ...data.recurrence,
            weekly: data.recurrence.weekly ?? null,
          };
        }
        if (data.notificationConfig) {
          normalizedUpdates.notificationConfig = {
            ...data.notificationConfig,
            actions: data.notificationConfig.actions ?? null,
          };
        }
        existing.update(normalizedUpdates as any);
        await reminderModule.reminderTemplateRepository.save(existing);
        return ok(existing.toClientDTO());
      },
      deleteTemplate: async (id) => {
        await reminderModule.reminderTemplateRepository.delete(id);
        return ok(undefined);
      },

      // Group CRUD
      createGroup: async (data, ctx) => {
        const group = ReminderGroup.create({
          ...data,
          identityId: ctx.identityId,
        });
        await reminderModule.reminderGroupRepository.save(group);
        return ok(group.toClientDTO());
      },
      listGroups: async (ctx) => {
        const groups = await reminderModule.reminderGroupRepository.findByIdentityId(
          ctx.identityId,
        );
        const data = groups.map((g) => g.toClientDTO());
        return ok({
          groups: data,
          total: data.length,
          page: 1,
          pageSize: data.length,
          hasMore: false,
        });
      },
      getGroup: async (id) => ok(await reminderModule.reminderGroupRepository.findById(id)),
      updateGroup: async (id, data) => {
        const existing = await reminderModule.reminderGroupRepository.findById(id);
        if (!existing) throw new Error('Group not found');
        // Reconstruct with updated fields via load()
        const updated = ReminderGroup.load({
          id: existing.id,
          identityId: existing.identityId as string,
          name: data.name ?? existing.name,
          description: 'description' in data ? (data.description ?? null) : existing.description,
          controlMode: data.controlMode ?? existing.controlMode,
          enabled: existing.enabled,
          status: existing.status,
          order: data.order ?? existing.order,
          color: 'color' in data ? (data.color ?? null) : existing.color,
          icon: 'icon' in data ? (data.icon ?? null) : existing.icon,
          stats: existing.stats as any,
          createdAt: existing.createdAt,
          updatedAt: new Date(),
          deletedAt: existing.deletedAt?.getTime() ?? null,
          version: existing.version,
        });
        await reminderModule.reminderGroupRepository.save(updated);
        return ok(updated.toClientDTO());
      },
      deleteGroup: async (id) => {
        await reminderModule.reminderGroupRepository.delete(id);
        return ok(undefined);
      },
      switchGroupControlMode: async (id, data) => {
        const existing = await reminderModule.reminderGroupRepository.findById(id);
        if (!existing) throw new Error('Group not found');
        if (data.mode === 'Group') {
          existing.switchToGroupControl();
        } else {
          existing.switchToIndividualControl();
        }
        await reminderModule.reminderGroupRepository.save(existing);
        return ok(existing.toClientDTO());
      },
      batchGroupTemplates: async (groupId, data) => {
        const templates = await reminderModule.reminderTemplateRepository.findByGroupId(groupId);
        let successCount = 0;
        for (const t of templates) {
          if (data.action === 'ENABLE') {
            t.enable();
          } else {
            t.pause();
          }
          await reminderModule.reminderTemplateRepository.save(t);
          successCount++;
        }
        return ok({ successCount, failedCount: 0 });
      },

      // Template Actions
      enableTemplate: async (id) => {
        const template = await reminderModule.reminderTemplateRepository.findById(id);
        if (!template) return fail({ code: 'NOT_FOUND', message: 'Template not found' });
        template.enable();
        await reminderModule.reminderTemplateRepository.save(template);
        return ok(template.toClientDTO());
      },
      pauseTemplate: async (id) => {
        const template = await reminderModule.reminderTemplateRepository.findById(id);
        if (!template) return fail({ code: 'NOT_FOUND', message: 'Template not found' });
        template.pause();
        await reminderModule.reminderTemplateRepository.save(template);
        return ok(template.toClientDTO());
      },
      toggleTemplate: async (id) => {
        const template = await reminderModule.reminderTemplateRepository.findById(id);
        if (!template) return fail({ code: 'NOT_FOUND', message: 'Template not found' });
        template.toggle();
        await reminderModule.reminderTemplateRepository.save(template);
        return ok(template.toClientDTO());
      },
      moveTemplate: async (id, groupId) => {
        const result = await reminderDomainService.assignTemplateToGroup(id, groupId);
        return ok(result);
      },
      getTemplateHistory: async (id) => {
        const template = await reminderModule.reminderTemplateRepository.findById(id, {
          includeHistory: true,
        } as any);
        if (!template) return fail({ code: 'NOT_FOUND', message: 'Template not found' });
        const history = template.getAllHistory ? template.getAllHistory() : [];
        return ok(history);
      },

      // Response Operations
      recordResponse: async (templateId, data) => {
        const result = await recordReminderResponse.execute({
          templateId,
          action: data.action as any,
          identityId: '', // filled by context upstream if needed
        });
        return ok(result);
      },
      getTemplateResponses: async (templateId) => {
        const responses = await recordReminderResponse.getResponsesByTemplate(templateId);
        return ok(responses);
      },
      getResponseStats: async (templateId) => {
        const stats = await recordReminderResponse.getResponseStats(templateId);
        return ok(stats);
      },

      // Frequency Analysis
      analyzeFrequency: async (templateId) => {
        const result = await analyzeReminderFrequency.execute(templateId);
        return ok(result);
      },
      adjustFrequency: async (templateId, data) => {
        const result = await adjustReminderFrequency.execute({
          templateId,
          newInterval: data.customInterval ?? 0,
          reason: data.action,
          identityId: '',
        });
        return ok(result);
      },
      rejectFrequencyAdjustment: async (templateId) => {
        await adjustReminderFrequency.reject(templateId, '');
        return ok({ success: true });
      },

      // Group Actions
      toggleGroup: async (id) => {
        const result = await reminderDomainService.toggleGroupAndTemplates(id);
        return ok(result);
      },

      // Preferences
      getPreferences: async (ctx) => {
        const prefs = await reminderModule.userReminderPreferenceRepository.findByIdentityId(
          ctx.identityId,
        );
        return ok(prefs);
      },
      updatePreferences: async (data, ctx) => {
        const existing = await reminderModule.userReminderPreferenceRepository.findByIdentityId(
          ctx.identityId,
        );
        if (!existing) {
          // Create default preferences with the update data
          const { UserReminderPreferences } =
            await import('../domain-server/aggregates/user-reminder-preferences');
          const prefs = UserReminderPreferences.create({ identityId: ctx.identityId });
          if (data.bestTimeSlots || data.worstTimeSlots) {
            prefs.updateTimeSlots(
              (data.bestTimeSlots as any) ?? [],
              (data.worstTimeSlots as any) ?? [],
            );
          }
          if (data.globalSmartFrequencyEnabled !== undefined) {
            prefs.toggleGlobalSmartFrequency(!!data.globalSmartFrequencyEnabled);
          }
          await reminderModule.userReminderPreferenceRepository.save(prefs);
          return ok(prefs.toClientDTO());
        }
        if (data.bestTimeSlots || data.worstTimeSlots) {
          existing.updateTimeSlots(
            (data.bestTimeSlots as any) ?? [],
            (data.worstTimeSlots as any) ?? [],
          );
        }
        if (data.globalSmartFrequencyEnabled !== undefined) {
          existing.toggleGlobalSmartFrequency(!!data.globalSmartFrequencyEnabled);
        }
        await reminderModule.userReminderPreferenceRepository.save(existing);
        return ok(existing.toClientDTO());
      },
    };

    // 3. Register routes
    const reminderRoutes = registerReminderRoutes(handlers, middleware, context.openApiRegistry);

    // 4. Mount sub-API routes
    router.use('/reminders', reminderRoutes);

    // 5. Register initialization tasks
    registerReminderInitializationTasks();
  },

  destroy() {
    ReminderContainer.getInstance().reset();
  },
};
