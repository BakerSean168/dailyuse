import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import TemplateDesktopCard from './TemplateDesktopCard.vue';

const meta = {
  title: 'Business/Reminder/TemplateDesktopCard',
  component: TemplateDesktopCard,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof TemplateDesktopCard>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockTemplate = {
  id: 'tpl-1',
  name: '每日喝水提醒',
  description: '每隔 2 小时提醒喝一杯水，保持身体水分充足。',
  icon: null,
  color: '#2196F3',
  effectiveEnabled: true,
  groupId: 'grp-1',
  triggerText: '每 2 小时',
  trigger: {
    type: 'INTERVAL',
    interval: { minutes: 120 },
    fixedTime: null,
  },
  createdAt: Date.now() - 86400_000 * 30,
  updatedAt: Date.now() - 86400_000,
};

export const ActiveTemplate: Story = {
  render: () => ({
    components: { TemplateDesktopCard },
    setup() {
      const dialogRef = ref();
      const open = () => dialogRef.value?.open();
      return { dialogRef, open, template: mockTemplate };
    },
    template: `
      <div class="p-8">
        <button class="px-4 py-2 bg-primary text-primary-foreground rounded-md" @click="open">查看模板详情</button>
        <TemplateDesktopCard ref="dialogRef" :template="template" />
      </div>
    `,
  }),
};

export const PausedTemplate: Story = {
  render: () => ({
    components: { TemplateDesktopCard },
    setup() {
      const dialogRef = ref();
      const pausedTemplate = { ...mockTemplate, id: 'tpl-2', name: '午休提醒', description: '已暂停的午休时间提醒。', effectiveEnabled: false, groupId: null, triggerText: '每天 12:30', trigger: { type: 'FIXED_TIME', fixedTime: { time: '12:30' }, interval: null } };
      const open = () => dialogRef.value?.open();
      return { dialogRef, open, template: pausedTemplate };
    },
    template: `
      <div class="p-8">
        <button class="px-4 py-2 bg-secondary text-secondary-foreground rounded-md" @click="open">查看已暂停模板</button>
        <TemplateDesktopCard ref="dialogRef" :template="template" />
      </div>
    `,
  }),
};
