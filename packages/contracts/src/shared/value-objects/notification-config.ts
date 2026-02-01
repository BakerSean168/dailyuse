import type { NotifyChannel } from './notify-channel';

/**
 * [Value Object] 通知配置
 * 描述 "触发后做什么"
 */
export interface NotificationConfig {
  enabled: boolean;
  
  // 覆盖默认文案 (可选)
  title?: string; 
  content?: string; 
  
  // 指定发送渠道 (如果为空，则使用用户全局设置)
  channels?: NotifyChannel[];
  
  // 动作链接 (点击通知跳转到哪里)
  clickAction?: string; // e.g. "app://task/123"
}

export interface NotificationConfigDTO {
  enabled: boolean;
  
  // 覆盖默认文案 (可选)
  title?: string; 
  content?: string; 
  
  // 指定发送渠道 (如果为空，则使用用户全局设置)
  channels?: NotifyChannel[];
  
  // 动作链接 (点击通知跳转到哪里)
  clickAction?: string; // e.g. "app://task/123"
}

export interface NotificationConfigPersistenceDTO {
  enabled: boolean;
  
  // 覆盖默认文案 (可选)
  title?: string; 
  content?: string; 
  
  // 指定发送渠道 (如果为空，则使用用户全局设置)
  channels?: NotifyChannel[];
  
  // 动作链接 (点击通知跳转到哪里)
  clickAction?: string; // e.g. "app://task/123"
}