/**
 * ValidationRule 值对象
 * 
 * 验证规则：required、min/max、pattern、enum、custom
 * 不可变性（所有修改返回新实例）
 */

import { ValueObject } from '@dailyuse/utils/domain';
import type {
  ValidationRuleDTO,
  ValidationRule as IValidationRule,
} from '@dailyuse/contracts/setting';

/**
 * ValidationRule 值对象实现
 */
export class ValidationRule extends ValueObject<ValidationRuleDTO> implements IValidationRule {

  private constructor(props: ValidationRuleDTO) {
    super(props);
  }

  // ================= 工厂方法 =================
  
  public static create(props: ValidationRuleDTO): ValidationRule {
    return new ValidationRule(props);
  }

  public static createDefault(): ValidationRule {
    return new ValidationRule({
      required: false,
      min: null,
      max: null,
      pattern: null,
      enum: null,
      custom: null,
    });
  }

  public static createRequired(): ValidationRule {
    return new ValidationRule({
      required: true,
      min: null,
      max: null,
      pattern: null,
      enum: null,
      custom: null,
    });
  }

  public static fromDTO(dto: ValidationRuleDTO): ValidationRule {
    return new ValidationRule(dto);
  }

  // ================= Getters =================

  public get required(): boolean {
    return this.props.required;
  }

  public get min(): number | null {
    return this.props.min;
  }

  public get max(): number | null {
    return this.props.max;
  }

  public get pattern(): string | null {
    return this.props.pattern;
  }

  public get enum(): unknown[] | null {
    return this.props.enum !== null ? [...this.props.enum] : null;
  }

  public get custom(): string | null {
    return this.props.custom;
  }

  // ================= 行为方法 =================

  public with(
    updates: Partial<ValidationRuleDTO>,
  ): ValidationRule {
    return new ValidationRule({ ...this.props, ...updates });
  }

  public setRequired(required: boolean): ValidationRule {
    return this.with({ required });
  }

  public setRange(min: number | null, max: number | null): ValidationRule {
    return this.with({ min, max });
  }

  public setPattern(pattern: string | null): ValidationRule {
    return this.with({ pattern });
  }

  public setEnum(enumValues: unknown[] | null): ValidationRule {
    return this.with({ enum: enumValues });
  }

  // ================= 计算属性 =================

  public get hasRange(): boolean {
    return this.props.min !== null || this.props.max !== null;
  }

  public get hasPattern(): boolean {
    return this.props.pattern !== null;
  }

  public get hasEnum(): boolean {
    return this.props.enum !== null && this.props.enum.length > 0;
  }

  public get hasCustom(): boolean {
    return this.props.custom !== null;
  }

  public get isEmpty(): boolean {
    return (
      !this.props.required &&
      !this.hasRange &&
      !this.hasPattern &&
      !this.hasEnum &&
      !this.hasCustom
    );
  }

  // ================= 序列化 =================

  public toDTO(): ValidationRuleDTO {
    return {
      required: this.props.required,
      min: this.props.min,
      max: this.props.max,
      pattern: this.props.pattern,
      enum: this.props.enum !== null ? [...this.props.enum] : null,
      custom: this.props.custom,
    };
  }

}
