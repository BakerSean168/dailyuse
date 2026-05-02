/**
 * Reminder Group Enabled Event.
 * 提醒分组启用事件。
 *
 * Triggered when a reminder group is enabled via ReminderGroup.enable().
 * ReminderGroup.enable() 调用后触发。
 */
export interface ReminderGroupEnabledEvent {
  identityId: string;
  groupId: string;
}
