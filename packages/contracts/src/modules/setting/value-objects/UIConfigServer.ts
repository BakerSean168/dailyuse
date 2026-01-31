/**
 * UIConfig Value Object - Server Interface
 * UI配置值对象 - 服务端接口
 */

import type { UIConfigClientDTO } from './UIConfigClient';

// ============ DTO 定义 ============

/**
 * UIConfig Server DTO
 */
export interface UIConfigServerDTO {
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
  label?: string | null;
  placeholder?: string | null;
  helpText?: string | null;
  icon?: string | null;
  order: number;
  visible: boolean;
  disabled: boolean;
  options?: Array<{ label: string; value: any }> | null;
  min?: number | null;
  max?: number | null;
  step?: number | null;
}

/**
 * UIConfig Persistence DTO
 */
export interface UIConfigPersistenceDTO {
  inputType: string;
  label?: string | null;
  placeholder?: string | null;
  helpText?: string | null;
  icon?: string | null;
  order: number;
  visible: boolean;
  disabled: boolean;
  options?: string | null; // JSON string
  min?: number | null;
  max?: number | null;
  step?: number | null;
}

// ============ 值对象接口 ============

export interface UIConfigServer {
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
  label?: string | null;
  placeholder?: string | null;
  helpText?: string | null;
  icon?: string | null;
  order: number;
  visible: boolean;
  disabled: boolean;
  options?: Array<{ label: string; value: any }> | null;
  min?: number | null;
  max?: number | null;
  step?: number | null;
