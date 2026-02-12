/**
 * @deprecated This is a backward compatibility stub.
 */
import { ref, computed } from 'vue';

export function useReminderStatistics() {
  const todayReminders = ref(0);
  const unreadReminders = ref(0);
  return { todayReminders, unreadReminders };
}
