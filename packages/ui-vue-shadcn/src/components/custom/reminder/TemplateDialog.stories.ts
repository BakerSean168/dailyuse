import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import TemplateDialog from './TemplateDialog.vue';

const groupOptions = [
  { id: 'grp-1', name: '工作提醒' },
  { id: 'grp-2', name: '健康管理' },
  { id: 'grp-3', name: '学习计划' },
];

const meta = {
  title: 'Business/Reminder/TemplateDialog',
  component: TemplateDialog,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof TemplateDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const CreateMode: Story = {
  render: () => ({
    components: { TemplateDialog },
    setup() {
      const dialogRef = ref();
      const open = () => dialogRef.value?.openForCreate();
      return { dialogRef, open, groupOptions };
    },
    template: `
      <div class="p-8">
        <button class="px-4 py-2 bg-primary text-primary-foreground rounded-md" @click="open">新建提醒模板</button>
        <TemplateDialog ref="dialogRef" :group-options="groupOptions" />
      </div>
    `,
  }),
};

export const EditMode: Story = {
  render: () => ({
    components: { TemplateDialog },
    setup() {
      const dialogRef = ref();
      const existingTemplate = {
        id: 'tpl-1',
        name: '每日喝水提醒',
        description: '每 2 小时提醒喝水',
        importanceLevel: 'MODERATE',
        color: '#4CAF50',
        icon: 'mdi-bell',
        tags: ['健康', '日常'],
        groupId: 'grp-2',
        trigger: {
          type: 'INTERVAL',
          interval: { minutes: 120 },
          fixedTime: null,
        },
      };
      const open = () => dialogRef.value?.openForEdit(existingTemplate);
      return { dialogRef, open, groupOptions, existingTemplate };
    },
    template: `
      <div class="p-8">
        <button class="px-4 py-2 bg-primary text-primary-foreground rounded-md" @click="open">编辑模板</button>
        <TemplateDialog ref="dialogRef" :template="existingTemplate" :group-options="groupOptions" />
      </div>
    `,
  }),
};
