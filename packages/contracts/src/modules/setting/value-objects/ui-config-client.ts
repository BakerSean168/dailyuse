/**
 * UIConfig Value Object - Client Interface
 * UI配置值对�?- 客户端接�?
 */

import type { UIConfigServerDTO } from './ui-config-server';

// ============ DTO 定义 ============

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

// ============ 值对象接�?============

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
