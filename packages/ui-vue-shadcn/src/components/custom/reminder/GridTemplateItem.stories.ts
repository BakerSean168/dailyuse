import type { Meta, StoryObj } from '@storybook/vue3-vite';
import GridTemplateItem from './GridTemplateItem.vue';

const meta = {
  title: 'Business/Reminder/GridTemplateItem',
  component: GridTemplateItem,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  decorators: [
    () => ({ template: '<div style="width: 140px; height: 160px;"><story /></div>' }),
  ],
  argTypes: {
    item: { description: '提醒模板对象' },
  },
} satisfies Meta<typeof GridTemplateItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Enabled: Story = {
  args: {
    item: {
      id: 'tpl-1',
      name: '喝水提醒',
      effectiveEnabled: true,
    },
  },
};

export const Disabled: Story = {
  args: {
    item: {
      id: 'tpl-2',
      name: '午休提醒',
      effectiveEnabled: false,
    },
  },
};

export const LongName: Story = {
  args: {
    item: {
      id: 'tpl-3',
      name: '每日站立会议提醒（周一至周五）',
      effectiveEnabled: true,
    },
  },
};
