/**
 * NotificationTemplate 聚合根实现
 * 通知模板聚合根 - 服务端实现
 */

import type { NotificationTemplateId } from '@dailyuse/contracts/primitives';
import { NotificationCategory, NotificationType } from '@dailyuse/contracts/notification';
import { AggregateRoot, createLogger } from '@dailyuse/utils';
import { NotificationTemplateId as NotificationTemplateIdType } from '@/domain-shared';
import {
  NotificationTemplateConfig,
  type NotificationTemplateConfigServerDTO,
  type TemplateContent,
  type EmailTemplateContent,
  type PushTemplateContent,
} from '../value-objects/NotificationTemplateConfig';

const logger = createLogger('NotificationTemplate');

// ============ 本地 DTO 定义 ============
// 这些类型应该移到 @dailyuse/contracts/notification 中

/**
 * NotificationTemplate Server DTO
 */
export interface NotificationTemplateServerDTO {
  id: NotificationTemplateId;
  name: string;
  description: string | null;
  type: NotificationType;
  category: NotificationCategory;
  template: NotificationTemplateConfigServerDTO;
  isActive: boolean;
  isSystemTemplate: boolean;
  createdAt: number; // TransferDate
  updatedAt: number; // TransferDate
}

/**
 * NotificationTemplate Persistence DTO
 */
export interface NotificationTemplatePersistenceDTO {
  id: NotificationTemplateId;
  name: string;
  description: string | null;
  type: NotificationType;
  category: NotificationCategory;
  isActive: boolean;
  isSystemTemplate: boolean;
  createdAt: Date;
  updatedAt: Date;

  // Flattened template config for DB storage
  templateTitle: string;
  templateContent: string;
  templateVariables?: string | null; // JSON string
  templateLayout?: string | null;
  templateStyle?: string | null;

  // Email specific
  templateEmailSubject?: string | null;
  templateEmailHtmlBody?: string | null;
  templateEmailTextBody?: string | null;

  // Push specific
  templatePushTitle?: string | null;
  templatePushBody?: string | null;
  templatePushIcon?: string | null;
  templatePushSound?: string | null;
}

/**
 * NotificationTemplate Server Interface
 */
export interface NotificationTemplateServer {
  readonly id: NotificationTemplateId;
  readonly name: string;
  readonly description: string | null;
  readonly type: NotificationType;
  readonly category: NotificationCategory;
  readonly template: NotificationTemplateConfigServerDTO;
  readonly isActive: boolean;
  readonly isSystemTemplate: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  activate(): void;
  deactivate(): void;
  updateTemplate(template: Partial<NotificationTemplateConfigServerDTO>): void;
  render(variables: Record<string, unknown>): { title: string; content: string };
  renderEmail(variables: Record<string, unknown>): { subject: string; htmlBody: string; textBody?: string };
  renderPush(variables: Record<string, unknown>): { title: string; body: string };
  validateVariables(variables: Record<string, unknown>): { isValid: boolean; missingVariables: string[] };
  toServerDTO(): NotificationTemplateServerDTO;
  toPersistenceDTO(): NotificationTemplatePersistenceDTO;
}

/**
 * NotificationTemplate 聚合根
 * 负责通知模板的创建、更新和管理
 */
export class NotificationTemplate
  extends AggregateRoot<NotificationTemplateId>
  implements NotificationTemplateServer
{
  // ===== 私有字段 =====
  private _name: string;
  private _description: string | null;
  private _type: NotificationType;
  private _category: NotificationCategory;
  private _template: NotificationTemplateConfig;
  private _isActive: boolean;
  private _isSystemTemplate: boolean;
  private _createdAt: Date;
  private _updatedAt: Date;

  // ===== 构造函数（私有） =====
  private constructor(
    id: NotificationTemplateId,
    params: {
      name: string;
      description: string | null;
      type: NotificationType;
      category: NotificationCategory;
      template: NotificationTemplateConfig;
      isActive: boolean;
      isSystemTemplate: boolean;
      createdAt: Date;
      updatedAt: Date;
    },
  ) {
    super(id);
    this._name = params.name;
    this._description = params.description;
    this._type = params.type;
    this._category = params.category;
    this._template = params.template;
    this._isActive = params.isActive;
    this._isSystemTemplate = params.isSystemTemplate;
    this._createdAt = params.createdAt;
    this._updatedAt = params.updatedAt;
  }

  // ===== Getter 属性 =====
  public get name(): string {
    return this._name;
  }

  public get description(): string | null {
    return this._description;
  }

  public get type(): NotificationType {
    return this._type;
  }

  public get category(): NotificationCategory {
    return this._category;
  }

  public get template(): NotificationTemplateConfigServerDTO {
    return this._template.toContract();
  }

  public get isActive(): boolean {
    return this._isActive;
  }

  public get isSystemTemplate(): boolean {
    return this._isSystemTemplate;
  }

  public get createdAt(): Date {
    return this._createdAt;
  }

  public get updatedAt(): Date {
    return this._updatedAt;
  }

  // ===== 业务方法 =====

  /**
   * 激活模板
   */
  public activate(): void {
    if (this._isActive) return;
    this._isActive = true;
    this._updatedAt = new Date();
    logger.info('✅ [聚合根] 模板已激活', { id: String(this.id) });
  }

  /**
   * 停用模板
   */
  public deactivate(): void {
    if (!this._isActive) return;
    this._isActive = false;
    this._updatedAt = new Date();
    logger.info('✅ [聚合根] 模板已停用', { id: String(this.id) });
  }

  /**
   * 更新模板配置
   */
  public updateTemplate(template: Partial<NotificationTemplateConfigServerDTO>): void {
    const current = this._template.toContract();
    const updated = { ...current, ...template };
    this._template = NotificationTemplateConfig.fromContract(updated);
    this._updatedAt = new Date();
    logger.info('✅ [聚合根] 模板配置已更新', { id: String(this.id) });
  }

  /**
   * 渲染模板
   */
  public render(variables: Record<string, unknown>): { title: string; content: string } {
    return this._template.render(variables);
  }

  /**
   * 渲染邮件模板
   */
  public renderEmail(variables: Record<string, unknown>): {
    subject: string;
    htmlBody: string;
    textBody?: string;
  } {
    const emailTemplate = this._template.emailTemplate;
    if (!emailTemplate) {
      throw new Error('该模板未配置邮件模板');
    }

    let subject = emailTemplate.subject;
    let htmlBody = emailTemplate.htmlBody ?? '';
    let textBody = emailTemplate.textBody ?? undefined;

    // 替换变量
    for (const [key, value] of Object.entries(variables)) {
      const pattern = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      subject = subject.replace(pattern, String(value ?? ''));
      htmlBody = htmlBody.replace(pattern, String(value ?? ''));
      if (textBody !== undefined) {
        textBody = textBody.replace(pattern, String(value ?? ''));
      }
    }

    return { subject, htmlBody, textBody };
  }

  /**
   * 渲染推送模板
   */
  public renderPush(variables: Record<string, unknown>): { title: string; body: string } {
    const pushTemplate = this._template.pushTemplate;
    if (!pushTemplate) {
      throw new Error('该模板未配置推送模板');
    }

    let title = pushTemplate.title;
    let body = pushTemplate.body;

    // 替换变量
    for (const [key, value] of Object.entries(variables)) {
      const pattern = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      title = title.replace(pattern, String(value ?? ''));
      body = body.replace(pattern, String(value ?? ''));
    }

    return { title, body };
  }

  /**
   * 验证变量是否满足模板要求
   */
  public validateVariables(variables: Record<string, unknown>): {
    isValid: boolean;
    missingVariables: string[];
  } {
    return this._template.validateVariables(variables);
  }

  // ===== 转换方法 =====

  public toServerDTO(): NotificationTemplateServerDTO {
    return {
      id: String(this.id) as NotificationTemplateId,
      name: this._name,
      description: this._description,
      type: this._type,
      category: this._category,
      template: this._template.toContract(),
      isActive: this._isActive,
      isSystemTemplate: this._isSystemTemplate,
      createdAt: this._createdAt.getTime(),
      updatedAt: this._updatedAt.getTime(),
    };
  }

  public toPersistenceDTO(): NotificationTemplatePersistenceDTO {
    const templateDTO = this._template.toContract();
    return {
      id: String(this.id) as NotificationTemplateId,
      name: this._name,
      description: this._description,
      type: this._type,
      category: this._category,
      isActive: this._isActive,
      isSystemTemplate: this._isSystemTemplate,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,

      // Flattened template config
      templateTitle: templateDTO.template.title,
      templateContent: templateDTO.template.content,
      templateVariables: templateDTO.template.variables
        ? JSON.stringify(templateDTO.template.variables)
        : null,
      templateLayout: null,
      templateStyle: null,

      // Email specific
      templateEmailSubject: templateDTO.emailTemplate?.subject ?? null,
      templateEmailHtmlBody: templateDTO.emailTemplate?.htmlBody ?? null,
      templateEmailTextBody: templateDTO.emailTemplate?.textBody ?? null,

      // Push specific
      templatePushTitle: templateDTO.pushTemplate?.title ?? null,
      templatePushBody: templateDTO.pushTemplate?.body ?? null,
      templatePushIcon: templateDTO.pushTemplate?.icon ?? null,
      templatePushSound: templateDTO.pushTemplate?.sound ?? null,
    };
  }

  // ===== 静态工厂方法 =====

  public static create(params: {
    name: string;
    type: NotificationType;
    category: NotificationCategory;
    template: NotificationTemplateConfigServerDTO;
    description?: string | null;
    isSystemTemplate?: boolean;
  }): NotificationTemplate {
    logger.info('🔨 [聚合根] 创建 NotificationTemplate 实例', {
      name: params.name,
      type: params.type,
      category: params.category,
    });

    const id = NotificationTemplateIdType.of(NotificationTemplateIdType.generate());
    const now = new Date();

    const template = new NotificationTemplate(id, {
      name: params.name,
      description: params.description ?? null,
      type: params.type,
      category: params.category,
      template: NotificationTemplateConfig.fromContract(params.template),
      isActive: true,
      isSystemTemplate: params.isSystemTemplate ?? false,
      createdAt: now,
      updatedAt: now,
    });

    logger.info('✅ [聚合根] NotificationTemplate 实例已创建', { id: String(id) });
    return template;
  }

  public static fromServerDTO(dto: NotificationTemplateServerDTO): NotificationTemplate {
    const id = NotificationTemplateIdType.of(dto.id);

    return new NotificationTemplate(id, {
      name: dto.name,
      description: dto.description,
      type: dto.type,
      category: dto.category,
      template: NotificationTemplateConfig.fromContract(dto.template),
      isActive: dto.isActive,
      isSystemTemplate: dto.isSystemTemplate,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
    });
  }

  public static fromPersistenceDTO(dto: NotificationTemplatePersistenceDTO): NotificationTemplate {
    const id = NotificationTemplateIdType.of(dto.id);

    const template: TemplateContent = {
      title: dto.templateTitle,
      content: dto.templateContent,
      variables: dto.templateVariables ? JSON.parse(dto.templateVariables) : [],
    };

    const emailTemplate: EmailTemplateContent | null =
      dto.templateEmailSubject && dto.templateEmailHtmlBody
        ? {
            subject: dto.templateEmailSubject,
            htmlBody: dto.templateEmailHtmlBody,
            textBody: dto.templateEmailTextBody,
          }
        : null;

    const pushTemplate: PushTemplateContent | null =
      dto.templatePushTitle && dto.templatePushBody
        ? {
            title: dto.templatePushTitle,
            body: dto.templatePushBody,
            icon: dto.templatePushIcon,
            sound: dto.templatePushSound,
          }
        : null;

    const templateConfigDTO: NotificationTemplateConfigServerDTO = {
      template,
      channels: {
        inApp: true,
        email: !!emailTemplate,
        push: !!pushTemplate,
        sms: false,
      },
      emailTemplate,
      pushTemplate,
    };

    return new NotificationTemplate(id, {
      name: dto.name,
      description: dto.description,
      type: dto.type,
      category: dto.category,
      template: NotificationTemplateConfig.fromContract(templateConfigDTO),
      isActive: dto.isActive,
      isSystemTemplate: dto.isSystemTemplate,
      createdAt: dto.createdAt instanceof Date ? dto.createdAt : new Date(dto.createdAt),
      updatedAt: dto.updatedAt instanceof Date ? dto.updatedAt : new Date(dto.updatedAt),
    });
  }
}
