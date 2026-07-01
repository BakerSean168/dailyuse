import type {
  ValidationRule,
  ValidationResult,
  FieldValidationResult,
  FormValidationResult,
  ValidationTrigger,
  ValidationSeverity,
  I18nConfig,
} from './types';

/**
 * 内置校验规则
 */
export class BuiltinValidators {
  private static i18n: I18nConfig = {
    locale: 'zh-CN',
    messages: {
      'zh-CN': {
        required: '{{field}}不能为空',
        minLength: '{{field}}长度不能少于{{length}}个字符',
        maxLength: '{{field}}长度不能超过{{length}}个字符',
        email: '请输入有效的邮箱地址',
        phone: '请输入有效的手机号码',
        number: '{{field}}必须是数字',
        min: '{{field}}不能小于{{value}}',
        max: '{{field}}不能大于{{value}}',
        range: '{{field}}必须在{{min}}到{{max}}之间',
        pattern: '{{field}}格式不正确',
        date: '请输入有效的日期',
        url: '请输入有效的URL地址',
        idCard: '请输入有效的身份证号码',
      },
      'en-US': {
        required: '{{field}} is required',
        minLength: '{{field}} must be at least {{length}} characters',
        maxLength: '{{field}} cannot exceed {{length}} characters',
        email: 'Please enter a valid email address',
        phone: 'Please enter a valid phone number',
        number: '{{field}} must be a number',
        min: '{{field}} cannot be less than {{value}}',
        max: '{{field}} cannot be greater than {{value}}',
        range: '{{field}} must be between {{min}} and {{max}}',
        pattern: '{{field}} format is incorrect',
        date: 'Please enter a valid date',
        url: 'Please enter a valid URL',
        idCard: 'Please enter a valid ID card number',
      },
    },
  };

  /**
   * 设置国际化配置
   */
  static setI18n(config: I18nConfig): void {
    this.i18n = { ...this.i18n, ...config };
  }

  /**
   * 获取错误消息
   */
  private static getMessage(
    key: string,
    params: Record<string, any> = {},
    field: string = '',
  ): string {
    const locale = this.i18n.locale;
    let template = this.i18n.messages[locale]?.[key] || this.i18n.messages['zh-CN'][key] || key;

    // 替换参数
    template = template.replace(/\{\{(\w+)\}\}/g, (match, paramKey) => {
      return params[paramKey]?.toString() || match;
    });

    // 替换字段名
    if (field) {
      template = template.replace(/\{\{field\}\}/g, field);
    }

    return template;
  }

  /**
   * 必填校验
   */
  static required(message?: string, allowWhitespace = false): ValidationRule {
    return {
      type: 'required',
      message,
      validator: (value: any, formData: any, field: string): ValidationResult => {
        const isEmpty =
          value === null ||
          value === undefined ||
          (typeof value === 'string' && (!allowWhitespace ? !value.trim() : !value)) ||
          (Array.isArray(value) && value.length === 0);

        return {
          valid: !isEmpty,
          message: isEmpty ? message || this.getMessage('required', {}, field) : undefined,
          severity: 'error' as ValidationSeverity,
          field,
          value,
          rule: 'required',
        };
      },
    };
  }

  /**
   * 最小长度校验
   */
  static minLength(length: number, message?: string): ValidationRule {
    return {
      type: 'minLength',
      length,
      message,
      validator: (value: any, formData: any, field: string): ValidationResult => {
        if (value === null || value === undefined) {
          return {
            valid: true,
            severity: 'error' as ValidationSeverity,
            field,
            value,
            rule: 'minLength',
          };
        }

        const strValue = String(value);
        const isValid = strValue.length >= length;

        return {
          valid: isValid,
          message: !isValid
            ? message || this.getMessage('minLength', { length }, field)
            : undefined,
          severity: 'error' as ValidationSeverity,
          field,
          value,
          rule: 'minLength',
        };
      },
    };
  }

  /**
   * 最大长度校验
   */
  static maxLength(length: number, message?: string): ValidationRule {
    return {
      type: 'maxLength',
      length,
      message,
      validator: (value: any, formData: any, field: string): ValidationResult => {
        if (value === null || value === undefined) {
          return {
            valid: true,
            severity: 'error' as ValidationSeverity,
            field,
            value,
            rule: 'maxLength',
          };
        }

        const strValue = String(value);
        const isValid = strValue.length <= length;

        return {
          valid: isValid,
          message: !isValid
            ? message || this.getMessage('maxLength', { length }, field)
            : undefined,
          severity: 'error' as ValidationSeverity,
          field,
          value,
          rule: 'maxLength',
        };
      },
    };
  }

  /**
   * 正则表达式校验
   */
  static pattern(pattern: RegExp | string, message?: string): ValidationRule {
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;

    return {
      type: 'pattern',
      pattern: regex,
      message,
      validator: (value: any, formData: any, field: string): ValidationResult => {
        if (value === null || value === undefined || value === '') {
          return {
            valid: true,
            severity: 'error' as ValidationSeverity,
            field,
            value,
            rule: 'pattern',
          };
        }

        const strValue = String(value);
        const isValid = regex.test(strValue);

        return {
          valid: isValid,
          message: !isValid ? message || this.getMessage('pattern', {}, field) : undefined,
          severity: 'error' as ValidationSeverity,
          field,
          value,
          rule: 'pattern',
        };
      },
    };
  }

  /**
   * 邮箱校验
   */
  static email(message?: string): ValidationRule {
    const emailRegex =
      /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

    return {
      type: 'email',
      message,
      validator: (value: any, formData: any, field: string): ValidationResult => {
        if (!value) {
          return {
            valid: true,
            severity: 'error' as ValidationSeverity,
            field,
            value,
            rule: 'email',
          };
        }

        const isValid = emailRegex.test(String(value));

        return {
          valid: isValid,
          message: !isValid ? message || this.getMessage('email', {}, field) : undefined,
          severity: 'error' as ValidationSeverity,
          field,
          value,
          rule: 'email',
        };
      },
    };
  }

  /**
   * 手机号校验
   */
  static phone(message?: string): ValidationRule {
    const phoneRegex = /^1[3-9]\d{9}$/;

    return {
      type: 'phone',
      message,
      validator: (value: any, formData: any, field: string): ValidationResult => {
        if (!value) {
          return {
            valid: true,
            severity: 'error' as ValidationSeverity,
            field,
            value,
            rule: 'phone',
          };
        }

        const isValid = phoneRegex.test(String(value).replace(/\D/g, ''));

        return {
          valid: isValid,
          message: !isValid ? message || this.getMessage('phone', {}, field) : undefined,
          severity: 'error' as ValidationSeverity,
          field,
          value,
          rule: 'phone',
        };
      },
    };
  }

  /**
   * 数字校验
   */
  static number(allowDecimal = true, message?: string): ValidationRule {
    return {
      type: 'number',
      allowDecimal,
      message,
      validator: (value: any, formData: any, field: string): ValidationResult => {
        if (value === null || value === undefined || value === '') {
          return {
            valid: true,
            severity: 'error' as ValidationSeverity,
            field,
            value,
            rule: 'number',
          };
        }

        const numValue = Number(value);
        const isValid = !isNaN(numValue) && (allowDecimal || Number.isInteger(numValue));

        return {
          valid: isValid,
          message: !isValid ? message || this.getMessage('number', {}, field) : undefined,
          severity: 'error' as ValidationSeverity,
          field,
          value,
          rule: 'number',
        };
      },
    };
  }

  /**
   * 最小值校验
   */
  static min(minValue: number, message?: string): ValidationRule {
    return {
      type: 'min',
      value: minValue,
      message,
      validator: (value: any, formData: any, field: string): ValidationResult => {
        if (value === null || value === undefined || value === '') {
          return {
            valid: true,
            severity: 'error' as ValidationSeverity,
            field,
            value,
            rule: 'min',
          };
        }

        const numValue = Number(value);
        const isValid = !isNaN(numValue) && numValue >= minValue;

        return {
          valid: isValid,
          message: !isValid
            ? message || this.getMessage('min', { value: minValue }, field)
            : undefined,
          severity: 'error' as ValidationSeverity,
          field,
          value,
          rule: 'min',
        };
      },
    };
  }

  /**
   * 最大值校验
   */
  static max(maxValue: number, message?: string): ValidationRule {
    return {
      type: 'max',
      value: maxValue,
      message,
      validator: (value: any, formData: any, field: string): ValidationResult => {
        if (value === null || value === undefined || value === '') {
          return {
            valid: true,
            severity: 'error' as ValidationSeverity,
            field,
            value,
            rule: 'max',
          };
        }

        const numValue = Number(value);
        const isValid = !isNaN(numValue) && numValue <= maxValue;

        return {
          valid: isValid,
          message: !isValid
            ? message || this.getMessage('max', { value: maxValue }, field)
            : undefined,
          severity: 'error' as ValidationSeverity,
          field,
          value,
          rule: 'max',
        };
      },
    };
  }

  /**
   * 范围校验
   */
  static range(min: number, max: number, message?: string): ValidationRule {
    return {
      type: 'range',
      min,
      max,
      message,
      validator: (value: any, formData: any, field: string): ValidationResult => {
        if (value === null || value === undefined || value === '') {
          return {
            valid: true,
            severity: 'error' as ValidationSeverity,
            field,
            value,
            rule: 'range',
          };
        }

        const numValue = Number(value);
        const isValid = !isNaN(numValue) && numValue >= min && numValue <= max;

        return {
          valid: isValid,
          message: !isValid ? message || this.getMessage('range', { min, max }, field) : undefined,
          severity: 'error' as ValidationSeverity,
          field,
          value,
          rule: 'range',
        };
      },
    };
  }

  /**
   * 自定义校验
   */
  static custom(
    validator: (value: any, formData: any, field: string) => ValidationResult | boolean | string,
    message?: string,
  ): ValidationRule {
    return {
      type: 'custom',
      message,
      validator: (value: any, formData: any, field: string): ValidationResult => {
        const result = validator(value, formData, field);

        if (typeof result === 'boolean') {
          return {
            valid: result,
            message: !result ? message : undefined,
            severity: 'error' as ValidationSeverity,
            field,
            value,
            rule: 'custom',
          };
        }

        if (typeof result === 'string') {
          return {
            valid: false,
            message: result,
            severity: 'error' as ValidationSeverity,
            field,
            value,
            rule: 'custom',
          };
        }

        return result;
      },
    };
  }

  /**
   * 异步校验
   */
  static async(
    validator: (
      value: any,
      formData: any,
      field: string,
    ) => Promise<ValidationResult | boolean | string>,
    debounce = 300,
    message?: string,
  ): ValidationRule {
    return {
      type: 'async',
      debounce,
      message,
      validator,
    };
  }

  /**
   * 日期校验
   */
  static date(message?: string): ValidationRule {
    return {
      type: 'date',
      message,
      validator: (value: any, formData: any, field: string): ValidationResult => {
        if (!value) {
          return {
            valid: true,
            severity: 'error' as ValidationSeverity,
            field,
            value,
            rule: 'date',
          };
        }

        const date = new Date(value);
        const isValid = date instanceof Date && !isNaN(date.getTime());

        return {
          valid: isValid,
          message: !isValid ? message || this.getMessage('date', {}, field) : undefined,
          severity: 'error' as ValidationSeverity,
          field,
          value,
          rule: 'date',
        };
      },
    };
  }

  /**
   * URL校验
   */
  static url(message?: string): ValidationRule {
    return {
      type: 'url',
      message,
      validator: (value: any, formData: any, field: string): ValidationResult => {
        if (!value) {
          return {
            valid: true,
            severity: 'error' as ValidationSeverity,
            field,
            value,
            rule: 'url',
          };
        }

        try {
          new URL(value);
          return {
            valid: true,
            severity: 'error' as ValidationSeverity,
            field,
            value,
            rule: 'url',
          };
        } catch {
          return {
            valid: false,
            message: message || this.getMessage('url', {}, field),
            severity: 'error' as ValidationSeverity,
            field,
            value,
            rule: 'url',
          };
        }
      },
    };
  }

  /**
   * 身份证校验
   */
  static idCard(message?: string): ValidationRule {
    const idCardRegex =
      /^[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/;

    return {
      type: 'idCard',
      message,
      validator: (value: any, formData: any, field: string): ValidationResult => {
        if (!value) {
          return {
            valid: true,
            severity: 'error' as ValidationSeverity,
            field,
            value,
            rule: 'idCard',
          };
        }

        const isValid = idCardRegex.test(String(value));

        return {
          valid: isValid,
          message: !isValid ? message || this.getMessage('idCard', {}, field) : undefined,
          severity: 'error' as ValidationSeverity,
          field,
          value,
          rule: 'idCard',
        };
      },
    };
  }
}
