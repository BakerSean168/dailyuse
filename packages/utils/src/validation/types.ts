/**
 * 表单校验规则系统 - 类型定义
 *
 * 设计目标：
 * 1. 框架无关性 - 核心逻辑与UI框架解耦
 * 2. 可扩展性 - 支持自定义规则和校验器
 * 3. 类型安全 - 完整的TypeScript支持
 * 4. 异步支持 - 支持异步校验
 * 5. 国际化 - 支持多语言错误信息
 */

// ===== 基础类型定义 =====

/**
 * 校验规则类型
 */
export type ValidatorType =
  | 'required'
  | 'minLength'
  | 'maxLength'
  | 'pattern'
  | 'email'
  | 'phone'
  | 'number'
  | 'min'
  | 'max'
  | 'range'
  | 'date'
  | 'dateRange'
  | 'url'
  | 'idCard'
  | 'custom'
  | 'async';

/**
 * 校验严重级别
 */
export type ValidationSeverity = 'error' | 'warning' | 'info';

/**
 * 校验时机
 */
export type ValidationTrigger = 'change' | 'blur' | 'submit' | 'manual';

/**
 * 校验结果
 */
export interface ValidationResult {
  /** 是否通过校验 */
  valid: boolean;
  /** 错误消息 */
  message?: string;
  /** 严重级别 */
  severity: ValidationSeverity;
  /** 字段名 */
  field?: string;
  /** 原始值 */
  value?: any;
  /** 校验规则名称 */
  rule?: string;
}

export type SyncValidationRuleExecutor = (
  value: any,
  formData: any,
  field: string,
) => ValidationResult | boolean | string;

export type AsyncValidationRuleExecutor = (
  value: any,
  formData: any,
  field: string,
) => Promise<ValidationResult | boolean | string>;

/**
 * 字段校验结果
 */
export interface FieldValidationResult {
  /** 字段名 */
  field: string;
  /** 是否通过校验 */
  valid: boolean;
  /** 校验结果列表 */
  results: ValidationResult[];
  /** 第一个错误消息 */
  firstError?: string;
  /** 所有错误消息 */
  errors: string[];
  /** 所有警告消息 */
  warnings: string[];
}

/**
 * 表单校验结果
 */
export interface FormValidationResult {
  /** 是否通过校验 */
  valid: boolean;
  /** 字段校验结果 */
  fields: Record<string, FieldValidationResult>;
  /** 所有错误 */
  errors: string[];
  /** 所有警告 */
  warnings: string[];
  /** 校验摘要 */
  summary: string;
}

// ===== 校验规则定义 =====

/**
 * 基础校验规则
 */
export interface BaseRule {
  /** 规则类型 */
  type: ValidatorType;
  /** 错误消息模板 */
  message?: string;
  /** 校验触发时机 */
  trigger?: ValidationTrigger[];
  /** 严重级别 */
  severity?: ValidationSeverity;
  /** 是否启用 */
  enabled?: boolean;
  /** 条件函数 - 返回false时跳过此规则 */
  condition?: (value: any, formData: any) => boolean;
  /** 规则执行函数；内置规则也可以直接携带 validator */
  validator?: SyncValidationRuleExecutor | AsyncValidationRuleExecutor;
}

/**
 * 必填规则
 */
export interface RequiredRule extends BaseRule {
  type: 'required';
  /** 允许空白字符 */
  allowWhitespace?: boolean;
}

/**
 * 长度规则
 */
export interface LengthRule extends BaseRule {
  type: 'minLength' | 'maxLength';
  /** 长度值 */
  length: number;
}

/**
 * 正则规则
 */
export interface PatternRule extends BaseRule {
  type: 'pattern';
  /** 正则表达式 */
  pattern: RegExp | string;
}

/**
 * 数值规则
 */
export interface NumberRule extends BaseRule {
  type: 'number' | 'min' | 'max';
  /** 数值 */
  value?: number;
  /** 是否允许小数 */
  allowDecimal?: boolean;
}

/**
 * 范围规则
 */
export interface RangeRule extends BaseRule {
  type: 'range' | 'dateRange';
  /** 最小值 */
  min?: number | Date;
  /** 最大值 */
  max?: number | Date;
}

/**
 * 其他内置规则
 */
export interface BuiltinValidatorRule extends BaseRule {
  type: 'email' | 'phone' | 'date' | 'url' | 'idCard';
  validator: SyncValidationRuleExecutor;
}

/**
 * 自定义规则
 */
export interface CustomRule extends BaseRule {
  type: 'custom';
  /** 校验函数 */
  validator: SyncValidationRuleExecutor;
}

/**
 * 异步规则
 */
export interface AsyncRule extends BaseRule {
  type: 'async';
  /** 异步校验函数 */
  validator: AsyncValidationRuleExecutor;
  /** 防抖延迟（毫秒） */
  debounce?: number;
  /** 取消前一个请求 */
  cancelPrevious?: boolean;
}

/**
 * 校验规则联合类型
 */
export type ValidationRule =
  | RequiredRule
  | LengthRule
  | PatternRule
  | NumberRule
  | RangeRule
  | BuiltinValidatorRule
  | CustomRule
  | AsyncRule;

// ===== 字段和表单定义 =====

/**
 * 字段配置
 */
export interface FieldConfig {
  /** 字段名 */
  name: string;
  /** 字段标签 */
  label?: string;
  /** 校验规则 */
  rules: ValidationRule[];
  /** 默认校验触发时机 */
  defaultTrigger?: ValidationTrigger[];
  /** 字段依赖 - 当这些字段变化时重新校验 */
  dependencies?: string[];
}

/**
 * 表单配置
 */
export interface FormConfig {
  /** 字段配置 */
  fields: FieldConfig[];
  /** 全局校验规则 */
  globalRules?: ValidationRule[];
  /** 默认校验触发时机 */
  defaultTrigger?: ValidationTrigger[];
  /** 国际化配置 */
  i18n?: I18nConfig;
}

/**
 * 国际化配置
 */
export interface I18nConfig {
  /** 当前语言 */
  locale: string;
  /** 消息模板 */
  messages: Record<string, Record<string, string>>;
}

// ===== 校验器接口 =====

/**
 * 字段校验器接口
 */
export interface IFieldValidator {
  /** 校验单个字段 */
  validateField(
    fieldName: string,
    value: any,
    formData: any,
    trigger?: ValidationTrigger,
  ): Promise<FieldValidationResult>;

  /** 添加规则 */
  addRule(fieldName: string, rule: ValidationRule): void;

  /** 移除规则 */
  removeRule(fieldName: string, ruleType: ValidatorType): void;

  /** 清空规则 */
  clearRules(fieldName?: string): void;
}

/**
 * 表单校验器接口
 */
export interface IFormValidator extends IFieldValidator {
  /** 校验整个表单 */
  validateForm(formData: any, trigger?: ValidationTrigger): Promise<FormValidationResult>;

  /** 校验多个字段 */
  validateFields(
    fieldNames: string[],
    formData: any,
    trigger?: ValidationTrigger,
  ): Promise<FormValidationResult>;

  /** 获取表单配置 */
  getConfig(): FormConfig;

  /** 更新配置 */
  updateConfig(config: Partial<FormConfig>): void;
}

// ===== 框架适配器接口 =====

/**
 * 框架适配器接口
 */
export interface IFrameworkAdapter<T = any> {
  /** 框架名称 */
  readonly frameworkName: string;

  /** 绑定到组件 */
  bind(component: T, config: FormConfig): void;

  /** 解绑 */
  unbind(component: T): void;

  /** 触发校验 */
  triggerValidation(component: T, trigger: ValidationTrigger): Promise<FormValidationResult>;

  /** 显示错误 */
  showErrors(component: T, results: FormValidationResult): void;

  /** 清除错误 */
  clearErrors(component: T, fieldNames?: string[]): void;
}

// ===== 事件系统 =====

/**
 * 校验事件类型
 */
export type ValidationEventType =
  | 'beforeValidate'
  | 'afterValidate'
  | 'validationStart'
  | 'validationEnd'
  | 'fieldChange'
  | 'formSubmit';

/**
 * 校验事件
 */
export interface ValidationEvent {
  /** 事件类型 */
  type: ValidationEventType;
  /** 字段名 */
  fieldName?: string;
  /** 字段值 */
  value?: any;
  /** 表单数据 */
  formData?: any;
  /** 校验结果 */
  result?: ValidationResult | FieldValidationResult | FormValidationResult;
  /** 时间戳 */
  timestamp: number;
}

/**
 * 事件监听器
 */
export type ValidationEventListener = (event: ValidationEvent) => void;

// ===== 工具类型 =====

/**
 * 提取表单字段类型
 */
export type FormFields<T> = {
  [K in keyof T]: T[K];
};

/**
 * 校验规则构建器类型
 */
export type RuleBuilder<T> = {
  [K in keyof T]: ValidationRule[];
};

/**
 * 条件校验函数
 */
export type ConditionalValidator<T> = (formData: T) => boolean;

// ===== 内置规则配置 =====

/**
 * 内置规则配置
 */
export interface BuiltinRulesConfig {
  email: {
    pattern: RegExp;
    message: string;
  };
  phone: {
    pattern: RegExp;
    message: string;
  };
  url: {
    pattern: RegExp;
    message: string;
  };
  idCard: {
    pattern: RegExp;
    message: string;
  };
}
