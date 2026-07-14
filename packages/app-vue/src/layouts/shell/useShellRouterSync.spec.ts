import { describe, expect, it } from 'vitest';
import {
  moduleForPath,
  MODULE_TITLE_KEYS,
  isStandaloneSettingsPath,
  resolveEntryLayout,
  AUTO_FOCUS_VIEWPORT,
} from './useShellRouterSync';

describe('moduleForPath (V2 §3 module matrix + settings scene D)', () => {
  it('maps every business route family to its shell module', () => {
    expect(moduleForPath('/goals')).toBe('goal');
    expect(moduleForPath('/goals/g-1')).toBe('goal');
    expect(moduleForPath('/goals/g-1/key-results/kr-1')).toBe('goal');
    expect(moduleForPath('/tasks')).toBe('task');
    expect(moduleForPath('/tasks/t-1')).toBe('task');
    expect(moduleForPath('/repository')).toBe('note');
    expect(moduleForPath('/note/n-1')).toBe('note');
    expect(moduleForPath('/governance')).toBe('note');
    expect(moduleForPath('/governance/r-1/history')).toBe('note');
    expect(moduleForPath('/reminders')).toBe('reminder');
    expect(moduleForPath('/notifications')).toBe('notification');
    expect(moduleForPath('/sse-monitor')).toBe('notification');
    expect(moduleForPath('/schedule')).toBe('schedule');
    expect(moduleForPath('/schedule/calendar')).toBe('schedule');
  });

  it('does not map settings/account into BusinessTab modules', () => {
    expect(moduleForPath('/settings')).toBeNull();
    expect(moduleForPath('/settings/')).toBeNull();
    expect(moduleForPath('/account')).toBeNull();
    expect(moduleForPath('/account/center')).toBeNull();
    expect(isStandaloneSettingsPath('/settings')).toBe(true);
    expect(isStandaloneSettingsPath('/settings/anything')).toBe(true);
    expect(isStandaloneSettingsPath('/account/center')).toBe(true);
    expect(isStandaloneSettingsPath('/tasks')).toBe(false);
  });

  it('returns null for shell-external and unknown paths', () => {
    expect(moduleForPath('/')).toBeNull();
    expect(moduleForPath('/auth')).toBeNull();
    expect(moduleForPath('/custom-notification')).toBeNull();
    expect(moduleForPath('/notes-typo')).toBeNull();
  });

  it('does not treat prefix-similar paths as module routes', () => {
    // '/notes' is not '/note/:id' nor '/notifications'
    expect(moduleForPath('/notes')).toBeNull();
    expect(moduleForPath('/goalsmith')).toBeNull();
  });

  it('has a tab title key for every shell module', () => {
    for (const key of Object.values(MODULE_TITLE_KEYS)) {
      expect(key).toMatch(/^nav\./);
    }
    expect(MODULE_TITLE_KEYS).not.toHaveProperty('setting');
  });
});

describe('resolveEntryLayout (schedule/settings no longer force focus)', () => {
  it('auto-focuses only when the viewport cannot host a safe split', () => {
    expect(resolveEntryLayout(900, 'split', 'default')).toEqual({
      layout: 'focus',
      reason: 'viewport',
    });
    expect(resolveEntryLayout(AUTO_FOCUS_VIEWPORT, 'split', 'default')).toBeNull();
    expect(resolveEntryLayout(1200, 'split', 'default')).toBeNull();
  });

  it('auto-focuses when geometry reports canSplit=false even on wide viewports', () => {
    expect(resolveEntryLayout(1024, 'split', 'default', false)).toEqual({
      layout: 'focus',
      reason: 'viewport',
    });
    expect(resolveEntryLayout(1200, 'split', 'default', true)).toBeNull();
  });

  it('preserves explicit user focus when re-entering a module on a wide viewport', () => {
    expect(resolveEntryLayout(1400, 'focus', 'user')).toBeNull();
  });

  it('can restore split when previous focus was viewport-driven and space returns', () => {
    expect(resolveEntryLayout(1400, 'focus', 'viewport')).toEqual({
      layout: 'split',
      reason: 'default',
    });
  });
});

