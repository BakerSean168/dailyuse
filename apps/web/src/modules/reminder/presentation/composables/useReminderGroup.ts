/**
 * @deprecated Use useReminder() instead. This is a backward compatibility shim.
 */
import { useReminder } from './useReminder';

export function useReminderGroup() {
  const reminder = useReminder();
  return {
    groups: reminder.groups,
    currentGroup: reminder.currentGroup,
    isLoading: reminder.isLoading,
    error: reminder.error,
    fetchGroups: reminder.fetchGroups,
    createGroup: reminder.createGroup,
    updateGroup: reminder.updateGroup,
    deleteGroup: reminder.deleteGroup,
  };
}
