import { describe, expect, it } from 'vitest';
import { WorkspaceSettings } from '../workspace-settings';

describe('WorkspaceSettings', () => {
  it('creates default settings', () => {
    const settings = WorkspaceSettings.createDefault();
    expect(settings.theme).toBe('default');
    expect(settings.fontSize).toBe(14);
    expect(settings.fontFamily).toBe('Consolas, "Courier New", monospace');
    expect(settings.lineHeight).toBe(1.5);
    expect(settings.tabSize).toBe(2);
    expect(settings.wordWrap).toBe(true);
    expect(settings.lineNumbers).toBe(true);
    expect(settings.minimap).toBe(true);
    expect(settings.hasCustomTheme).toBe(false);
  });

  it('toggles settings', () => {
    let settings = WorkspaceSettings.createDefault();
    settings = settings.toggleWordWrap();
    expect(settings.wordWrap).toBe(false);
    settings = settings.toggleMinimap();
    expect(settings.minimap).toBe(false);
  });

  it('updates simple fields', () => {
    let settings = WorkspaceSettings.createDefault();
    settings = settings.setTheme('dark');
    expect(settings.theme).toBe('dark');
    expect(settings.hasCustomTheme).toBe(true);

    settings = settings.setFontSize(16);
    expect(settings.fontSize).toBe(16);
  });

  it('updates auto save', () => {
    let settings = WorkspaceSettings.createDefault();
    expect(settings.autoSaveFormatted).toBe('每 30 秒');

    settings = settings.disableAutoSave();
    expect(settings.isAutoSaveEnabled).toBe(false);
    expect(settings.autoSaveFormatted).toBe('已禁用');

    settings = settings.enableAutoSave(60);
    expect(settings.isAutoSaveEnabled).toBe(true);
    expect(settings.autoSave?.interval).toBe(60);
    expect(settings.autoSaveFormatted).toBe('每 60 秒');
  });

  it('converts to/from DTO', () => {
    const settings = WorkspaceSettings.createDefault();
    const dto = settings.toDTO();
    expect(dto.theme).toBe('default');

    const settingsFromDto = WorkspaceSettings.fromDTO(dto);
    expect(settingsFromDto.theme).toBe('default');

    const settingsCreated = WorkspaceSettings.create(dto);
    expect(settingsCreated.theme).toBe('default');
  });

  it('handles null values in DTOs', () => {
    const settings = WorkspaceSettings.fromDTO({
      theme: null,
      fontSize: null,
      fontFamily: null,
      lineHeight: null,
      tabSize: null,
      wordWrap: null,
      lineNumbers: null,
      minimap: null,
      autoSave: null,
    });
    expect(settings.theme).toBeNull();
    expect(settings.autoSave).toBeNull();
    expect(settings.hasCustomTheme).toBe(false);
  });
});
