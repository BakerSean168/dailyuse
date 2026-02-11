import type { Meta, StoryObj } from '@storybook/vue3';

// Example Button component for demonstration
const Button = {
  name: 'Button',
  props: {
    label: {
      type: String,
      required: true,
    },
    variant: {
      type: String,
      default: 'primary',
      validator: (value: string) => ['primary', 'secondary'].includes(value),
    },
  },
  template: `
    <button :style="styles" @click="handleClick">
      {{ label }}
    </button>
  `,
  computed: {
    styles() {
      return {
        padding: '10px 20px',
        borderRadius: '4px',
        border: 'none',
        cursor: 'pointer',
        fontSize: '14px',
        backgroundColor: this.variant === 'primary' ? '#0070f3' : '#eaeaea',
        color: this.variant === 'primary' ? '#ffffff' : '#000000',
      };
    },
  },
  methods: {
    handleClick() {
      console.log('Button clicked');
    },
  },
};

const meta: Meta<typeof Button> = {
  title: 'Example/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    label: 'Primary Button',
    variant: 'primary',
  },
};

export const Secondary: Story = {
  args: {
    label: 'Secondary Button',
    variant: 'secondary',
  },
};
