import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const localeAwareSurfaces = [
  'src/modules/schedule/components/CreateScheduleDialog.vue',
  'src/modules/task/components/TaskTemplateForm/sections/ReminderSection.vue',
  'src/modules/task/components/TaskTemplateForm/sections/RecurrenceSection.vue',
  'src/modules/task/components/TaskTemplateForm/sections/TimeConfigSection.vue',
  'src/modules/task/components/dialogs/TaskCompleteDialog.vue',
  'src/modules/goal/views/GoalDetailView.vue',
  'src/modules/notification/views/SSEMonitorPage.vue',
];

describe('locale-aware date presentation', () => {
  it.each(localeAwareSurfaces)('%s binds date formatting to the active locale', (relativePath) => {
    const source = readFileSync(resolve(process.cwd(), relativePath), 'utf8');

    expect(source).not.toMatch(/\.toLocale(?:Date|Time)?String\(\s*(?:\)|undefined\s*,)/);
    if (source.includes("'yyyy-MM-dd EEEE'")) {
      expect(source).toContain("locale: locale.value.startsWith('zh') ? zhCN : enUS");
    }
  });
});
