import type { Meta, StoryObj } from '@storybook/react';

// Example Button component for demonstration
function Button({ 
  label, 
  onClick,
  variant = 'primary'
}: { 
  label: string; 
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
}) {
  const styles = {
    padding: '10px 20px',
    borderRadius: '4px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    backgroundColor: variant === 'primary' ? '#0070f3' : '#eaeaea',
    color: variant === 'primary' ? '#ffffff' : '#000000',
  };

  return (
    <button style={styles} onClick={onClick}>
      {label}
    </button>
  );
}

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
