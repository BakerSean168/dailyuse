/**
 * DashboardWidget - 仪表�?Widget 基础容器组件
 *
 * 提供 Widget 的通用布局和功能：
 * - 标题栏（图标、标题、刷新按钮）
 * - 加载状态骨架屏
 * - 错误状态显�?
 * - 可折叠内容区�?
 *
 * @module dashboard/presentation/components
 */

import { useState, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Skeleton,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  cn,
} from '@dailyuse/ui-react-shadcn';

import { RefreshCw, ChevronDown, AlertCircle } from 'lucide-react';

// ============ Types ============

export type WidgetSize = 'small' | 'medium' | 'large';

export interface DashboardWidgetProps {
  /** Widget 标题 */
  title: string;
  /** Widget 图标 */
  icon?: React.ReactNode;
  /** Widget 尺寸 */
  size?: WidgetSize;
  /** 是否加载�?*/
  loading?: boolean;
  /** 错误信息 */
  error?: string | null;
  /** 刷新回调 */
  onRefresh?: () => Promise<void> | void;
  /** 是否可折�?*/
  collapsible?: boolean;
  /** 默认是否展开 */
  defaultExpanded?: boolean;
  /** 额外�?CSS 类名 */
  className?: string;
  /** 子内�?*/
  children: React.ReactNode;
  /** 头部右侧额外操作 */
  headerActions?: React.ReactNode;
}

// ============ Component ============

export function DashboardWidget({
  title,
  icon,
  size = 'small',
  loading = false,
  error,
  onRefresh,
  collapsible = false,
  defaultExpanded = true,
  className,
  children,
  headerActions,
}: DashboardWidgetProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 处理刷新
  const handleRefresh = useCallback(async () => {
    if (!onRefresh || isRefreshing) return;

    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  }, [onRefresh, isRefreshing]);

  // 获取尺寸对应的网格类
  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return 'col-span-1';
      case 'medium':
        return 'col-span-1 md:col-span-2';
      case 'large':
        return 'col-span-1 md:col-span-2 lg:col-span-3';
      default:
        return 'col-span-1';
    }
  };

  // 骨架屏高�?
  const getSkeletonHeight = () => {
    switch (size) {
      case 'small':
        return 'h-32';
      case 'medium':
        return 'h-40';
      case 'large':
        return 'h-48';
      default:
        return 'h-32';
    }
  };

  // 渲染内容
  const renderContent = () => {
    if (loading) {
      return (
        <div className="space-y-3">
          <Skeleton className={cn("w-full", getSkeletonHeight())} />
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <AlertCircle className="h-8 w-8 text-destructive mb-2" />
          <p className="text-sm text-muted-foreground">{error}</p>
          {onRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              className="mt-3"
            >
              重试
            </Button>
          )}
        </div>
      );
    }

    return children;
  };

  // 可折�?Widget
  if (collapsible) {
    return (
      <Collapsible
        open={isExpanded}
        onOpenChange={setIsExpanded}
        className={cn(getSizeClasses(), className)}
      >
        <Card className="h-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="p-0 h-auto hover:bg-transparent">
                <div className="flex items-center gap-2">
                  {icon}
                  <CardTitle className="text-lg font-semibold">{title}</CardTitle>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 text-muted-foreground transition-transform",
                      isExpanded && "rotate-180"
                    )}
                  />
                </div>
              </Button>
            </CollapsibleTrigger>
            <div className="flex items-center gap-1">
              {headerActions}
              {onRefresh && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleRefresh}
                  disabled={loading || isRefreshing}
                >
                  <RefreshCw
                    className={cn(
                      "h-4 w-4",
                      (loading || isRefreshing) && "animate-spin"
                    )}
                  />
                </Button>
              )}
            </div>
          </CardHeader>
          <CollapsibleContent>
            <CardContent className="pt-0">
              {renderContent()}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    );
  }

  // 普�?Widget
  return (
    <Card className={cn("h-full", getSizeClasses(), className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          {icon}
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        </div>
        <div className="flex items-center gap-1">
          {headerActions}
          {onRefresh && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleRefresh}
              disabled={loading || isRefreshing}
            >
              <RefreshCw
                className={cn(
                  "h-4 w-4",
                  (loading || isRefreshing) && "animate-spin"
                )}
              />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {renderContent()}
      </CardContent>
    </Card>
  );
}

export default DashboardWidget;
