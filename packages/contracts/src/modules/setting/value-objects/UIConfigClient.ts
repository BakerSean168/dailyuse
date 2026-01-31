/**
 * UIConfig Value Object - Client Interface
 * UI配置值对象 - 客户端接口
 */

import type { UIConfigServerDTO } from './UIConfigServer';

// ============ DTO 定义 ============

/**
 * UIConfig Client DTO
 */
export interface UIConfigClientDTO {
  inputType: string;
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

// ============ 值对象接口 ============

export interface UIConfigClient {
  inputType: string;
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

  // UI 方法
  hasOptions(): boolean;
  hasRange(): boolean;
  getComponentName(): string;}
