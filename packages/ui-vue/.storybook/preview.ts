import type { Preview } from '@storybook/vue3-vite';
import '../src/assets/main.css';
import '../../ui-core/src/styles/theme.css';
const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
  },

  tags: ['autodocs']
};

export default preview;
