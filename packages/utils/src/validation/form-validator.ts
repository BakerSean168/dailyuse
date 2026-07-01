import type {
  ValidationRule,
  ValidationResult,
  FieldValidationResult,
  FormValidationResult,
  ValidationTrigger,
  FieldConfig,
  FormConfig,
  IFormValidator,
  ValidationEventType,
  ValidationEvent,
  ValidationEventListener,
} from './types';

/**
 * 核心表单校验器
 * 框架无关的校验引擎
 */
export class FormValidator implements IFormValidator {
  private config: FormConfig;
  private eventListeners: Map<ValidationEventType, ValidationEventListener[]> = new Map();
  private pendingAsyncValidations: Map<string, AbortController> = new Map();

  constructor(config: FormConfig) {
    this.config = { ...config };
    this.initializeEventListeners();
  }

  /**
   * 初始化事件监听器
   */
  private initializeEventListeners(): void {
    const eventTypes: ValidationEventType[] = [
      'beforeValidate',
      'afterValidate',
      'validationStart',
      'validationEnd',
      'fieldChange',
      'formSubmit',
    ];

    eventTypes.forEach((type) => {
      this.eventListeners.set(type, []);
    });
  }

  /**
   * 添加事件监听器
   */
  addEventListener(type: ValidationEventType, listener: ValidationEventListener): void {
    const listeners = this.eventListeners.get(type) || [];
    listeners.push(listener);
    this.eventListeners.set(type, listeners);
  }

  /**
   * 移除事件监听器
   */
  removeEventListener(type: ValidationEventType, listener: ValidationEventListener): void {
    const listeners = this.eventListeners.get(type) || [];
    const index = listeners.indexOf(listener);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  }

  /**
   * 触发事件
   */
  private emitEvent(event: ValidationEvent): void {
    const listeners = this.eventListeners.get(event.type) || [];
    listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (error) {
        console.error(`Error in validation event listener for ${event.type}:`, error);
      }
    });
  }

  /**
   * 校验单个字段
   */
  async validateField(
    fieldName: string,
    value: any,
    formData: any,
    trigger: ValidationTrigger = 'change',
  ): Promise<FieldValidationResult> {
    const startTime = Date.now();

    // 触发校验开始事件
    this.emitEvent({
      type: 'validationStart',
      fieldName,
      value,
      formData,
      timestamp: startTime,
    });

    try {
      const fieldConfig = this.findFieldConfig(fieldName);
      if (!fieldConfig) {
        return this.createEmptyFieldResult(fieldName);
      }

      // 取消之前的异步校验
      this.cancelAsyncValidation(fieldName);

      // 过滤适用的规则
      const applicableRules = this.filterApplicableRules(fieldConfig.rules, trigger, formData);

      // 执行同步校验
      const syncResults = await this.executeSyncValidation(
        fieldName,
        value,
        formData,
        applicableRules.filter((rule) => rule.type !== 'async'),
      );

      // 执行异步校验
      const asyncResults = await this.executeAsyncValidation(
        fieldName,
        value,
        formData,
        applicableRules.filter((rule) => rule.type === 'async'),
      );

      // 合并结果
      const allResults = [...syncResults, ...asyncResults];
      const fieldResult = this.createFieldResult(fieldName, allResults);

      // 触发校验结束事件
      this.emitEvent({
        type: 'validationEnd',
        fieldName,
        value,
        formData,
        result: fieldResult,
        timestamp: Date.now(),
      });

      return fieldResult;
    } catch (error) {
      console.error(`Validation error for field ${fieldName}:`, error);
      return this.createErrorFieldResult(fieldName, 'Validation failed');
    }
  }

  /**
   * 校验多个字段
   */
  async validateFields(
    fieldNames: string[],
    formData: any,
    trigger: ValidationTrigger = 'change',
  ): Promise<FormValidationResult> {
    const fieldResults = await Promise.all(
      fieldNames.map((fieldName) =>
        this.validateField(fieldName, formData[fieldName], formData, trigger),
      ),
    );

    return this.createFormResult(fieldResults);
  }

  /**
   * 校验整个表单
   */
  async validateForm(
    formData: any,
    trigger: ValidationTrigger = 'submit',
  ): Promise<FormValidationResult> {
    const startTime = Date.now();

    // 触发表单校验开始事件
    this.emitEvent({
      type: 'beforeValidate',
      formData,
      timestamp: startTime,
    });

    try {
      const fieldNames = this.config.fields.map((field) => field.name);
      const result = await this.validateFields(fieldNames, formData, trigger);

      // 执行全局规则校验
      const globalResults = await this.executeGlobalValidation(formData, trigger);

      // 合并全局校验结果
      if (globalResults.length > 0) {
        result.errors.push(...globalResults.filter((r) => !r.valid).map((r) => r.message || ''));
        result.valid = result.valid && globalResults.every((r) => r.valid);
      }

      // 触发表单校验结束事件
      this.emitEvent({
        type: 'afterValidate',
        formData,
        result,
        timestamp: Date.now(),
      });

      return result;
    } catch (error) {
      console.error('Form validation error:', error);
      return this.createErrorFormResult('Form validation failed');
    }
  }

  /**
   * 添加字段规则
   */
  addRule(fieldName: string, rule: ValidationRule): void {
    const fieldConfig = this.findFieldConfig(fieldName);
    if (fieldConfig) {
      fieldConfig.rules.push(rule);
    } else {
      // 创建新的字段配置
      this.config.fields.push({
        name: fieldName,
        rules: [rule],
      });
    }
  }

  /**
   * 移除字段规则
   */
  removeRule(fieldName: string, ruleType: string): void {
    const fieldConfig = this.findFieldConfig(fieldName);
    if (fieldConfig) {
      fieldConfig.rules = fieldConfig.rules.filter((rule) => rule.type !== ruleType);
    }
  }

  /**
   * 清空规则
   */
  clearRules(fieldName?: string): void {
    if (fieldName) {
      const fieldConfig = this.findFieldConfig(fieldName);
      if (fieldConfig) {
        fieldConfig.rules = [];
      }
    } else {
      this.config.fields.forEach((field) => {
        field.rules = [];
      });
      this.config.globalRules = [];
    }
  }

  /**
   * 获取配置
   */
  getConfig(): FormConfig {
    return { ...this.config };
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<FormConfig>): void {
    this.config = { ...this.config, ...config };
  }

  // ===== 私有辅助方法 =====

  /**
   * 查找字段配置
   */
  private findFieldConfig(fieldName: string): FieldConfig | undefined {
    return this.config.fields.find((field) => field.name === fieldName);
  }

  /**
   * 过滤适用的规则
   */
  private filterApplicableRules(
    rules: ValidationRule[],
    trigger: ValidationTrigger,
    formData: any,
  ): ValidationRule[] {
    return rules.filter((rule) => {
      // 检查是否启用
      if (rule.enabled === false) {
        return false;
      }

      // 检查触发条件
      const triggers = rule.trigger || this.config.defaultTrigger || ['change'];
      if (!triggers.includes(trigger)) {
        return false;
      }

      // 检查条件函数
      if (rule.condition && !rule.condition(formData[trigger], formData)) {
        return false;
      }

      return true;
    });
  }

  /**
   * 执行同步校验
   */
  private async executeSyncValidation(
    fieldName: string,
    value: any,
    formData: any,
    rules: ValidationRule[],
  ): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];

    for (const rule of rules) {
      try {
        const result = await this.executeRule(rule, fieldName, value, formData);
        results.push(result);

        // 如果是错误且配置了遇到错误停止，则停止后续校验
        if (!result.valid && result.severity === 'error') {
          break;
        }
      } catch (error) {
        console.error(`Error executing rule ${rule.type} for field ${fieldName}:`, error);
        results.push({
          valid: false,
          message: 'Validation rule execution failed',
          severity: 'error',
          field: fieldName,
          value,
          rule: rule.type,
        });
      }
    }

    return results;
  }

  /**
   * 执行异步校验
   */
  private async executeAsyncValidation(
    fieldName: string,
    value: any,
    formData: any,
    rules: ValidationRule[],
  ): Promise<ValidationResult[]> {
    if (rules.length === 0) {
      return [];
    }

    const abortController = new AbortController();
    this.pendingAsyncValidations.set(fieldName, abortController);

    try {
      const results = await Promise.all(
        rules.map((rule) =>
          this.executeAsyncRule(rule, fieldName, value, formData, abortController.signal),
        ),
      );

      this.pendingAsyncValidations.delete(fieldName);
      return results.filter((result) => result !== null) as ValidationResult[];
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return []; // 校验被取消
      }

      console.error(`Async validation error for field ${fieldName}:`, error);
      return [
        {
          valid: false,
          message: 'Async validation failed',
          severity: 'error',
          field: fieldName,
          value,
          rule: 'async',
        },
      ];
    }
  }

  /**
   * 执行规则
   */
  private async executeRule(
    rule: ValidationRule,
    fieldName: string,
    value: any,
    formData: any,
  ): Promise<ValidationResult> {
    if ('validator' in rule && typeof rule.validator === 'function') {
      const result = await rule.validator(value, formData, fieldName);

      if (typeof result === 'boolean') {
        return {
          valid: result,
          message: !result ? rule.message : undefined,
          severity: rule.severity || 'error',
          field: fieldName,
          value,
          rule: rule.type,
        };
      }

      if (typeof result === 'string') {
        return {
          valid: false,
          message: result,
          severity: rule.severity || 'error',
          field: fieldName,
          value,
          rule: rule.type,
        };
      }

      // If result is ValidationResult, merge with field/value info
      return {
        ...result,
        field: fieldName,
        value,
        rule: rule.type,
      };
    }

    // 如果没有自定义validator，返回通过
    return {
      valid: true,
      severity: rule.severity || 'error',
      field: fieldName,
      value,
      rule: rule.type,
    };
  }

  /**
   * 执行异步规则
   */
  private async executeAsyncRule(
    rule: ValidationRule,
    fieldName: string,
    value: any,
    formData: any,
    signal: AbortSignal,
  ): Promise<ValidationResult | null> {
    if (rule.type !== 'async' || !('validator' in rule)) {
      return null;
    }

    // 防抖处理
    if ('debounce' in rule && rule.debounce && rule.debounce > 0) {
      await this.delay(rule.debounce);
      if (signal.aborted) {
        throw new Error('Validation aborted');
      }
    }

    const result = await rule.validator(value, formData, fieldName);

    if (typeof result === 'boolean') {
      return {
        valid: result,
        message: !result ? rule.message : undefined,
        severity: rule.severity || 'error',
        field: fieldName,
        value,
        rule: rule.type,
      };
    }

    if (typeof result === 'string') {
      return {
        valid: false,
        message: result,
        severity: rule.severity || 'error',
        field: fieldName,
        value,
        rule: rule.type,
      };
    }

    return result;
  }

  /**
   * 执行全局校验
   */
  private async executeGlobalValidation(
    formData: any,
    trigger: ValidationTrigger,
  ): Promise<ValidationResult[]> {
    if (!this.config.globalRules) {
      return [];
    }

    const results: ValidationResult[] = [];
    const applicableRules = this.filterApplicableRules(this.config.globalRules, trigger, formData);

    for (const rule of applicableRules) {
      try {
        const result = await this.executeRule(rule, 'form', formData, formData);
        results.push(result);
      } catch (error) {
        console.error(`Error executing global rule ${rule.type}:`, error);
        results.push({
          valid: false,
          message: 'Global validation rule execution failed',
          severity: 'error',
          field: 'form',
          value: formData,
          rule: rule.type,
        });
      }
    }

    return results;
  }

  /**
   * 取消异步校验
   */
  private cancelAsyncValidation(fieldName: string): void {
    const controller = this.pendingAsyncValidations.get(fieldName);
    if (controller) {
      controller.abort();
      this.pendingAsyncValidations.delete(fieldName);
    }
  }

  /**
   * 延迟函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * 创建字段结果
   */
  private createFieldResult(fieldName: string, results: ValidationResult[]): FieldValidationResult {
    const errors = results
      .filter((r) => !r.valid && r.severity === 'error')
      .map((r) => r.message || '');
    const warnings = results
      .filter((r) => !r.valid && r.severity === 'warning')
      .map((r) => r.message || '');

    return {
      field: fieldName,
      valid: results.every((r) => r.valid || r.severity !== 'error'),
      results,
      firstError: errors[0],
      errors,
      warnings,
    };
  }

  /**
   * 创建空的字段结果
   */
  private createEmptyFieldResult(fieldName: string): FieldValidationResult {
    return {
      field: fieldName,
      valid: true,
      results: [],
      errors: [],
      warnings: [],
    };
  }

  /**
   * 创建错误字段结果
   */
  private createErrorFieldResult(fieldName: string, error: string): FieldValidationResult {
    return {
      field: fieldName,
      valid: false,
      results: [
        {
          valid: false,
          message: error,
          severity: 'error',
          field: fieldName,
          rule: 'system',
        },
      ],
      firstError: error,
      errors: [error],
      warnings: [],
    };
  }

  /**
   * 创建表单结果
   */
  private createFormResult(fieldResults: FieldValidationResult[]): FormValidationResult {
    const fields: Record<string, FieldValidationResult> = {};
    const errors: string[] = [];
    const warnings: string[] = [];

    fieldResults.forEach((result) => {
      fields[result.field] = result;
      errors.push(...result.errors);
      warnings.push(...result.warnings);
    });

    const valid = fieldResults.every((result) => result.valid);

    return {
      valid,
      fields,
      errors,
      warnings,
      summary: valid ? 'Validation passed' : `${errors.length} error(s) found`,
    };
  }

  /**
   * 创建错误表单结果
   */
  private createErrorFormResult(error: string): FormValidationResult {
    return {
      valid: false,
      fields: {},
      errors: [error],
      warnings: [],
      summary: error,
    };
  }

  /**
   * 销毁校验器
   */
  destroy(): void {
    // 取消所有异步校验
    this.pendingAsyncValidations.forEach((controller) => controller.abort());
    this.pendingAsyncValidations.clear();

    // 清空事件监听器
    this.eventListeners.clear();
  }
}
