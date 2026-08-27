import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = readFileSync(
  resolve(process.cwd(), 'src/modules/task/components/TaskTemplateForm/TaskTemplateForm.vue'),
  'utf8',
);

describe('TaskTemplateForm vNext surface', () => {
  it('uses shared product-time and recurrence controls instead of legacy Task sections', () => {
    expect(source).toContain('<DateField');
    expect(source).toContain('<TimeField');
    expect(source).toContain('<RecurrenceEditor');
    expect(source).toContain('<ReminderOffsetField');
    expect(source).toContain('<LabelPicker');
    expect(source).toContain('<KeyResultLinksSection');
    expect(source).not.toContain('TimeConfigSection');
    expect(source).not.toContain('RecurrenceSection');
    expect(source).not.toContain('ReminderSection');
    expect(source).not.toContain('MetadataSection');
    expect(source).not.toContain('<RadioGroup');
    expect(source).not.toContain('ColorPickerField');
    expect(source).not.toContain('tags-input');
  });

  it('keeps primary fields visible and secondary fields behind one More section', () => {
    expect(source).toContain('data-testid="task-vnext-editor"');
    expect(source).toContain('data-testid="task-editor-time-fields"');
    expect(source).toContain('data-testid="task-editor-recurrence"');
    expect(source).toContain('data-testid="task-editor-labels"');
    expect(source).toContain('data-testid="task-form-advanced-toggle"');
    expect(source).toContain('data-testid="task-editor-checklist"');
    expect(source).toContain('data-testid="task-add-checklist-item"');
  });

  it('infers TaskTimeType through the adapter rather than exposing a type selector', () => {
    expect(source).toContain('resolveTaskEditorTime');
    expect(source).not.toContain('TaskTimeType');
    expect(source).not.toContain('time-all-day');
    expect(source).not.toContain('time-point');
    expect(source).not.toContain('time-range');
  });
});
