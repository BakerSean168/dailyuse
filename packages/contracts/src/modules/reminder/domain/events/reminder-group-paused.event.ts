/**
 * Reminder Group Paused Event.
 * 提醒分组暂停事件。
 *
 * Triggered when a reminder group is paused via ReminderGroup.pause().
 * ReminderGroup.pause() 调用后触发。
 */
export interface ReminderGroupPausedEvent {
  identityId: string;
  groupId: string;
}
