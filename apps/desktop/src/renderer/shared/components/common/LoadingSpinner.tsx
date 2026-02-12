/**
 * LoadingSpinner Component
 * 加载状态指示器
 */

import * as React from 'react';
import { cn } from '@dailyuse/ui-react-shadcn';
import { Loader2 } from 'lucide-react';

export interface LoadingSpinnerProps {
  /** 大小 */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** 自定义类�?*/
  className?: string;
  /** 加载文本 */
  text?: string;
  /** 是否全屏居中 */
  fullScreen?: boolean;
}

const sizeMap = {
  sm: 16,
  md: 24,
  lg: 32,
  xl: 48,
};

export function LoadingSpinner({
  size = 'md',
  className,
  text,
  fullScreen = false,
}: LoadingSpinnerProps) {
  const spinner = (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      <Loader2 
        size={sizeMap[size]} 
        className="animate-spin text-primary" 
      />
      {text && (
        <span className="text-sm text-muted-foreground">{text}</span>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
        {spinner}
      </div>
    );
  }

  return spinner;
}

/**
 * LoadingOverlay - 覆盖在内容上的加载层
 */
export function LoadingOverlay({ 
  loading, 
  children,
  text,
}: { 
  loading: boolean; 
  children: React.ReactNode;
  text?: string;
}) {
  return (
    <div className="relative">
      {children}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm">
          <LoadingSpinner text={text} />
        </div>
      )}
    </div>
  );
}
