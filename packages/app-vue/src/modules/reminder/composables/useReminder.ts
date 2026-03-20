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
  UserReminderPreferencesClientDTO,
  CreateReminderTemplateReq,
  UpdateReminderTemplateReq,
  CreateReminderGroupReq,
  UpdateReminderGroupReq,
} from '@dailyuse/contracts/reminder';
import { AuthChannels } from '@dailyuse/contracts/electron';
import type { ResultError } from '@dailyuse/contracts/result';
import type { Result } from '@dailyuse/contracts/result';

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

  function handleError(msg: string): void {
    store.setError(msg);
    console.error(msg);
  }

  async function ensureDesktopAuthReady(): Promise<boolean> {
    const api = (window as any)?.electronAPI;
    if (!api?.invoke) {
      return false;
    }

    try {
      const status = (await api.invoke(AuthChannels.GET_STATUS)) as {
        authenticated?: boolean;
        runtimeState?: string;
      };

      if (status?.authenticated) {
        return true;
      }

      if (status?.runtimeState === 'RESTORING' || status?.runtimeState === 'UNINITIALIZED') {
        await api.invoke(AuthChannels.INITIALIZE);
        const refreshed = (await api.invoke(AuthChannels.GET_STATUS)) as {
          authenticated?: boolean;
        };
        return Boolean(refreshed?.authenticated);
      }
    } catch (error) {
      console.warn('[Reminder] Failed to ensure desktop auth readiness', error);
    }

    return false;
  }

  async function maybeRecoverAuth(error: ResultError): Promise<boolean> {
    if (error.code !== 'AUTH_REQUIRED' && error.code !== 'AUTH_RESTORING') {
      return false;
    }
    return ensureDesktopAuthReady();
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
      let result = await service.getReminderTemplates();

      if (!result.ok && (await maybeRecoverAuth(result.error))) {
        result = await service.getReminderTemplates();
      }

      if (result.ok) {
        store.setTemplates(result.data ?? [], result.data?.length ?? 0);
      } else {
        handleError(result.error.message || t('reminder.error.loadTemplatesFailed'));
      }
    } finally {
      store.setLoading(false);
    }
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
        handleError(result.error.message || t('reminder.error.createTemplateFailed'));
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
        handleError(result.error.message || t('reminder.error.updateTemplateFailed'));
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
        handleError(result.error.message || t('reminder.error.deleteTemplateFailed'));
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
        await reloadReminderScene();
        return result.data;
      }
      handleError(result.error.message || t('reminder.error.toggleTemplateFailed'));
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
        await reloadReminderScene();
        return result.data;
      }
      handleError(result.error.message || t('reminder.error.moveTemplateFailed'));
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
      let result = await service.getReminderGroups();

      if (!result.ok && (await maybeRecoverAuth(result.error))) {
        result = await service.getReminderGroups();
      }

      if (result.ok) {
        store.setGroups(result.data ?? []);
      } else {
        handleError(result.error.message || t('reminder.error.loadGroupsFailed'));
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
        handleError(result.error.message || t('reminder.error.createGroupFailed'));
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
        handleError(result.error.message || t('reminder.error.updateGroupFailed'));
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
        handleError(result.error.message || t('reminder.error.deleteGroupFailed'));
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
      handleError(result.error.message || t('reminder.error.toggleGroupFailed'));
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
      handleError(result.error.message || t('reminder.error.updateGroupFailed'));
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
    handleError(result.error.message || t('reminder.error.loadPreferencesFailed'));
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
      handleError(result.error.message || t('reminder.error.updatePreferencesFailed'));
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
