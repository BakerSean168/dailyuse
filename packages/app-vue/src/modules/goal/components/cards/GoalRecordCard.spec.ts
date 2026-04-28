import { mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import { describe, expect, it } from 'vitest';
import type { GoalRecordClientDTO } from '@dailyuse/contracts/goal';
import GoalRecordCard from './GoalRecordCard.vue';

const i18n = createI18n({
  legacy: false,
  locale: 'en-US',
  messages: {
    'en-US': {
      goal: {
        cards: {
          cardsRecordCard: {
            recordValue: 'Record value: ',
          },
        },
      },
    },
  },
});

function createRecord(overrides: Partial<GoalRecordClientDTO> = {}): GoalRecordClientDTO {
  return {
    id: 'record-1' as GoalRecordClientDTO['id'],
    keyResultId: 'kr-1' as GoalRecordClientDTO['keyResultId'],
    value: 12,
    comment: 'Closed the remaining branch coverage gap.',
    createdAt: 1745780400000,
    updatedAt: 1745780400000,
    ...overrides,
  } as GoalRecordClientDTO;
}

describe('GoalRecordCard', () => {
  it('renders formatted value date and comment for a persisted progress record', () => {
    const record = createRecord();
    const wrapper = mount(GoalRecordCard, {
      props: { record },
      global: { plugins: [i18n] },
    });

    expect(wrapper.text()).toContain('Record value: 12');
    expect(wrapper.text()).toContain(new Date(record.createdAt).toLocaleString());
    expect(wrapper.text()).toContain('Closed the remaining branch coverage gap.');
  });

  it('falls back to the raw timestamp and hides the comment block when absent', () => {
    const wrapper = mount(GoalRecordCard, {
      props: {
        record: createRecord({
          createdAt: 'invalid-date' as unknown as GoalRecordClientDTO['createdAt'],
          comment: null,
        }),
      },
      global: { plugins: [i18n] },
    });

    expect(wrapper.text()).toContain('invalid-date');
    expect(wrapper.text()).not.toContain('Closed the remaining branch coverage gap.');
  });
});
