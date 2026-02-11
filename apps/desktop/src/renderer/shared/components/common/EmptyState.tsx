/**
 * EmptyState Component
 * 显示空状态时的占位组�?
 */

import * as React from 'react';
import { cn } from '@dailyuse/ui-react-shadcn';
import type { LucideIcon } from 'lucide-react';
import { FileQuestion } from 'lucide-react';

export interface EmptyStateProps {
  /** 标题 */
  title?: string;
  /** 描述文本 */
  description?: string;
  /** 图标组件 */
  icon?: LucideIcon;
  /** 图标大小 */
  iconSize?: number;
  /** 操作按钮 */
  action?: React.ReactNode;
  /** 自定义类�?*/
  className?: string;
}

export function EmptyState({
  title = '暂无数据',
  description,
  icon: Icon = FileQuestion,
  iconSize = 48,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-12 px-4 text-center',
        className
      )}
    >
      <div className="mb-4 text-muted-foreground">
        <Icon size={iconSize} strokeWidth={1.5} />
      </div>
      
      {title && (
        <h3 className="text-lg font-medium text-foreground mb-2">
          {title}
        </h3>
      )}
      
      {description && (
        <p className="text-sm text-muted-foreground max-w-sm mb-4">
          {description}
        </p>
      )}
      
      {action && (
        <div className="mt-2">
          {action}
        </div>
      )}
    </div>
  );
}
