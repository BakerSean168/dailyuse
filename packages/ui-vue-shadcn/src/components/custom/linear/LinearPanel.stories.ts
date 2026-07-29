import type { Meta, StoryObj } from '@storybook/vue3-vite';
import LinearPanel from './LinearPanel.vue';
import LinearSidebarItem from './LinearSidebarItem.vue';

const meta = {
  title: 'Business/Linear/LinearPanel',
  component: LinearPanel,
  tags: ['autodocs'],
} satisfies Meta<typeof LinearPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    components: { LinearPanel },
    template: `
      <div class="h-[400px]">
        <LinearPanel class="w-[220px]">
          <div class="p-4 text-sm text-muted-foreground">Panel Content</div>
        </LinearPanel>
      </div>
    `,
  }),
};

export const WithSidebar: Story = {
  render: () => ({
    components: { LinearPanel, LinearSidebarItem },
    template: `
      <div class="h-[400px]">
        <LinearPanel class="w-[220px]">
          <div class="p-3 text-sm font-semibold text-foreground border-b">知行 (MemoFlow)</div>
          <div class="p-2 space-y-0.5">
            <LinearSidebarItem label="Inbox" :count="3">
              <template #icon>📥</template>
            </LinearSidebarItem>
            <LinearSidebarItem label="My Issues" active :count="12">
              <template #icon>📋</template>
            </LinearSidebarItem>
            <LinearSidebarItem label="Views">
              <template #icon>👁️</template>
            </LinearSidebarItem>
            <LinearSidebarItem label="Cycles">
              <template #icon>🔄</template>
            </LinearSidebarItem>
          </div>
          <div class="mt-auto p-2 border-t">
            <LinearSidebarItem label="Settings">
              <template #icon>⚙️</template>
            </LinearSidebarItem>
          </div>
        </LinearPanel>
      </div>
    `,
  }),
};
