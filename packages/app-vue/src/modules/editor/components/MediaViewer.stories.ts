import type { Meta, StoryObj } from '@storybook/vue3-vite';
import MediaViewer from './MediaViewer.vue';

const meta = {
  title: 'Business/Editor/MediaViewer',
  component: MediaViewer,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  decorators: [() => ({ template: '<div style="width: 600px;"><story /></div>' })],
  argTypes: {
    filePath: { description: '文件路径', control: 'text' },
    fileType: { description: '文件类型', control: 'select', options: ['image', 'video', 'audio'] },
    fileName: { description: '文件名', control: 'text' },
  },
} satisfies Meta<typeof MediaViewer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Image: Story = {
  args: { filePath: 'https://placehold.co/600x400', fileType: 'image', fileName: 'example.png' },
};

export const Video: Story = {
  args: { filePath: 'https://www.w3schools.com/html/mov_bbb.mp4', fileType: 'video', fileName: 'demo.mp4' },
};

export const Audio: Story = {
  args: { filePath: 'https://www.w3schools.com/html/horse.ogg', fileType: 'audio', fileName: 'horse.ogg' },
};
