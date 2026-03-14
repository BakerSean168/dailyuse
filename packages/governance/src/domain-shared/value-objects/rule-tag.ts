/**
 * RuleTag 值对象
 *
 * 【规范说明：Class 类型值对象 - 参考 domain-shared-class-value-object-spec.md】
 *
 * 规则标签：用于规则分类和检索
 * - 自动规范化为 lowercase-kebab-case
 * - 防止标签碎片化（" DDD " vs "ddd" vs "DDD"）
 * - 只允许小写字母、数字和连字符
 */

import { ValueObject } from '@dailyuse/utils';
import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';
import type { RuleTagDTO } from '../../contracts/value-objects/rule-tag';

/**
 * 内部 Props 接口
 * 用于值对象内部存储
 */
interface RuleTagProps {
  value: string;
}

/**
 * RuleTag 值对象实现
 *
 * 包含：
 * - value: 标签值（自动规范化为 lowercase-kebab-case）
 */
export class RuleTag extends ValueObject<RuleTagProps> {
  /**
   * Maximum allowed length for a tag value.
   * 标签值的最大允许长度。
   */
  private static readonly MAX_LENGTH = 50;

  private constructor(props: RuleTagProps) {
    super(props);
  }

  // ================= 工厂方法 1: 标准创建（带规范化）=================
  /**
   * 创建新的标签（自动规范化）
   *
   * @param raw - 原始标签输入（会自动规范化）
   * @example
   *   " My Tag " -> "my-tag"
   *   "DDD" -> "ddd"
   *   "value-object" -> "value-object"
   */
  public static create(raw: string): Result<RuleTag> {
    const normalized = raw.trim().toLowerCase().replace(/\s+/g, '-');

    const props: RuleTagProps = { value: normalized };

    const validationResult = RuleTag.validate(props);
    if (!validationResult.ok) {
      return error(
        validationResult.error.code,
        validationResult.error.message,
        validationResult.error.details,
      );
    }

    return ok(new RuleTag(props));
  }

  // ================= 工厂方法 2: 从 DTO 恢复 =================
  /**
   * 从 DTO 恢复值对象（不做规范化，假定已规范化）
   */
  public static fromDTO(dto: RuleTagDTO): RuleTag {
    return new RuleTag({ value: dto.value });
  }

  // ================= 内部校验逻辑 =================
  /**
   * 集中校验逻辑
   */
  private static validate(props: RuleTagProps): Result<true> {
    // 验证不为空
    if (props.value.length === 0) {
      return error('VALIDATION_ERROR', 'Tag cannot be empty');
    }

    // 验证最大长度
    if (props.value.length > RuleTag.MAX_LENGTH) {
      return error(
        'VALIDATION_ERROR',
        `Tag must not exceed ${RuleTag.MAX_LENGTH} characters (got ${props.value.length})`,
      );
    }

    // 验证格式（只允许小写字母、数字和连字符）
    if (!/^[a-z0-9-]+$/.test(props.value)) {
      return error(
        'VALIDATION_ERROR',
        'Tag must contain only lowercase letters, numbers, and hyphens',
      );
    }

    return ok(true);
  }

  // ================= Getters（只读暴露）=================

  public get value(): string {
    return this.props.value;
  }

  // ================= 计算属性（Rich Logic）=================

  /**
   * 获取标签长度
   */
  public get length(): number {
    return this.props.value.length;
  }

  /**
   * 检查是否包含指定文本
   */
  public contains(text: string): boolean {
    return this.props.value.includes(text.toLowerCase());
  }

  /**
   * 检查是否以指定文本开头
   */
  public startsWith(prefix: string): boolean {
    return this.props.value.startsWith(prefix.toLowerCase());
  }

  /**
   * 检查是否以指定文本结尾
   */
  public endsWith(suffix: string): boolean {
    return this.props.value.endsWith(suffix.toLowerCase());
  }

  // ================= 序列化方法 =================

  /**
   * 转换为 DTO（用于 API 传输或前端展示）
   */
  public toDTO(): RuleTagDTO {
    return {
      value: this.props.value,
    };
  }

  /**
   * 转换为字符串（便于直接使用）
   */
  public override toString(): string {
    return this.props.value;
  }
}
