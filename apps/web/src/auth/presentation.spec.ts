import { beforeEach, describe, expect, it } from 'vitest';
import {
  applyAuthTheme,
  readPresentationPreferenceState,
  writePresentationPreferenceState,
} from './presentation';

describe('web authentication presentation', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = '';
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.style.colorScheme = '';
  });

  it('always applies the fixed dark brand theme', () => {
    applyAuthTheme();

    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(document.documentElement.style.colorScheme).toBe('dark');
  });

  it('updates auth locale without overwriting the workspace theme preference', () => {
    localStorage.setItem(
      'presentation-preference',
      JSON.stringify({ locale: 'en-US', theme: 'light' }),
    );

    writePresentationPreferenceState({ locale: 'zh-CN' });

    expect(readPresentationPreferenceState()).toEqual({ locale: 'zh-CN', theme: 'light' });
  });
});
