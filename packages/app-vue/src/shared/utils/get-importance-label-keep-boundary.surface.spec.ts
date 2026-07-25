import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 1219: getImportanceLabel keep-boundary (goal Vital i18n vs react English vs KR h/m/l).
 * - app-vue GoalDetailView: Vital/Important/… → t('goal.dialog.importance*')
 * - app-react GoalCompareScreen: Vital/… → English identity strings (no t())
 * Soft residual 1219: KRPreviewList high/medium/low key space stays separate.
 * Soft residual 1216: formatTimestamp keep-boundary remains separate.
 * Does not flip §13.2 checkboxes.
 */
describe('getImportanceLabel keep-boundary (residual 1219)', () => {
  const dir = __dirname;
  const vue = readFileSync(
    resolve(dir, '../../modules/goal/views/GoalDetailView.vue'),
    'utf8',
  );
  const react = readFileSync(
    resolve(dir, '../../../../app-react/src/screens/GoalCompareScreen.tsx'),
    'utf8',
  );
  const kr = readFileSync(
    resolve(dir, '../../modules/goal/components/KRPreviewList.vue'),
    'utf8',
  );

  it('owns Residual 1219 keep-boundary markers on app-vue goal Vital-scale i18n getImportanceLabel', () => {
    expect(vue).toContain('Residual 1219 keep-boundary');
    expect(vue).toMatch(/function getImportanceLabel\b/);
    expect(vue).toContain("t('goal.dialog.importanceVital')");
    expect(vue).toContain("t('goal.dialog.importanceTrivial')");
    const body = vue.match(/function getImportanceLabel\([\s\S]*?\n\}/)?.[0] ?? '';
    expect(body).toContain('Vital');
    expect(body).toContain('Important');
    expect(body).toContain('goal.dialog.importance');
    expect(body).not.toContain("Vital: 'Vital'");
    expect(body).not.toContain("case 'high'");
    expect(body).not.toContain('goal.krPreview');
  });

  it('differs from app-react English identity getImportanceLabel (no force-merge)', () => {
    expect(react).toContain('Residual 1219 keep-boundary');
    expect(react).toMatch(/function getImportanceLabel\b/);
    expect(react).toContain('Soft residual 1219');
    expect(react).toContain("Vital: 'Vital'");
    expect(react).toContain("Trivial: 'Trivial'");
    const body = react.match(/function getImportanceLabel\([\s\S]*?\n  \}/)?.[0] ?? '';
    expect(body).toContain("'Vital'");
    expect(body).not.toContain('goal.dialog.importance');
    expect(body).not.toMatch(/\bt\(/);
    expect(body).not.toContain("case 'high'");
  });

  it('soft residual 1219 KR high/medium/low key space stays separate', () => {
    expect(kr).toContain('Soft residual 1219');
    expect(kr).toMatch(/function getImportanceLabel\b/);
    expect(kr).toContain("case 'high'");
    expect(kr).toContain("case 'medium'");
    expect(kr).toContain("case 'low'");
    expect(kr).toContain('goal.krPreview.importance');
    expect(kr).not.toContain('importanceVital');
    expect(kr).not.toContain("Vital: 'Vital'");
  });

  it('runtime: documents Vital i18n vs English identity vs h/m/l contracts via body shape', () => {
    function vueGoalGetImportanceLabel(importance: string, t: (k: string) => string): string {
      const labels: Record<string, string> = {
        Vital: t('goal.dialog.importanceVital'),
        Important: t('goal.dialog.importanceImportant'),
        Moderate: t('goal.dialog.importanceModerate'),
        Minor: t('goal.dialog.importanceMinor'),
        Trivial: t('goal.dialog.importanceTrivial'),
      };
      return labels[importance] ?? importance;
    }
    function reactGetImportanceLabel(importance: string): string {
      const labels: Record<string, string> = {
        Vital: 'Vital',
        Important: 'Important',
        Moderate: 'Moderate',
        Minor: 'Minor',
        Trivial: 'Trivial',
      };
      return labels[importance] ?? importance;
    }
    function krGetImportanceLabel(importance: string, t: (k: string) => string): string {
      switch (importance) {
        case 'high':
          return t('goal.krPreview.importanceHigh');
        case 'medium':
          return t('goal.krPreview.importanceMedium');
        case 'low':
          return t('goal.krPreview.importanceLow');
        default:
          return importance;
      }
    }
    const t = (k: string) => `i18n:${k}`;
    expect(vueGoalGetImportanceLabel('Vital', t)).toBe('i18n:goal.dialog.importanceVital');
    expect(reactGetImportanceLabel('Vital')).toBe('Vital');
    expect(krGetImportanceLabel('high', t)).toBe('i18n:goal.krPreview.importanceHigh');
    expect(krGetImportanceLabel('Vital', t)).toBe('Vital');
    expect(vueGoalGetImportanceLabel('high', t)).toBe('high');
  });

  it('documents residual 1219 lock intent without claiming §13.2 complete', () => {
    const self = readFileSync(
      resolve(dir, 'get-importance-label-keep-boundary.surface.spec.ts'),
      'utf8',
    );
    expect(self).toContain('Residual 1219');
    expect(self).toContain('Does not flip §13.2 checkboxes');
    expect(self).toContain('keep-boundary');
  });
});
