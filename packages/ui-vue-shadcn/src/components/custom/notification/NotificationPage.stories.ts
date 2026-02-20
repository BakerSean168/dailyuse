import type { Meta, StoryObj } from '@storybook/vue3-vite';
import NotificationPage from './NotificationPage.vue';

const meta = {
  title: 'Business/Notification/NotificationPage',
  component: NotificationPage,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof NotificationPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => ({
    components: { NotificationPage },
    template: `
      <NotificationPage>
        <div class="space-y-4">
          <div class="flex gap-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer border-b">
            <div class="flex h-10 w-10 items-center justify-center rounded-full bg-green-500 text-white">✅</div>
            <div class="flex-1">
              <p class="text-sm font-semibold">任务完成</p>
              <p class="text-sm text-muted-foreground">「代码评审」已标记为完成。</p>
              <p class="text-xs text-muted-foreground mt-1">5 分钟前</p>
            </div>
          </div>
          <div class="flex gap-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer border-b">
            <div class="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500 text-white">⚙️</div>
            <div class="flex-1">
              <p class="text-sm">系统通知</p>
              <p class="text-sm text-muted-foreground">版本 v2.3.0 已发布。</p>
              <p class="text-xs text-muted-foreground mt-1">1 小时前</p>
            </div>
          </div>
        </div>
      </NotificationPage>
    `,
  }),
};

export const Empty: Story = {
  render: () => ({
    components: { NotificationPage },
    template: `
      <NotificationPage>
        <div class="flex flex-col items-center justify-center py-12 text-center">
          <p class="text-4xl mb-3">🔔</p>
          <p class="text-sm text-muted-foreground">暂无通知</p>
        </div>
      </NotificationPage>
    `,
  }),
};
