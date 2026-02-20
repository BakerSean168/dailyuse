import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import TimelineControls from './TimelineControls.vue';

const mockSnapshots = [
  { id: 's1', date: '2024-01-01', label: '项目启动', progress: 0 },
  { id: 's2', date: '2024-02-01', label: '第一次迭代完成', progress: 15 },
  { id: 's3', date: '2024-03-01', label: 'v1.0 上线', progress: 35 },
  { id: 's4', date: '2024-04-01', label: '用户增长活动', progress: 55 },
  { id: 's5', date: '2024-05-01', label: '性能优化完成', progress: 72 },
  { id: 's6', date: '2024-06-01', label: '年中复盘', progress: 85 },
];

const meta = {
  title: 'Business/Goal/Timeline/TimelineControls',
  component: TimelineControls,
  tags: ['autodocs'],
  argTypes: {
    speed: { control: 'select', options: [0.5, 1, 2] },
    loop: { control: 'boolean' },
    isPlaying: { control: 'boolean' },
  },
  args: {
    snapshots: mockSnapshots,
    currentIndex: 0,
    isPlaying: false,
    speed: 1,
    loop: false,
  },
  decorators: [() => ({ template: '<div style="max-width: 600px;"><story /></div>' })],
} satisfies Meta<typeof TimelineControls>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => ({
    components: { TimelineControls },
    setup() {
      const currentIndex = ref(args.currentIndex);
      const isPlaying = ref(args.isPlaying);
      const speed = ref(args.speed);
      const loop = ref(args.loop);
      return { args, currentIndex, isPlaying, speed, loop };
    },
    template: `<TimelineControls
      v-bind="args"
      v-model:currentIndex="currentIndex"
      v-model:isPlaying="isPlaying"
      v-model:speed="speed"
      v-model:loop="loop"
    />`,
  }),
};

export const Playing: Story = {
  render: (args) => ({
    components: { TimelineControls },
    setup() {
      const currentIndex = ref(args.currentIndex);
      const isPlaying = ref(args.isPlaying);
      const speed = ref(args.speed);
      const loop = ref(args.loop);
      return { args, currentIndex, isPlaying, speed, loop };
    },
    template: `<TimelineControls
      v-bind="args"
      v-model:currentIndex="currentIndex"
      v-model:isPlaying="isPlaying"
      v-model:speed="speed"
      v-model:loop="loop"
    />`,
  }),
  args: {
    currentIndex: 2,
    isPlaying: true,
    speed: 1,
    loop: true,
  },
};

export const FastSpeed: Story = {
  render: (args) => ({
    components: { TimelineControls },
    setup() {
      const currentIndex = ref(args.currentIndex);
      const isPlaying = ref(args.isPlaying);
      const speed = ref(args.speed);
      const loop = ref(args.loop);
      return { args, currentIndex, isPlaying, speed, loop };
    },
    template: `<TimelineControls
      v-bind="args"
      v-model:currentIndex="currentIndex"
      v-model:isPlaying="isPlaying"
      v-model:speed="speed"
      v-model:loop="loop"
    />`,
  }),
  args: {
    currentIndex: 4,
    isPlaying: false,
    speed: 2,
    loop: false,
  },
};

export const FewSnapshots: Story = {
  render: (args) => ({
    components: { TimelineControls },
    setup() {
      const currentIndex = ref(args.currentIndex);
      const isPlaying = ref(args.isPlaying);
      const speed = ref(args.speed);
      const loop = ref(args.loop);
      return { args, currentIndex, isPlaying, speed, loop };
    },
    template: `<TimelineControls
      v-bind="args"
      v-model:currentIndex="currentIndex"
      v-model:isPlaying="isPlaying"
      v-model:speed="speed"
      v-model:loop="loop"
    />`,
  }),
  args: {
    snapshots: [mockSnapshots[0], mockSnapshots[5]],
    currentIndex: 0,
  },
};
