import type { Meta, StoryObj } from '@storybook/vue3-vite';
import TimelineControls from './TimelineControls.vue';

const now = Date.now();
const DAY = 86400000;

const mockSnapshots = [
  { timestamp: now - 30 * DAY, label: '1月前', totalWeight: 100, krWeights: [] },
  { timestamp: now - 20 * DAY, label: '20天前', totalWeight: 100, krWeights: [] },
  { timestamp: now - 10 * DAY, label: '10天前', totalWeight: 100, krWeights: [] },
  { timestamp: now, label: '今天', totalWeight: 100, krWeights: [] },
];

const meta = {
  title: 'Business/Goal/Timeline/TimelineControls',
  component: TimelineControls,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  argTypes: {
    snapshots: { description: '时间线快照', control: 'object' },
    currentIndex: { description: '当前索引', control: 'number' },
    isPlaying: { description: '是否播放中', control: 'boolean' },
    speed: { description: '播放速度', control: 'number' },
    loop: { description: '循环播放', control: 'boolean' },
  },
} satisfies Meta<typeof TimelineControls>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    snapshots: mockSnapshots as any,
    currentIndex: 0,
    isPlaying: false,
    speed: 1,
    loop: false,
  },
};

export const Playing: Story = {
  args: {
    snapshots: mockSnapshots as any,
    currentIndex: 2,
    isPlaying: true,
    speed: 2,
    loop: true,
  },
};

export const AtEnd: Story = {
  args: {
    snapshots: mockSnapshots as any,
    currentIndex: 3,
    isPlaying: false,
    speed: 1,
    loop: false,
  },
};
