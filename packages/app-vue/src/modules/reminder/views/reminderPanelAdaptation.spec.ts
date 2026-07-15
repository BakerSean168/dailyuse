import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const reminderSource = readFileSync(
  resolve(process.cwd(), 'src/modules/reminder/views/ReminderLinearView.vue'),
  'utf8',
);

describe('Reminder single-page architecture', () => {
  it('keeps one toolbar, one primary action, and one responsive workspace DOM', () => {
    expect(reminderSource).toContain('data-testid="reminder-page-toolbar"');
    expect(reminderSource).toContain('data-testid="reminder-workspace-grid"');
    expect(reminderSource).toContain('data-primary-action="create-reminder-template"');
    expect(reminderSource.match(/data-primary-action=/g)).toHaveLength(1);
    expect(reminderSource).toContain('@3xl/panel:grid-cols-');
    expect(reminderSource).not.toContain('usePanelWidth');
    expect(reminderSource).not.toContain('isNarrow');
    expect(reminderSource).not.toContain('ReminderGroupSwitcherBar');
    expect(reminderSource).not.toContain('create-first-reminder-template-button');
    expect(reminderSource).not.toContain("key: 'createReminder'");
  });
});
