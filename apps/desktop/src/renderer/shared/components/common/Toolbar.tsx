/**
 * Toolbar Component
 *
 * A flexible toolbar component for actions, filters, and controls.
 * Commonly used in list views for bulk actions and filtering.
 *
 * @module renderer/shared/components/common/Toolbar
 */

import { cn } from '@dailyuse/ui-react-shadcn';
import type { HTMLAttributes, ReactNode } from 'react';

export interface ToolbarProps extends HTMLAttributes<HTMLDivElement> {
  /** Content for the left side of the toolbar. */
  leftContent?: ReactNode;
  /** Content for the center of the toolbar. */
  centerContent?: ReactNode;
  /** Content for the right side of the toolbar. */
  rightContent?: ReactNode;
  /** Visual variant of the toolbar. */
  variant?: 'default' | 'bordered' | 'elevated';
  /** Size variant affecting padding. */
  size?: 'sm' | 'md' | 'lg';
  /** Whether the toolbar is sticky at the top. */
  sticky?: boolean;
}

const variantStyles = {
  default: 'bg-background',
  bordered: 'bg-background border-b border-border',
  elevated: 'bg-background shadow-sm',
};

const sizeStyles = {
  sm: 'px-2 py-1 gap-2',
  md: 'px-4 py-2 gap-4',
  lg: 'px-6 py-3 gap-6',
};

/**
 * Toolbar provides a flexible container for actions and controls.
 *
 * @example
 * ```tsx
 * <Toolbar
 *   leftContent={<SearchInput />}
 *   centerContent={<FilterTabs />}
 *   rightContent={<Button>New Item</Button>}
 *   variant="bordered"
 * />
 * ```
 */
export function Toolbar({
  leftContent,
  centerContent,
  rightContent,
  variant = 'default',
  size = 'md',
  sticky = false,
  className,
  children,
  ...props
}: ToolbarProps) {
  // If children are provided, use simple mode
  if (children) {
    return (
      <div
        className={cn(
          'flex items-center',
          variantStyles[variant],
          sizeStyles[size],
          sticky && 'sticky top-0 z-10',
          className
        )}
        role="toolbar"
        {...props}
      >
        {children}
      </div>
    );
  }

  // Otherwise, use three-section layout
  return (
    <div
      className={cn(
        'flex items-center justify-between',
        variantStyles[variant],
        sizeStyles[size],
        sticky && 'sticky top-0 z-10',
        className
      )}
      role="toolbar"
      {...props}
    >
      {/* Left section */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {leftContent}
      </div>

      {/* Center section */}
      {centerContent && (
        <div className="flex items-center gap-2 flex-1 justify-center">
          {centerContent}
        </div>
      )}

      {/* Right section */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {rightContent}
      </div>
    </div>
  );
}

/**
 * ToolbarGroup groups related toolbar items together.
 */
export interface ToolbarGroupProps extends HTMLAttributes<HTMLDivElement> {
  /** Gap between items. */
  gap?: 'sm' | 'md' | 'lg';
  /** Whether to show a separator before this group. */
  separator?: boolean;
}

const gapStyles = {
  sm: 'gap-1',
  md: 'gap-2',
  lg: 'gap-3',
};

export function ToolbarGroup({
  gap = 'md',
  separator = false,
  className,
  children,
  ...props
}: ToolbarGroupProps) {
  return (
    <>
      {separator && (
        <div className="h-6 w-px bg-border mx-2" aria-hidden="true" />
      )}
      <div
        className={cn('flex items-center', gapStyles[gap], className)}
        role="group"
        {...props}
      >
        {children}
      </div>
    </>
  );
}

/**
 * ToolbarSeparator provides a visual separator between toolbar items.
 */
export function ToolbarSeparator({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('h-6 w-px bg-border mx-2', className)}
      role="separator"
      aria-orientation="vertical"
      {...props}
    />
  );
}

export default Toolbar;
