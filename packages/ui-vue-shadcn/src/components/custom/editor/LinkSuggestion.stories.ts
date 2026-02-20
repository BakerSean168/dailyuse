import type { Meta, StoryObj } from '@storybook/vue3-vite';
import LinkSuggestion from './LinkSuggestion.vue';

const meta = {
  title: 'Business/Editor/LinkSuggestion',
  component: LinkSuggestion,
  tags: ['autodocs'],
  argTypes: {
    visible: { control: 'boolean' },
    searchQuery: { control: 'text' },
  },
  args: {
    visible: true,
    searchQuery: '',
    position: { x: 100, y: 200 },
  },
} satisfies Meta<typeof LinkSuggestion>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    visible: true,
    searchQuery: '',
    position: { x: 100, y: 200 },
  },
};

export const WithSearchQuery: Story = {
  args: {
    visible: true,
    searchQuery: 'meeting',
    position: { x: 150, y: 250 },
  },
};

export const Hidden: Story = {
  args: {
    visible: false,
    searchQuery: '',
    position: { x: 100, y: 200 },
  },
};

export const PartialMatch: Story = {
  args: {
    visible: true,
    searchQuery: 'arc',
    position: { x: 200, y: 300 },
  },
};

export const TopLeftPosition: Story = {
  args: {
    visible: true,
    searchQuery: 'notes',
    position: { x: 0, y: 0 },
  },
};
