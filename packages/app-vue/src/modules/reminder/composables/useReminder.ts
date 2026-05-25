/**
 * useReminder - 提醒模块主 composable
 *
 * 编排 ReminderClientService 调用 + Store 更新 + 错误处理。
 * 通过 inject(REMINDER_SERVICE_KEY) 获取服务实例，
 * 使用 Result<T> 模式替代 try/catch。
 */

import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useReminderStore } from '../stores/reminder-store';
import { REMINDER_SERVICE_KEY } from '../../../di/keys';
import { useStrictInject } from '../../../shared/utils/useStrictInject';
import type {
  ControlMode,
  ReminderTemplateClientDTO,
  ReminderGroupClientDTO,
  ReminderTemplateListRes,
  ReminderGroupListRes,
  UserReminderPreferencesClientDTO,
  GetReminderTodayScheduleRes,
  CreateReminderTemplateReq,
  UpdateReminderTemplateReq,
  CreateReminderGroupReq,
  UpdateReminderGroupReq,
} from '@dailyuse/contracts/reminder';
import type { Result } from '@dailyuse/contracts/result';
import { translateResultError } from '../../../shared/utils/translate-result-error';
import { executeDesktopAuthenticatedResult } from '../../../shared/utils/execute-desktop-authenticated-result';

type ReminderPreferencesCapableService = {
  getPreferences?: () => Promise<Result<UserReminderPreferencesClientDTO>>;
  updatePreferences?: (
    data: Record<string, unknown>,
  ) => Promise<Result<UserReminderPreferencesClientDTO>>;
};

export function useReminder() {
  const service = useStrictInject(REMINDER_SERVICE_KEY, 'ReminderService');
  const { t } = useI18n();

  const store = useReminderStore();
  const savingId = ref<string | null>(null);
  const isSaving = computed(() => savingId.value !== null);

  const templates = computed(() => store.templates);
  const groups = computed(() => store.groups);
  const preferences = computed(() => store.preferences);
  const isLoading = computed(() => store.isLoading);
  const error = computed(() => store.error);

  function handleError(error: unknown, fallbackKey: string): void {
    const message = translateResultError(error, t, { fallbackKey });
    store.setError(message);
    console.error(message);
  }

  async function executeReminderOperation<T>(
    operation: () => Promise<Result<T>>,
    fallbackKey: string,
  ) {
    return executeDesktopAuthenticatedResult({
      operation,
      logScope: 'Reminder',
      t,
      fallbackKey,
      onError: (error) => {
        handleError(error, fallbackKey);
      },
    });
  }

  async function reloadReminderScene() {
    await Promise.all([fetchTemplates(), fetchGroups(), fetchPreferences()]);
  }

  // ── Templates ──

  async function fetchTemplates() {
    store.setLoading(true);
    store.setError(null);
    try {
      const result = await executeReminderOperation<ReminderTemplateListRes>(
        () => service.getReminderTemplates() as Promise<Result<ReminderTemplateListRes>>,
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
        await reloadReminderScene();
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
        await reloadReminderScene();
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
        await reloadReminderScene();
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
        await reloadReminderScene();
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
        await reloadReminderScene();
        return result.data;
      }
      return null;
    } finally {
      savingId.value = null;
    }
  }

  // ── Groups ──

  async function fetchGroups() {
    store.setLoading(true);
    store.setError(null);
    try {
      const result = await executeReminderOperation<ReminderGroupListRes>(
        () => service.getReminderGroups() as Promise<Result<ReminderGroupListRes>>,
        'reminder.error.loadGroupsFailed',
      );

      if (result.ok) {
        const groups = result.data.groups;
        store.setGroups(groups);
      }
    } finally {
      store.setLoading(false);
    }
  }

  async function createGroup(data: CreateReminderGroupReq): Promise<ReminderGroupClientDTO | null> {
    savingId.value = 'new-group';
    store.setError(null);
    try {
      const result = await executeReminderOperation<ReminderGroupClientDTO>(
        () => service.createReminderGroup(data),
        'reminder.error.createGroupFailed',
      );
      if (result.ok) {
        await reloadReminderScene();
        return result.data;
      }
      return null;
    } finally {
      savingId.value = null;
    }
  }

  async function updateGroup(
    id: string,
    data: UpdateReminderGroupReq,
  ): Promise<ReminderGroupClientDTO | null> {
    savingId.value = id;
    store.setError(null);
    try {
      const result = await executeReminderOperation<ReminderGroupClientDTO>(
        () => service.updateReminderGroup(id, data),
        'reminder.error.updateGroupFailed',
      );
      if (result.ok) {
        await reloadReminderScene();
        return result.data;
      }
      return null;
    } finally {
      savingId.value = null;
    }
  }

  async function deleteGroup(id: string): Promise<boolean> {
    savingId.value = id;
    store.setError(null);
    try {
      const result = await executeReminderOperation(
        () => service.deleteReminderGroup(id),
        'reminder.error.deleteGroupFailed',
      );
      if (result.ok) {
        await reloadReminderScene();
        return true;
      }
      return false;
    } finally {
      savingId.value = null;
    }
  }

  async function toggleGroup(id: string): Promise<ReminderGroupClientDTO | null> {
    savingId.value = id;
    store.setError(null);
    try {
      const result = await executeReminderOperation<ReminderGroupClientDTO>(
        () => service.toggleReminderGroupStatus(id),
        'reminder.error.toggleGroupFailed',
      );
      if (result.ok) {
        await reloadReminderScene();
        return result.data;
      }
      return null;
    } finally {
      savingId.value = null;
    }
  }

  async function switchGroupControlMode(
    id: string,
    mode: ControlMode,
  ): Promise<ReminderGroupClientDTO | null> {
    savingId.value = id;
    store.setError(null);
    try {
      const result = await executeReminderOperation<ReminderGroupClientDTO>(
        () => service.switchReminderGroupControlMode(id, mode),
        'reminder.error.updateGroupFailed',
      );
      if (result.ok) {
        await reloadReminderScene();
        return result.data;
      }
      return null;
    } finally {
      savingId.value = null;
    }
  }

  async function fetchPreferences(): Promise<UserReminderPreferencesClientDTO | null> {
    const preferencesService = service as ReminderPreferencesCapableService;
    if (typeof preferencesService.getPreferences !== 'function') {
      return null;
    }

    const result = await executeReminderOperation<UserReminderPreferencesClientDTO>(
      () => preferencesService.getPreferences!(),
      'reminder.error.loadPreferencesFailed',
    );
    if (result.ok) {
      store.setPreferences(result.data);
      return result.data;
    }
    return null;
  }

  async function updatePreferences(
    data: Record<string, unknown>,
  ): Promise<UserReminderPreferencesClientDTO | null> {
    const preferencesService = service as ReminderPreferencesCapableService;
    if (typeof preferencesService.updatePreferences !== 'function') {
      return null;
    }

    savingId.value = 'preferences';
    store.setError(null);
    try {
      const result = await executeReminderOperation<UserReminderPreferencesClientDTO>(
        () => preferencesService.updatePreferences!(data),
        'reminder.error.updatePreferencesFailed',
      );
      if (result.ok) {
        await reloadReminderScene();
        return result.data;
      }
      return null;
    } finally {
      savingId.value = null;
    }
  }

  return {
    templates,
    groups,
    preferences,
    isLoading,
    isSaving,
    error,
    fetchTemplates,
    getTodaySchedule,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    toggleTemplate,
    moveTemplateToGroup,
    fetchGroups,
    createGroup,
    updateGroup,
    deleteGroup,
    toggleGroup,
    switchGroupControlMode,
    fetchPreferences,
    updatePreferences,
    reloadReminderScene,
  };
}
