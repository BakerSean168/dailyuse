/**
 * useReminder - 提醒模块主 composable
 *
 * 编排 ReminderClientService 调用 + Store 更新 + 错误处理。
 * 通过 inject(REMINDER_SERVICE_KEY) 获取服务实例，
 * 使用 Result<T> 模式替代 try/catch。
 */

import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useReminderStore } from '../stores/reminderStore';
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
import {
  getDesktopAuthApi,
  recoverDesktopAuthIfNeeded,
} from '../../../shared/utils/desktopAuthRecovery';
import { translateResultError } from '../../../shared/utils/translateResultError';

export function useReminder() {
  const service = useStrictInject(REMINDER_SERVICE_KEY, 'ReminderService');
  const { t } = useI18n();

  const store = useReminderStore();
  const savingId = ref<string | null>(null);

  const templates = computed(() => store.templates);
  const groups = computed(() => store.groups);
  const preferences = computed(() => store.preferences);
  const isLoading = computed(() => store.isLoading);
  const error = computed(() => store.error);
  const isSaving = computed(() => savingId.value !== null);

  function handleError(error: unknown, fallbackKey: string): void {
    const message = translateResultError(error, t, { fallbackKey });
    store.setError(message);
    console.error(message);
  }

  async function maybeRecoverAuth(error: { code?: string }): Promise<boolean> {
    return recoverDesktopAuthIfNeeded(error, getDesktopAuthApi(), 'Reminder');
  }

  async function executeWithOptionalAuthRecovery<T>(
    action: () => Promise<Result<T>>,
  ): Promise<Result<T>> {
    let result = await action();
    if (!result.ok && (await maybeRecoverAuth(result.error))) {
      result = await action();
    }
    return result;
  }

  async function reloadReminderScene() {
    await Promise.all([fetchTemplates(), fetchGroups(), fetchPreferences()]);
  }

  // ── Templates ──

  async function fetchTemplates() {
    store.setLoading(true);
    store.setError(null);
    try {
      let result: Result<ReminderTemplateListRes> = await service.getReminderTemplates();

      if (!result.ok && (await maybeRecoverAuth(result.error))) {
        result = await service.getReminderTemplates();
      }

      if (result.ok) {
        const templates = result.data.templates;
        store.setTemplates(templates, templates.length);
      } else {
        handleError(result.error, 'reminder.error.loadTemplatesFailed');
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
    const result = await executeWithOptionalAuthRecovery<GetReminderTodayScheduleRes>(() =>
      service.getTodaySchedule(params),
    );
    if (result.ok) {
      return result.data;
    }
    handleError(result.error, 'reminder.error.loadTemplatesFailed');
    return null;
  }

  async function createTemplate(
    data: CreateReminderTemplateReq,
  ): Promise<ReminderTemplateClientDTO | null> {
    savingId.value = 'new';
    store.setError(null);
    try {
      const result = await executeWithOptionalAuthRecovery<ReminderTemplateClientDTO>(() =>
        service.createReminderTemplate(data),
      );
      if (result.ok) {
        await reloadReminderScene();
        return result.data;
      } else {
        handleError(result.error, 'reminder.error.createTemplateFailed');
        return null;
      }
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
      const result = await executeWithOptionalAuthRecovery<ReminderTemplateClientDTO>(() =>
        service.updateReminderTemplate(id, data),
      );
      if (result.ok) {
        await reloadReminderScene();
        return result.data;
      } else {
        handleError(result.error, 'reminder.error.updateTemplateFailed');
        return null;
      }
    } finally {
      savingId.value = null;
    }
  }

  async function deleteTemplate(id: string): Promise<boolean> {
    savingId.value = id;
    store.setError(null);
    try {
      const result = await executeWithOptionalAuthRecovery(() =>
        service.deleteReminderTemplate(id),
      );
      if (result.ok) {
        await reloadReminderScene();
        return true;
      } else {
        handleError(result.error, 'reminder.error.deleteTemplateFailed');
        return false;
      }
    } finally {
      savingId.value = null;
    }
  }

  async function toggleTemplate(id: string): Promise<ReminderTemplateClientDTO | null> {
    savingId.value = id;
    store.setError(null);
    try {
      const result = await executeWithOptionalAuthRecovery<ReminderTemplateClientDTO>(() =>
        service.toggleTemplateEnabled(id),
      );
      if (result.ok) {
        store.updateTemplate(result.data);
        await reloadReminderScene();
        return result.data;
      }
      handleError(result.error, 'reminder.error.toggleTemplateFailed');
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
      const result = await executeWithOptionalAuthRecovery<ReminderTemplateClientDTO>(() =>
        service.moveTemplateToGroup(id, groupId),
      );
      if (result.ok) {
        store.updateTemplate(result.data);
        await reloadReminderScene();
        return result.data;
      }
      handleError(result.error, 'reminder.error.moveTemplateFailed');
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
      let result: Result<ReminderGroupListRes> = await service.getReminderGroups();

      if (!result.ok && (await maybeRecoverAuth(result.error))) {
        result = await service.getReminderGroups();
      }

      if (result.ok) {
        const groups = result.data.groups;
        store.setGroups(groups);
      } else {
        handleError(result.error, 'reminder.error.loadGroupsFailed');
      }
    } finally {
      store.setLoading(false);
    }
  }

  async function createGroup(data: CreateReminderGroupReq): Promise<ReminderGroupClientDTO | null> {
    savingId.value = 'new-group';
    store.setError(null);
    try {
      const result = await executeWithOptionalAuthRecovery<ReminderGroupClientDTO>(() =>
        service.createReminderGroup(data),
      );
      if (result.ok) {
        await reloadReminderScene();
        return result.data;
      } else {
        handleError(result.error, 'reminder.error.createGroupFailed');
        return null;
      }
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
      const result = await executeWithOptionalAuthRecovery<ReminderGroupClientDTO>(() =>
        service.updateReminderGroup(id, data),
      );
      if (result.ok) {
        await reloadReminderScene();
        return result.data;
      } else {
        handleError(result.error, 'reminder.error.updateGroupFailed');
        return null;
      }
    } finally {
      savingId.value = null;
    }
  }

  async function deleteGroup(id: string): Promise<boolean> {
    savingId.value = id;
    store.setError(null);
    try {
      const result = await executeWithOptionalAuthRecovery(() => service.deleteReminderGroup(id));
      if (result.ok) {
        await reloadReminderScene();
        return true;
      } else {
        handleError(result.error, 'reminder.error.deleteGroupFailed');
        return false;
      }
    } finally {
      savingId.value = null;
    }
  }

  async function toggleGroup(id: string): Promise<ReminderGroupClientDTO | null> {
    savingId.value = id;
    store.setError(null);
    try {
      const result = await executeWithOptionalAuthRecovery<ReminderGroupClientDTO>(() =>
        service.toggleReminderGroupStatus(id),
      );
      if (result.ok) {
        await reloadReminderScene();
        return result.data;
      }
      handleError(result.error, 'reminder.error.toggleGroupFailed');
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
      const result = await executeWithOptionalAuthRecovery<ReminderGroupClientDTO>(() =>
        service.switchReminderGroupControlMode(id, mode),
      );
      if (result.ok) {
        await reloadReminderScene();
        return result.data;
      }
      handleError(result.error, 'reminder.error.updateGroupFailed');
      return null;
    } finally {
      savingId.value = null;
    }
  }

  async function fetchPreferences(): Promise<UserReminderPreferencesClientDTO | null> {
    const anyService = service as any;
    if (typeof anyService.getPreferences !== 'function') {
      return null;
    }

    const result = await executeWithOptionalAuthRecovery<UserReminderPreferencesClientDTO>(() =>
      anyService.getPreferences(),
    );
    if (result.ok) {
      store.setPreferences(result.data);
      return result.data;
    }
    handleError(result.error, 'reminder.error.loadPreferencesFailed');
    return null;
  }

  async function updatePreferences(
    data: Record<string, unknown>,
  ): Promise<UserReminderPreferencesClientDTO | null> {
    const anyService = service as any;
    if (typeof anyService.updatePreferences !== 'function') {
      return null;
    }

    savingId.value = 'preferences';
    store.setError(null);
    try {
      const result = await executeWithOptionalAuthRecovery<UserReminderPreferencesClientDTO>(() =>
        anyService.updatePreferences(data),
      );
      if (result.ok) {
        await reloadReminderScene();
        return result.data;
      }
      handleError(result.error, 'reminder.error.updatePreferencesFailed');
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
