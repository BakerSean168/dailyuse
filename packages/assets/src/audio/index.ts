/**
 * 音频资源导出
 *
 * 所有通知音效的统一导出
 */

export const audioAssetPaths = {
  alertSound: './notifications/alert.wav',
  defaultSound: './notifications/default.wav',
  errorSound: './notifications/error.wav',
  notificationSound: './notifications/notification.wav',
  reminderSound: './notifications/reminder.wav',
  successSound: './notifications/success.wav',
} as const;

export type AudioAssetKey = keyof typeof audioAssetPaths;

// 通知音效
export const alertSound = new URL(audioAssetPaths.alertSound, import.meta.url).href;
export const defaultSound = new URL(audioAssetPaths.defaultSound, import.meta.url).href;
export const errorSound = new URL(audioAssetPaths.errorSound, import.meta.url).href;
export const notificationSound = new URL(audioAssetPaths.notificationSound, import.meta.url).href;
export const reminderSound = new URL(audioAssetPaths.reminderSound, import.meta.url).href;
export const successSound = new URL(audioAssetPaths.successSound, import.meta.url).href;

// 导出所有音效作为对象（可选）
export const sounds = {
  alert: alertSound,
  default: defaultSound,
  error: errorSound,
  notification: notificationSound,
  reminder: reminderSound,
  success: successSound,
} as const;

// 导出类型
export type SoundType = keyof typeof sounds;
