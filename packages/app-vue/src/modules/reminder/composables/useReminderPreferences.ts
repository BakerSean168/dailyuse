import type { UserReminderPreferencesClientDTO } from '@dailyuse/contracts/reminder';
import type { Result } from '@dailyuse/contracts/result';
import type { ReminderContext } from './useReminderContext';

type ReminderPreferencesCapableService = {
  getPreferences?: () => Promise<Result<UserReminderPreferencesClientDTO>>;
  updatePreferences?: (
    data: Record<string, unknown>,
  ) => Promise<Result<UserReminderPreferencesClientDTO>>;
};

export function useReminderPreferences(ctx: ReminderContext) {
  const { store, service, savingId, executeReminderOperation } = ctx;

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
        return result.data;
      }
      return null;
    } finally {
      savingId.value = null;
    }
  }

  return {
    fetchPreferences,
    updatePreferences,
  };
}
