/**
 * Setting Event Emitter
 * 设置事件发送器
 * 
 * 当用户修改设置时，发送相应的事件到事件总线
 */

import { eventBus } from '@dailyuse/utils';
import { THEME_EVENTS } from '../../../theme/application/events/ThemeEvents';
import type {
  ThemeChangedPayload,
  ThemeModeChangedPayload,
  AccentColorChangedPayload,
  FontSizeChangedPayload,
  CompactModeChangedPayload,
} from '../../../theme/application/events/ThemeEvents';
import type { ThemeConfig } from '../../../theme/domain/ThemeConfig';

export class SettingEventEmitter {
  /**
   * 发送完整主题变更事件
   */
  static emitThemeChanged(previous: ThemeConfig | null, current: ThemeConfig): void {
    const payload: ThemeChangedPayload = {
      previous,
      current,
      source: 'setting',
    };

    eventBus.emit(THEME_EVENTS.CHANGED, payload);
    console.log('📤 [SettingEventEmitter] 发送主题变更事件:', payload);
  }

  /**
   * 发送主题模式变更事件
   */
  static emitModeChanged(mode: ThemeConfig['mode']): void {
    const payload: ThemeModeChangedPayload = {
      mode,
      source: 'setting',
    };

    eventBus.emit(THEME_EVENTS.MODE_CHANGED, payload);
    console.log('📤 [SettingEventEmitter] 发送主题模式变更事件:', payload);
  }

  /**
   * 发送主题色变更事件
   */
  static emitAccentColorChanged(color: string): void {
    const payload: AccentColorChangedPayload = {
      color,
      source: 'setting',
    };

    eventBus.emit(THEME_EVENTS.ACCENT_COLOR_CHANGED, payload);
    console.log('📤 [SettingEventEmitter] 发送主题色变更事件:', payload);
  }

  /**
   * 发送字体大小变更事件
   */
  static emitFontSizeChanged(fontSize: ThemeConfig['fontSize']): void {
    const payload: FontSizeChangedPayload = {
      fontSize,
      source: 'setting',
    };

    eventBus.emit(THEME_EVENTS.FONT_SIZE_CHANGED, payload);
    console.log('📤 [SettingEventEmitter] 发送字体大小变更事件:', payload);
  }

  /**
   * 发送紧凑模式变更事件
   */
  static emitCompactModeChanged(enabled: boolean): void {
    const payload: CompactModeChangedPayload = {
      enabled,
      source: 'setting',
    };

    eventBus.emit(THEME_EVENTS.COMPACT_MODE_CHANGED, payload);
    console.log('📤 [SettingEventEmitter] 发送紧凑模式变更事件:', payload);
  }
}
