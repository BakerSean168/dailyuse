import { describe, expect, it } from 'vitest';
import { moduleForPath, MODULE_TITLE_KEYS, shouldOpenInFocus } from './useShellRouterSync';

describe('moduleForPath (V2 §3 module matrix)', () => {
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
    expect(moduleForPath('/settings')).toBe('setting');
    expect(moduleForPath('/account')).toBe('setting');
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
  });
});

describe('shouldOpenInFocus (V2 §3 / §6.3)', () => {
  it('marks settings and schedule for default focus entry', () => {
    expect(shouldOpenInFocus('setting')).toBe(true);
    expect(shouldOpenInFocus('schedule')).toBe(true);
    expect(shouldOpenInFocus('task')).toBe(false);
    expect(shouldOpenInFocus('goal')).toBe(false);
  });
});
