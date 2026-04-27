import { describe, expect, it } from 'vitest';
import { SyncConfig } from '../sync-config';
import { UIConfig } from '../ui-config';
import { ValidationRule } from '../validation-rule';

describe('setting rich value objects', () => {
  it('covers sync config factories, transitions, and serialization', () => {
    const defaultConfig = SyncConfig.createDefault();
    expect(defaultConfig.enabled).toBe(true);
    expect(defaultConfig.syncToCloud).toBe(true);
    expect(defaultConfig.syncToDevices).toBe(true);
    expect(defaultConfig.isDisabled).toBe(false);
    expect(defaultConfig.isFullSync).toBe(true);
    expect(defaultConfig.isCloudOnly).toBe(false);
    expect(defaultConfig.isDevicesOnly).toBe(false);
    expect(defaultConfig.syncDescription).toBe('云端 + 设备间同步');

    const disabled = SyncConfig.createDisabled();
    expect(disabled.isDisabled).toBe(true);
    expect(disabled.syncDescription).toBe('同步已禁用');

    const cloudOnly = SyncConfig.createCloudOnly();
    expect(cloudOnly.isCloudOnly).toBe(true);
    expect(cloudOnly.syncDescription).toBe('仅云端同步');

    const devicesOnly = SyncConfig.create({
      enabled: true,
      syncToCloud: false,
      syncToDevices: true,
    });
    expect(devicesOnly.isDevicesOnly).toBe(true);
    expect(devicesOnly.syncDescription).toBe('仅设备间同步');

    const enabledWithoutTargets = SyncConfig.fromDTO({
      enabled: true,
      syncToCloud: false,
      syncToDevices: false,
    });
    expect(enabledWithoutTargets.syncDescription).toBe('同步已启用');

    const fromPersistence = SyncConfig.fromPersistenceDTO({
      enabled: false,
      syncToCloud: true,
      syncToDevices: false,
    });
    expect(fromPersistence.enabled).toBe(false);

    const updated = disabled.enable().setSyncToCloud(true).setSyncToDevices(true);
    expect(updated.toDTO()).toEqual({
      enabled: true,
      syncToCloud: true,
      syncToDevices: true,
    });
    expect(updated.toPersistenceDTO()).toEqual(updated.toDTO());
    expect(updated.disable().toDTO()).toEqual({
      enabled: false,
      syncToCloud: false,
      syncToDevices: false,
    });
    expect(defaultConfig.with({ syncToDevices: false }).syncToDevices).toBe(false);
  });

  it('covers ui config factories, getters, behavior, and persistence mapping', () => {
    const defaultConfig = UIConfig.createDefault();
    expect(defaultConfig.inputType).toBe('TEXT');
    expect(defaultConfig.label).toBeNull();
    expect(defaultConfig.placeholder).toBeNull();
    expect(defaultConfig.helpText).toBeNull();
    expect(defaultConfig.icon).toBeNull();
    expect(defaultConfig.order).toBe(0);
    expect(defaultConfig.visible).toBe(true);
    expect(defaultConfig.disabled).toBe(false);
    expect(defaultConfig.options).toBeNull();
    expect(defaultConfig.min).toBeNull();
    expect(defaultConfig.max).toBeNull();
    expect(defaultConfig.step).toBeNull();
    expect(defaultConfig.hasLabel).toBe(false);
    expect(defaultConfig.hasOptions).toBe(false);
    expect(defaultConfig.hasRange).toBe(false);
    expect(defaultConfig.isSelectable).toBe(false);
    expect(defaultConfig.isNumeric).toBe(false);

    const selectConfig = UIConfig.createSelect(
      [
        { label: 'Alpha', value: 'a' },
        { label: 'Beta', value: 'b' },
      ],
      'Pick one',
    );
    expect(selectConfig.inputType).toBe('SELECT');
    expect(selectConfig.label).toBe('Pick one');
    expect(selectConfig.hasLabel).toBe(true);
    expect(selectConfig.hasOptions).toBe(true);
    expect(selectConfig.isSelectable).toBe(true);

    const clonedOptions = selectConfig.options;
    expect(clonedOptions).toEqual([
      { label: 'Alpha', value: 'a' },
      { label: 'Beta', value: 'b' },
    ]);
    clonedOptions?.push({ label: 'Gamma', value: 'c' });
    expect(selectConfig.options).toHaveLength(2);

    const sliderConfig = UIConfig.createSlider(1, 10, 2);
    expect(sliderConfig.inputType).toBe('SLIDER');
    expect(sliderConfig.min).toBe(1);
    expect(sliderConfig.max).toBe(10);
    expect(sliderConfig.step).toBe(2);
    expect(sliderConfig.hasRange).toBe(true);
    expect(sliderConfig.isNumeric).toBe(true);

    const updated = defaultConfig
      .setLabel('Display name')
      .setVisible(false)
      .setDisabled(true)
      .setOrder(9)
      .addOption({ label: 'Only', value: 1 });
    expect(updated.label).toBe('Display name');
    expect(updated.visible).toBe(false);
    expect(updated.disabled).toBe(true);
    expect(updated.order).toBe(9);
    expect(updated.options).toEqual([{ label: 'Only', value: 1 }]);

    const fromDTO = UIConfig.fromDTO({
      inputType: 'NUMBER',
      label: 'Port',
      placeholder: '5432',
      helpText: 'Database port',
      icon: 'server',
      order: 2,
      visible: false,
      disabled: true,
      options: null,
      min: 1,
      max: 65535,
      step: 1,
    });
    expect(fromDTO.isNumeric).toBe(true);

    const fromPersistence = UIConfig.fromPersistenceDTO({
      inputType: 'RADIO',
      label: 'Choice',
      placeholder: null,
      helpText: 'Select one',
      icon: null,
      order: 4,
      visible: true,
      disabled: false,
      options: JSON.stringify([{ label: 'A', value: 'a' }]),
      min: null,
      max: null,
      step: null,
    });
    expect(fromPersistence.options).toEqual([{ label: 'A', value: 'a' }]);

    expect(fromPersistence.with({ inputType: 'CHECKBOX' }).inputType).toBe('CHECKBOX');
    expect(fromPersistence.toDTO()).toEqual({
      inputType: 'RADIO',
      label: 'Choice',
      placeholder: null,
      helpText: 'Select one',
      icon: null,
      order: 4,
      visible: true,
      disabled: false,
      options: [{ label: 'A', value: 'a' }],
      min: null,
      max: null,
      step: null,
    });
    expect(fromPersistence.toPersistenceDTO()).toEqual({
      inputType: 'RADIO',
      label: 'Choice',
      placeholder: null,
      helpText: 'Select one',
      icon: null,
      order: 4,
      visible: true,
      disabled: false,
      options: JSON.stringify([{ label: 'A', value: 'a' }]),
      min: null,
      max: null,
      step: null,
    });
  });

  it('covers validation rule factories, flags, and serialization', () => {
    const emptyRule = ValidationRule.createDefault();
    expect(emptyRule.required).toBe(false);
    expect(emptyRule.min).toBeNull();
    expect(emptyRule.max).toBeNull();
    expect(emptyRule.pattern).toBeNull();
    expect(emptyRule.enum).toBeNull();
    expect(emptyRule.custom).toBeNull();
    expect(emptyRule.hasRange).toBe(false);
    expect(emptyRule.hasPattern).toBe(false);
    expect(emptyRule.hasEnum).toBe(false);
    expect(emptyRule.hasCustom).toBe(false);
    expect(emptyRule.isEmpty).toBe(true);

    const requiredRule = ValidationRule.createRequired();
    expect(requiredRule.required).toBe(true);
    expect(requiredRule.isEmpty).toBe(false);

    const fromDTO = ValidationRule.fromDTO({
      required: true,
      min: 1,
      max: 10,
      pattern: '^memo',
      enum: ['memo', 'note'],
      custom: 'custom-check',
    });
    expect(fromDTO.hasRange).toBe(true);
    expect(fromDTO.hasPattern).toBe(true);
    expect(fromDTO.hasEnum).toBe(true);
    expect(fromDTO.hasCustom).toBe(true);
    expect(fromDTO.isEmpty).toBe(false);

    const clonedEnum = fromDTO.enum;
    expect(clonedEnum).toEqual(['memo', 'note']);
    clonedEnum?.push('extra');
    expect(fromDTO.enum).toEqual(['memo', 'note']);

    const fromPersistence = ValidationRule.fromPersistenceDTO({
      required: false,
      min: 2,
      max: 8,
      pattern: '\\d+',
      enum: JSON.stringify([1, 2]),
      custom: null,
    });
    expect(fromPersistence.enum).toEqual([1, 2]);

    const updated = emptyRule
      .setRequired(true)
      .setRange(3, 12)
      .setPattern('^abc')
      .setEnum(['abc', 'def']);
    expect(updated.required).toBe(true);
    expect(updated.min).toBe(3);
    expect(updated.max).toBe(12);
    expect(updated.pattern).toBe('^abc');
    expect(updated.enum).toEqual(['abc', 'def']);

    expect(updated.with({ custom: 'sync-only' }).custom).toBe('sync-only');
    expect(updated.toDTO()).toEqual({
      required: true,
      min: 3,
      max: 12,
      pattern: '^abc',
      enum: ['abc', 'def'],
      custom: null,
    });
    expect(updated.toPersistenceDTO()).toEqual({
      required: true,
      min: 3,
      max: 12,
      pattern: '^abc',
      enum: JSON.stringify(['abc', 'def']),
      custom: null,
    });
  });
});
