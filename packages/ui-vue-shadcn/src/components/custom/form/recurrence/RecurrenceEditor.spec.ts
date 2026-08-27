import { fireEvent, render } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'
import RecurrenceEditor from './RecurrenceEditor.vue'
import type { RecurrenceEditorValue } from './types'

function lastModelUpdate(emitted: Record<string, unknown[]>): RecurrenceEditorValue | null {
  const events = emitted['update:modelValue'] as unknown[][]
  return events[events.length - 1]?.[0] as RecurrenceEditorValue | null
}

describe('RecurrenceEditor', () => {
  it('enables recurrence with a neutral daily default and disables it back to null', async () => {
    const view = render(RecurrenceEditor, { props: { modelValue: null, labels: { enabled: 'Repeat' } } })

    await fireEvent.click(view.getByLabelText('Repeat'))
    expect(lastModelUpdate(view.emitted())).toEqual({
      frequency: 'Daily',
      interval: 1,
      daysOfWeek: [],
      endMode: 'never',
      endDate: null,
      occurrences: null,
    })
  })

  it('updates interval and weekly day selection without owning recurrence math', async () => {
    const value: RecurrenceEditorValue = {
      frequency: 'Weekly',
      interval: 1,
      daysOfWeek: [1],
      endMode: 'never',
      endDate: null,
      occurrences: null,
    }
    const view = render(RecurrenceEditor, {
      props: {
        modelValue: value,
        labels: { interval: 'Every N weeks', weekdays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] },
      },
    })

    await fireEvent.update(view.getByLabelText('Every N weeks'), '2')
    expect(lastModelUpdate(view.emitted())).toMatchObject({ interval: 2 })

    await fireEvent.click(view.getByRole('checkbox', { name: 'Tue' }))
    expect(lastModelUpdate(view.emitted())).toMatchObject({ daysOfWeek: [1, 2] })
  })
})
