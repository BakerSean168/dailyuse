/**
 * PageContainer Component
 * 页面容器布局组件
 */

import * as React from 'react';
import { cn } from '@dailyuse/ui-react-shadcn';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@dailyuse/ui-react-shadcn';

export interface PageContainerProps {
  /** 页面标题 */
  title?: string;
  /** 页面描述 */
  description?: string;
  /** 右侧操作按钮 */
  actions?: React.ReactNode;
  /** 是否显示返回按钮 */
  showBack?: boolean;
  /** 返回回调 */
  onBack?: () => void;
  /** 子内�?*/
  children: React.ReactNode;
  /** 自定义类�?*/
  className?: string;
  /** 内容区域类名 */
  contentClassName?: string;
  /** 是否有内边距 */
  noPadding?: boolean;
  /** 是否可滚�?*/
  scrollable?: boolean;
}

export function PageContainer({
  title,
  description,
  actions,
  showBack = false,
  onBack,
  children,
  className,
  contentClassName,
  noPadding = false,
  scrollable = true,
}: PageContainerProps) {
  const hasHeader = title || actions || showBack;

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header */}
      {hasHeader && (
        <header className="flex items-center justify-between px-6 py-4 border-b bg-background shrink-0">
          <div className="flex items-center gap-4">
            {showBack && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onBack}
                className="shrink-0"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">返回</span>
              </Button>
            )}
            <div>
              {title && (
                <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
              )}
              {description && (
                <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
              )}
            </div>
          </div>
          
          {actions && (
            <div className="flex items-center gap-2">
              {actions}
            </div>
          )}
        </header>
      )}

      {/* Content */}
      <main
        className={cn(
          'flex-1 min-h-0',
          scrollable && 'overflow-auto',
          !noPadding && 'p-6',
          contentClassName
        )}
      >
        {children}
      </main>
    </div>
  );
}

/**
 * PageSection Component
 * 页面内的分区组件
 */
export interface PageSectionProps {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function PageSection({
  title,
  description,
  actions,
  children,
  className,
}: PageSectionProps) {
  return (
    <section className={cn('space-y-4', className)}>
      {(title || actions) && (
        <div className="flex items-center justify-between">
          <div>
            {title && (
              <h2 className="text-lg font-medium">{title}</h2>
            )}
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          {actions && (
            <div className="flex items-center gap-2">{actions}</div>
          )}
        </div>
      )}
      {children}
    </section>
  );
}
