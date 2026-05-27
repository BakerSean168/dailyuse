import type {
  ControlMode,
  ReminderGroupClientDTO,
  ReminderGroupListRes,
  CreateReminderGroupReq,
  UpdateReminderGroupReq,
} from '@dailyuse/contracts/reminder';
import type { ReminderContext } from './useReminderContext';

export function useReminderGroups(ctx: ReminderContext) {
  const { store, service, savingId, executeReminderOperation } = ctx;

  async function fetchGroups() {
    store.setLoading(true);
    store.setError(null);
    try {
      const result = await executeReminderOperation<ReminderGroupListRes>(
        () => service.getReminderGroups() as Promise<any>,
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
        return result.data;
      }
      return null;
    } finally {
      savingId.value = null;
    }
  }

  return {
    fetchGroups,
    createGroup,
    updateGroup,
    deleteGroup,
    toggleGroup,
    switchGroupControlMode,
  };
}
