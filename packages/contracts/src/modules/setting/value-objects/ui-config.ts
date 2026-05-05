/**
 * UIConfig Value Object
 * UI配置值对象
 */

// ============ DTO 定义 ============

/**
 * UIConfig DTO
 */
export interface UIConfigDTO {
  inputType:
    | 'TEXT'
    | 'NUMBER'
    | 'SWITCH'
    | 'SELECT'
    | 'RADIO'
    | 'CHECKBOX'
    | 'SLIDER'
    | 'COLOR'
    | 'FILE';
  label: string | null;
  placeholder: string | null;
  helpText: string | null;
  icon: string | null;
  order: number;
  visible: boolean;
  disabled: boolean;
  options: Array<{ label: string; value: unknown }> | null;
  min: number | null;
  max: number | null;
  step: number | null;
}

// ============ 值对象接口 ============

/**
 * UIConfig 值对象接口
 */
export interface UIConfig {
  inputType:
    | 'TEXT'
    | 'NUMBER'
    | 'SWITCH'
    | 'SELECT'
    | 'RADIO'
    | 'CHECKBOX'
    | 'SLIDER'
    | 'COLOR'
    | 'FILE';
  label: string | null;
  placeholder: string | null;
  helpText: string | null;
  icon: string | null;
  order: number;
  visible: boolean;
  disabled: boolean;
  options: Array<{ label: string; value: unknown }> | null;
  min: number | null;
  max: number | null;
  step: number | null;
}
