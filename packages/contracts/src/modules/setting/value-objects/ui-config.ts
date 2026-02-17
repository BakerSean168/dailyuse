/**
 * UIConfig Value Object
 * UI配置值对象
 */

// ============ DTO 定义 ============

/**
 * UIConfig DTO (Server)
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
  options: Array<{ label: string; value: any }> | null;
  min: number | null;
  max: number | null;
  step: number | null;
}

/**
 * UIConfig Client DTO
 */
export interface UIConfigClientDTO {
  inputType: string;
  label: string | null;
  placeholder: string | null;
  helpText: string | null;
  icon: string | null;
  order: number;
  visible: boolean;
  disabled: boolean;
  options: Array<{ label: string; value: any }> | null;
  min: number | null;
  max: number | null;
  step: number | null;
}

/**
 * UIConfig Persistence DTO
 */
export interface UIConfigPersistenceDTO {
  inputType: string;
  label: string | null;
  placeholder: string | null;
  helpText: string | null;
  icon: string | null;
  order: number;
  visible: boolean;
  disabled: boolean;
  options: string | null; // JSON string
  min: number | null;
  max: number | null;
  step: number | null;
}

// ============ 值对象接口 ============

/**
 * UIConfig 值对象接口 (Server)
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
  options: Array<{ label: string; value: any }> | null;
  min: number | null;
  max: number | null;
  step: number | null;
}

/**
 * UIConfig Client 值对象接口
 */
export interface UIConfigClient {
  inputType: string;
  label: string | null;
  placeholder: string | null;
  helpText: string | null;
  icon: string | null;
  order: number;
  visible: boolean;
  disabled: boolean;
  options: Array<{ label: string; value: any }> | null;
  min: number | null;
  max: number | null;
  step: number | null;
}



