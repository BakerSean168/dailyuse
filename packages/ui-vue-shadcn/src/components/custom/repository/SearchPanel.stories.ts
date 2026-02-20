import type { Meta, StoryObj } from '@storybook/vue3-vite';
import SearchPanel from './SearchPanel.vue';

const meta = {
  title: 'Business/Repository/SearchPanel',
  component: SearchPanel,
  tags: ['autodocs'],
  argTypes: {
    searching: { control: 'boolean' },
    hasSearched: { control: 'boolean' },
    totalResults: { control: 'number' },
    totalMatches: { control: 'number' },
    searchTime: { control: 'number' },
  },
  args: {
    repositoryId: 'repo-1',
    searching: false,
    hasSearched: false,
  },
} satisfies Meta<typeof SearchPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockResults = [
  {
    id: 'res-1',
    name: 'Getting Started.md',
    path: '/docs/Getting Started.md',
    matches: [
      { line: 5, content: 'Welcome to the **knowledge base** platform.', highlight: [19, 33] },
      { line: 12, content: 'Use the **knowledge base** to organize your research.', highlight: [9, 23] },
    ],
  },
  {
    id: 'res-2',
    name: 'Architecture.md',
    path: '/docs/technical/Architecture.md',
    matches: [
      { line: 23, content: 'The knowledge layer handles core business logic.', highlight: [4, 13] },
    ],
  },
  {
    id: 'res-3',
    name: 'FAQ.md',
    path: '/FAQ.md',
    matches: [
      { line: 8, content: 'Q: How do I create a new knowledge entry?', highlight: [30, 39] },
      { line: 15, content: 'Knowledge management is a core feature.', highlight: [0, 9] },
      { line: 42, content: 'Share knowledge across your team.', highlight: [6, 15] },
    ],
  },
];

export const Default: Story = {
  args: {},
};

export const WithResults: Story = {
  args: {
    results: mockResults,
    hasSearched: true,
    totalResults: 3,
    totalMatches: 6,
    searchTime: 0.045,
  },
};

export const Searching: Story = {
  args: {
    searching: true,
    hasSearched: false,
  },
};

export const NoResults: Story = {
  args: {
    results: [],
    hasSearched: true,
    totalResults: 0,
    totalMatches: 0,
    searchTime: 0.012,
  },
};
