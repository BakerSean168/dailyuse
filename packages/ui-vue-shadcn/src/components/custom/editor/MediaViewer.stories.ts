import type { Meta, StoryObj } from '@storybook/vue3-vite';
import MediaViewer from './MediaViewer.vue';

const meta = {
  title: 'Business/Editor/MediaViewer',
  component: MediaViewer,
  tags: ['autodocs'],
  argTypes: {
    filePath: { control: 'text' },
    fileType: {
      control: 'select',
      options: ['image', 'video', 'audio'],
    },
    fileName: { control: 'text' },
  },
  args: {
    filePath: 'https://via.placeholder.com/600x400',
    fileType: 'image',
    fileName: 'sample-image.png',
  },
} satisfies Meta<typeof MediaViewer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ImageFile: Story = {
  args: {
    filePath: 'https://via.placeholder.com/600x400',
    fileType: 'image',
    fileName: 'photo.png',
  },
};

export const VideoFile: Story = {
  args: {
    filePath: '/media/sample-video.mp4',
    fileType: 'video',
    fileName: 'presentation.mp4',
  },
};

export const AudioFile: Story = {
  args: {
    filePath: '/media/sample-audio.mp3',
    fileType: 'audio',
    fileName: 'recording.mp3',
  },
};

export const WithoutFileName: Story = {
  args: {
    filePath: 'https://via.placeholder.com/800x600',
    fileType: 'image',
  },
};

export const LongFileName: Story = {
  args: {
    filePath: '/media/screenshot.png',
    fileType: 'image',
    fileName: 'very-long-file-name-that-might-overflow-the-container-screenshot-2024.png',
  },
};
