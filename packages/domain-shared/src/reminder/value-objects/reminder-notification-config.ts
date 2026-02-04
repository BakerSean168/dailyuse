/**
 * ReminderNotificationConfig 值对象
 * 
 * 提醒通知配置：渠道、标题、声音、震动等
 * 不可变性（所有修改返回新实例）
 */

import { ValueObject } from '@dailyuse/utils';
import type {
  INotificationConfigServer,
  NotificationConfigServerDTO,
  NotificationChannel,
  SoundConfig,
  VibrationConfig,
  NotificationActionConfig,
} from '@dailyuse/contracts/reminder';

/**
 * ReminderNotificationConfig 值对象实现
 */
export class ReminderNotificationConfig extends ValueObject<NotificationConfigServerDTO> implements INotificationConfigServer {

  private constructor(props: NotificationConfigServerDTO) {
    super(props);
  }

  // ================= 工厂方法 =================
  
  public static create(props: NotificationConfigServerDTO): ReminderNotificationConfig {
    return new ReminderNotificationConfig(props);
  }

  public static createDefault(): ReminderNotificationConfig {
    return new ReminderNotificationConfig({
      channels: ['InApp'],
      title: null,
      body: null,
      sound: { enabled: true, soundName: null },
      vibration: { enabled: true, pattern: null },
      actions: null,
    });
  }

  public static fromDTO(dto: NotificationConfigServerDTO): ReminderNotificationConfig {
    return new ReminderNotificationConfig(dto);
  }

  // ================= Getters =================

  public get channels(): NotificationChannel[] {
    return [...this.props.channels];
  }

  public get title(): string | null {
    return this.props.title;
  }

  public get body(): string | null {
    return this.props.body;
  }

  public get sound(): SoundConfig | null {
    return this.props.sound !== null ? { ...this.props.sound } : null;
  }

  public get vibration(): VibrationConfig | null {
    return this.props.vibration !== null ? { ...this.props.vibration } : null;
  }

  public get actions(): NotificationActionConfig[] | null {
    return this.props.actions !== null ? [...this.props.actions] : null;
  }

  // ================= 行为方法 =================

  public with(
    updates: Partial<NotificationConfigServerDTO>,
  ): ReminderNotificationConfig {
    return new ReminderNotificationConfig({ ...this.props, ...updates });
  }

  public addChannel(channel: NotificationChannel): ReminderNotificationConfig {
    if (this.props.channels.includes(channel)) return this;
    return this.with({ channels: [...this.props.channels, channel] });
  }

  public removeChannel(channel: NotificationChannel): ReminderNotificationConfig {
    return this.with({ channels: this.props.channels.filter(c => c !== channel) });
  }

  public setTitle(title: string | null): ReminderNotificationConfig {
    return this.with({ title });
  }

  public setBody(body: string | null): ReminderNotificationConfig {
    return this.with({ body });
  }

  public enableSound(soundName?: string): ReminderNotificationConfig {
    return this.with({ sound: { enabled: true, soundName: soundName ?? null } });
  }

  public disableSound(): ReminderNotificationConfig {
    return this.with({ sound: { enabled: false, soundName: null } });
  }

  // ================= 计算属性 =================

  public get hasChannels(): boolean {
    return this.props.channels.length > 0;
  }

  public get hasSoundEnabled(): boolean {
    return this.props.sound?.enabled ?? false;
  }

  public get hasVibrationEnabled(): boolean {
    return this.props.vibration?.enabled ?? false;
  }

  public get hasActions(): boolean {
    return this.props.actions !== null && this.props.actions.length > 0;
  }

  public get channelsText(): string {
    const channelNames: Record<NotificationChannel, string> = {
      InApp: '应用内',
      Push: '推送',
      Email: '邮件',
      Sms: '短信',
    };
    return this.props.channels.map(c => channelNames[c] || c).join(' + ') || '无';
  }

  // ================= 序列化 =================

  public toServerDTO(): NotificationConfigServerDTO {
    return {
      channels: [...this.props.channels],
      title: this.props.title,
      body: this.props.body,
      sound: this.props.sound !== null ? { ...this.props.sound } : null,
      vibration: this.props.vibration !== null ? { ...this.props.vibration } : null,
      actions: this.props.actions !== null ? [...this.props.actions] : null,
    };
  }
}
