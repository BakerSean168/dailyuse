/**
 * NotificationTemplateConfig 值对象
 * 
 * 通知模板配置：模板内容、渠道配置、邮件模板、推送模板
 * 不可变性（所有修改返回新实例）
 * 
 * 注意：此值对象在 domain-server 中定义，因为相关类型接口
 * (NotificationTemplateConfigServer, TemplateContent, ChannelConfig 等)
 * 尚未在 @dailyuse/contracts/notification 中定义。
 */

import { ValueObject } from '@dailyuse/utils';
import type {
  TemplateContent,
  EmailTemplateContent,
  PushTemplateContent,
  ChannelConfig,
  NotificationTemplateConfigServerDTO,
} from '@dailyuse/contracts/notification';

/**
 * NotificationTemplateConfig Server Interface
 */
export interface NotificationTemplateConfigServer {
  template: TemplateContent;
  channels: ChannelConfig;
  emailTemplate: EmailTemplateContent | null;
  pushTemplate: PushTemplateContent | null;
  
  render(variables: Record<string, unknown>): { title: string; content: string };
  validateVariables(variables: Record<string, unknown>): {
    isValid: boolean;
    missingVariables: string[];
  };
  toContract(): NotificationTemplateConfigServerDTO;
}

/**
 * NotificationTemplateConfig 值对象实现
 */
export class NotificationTemplateConfig
  extends ValueObject<NotificationTemplateConfigServerDTO>
  implements NotificationTemplateConfigServer
{
  private constructor(props: NotificationTemplateConfigServerDTO) {
    super(props);
  }

  // ================= 工厂方法 =================

  public static create(props: NotificationTemplateConfigServerDTO): NotificationTemplateConfig {
    return new NotificationTemplateConfig(props);
  }

  public static createDefault(): NotificationTemplateConfig {
    return new NotificationTemplateConfig({
      template: {
        title: '',
        content: '',
        variables: [],
      },
      channels: {
        inApp: true,
        email: false,
        push: false,
        sms: false,
      },
      emailTemplate: null,
      pushTemplate: null,
    });
  }

  public static fromContract(dto: NotificationTemplateConfigServerDTO): NotificationTemplateConfig {
    return new NotificationTemplateConfig({
      template: dto.template,
      channels: dto.channels,
      emailTemplate: dto.emailTemplate ?? null,
      pushTemplate: dto.pushTemplate ?? null,
    });
  }

  // ================= Getters =================

  public get template(): TemplateContent {
    return this.props.template;
  }

  public get channels(): ChannelConfig {
    return this.props.channels;
  }

  public get emailTemplate(): EmailTemplateContent | null {
    return this.props.emailTemplate ?? null;
  }

  public get pushTemplate(): PushTemplateContent | null {
    return this.props.pushTemplate ?? null;
  }

  // ================= 业务方法 =================

  /**
   * 渲染模板
   */
  public render(variables: Record<string, unknown>): { title: string; content: string } {
    let title = this.template.title;
    let content = this.template.content;

    for (const [key, value] of Object.entries(variables)) {
      const pattern = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      title = title.replace(pattern, String(value ?? ''));
      content = content.replace(pattern, String(value ?? ''));
    }

    return { title, content };
  }

  /**
   * 验证变量是否满足模板要求
   */
  public validateVariables(variables: Record<string, unknown>): {
    isValid: boolean;
    missingVariables: string[];
  } {
    const requiredVariables = this.template.variables ?? [];
    const providedKeys = Object.keys(variables);
    const missingVariables = requiredVariables.filter((v) => !providedKeys.includes(v));

    return {
      isValid: missingVariables.length === 0,
      missingVariables,
    };
  }

  /**
   * 检查是否启用了指定渠道
   */
  public isChannelEnabled(channel: keyof ChannelConfig): boolean {
    return this.channels[channel];
  }

  /**
   * 获取已启用的渠道列表
   */
  public getEnabledChannels(): (keyof ChannelConfig)[] {
    const channels: (keyof ChannelConfig)[] = [];
    if (this.channels.inApp) channels.push('inApp');
    if (this.channels.email) channels.push('email');
    if (this.channels.push) channels.push('push');
    if (this.channels.sms) channels.push('sms');
    return channels;
  }

  // ================= 修改方法（返回新实例） =================

  /**
   * 更新模板内容
   */
  public withTemplate(template: Partial<TemplateContent>): NotificationTemplateConfig {
    return new NotificationTemplateConfig({
      ...this.props,
      template: { ...this.template, ...template },
    });
  }

  /**
   * 更新渠道配置
   */
  public withChannels(channels: Partial<ChannelConfig>): NotificationTemplateConfig {
    return new NotificationTemplateConfig({
      ...this.props,
      channels: { ...this.channels, ...channels },
    });
  }

  /**
   * 更新邮件模板
   */
  public withEmailTemplate(emailTemplate: EmailTemplateContent | null): NotificationTemplateConfig {
    return new NotificationTemplateConfig({
      ...this.props,
      emailTemplate,
    });
  }

  /**
   * 更新推送模板
   */
  public withPushTemplate(pushTemplate: PushTemplateContent | null): NotificationTemplateConfig {
    return new NotificationTemplateConfig({
      ...this.props,
      pushTemplate,
    });
  }

  // ================= 转换方法 =================

  public toContract(): NotificationTemplateConfigServerDTO {
    return {
      template: this.template,
      channels: this.channels,
      emailTemplate: this.emailTemplate,
      pushTemplate: this.pushTemplate,
    };
  }

  public toDTO(): NotificationTemplateConfigServerDTO {
    return this.toContract();
  }
}
