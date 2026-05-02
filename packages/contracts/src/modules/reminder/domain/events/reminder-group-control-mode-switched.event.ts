/**
 * Reminder Group Control Mode Switched Event.
 * 提醒分组控制模式切换事件。
 *
 * Triggered when a reminder group's control mode changes
 * (Individual <-> Group) via switchToGroupControl() / switchToIndividualControl().
 * 控制模式在 Individual 和 Group 之间切换时触发。
 */
export interface ReminderGroupControlModeSwitchedEvent {
  identityId: string;
  groupId: string;
  previousMode: string;
  newMode: string;
}
