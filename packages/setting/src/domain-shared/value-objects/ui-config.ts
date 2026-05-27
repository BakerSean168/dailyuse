/**
 * UIConfig 值对象
 * 
 * UI配置：inputType、label、placeholder、options等
 * 不可变性（所有修改返回新实例）
 */

import { ValueObject } from '@dailyuse/utils/domain';
import type {
  UIConfigDTO,
  UIConfig as IUIConfig,
} from '@dailyuse/contracts/setting';

type UIInputType = UIConfigDTO['inputType'];

interface UIOption {
  label: string;
  value: any;
}

/**
 * UIConfig 值对象实现
 */
export class UIConfig extends ValueObject<UIConfigDTO> implements IUIConfig {

  private constructor(props: UIConfigDTO) {
    super(props);
  }

  // ================= 工厂方法 =================
  
  public static create(props: UIConfigDTO): UIConfig {
    return new UIConfig(props);
  }

  public static createDefault(inputType: UIInputType = 'TEXT'): UIConfig {
    return new UIConfig({
      inputType,
      label: null,
      placeholder: null,
      helpText: null,
      icon: null,
      order: 0,
      visible: true,
      disabled: false,
      options: null,
      min: null,
      max: null,
      step: null,
    });
  }

  public static createSelect(options: UIOption[], label?: string): UIConfig {
    return new UIConfig({
      inputType: 'SELECT',
      label: label ?? null,
      placeholder: null,
      helpText: null,
      icon: null,
      order: 0,
      visible: true,
      disabled: false,
      options,
      min: null,
      max: null,
      step: null,
    });
  }

  public static createSlider(min: number, max: number, step: number = 1): UIConfig {
    return new UIConfig({
      inputType: 'SLIDER',
      label: null,
      placeholder: null,
      helpText: null,
      icon: null,
      order: 0,
      visible: true,
      disabled: false,
      options: null,
      min,
      max,
      step,
    });
  }

  public static fromDTO(dto: UIConfigDTO): UIConfig {
    return new UIConfig(dto);
  }

  // ================= Getters =================

  public get inputType(): UIInputType {
    return this.props.inputType;
  }

  public get label(): string | null {
    return this.props.label;
  }

  public get placeholder(): string | null {
    return this.props.placeholder;
  }

  public get helpText(): string | null {
    return this.props.helpText;
  }

  public get icon(): string | null {
    return this.props.icon;
  }

  public get order(): number {
    return this.props.order;
  }

  public get visible(): boolean {
    return this.props.visible;
  }

  public get disabled(): boolean {
    return this.props.disabled;
  }

  public get options(): UIOption[] | null {
    return this.props.options !== null ? [...this.props.options] : null;
  }

  public get min(): number | null {
    return this.props.min;
  }

  public get max(): number | null {
    return this.props.max;
  }

  public get step(): number | null {
    return this.props.step;
  }

  // ================= 行为方法 =================

  public with(
    updates: Partial<UIConfigDTO>,
  ): UIConfig {
    return new UIConfig({ ...this.props, ...updates });
  }

  public setLabel(label: string | null): UIConfig {
    return this.with({ label });
  }

  public setVisible(visible: boolean): UIConfig {
    return this.with({ visible });
  }

  public setDisabled(disabled: boolean): UIConfig {
    return this.with({ disabled });
  }

  public setOrder(order: number): UIConfig {
    return this.with({ order });
  }

  public addOption(option: UIOption): UIConfig {
    const currentOptions = this.props.options ?? [];
    return this.with({ options: [...currentOptions, option] });
  }

  // ================= 计算属性 =================

  public get hasLabel(): boolean {
    return this.props.label !== null;
  }

  public get hasOptions(): boolean {
    return this.props.options !== null && this.props.options.length > 0;
  }

  public get hasRange(): boolean {
    return this.props.min !== null || this.props.max !== null;
  }

  public get isSelectable(): boolean {
    return ['SELECT', 'RADIO', 'CHECKBOX'].includes(this.props.inputType);
  }

  public get isNumeric(): boolean {
    return ['NUMBER', 'SLIDER'].includes(this.props.inputType);
  }

  // ================= 序列化 =================

  public toDTO(): UIConfigDTO {
    return {
      inputType: this.props.inputType,
      label: this.props.label,
      placeholder: this.props.placeholder,
      helpText: this.props.helpText,
      icon: this.props.icon,
      order: this.props.order,
      visible: this.props.visible,
      disabled: this.props.disabled,
      options: this.props.options !== null ? [...this.props.options] : null,
      min: this.props.min,
      max: this.props.max,
      step: this.props.step,
    };
  }

}
