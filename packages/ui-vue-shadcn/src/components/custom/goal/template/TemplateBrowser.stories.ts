import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import TemplateBrowser from './TemplateBrowser.vue';

const meta = {
  title: 'Business/Goal/Template/TemplateBrowser',
  component: TemplateBrowser,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: { description: { component: '目标模板浏览器。通过 `open()` 方法打开，支持分类筛选、搜索、预览和应用模板。' } },
  },
} satisfies Meta<typeof TemplateBrowser>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    components: { TemplateBrowser },
    setup() {
      const browserRef = ref<InstanceType<typeof TemplateBrowser>>();
      const open = () => browserRef.value?.open();
      return { browserRef, open };
    },
    template: `<div class="p-4"><button class="px-4 py-2 rounded bg-primary text-primary-foreground" @click="open">浏览模板</button><TemplateBrowser ref="browserRef" /></div>`,
  }),
};
