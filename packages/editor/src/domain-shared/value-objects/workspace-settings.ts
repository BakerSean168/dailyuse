/**
 * WorkspaceSettings 值对象
 * 
 * 工作区设置：主题、字体、自动保存等
 * 不可变性（所有修改返回新实例）
 */

import { ValueObject } from '@dailyuse/utils/domain';
import type {
  IWorkspaceSettings,
  WorkspaceSettingsDTO,
} from '@dailyuse/contracts/editor';

interface AutoSaveConfig {
  enabled: boolean;
  interval: number; // 秒
}

/**
 * WorkspaceSettings 值对象实现
 */
export class WorkspaceSettings extends ValueObject<WorkspaceSettingsDTO> implements IWorkspaceSettings {

  private constructor(props: WorkspaceSettingsDTO) {
    super(props);
  }

  // ================= 工厂方法 =================
  
  public static create(props: WorkspaceSettingsDTO): WorkspaceSettings {
    return new WorkspaceSettings(props);
  }

  public static createDefault(): WorkspaceSettings {
    return new WorkspaceSettings({
      theme: 'default',
      fontSize: 14,
      fontFamily: 'Consolas, "Courier New", monospace',
      lineHeight: 1.5,
      tabSize: 2,
      wordWrap: true,
      lineNumbers: true,
      minimap: true,
      autoSave: {
        enabled: true,
        interval: 30,
      },
    });
  }

  public static fromDTO(dto: WorkspaceSettingsDTO): WorkspaceSettings {
    return new WorkspaceSettings(dto);
  }

  // ================= Getters =================

  public get theme(): string | null {
    return this.props.theme;
  }

  public get fontSize(): number | null {
    return this.props.fontSize;
  }

  public get fontFamily(): string | null {
    return this.props.fontFamily;
  }

  public get lineHeight(): number | null {
    return this.props.lineHeight;
  }

  public get tabSize(): number | null {
    return this.props.tabSize;
  }

  public get wordWrap(): boolean | null {
    return this.props.wordWrap;
  }

  public get lineNumbers(): boolean | null {
    return this.props.lineNumbers;
  }

  public get minimap(): boolean | null {
    return this.props.minimap;
  }

  public get autoSave(): AutoSaveConfig | null {
    return this.props.autoSave !== null ? { ...this.props.autoSave } : null;
  }

  // ================= 行为方法 =================

  public with(
    updates: Partial<WorkspaceSettingsDTO>,
  ): WorkspaceSettings {
    return new WorkspaceSettings({ ...this.props, ...updates });
  }

  public setTheme(theme: string | null): WorkspaceSettings {
    return this.with({ theme });
  }

  public setFontSize(fontSize: number | null): WorkspaceSettings {
    return this.with({ fontSize });
  }

  public enableAutoSave(interval: number = 30): WorkspaceSettings {
    return this.with({ autoSave: { enabled: true, interval } });
  }

  public disableAutoSave(): WorkspaceSettings {
    return this.with({ autoSave: { enabled: false, interval: 0 } });
  }

  public toggleWordWrap(): WorkspaceSettings {
    return this.with({ wordWrap: this.props.wordWrap !== true });
  }

  public toggleMinimap(): WorkspaceSettings {
    return this.with({ minimap: this.props.minimap !== true });
  }

  // ================= 计算属性 =================

  public get isAutoSaveEnabled(): boolean {
    return this.props.autoSave?.enabled ?? false;
  }

  public get autoSaveFormatted(): string {
    if (!this.props.autoSave?.enabled) return '已禁用';
    return `每 ${this.props.autoSave.interval} 秒`;
  }

  public get hasCustomTheme(): boolean {
    return this.props.theme !== null && this.props.theme !== 'default';
  }

  // ================= 序列化 =================

  public toDTO(): WorkspaceSettingsDTO {
    return {
      theme: this.props.theme,
      fontSize: this.props.fontSize,
      fontFamily: this.props.fontFamily,
      lineHeight: this.props.lineHeight,
      tabSize: this.props.tabSize,
      wordWrap: this.props.wordWrap,
      lineNumbers: this.props.lineNumbers,
      minimap: this.props.minimap,
      autoSave: this.props.autoSave !== null ? { ...this.props.autoSave } : null,
    };
  }
}
