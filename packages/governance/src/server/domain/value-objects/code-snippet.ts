/**
 * CodeSnippet 值对象
 *
 * 【规范说明：Class 类型值对象 - 参考 domain-shared-class-value-object-spec.md】
 *
 * 代码示例片段：用于展示 Good/Bad 代码示例
 * - 支持多种编程语言
 * - 限制内容大小（最大 10KB）
 * - 可选标题说明
 * 不可变性（所有修改返回新实例）
 */

import { ValueObject } from '@dailyuse/utils/domain';
import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';
import type { CodeSnippetDTO } from '@dailyuse/contracts/governance';
import type { CodeSnippetId } from '@dailyuse/contracts/governance';

// ============ Persistence DTO (持久化层) ============

/**
 * CodeSnippet Persistence DTO — database storage format.
 * 代码片段持久化 DTO — 数据库存储格式。
 *
 * @internal Repository implementation detail. Consumers should use CodeSnippetDTO.
 * @internal 仓储实现细节，消费者应使用 CodeSnippetDTO。
 */
export interface CodeSnippetPersistenceDTO {
  id: string;
  language: string;
  content: string;
  type: string;
  caption: string | null;
}
import { Language, type Language as LanguageValue } from './language';
import { SnippetType, type SnippetType as SnippetTypeValue } from './snippet-type';

const MAX_CONTENT_SIZE = 10 * 1024; // 10KB
const MAX_CAPTION_LENGTH = 200;

/**
 * 内部 Props 接口
 * 用于值对象内部存储
 */
interface CodeSnippetProps {
  id: CodeSnippetId;
  language: LanguageValue;
  content: string;
  type: SnippetTypeValue;
  caption: string | null;
}

/**
 * CodeSnippet 值对象实现
 *
 * 包含：
 * - id: 代码片段 ID
 * - language: 编程语言
 * - content: 代码内容（最大 10KB）
 * - type: 片段类型（GoodExample/BadExample）
 * - caption: 标题说明（可选，最大 200 字符）
  * @param props - 
 */
export class CodeSnippet extends ValueObject<CodeSnippetProps> {
  private constructor(props: CodeSnippetProps) {
    super(props);
  }

  // ================= 工厂方法 1: 标准创建 =================
  /**
   * 创建新的代码片段（包含校验）
   *
   * @param props - 代码片段属性（id 可选，自动生成）
   * @returns Result<CodeSnippet> 成功或带验证错误
   */
  public static create(
    props: Omit<CodeSnippetDTO, 'id'> & { id?: CodeSnippetId },
  ): Result<CodeSnippet> {
    const languageResult = Language.create(props.language);
    if (!languageResult.ok) {
      return error(
        languageResult.error.code,
        languageResult.error.message,
        languageResult.error.details,
      );
    }

    const snippetTypeResult = SnippetType.create(props.type);
    if (!snippetTypeResult.ok) {
      return error(
        snippetTypeResult.error.code,
        snippetTypeResult.error.message,
        snippetTypeResult.error.details,
      );
    }

    const fullProps: CodeSnippetProps = {
      id: (props.id || crypto.randomUUID()) as CodeSnippetId,
      language: languageResult.data,
      content: props.content,
      type: snippetTypeResult.data,
      caption: props.caption ?? null,
    };

    const validationResult = this.validate(fullProps);
    if (!validationResult.ok) {
      return error(
        validationResult.error.code,
        validationResult.error.message,
        validationResult.error.details,
      );
    }

    return ok(new CodeSnippet(fullProps));
  }

  // ================= 工厂方法 2: 从 DTO 恢复 =================
  /**
   * Restores a CodeSnippet from a transfer DTO (with validation via Result).
   * 从传输 DTO 恢复值对象（通过 Result 进行校验）。
   *
   * Used when hydrating from API responses or client-side data.
   * 用于从 API 响应或客户端数据还原对象。
   */
  public static fromDTO(dto: CodeSnippetDTO): Result<CodeSnippet> {
    const languageResult = Language.create(dto.language);
    if (!languageResult.ok) {
      return error(
        languageResult.error.code,
        languageResult.error.message,
        languageResult.error.details,
      );
    }

    const snippetTypeResult = SnippetType.create(dto.type);
    if (!snippetTypeResult.ok) {
      return error(
        snippetTypeResult.error.code,
        snippetTypeResult.error.message,
        snippetTypeResult.error.details,
      );
    }

    return ok(
      new CodeSnippet({
        ...dto,
        language: languageResult.data,
        type: snippetTypeResult.data,
      }),
    );
  }

  // ================= 工厂方法 3: 从持久化 DTO 恢复 =================
  /**
   * Restores a CodeSnippet from a persistence DTO (with validation via Result).
   * 从数据库持久化 DTO 恢复值对象（通过 Result 进行校验）。
   */
  public static fromPersistenceDTO(dto: CodeSnippetPersistenceDTO): Result<CodeSnippet> {
    const languageResult = Language.create(dto.language);
    if (!languageResult.ok) {
      return error(
        languageResult.error.code,
        languageResult.error.message,
        languageResult.error.details,
      );
    }

    const snippetTypeResult = SnippetType.create(dto.type);
    if (!snippetTypeResult.ok) {
      return error(
        snippetTypeResult.error.code,
        snippetTypeResult.error.message,
        snippetTypeResult.error.details,
      );
    }

    return ok(
      new CodeSnippet({
        id: dto.id as CodeSnippetId,
        language: languageResult.data,
        content: dto.content,
        type: snippetTypeResult.data,
        caption: dto.caption,
      }),
    );
  }

  // ================= 内部校验逻辑 =================
  /**
   * 集中校验逻辑
   */
  private static validate(props: CodeSnippetProps): Result<true> {
    // 验证内容不为空
    if (props.content.trim().length === 0) {
      return error('VALIDATION_ERROR', 'Code snippet content cannot be empty');
    }

    // 验证内容大小（最大 10KB）
    const contentBytes = new Blob([props.content]).size;
    if (contentBytes > MAX_CONTENT_SIZE) {
      return error(
        'VALIDATION_ERROR',
        `Code snippet exceeds maximum size of 10KB (current: ${(contentBytes / 1024).toFixed(2)}KB)`,
      );
    }

    // 验证标题长度（可选，但有长度限制）
    if (props.caption && props.caption.length > MAX_CAPTION_LENGTH) {
      return error(
        'VALIDATION_ERROR',
        `Caption exceeds maximum length of ${MAX_CAPTION_LENGTH} characters`,
      );
    }

    return ok(true);
  }

  // ================= Getters（只读暴露）=================

  public get id(): CodeSnippetId {
    return this.props.id;
  }

  public get language(): LanguageValue {
    return this.props.language;
  }

  public get content(): string {
    return this.props.content;
  }

  public get type(): SnippetTypeValue {
    return this.props.type;
  }

  public get caption(): string | null {
    return this.props.caption;
  }

  // ================= 计算属性（Rich Logic）=================

  /**
   * 是否有标题
   */
  public get hasCaption(): boolean {
    return this.props.caption !== null && this.props.caption.length > 0;
  }

  /**
   * 获取内容大小（字节）
   */
  public get contentSize(): number {
    return new Blob([this.props.content]).size;
  }

  /**
   * 获取内容大小（KB）
   */
  public get contentSizeInKB(): number {
    return this.contentSize / 1024;
  }

  /**
   * 获取内容行数
   */
  public get lineCount(): number {
    return this.props.content.split('\n').length;
  }

  /**
   * 是否为 Good Example
   */
  public get isGoodExample(): boolean {
    return this.props.type === SnippetType.GoodExample;
  }

  /**
   * 是否为 Bad Example
   */
  public get isBadExample(): boolean {
    return this.props.type === SnippetType.BadExample;
  }

  /**
   * 获取类型显示文本
   */
  public getTypeDisplayText(): string {
    return this.isGoodExample ? '✓ Good Example' : '✗ Bad Example';
  }

  // ================= 行为方法（不可变变更）=================

  /**
   * 更新内容
   */
  public updateContent(content: string): Result<CodeSnippet> {
    return CodeSnippet.create({
      ...this.props,
      content,
    });
  }

  /**
   * 更新标题
   */
  public updateCaption(caption: string | null): Result<CodeSnippet> {
    return CodeSnippet.create({
      ...this.props,
      caption,
    });
  }

  /**
   * 更新语言
   */
  public updateLanguage(language: LanguageValue): Result<CodeSnippet> {
    return CodeSnippet.create({
      ...this.props,
      language,
    });
  }

  // ================= 序列化方法 =================

  /**
   * 转换为 DTO（用于 API 传输或前端展示）
   */
  public toDTO(): CodeSnippetDTO {
    return {
      id: this.props.id,
      language: this.props.language,
      content: this.props.content,
      type: this.props.type,
      caption: this.props.caption,
    };
  }

  /**
   * 转换为持久化 DTO（用于数据库存储）
   */
  public toPersistenceDTO(): CodeSnippetPersistenceDTO {
    return {
      id: this.props.id,
      language: this.props.language,
      content: this.props.content,
      type: this.props.type,
      caption: this.props.caption,
    };
  }
}

