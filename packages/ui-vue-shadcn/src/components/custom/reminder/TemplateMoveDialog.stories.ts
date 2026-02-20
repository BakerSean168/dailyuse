import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import TemplateMoveDialog from './TemplateMoveDialog.vue';

const groups = [
  { id: 'grp-1', name: '工作提醒', description: '工作相关', icon: 'mdi-briefcase', enabled: true },
  { id: 'grp-2', name: '健康管理', description: '健康相关', icon: 'mdi-heart', enabled: true },
  { id: 'grp-3', name: '学习计划', description: '已停用', icon: 'mdi-school', enabled: false },
];

const templates = [
  { id: 'tpl-1', name: '喝水提醒', groupId: 'grp-2' },
  { id: 'tpl-2', name: '站会提醒', groupId: 'grp-1' },
  { id: 'tpl-3', name: '阅读提醒', groupId: 'grp-3' },
  { id: 'tpl-4', name: '独立提醒', groupId: null },
];

const meta = {
  title: 'Business/Reminder/TemplateMoveDialog',
  component: TemplateMoveDialog,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof TemplateMoveDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const MoveFromGroup: Story = {
  render: () => ({
    components: { TemplateMoveDialog },
    setup() {
      const dialogRef = ref();
      const templateToMove = { id: 'tpl-1', name: '喝水提醒', groupId: 'grp-2' };
      const open = () => dialogRef.value?.open();
      return { dialogRef, open, templateToMove, groups, templates };
    },
    template: `
      <div class="p-8">
        <button class="px-4 py-2 bg-primary text-primary-foreground rounded-md" @click="open">移动模板</button>
        <TemplateMoveDialog ref="dialogRef" :template="templateToMove" :groups="groups" :templates="templates" />
      </div>
    `,
  }),
};

export const MoveUngrouped: Story = {
  render: () => ({
    components: { TemplateMoveDialog },
    setup() {
      const dialogRef = ref();
      const templateToMove = { id: 'tpl-4', name: '独立提醒', groupId: null };
      const open = () => dialogRef.value?.open();
      return { dialogRef, open, templateToMove, groups, templates };
    },
    template: `
      <div class="p-8">
        <button class="px-4 py-2 bg-secondary text-secondary-foreground rounded-md" @click="open">移动未分组模板</button>
        <TemplateMoveDialog ref="dialogRef" :template="templateToMove" :groups="groups" :templates="templates" />
      </div>
    `,
  }),
};
