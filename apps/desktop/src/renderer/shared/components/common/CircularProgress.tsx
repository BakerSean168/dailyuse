/**
 * CircularProgress Component
 *
 * A circular progress indicator for showing completion status.
 * Supports determinate (with value) and indeterminate (spinning) modes.
 *
 * @module renderer/shared/components/common/CircularProgress
 */

import { cn } from '@dailyuse/ui-react-shadcn';
import type { HTMLAttributes } from 'react';

export interface CircularProgressProps extends HTMLAttributes<HTMLDivElement> {
  /** Progress value from 0 to 100. If undefined, shows indeterminate spinner. */
  value?: number;
  /** Size of the progress circle. */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Thickness of the progress stroke. */
  strokeWidth?: number;
  /** Color variant. */
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'destructive';
  /** Whether to show the progress value as text. */
  showValue?: boolean;
  /** Custom label to show instead of percentage. */
  label?: string;
}

const sizeMap = {
  sm: 24,
  md: 40,
  lg: 56,
  xl: 80,
};

const strokeWidthMap = {
  sm: 3,
  md: 4,
  lg: 5,
  xl: 6,
};

const variantStyles = {
  primary: 'stroke-primary',
  secondary: 'stroke-secondary',
  success: 'stroke-green-500',
  warning: 'stroke-yellow-500',
  destructive: 'stroke-destructive',
};

const textSizeMap = {
  sm: 'text-[8px]',
  md: 'text-xs',
  lg: 'text-sm',
  xl: 'text-lg',
};

/**
 * CircularProgress displays a circular progress indicator.
 *
 * @example
 * ```tsx
 * // Determinate progress
 * <CircularProgress value={75} showValue />
 *
 * // Indeterminate spinner
 * <CircularProgress size="lg" />
 *
 * // With custom label
 * <CircularProgress value={3} label="3/10" size="lg" />
 * ```
 */
export function CircularProgress({
  value,
  size = 'md',
  strokeWidth: customStrokeWidth,
  variant = 'primary',
  showValue = false,
  label,
  className,
  ...props
}: CircularProgressProps) {
  const diameter = sizeMap[size];
  const strokeWidth = customStrokeWidth ?? strokeWidthMap[size];
  const radius = (diameter - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  const isDeterminate = value !== undefined;
  const clampedValue = isDeterminate ? Math.min(100, Math.max(0, value)) : 0;
  const strokeDashoffset = circumference - (clampedValue / 100) * circumference;

  return (
    <div
      className={cn('relative inline-flex items-center justify-center', className)}
      style={{ width: diameter, height: diameter }}
      role="progressbar"
      aria-valuenow={isDeterminate ? clampedValue : undefined}
      aria-valuemin={0}
      aria-valuemax={100}
      {...props}
    >
      <svg
        className={cn(
          'transform -rotate-90',
          !isDeterminate && 'animate-spin'
        )}
        width={diameter}
        height={diameter}
      >
        {/* Background circle */}
        <circle
          className="stroke-muted"
          fill="none"
          strokeWidth={strokeWidth}
          r={radius}
          cx={diameter / 2}
          cy={diameter / 2}
        />
        {/* Progress circle */}
        <circle
          className={cn(
            variantStyles[variant],
            'transition-all duration-300 ease-in-out',
            !isDeterminate && 'opacity-75'
          )}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={isDeterminate ? strokeDashoffset : circumference * 0.75}
          r={radius}
          cx={diameter / 2}
          cy={diameter / 2}
        />
      </svg>

      {/* Center text */}
      {(showValue || label) && isDeterminate && (
        <span
          className={cn(
            'absolute font-medium text-foreground',
            textSizeMap[size]
          )}
        >
          {label ?? `${Math.round(clampedValue)}%`}
        </span>
      )}
    </div>
  );
}

export default CircularProgress;
