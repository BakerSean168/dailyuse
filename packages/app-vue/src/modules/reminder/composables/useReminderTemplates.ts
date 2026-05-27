import { computed } from 'vue';
import type {
  ReminderTemplateClientDTO,
  ReminderTemplateListRes,
  GetReminderTodayScheduleRes,
  CreateReminderTemplateReq,
  UpdateReminderTemplateReq,
} from '@dailyuse/contracts/reminder';
import type { ReminderContext } from './useReminderContext';

export function useReminderTemplates(ctx: ReminderContext) {
  const { store, service, savingId, executeReminderOperation } = ctx;

  const isSaving = computed(() => savingId.value !== null);

  async function fetchTemplates() {
    store.setLoading(true);
    store.setError(null);
    try {
      const result = await executeReminderOperation<ReminderTemplateListRes>(
        () => service.getReminderTemplates() as Promise<any>,
        'reminder.error.loadTemplatesFailed',
      );

      if (result.ok) {
        const templates = result.data.templates;
        store.setTemplates(templates, templates.length);
      }
    } finally {
      store.setLoading(false);
    }
  }

  async function getTodaySchedule(params?: {
    limit?: number;
    includeExpired?: boolean;
  }): Promise<GetReminderTodayScheduleRes | null> {
    store.setError(null);
    const result = await executeReminderOperation<GetReminderTodayScheduleRes>(
      () => service.getTodaySchedule(params),
      'reminder.error.loadTemplatesFailed',
    );
    if (result.ok) {
      return result.data;
    }
    return null;
  }

  async function createTemplate(
    data: CreateReminderTemplateReq,
  ): Promise<ReminderTemplateClientDTO | null> {
    savingId.value = 'new';
    store.setError(null);
    try {
      const result = await executeReminderOperation<ReminderTemplateClientDTO>(
        () => service.createReminderTemplate(data),
        'reminder.error.createTemplateFailed',
      );
      if (result.ok) {
        return result.data;
      }
      return null;
    } finally {
      savingId.value = null;
    }
  }

  async function updateTemplate(
    id: string,
    data: UpdateReminderTemplateReq,
  ): Promise<ReminderTemplateClientDTO | null> {
    savingId.value = id;
    store.setError(null);
    try {
      const result = await executeReminderOperation<ReminderTemplateClientDTO>(
        () => service.updateReminderTemplate(id, data),
        'reminder.error.updateTemplateFailed',
      );
      if (result.ok) {
        return result.data;
      }
      return null;
    } finally {
      savingId.value = null;
    }
  }

  async function deleteTemplate(id: string): Promise<boolean> {
    savingId.value = id;
    store.setError(null);
    try {
      const result = await executeReminderOperation(
        () => service.deleteReminderTemplate(id),
        'reminder.error.deleteTemplateFailed',
      );
      if (result.ok) {
        return true;
      }
      return false;
    } finally {
      savingId.value = null;
    }
  }

  async function toggleTemplate(id: string): Promise<ReminderTemplateClientDTO | null> {
    savingId.value = id;
    store.setError(null);
    try {
      const result = await executeReminderOperation<ReminderTemplateClientDTO>(
        () => service.toggleTemplateEnabled(id),
        'reminder.error.toggleTemplateFailed',
      );
      if (result.ok) {
        store.updateTemplate(result.data);
        return result.data;
      }
      return null;
    } finally {
      savingId.value = null;
    }
  }

  async function moveTemplateToGroup(
    id: string,
    groupId: string | null,
  ): Promise<ReminderTemplateClientDTO | null> {
    savingId.value = id;
    store.setError(null);
    try {
      const result = await executeReminderOperation<ReminderTemplateClientDTO>(
        () => service.moveTemplateToGroup(id, groupId),
        'reminder.error.moveTemplateFailed',
      );
      if (result.ok) {
        store.updateTemplate(result.data);
        return result.data;
      }
      return null;
    } finally {
      savingId.value = null;
    }
  }

  return {
    isSaving,
    fetchTemplates,
    getTodaySchedule,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    toggleTemplate,
    moveTemplateToGroup,
  };
}
