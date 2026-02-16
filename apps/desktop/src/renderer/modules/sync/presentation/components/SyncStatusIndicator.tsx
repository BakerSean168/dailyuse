/**
 * SyncStatusIndicator Component
 *
 * 同步状态指示器组件
 */

import { RefreshCw, Check, AlertCircle, Cloud, CloudOff, Loader2 } from 'lucide-react';
import {
  Badge,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  Button,
} from '@dailyuse/ui-react-shadcn';
import { useSyncStatus, useSync } from '../hooks';

interface SyncStatusIndicatorProps {
  showLabel?: boolean;
  compact?: boolean;
  className?: string;
}

type StatusLabel = 'idle' | 'syncing' | 'error' | 'offline' | 'conflict';

const statusConfig: Record<
  StatusLabel,
  {
    icon: typeof RefreshCw;
    label: string;
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
    color: string;
  }
> = {
  idle: {
    icon: Cloud,
    label: '已同',
    variant: 'secondary',
    color: 'text-muted-foreground',
  },
  syncing: {
    icon: Loader2,
    label: '同步',
    variant: 'default',
    color: 'text-blue-500',
  },
  error: {
    icon: AlertCircle,
    label: '同步失败',
    variant: 'destructive',
    color: 'text-destructive',
  },
  conflict: {
    icon: AlertCircle,
    label: '有冲',
    variant: 'destructive',
    color: 'text-orange-500',
  },
  offline: {
    icon: CloudOff,
    label: '离线',
    variant: 'outline',
    color: 'text-muted-foreground',
  },
};

export function SyncStatusIndicator({
  showLabel = true,
  compact = false,
  className = '',
}: SyncStatusIndicatorProps) {
  const { status, loading, error, refresh } = useSyncStatus();
  const { startSync, syncing } = useSync();

  const state: StatusLabel = status?.state?.statusLabel ?? 'idle';
  const config = statusConfig[state];
  const Icon = config.icon;

  const handleClick = async () => {
    if (state === 'error') {
      await startSync();
    } else if (state === 'idle') {
      await startSync();
    }
  };

  const tooltipContent = () => {
    if (loading) return '加载中...';
    if (error) return `错误: ${error.message}`;
    if (!status) return '未知状';

    const parts = [config.label];
    if (status.state?.lastSyncAt) {
      const date = new Date(status.state.lastSyncAt);
      parts.push(`上次同步: ${date.toLocaleString()}`);
    }
    if (status.pendingChangesCount && status.pendingChangesCount > 0) {
      parts.push(`待同` ${status.pendingChangesCount} 项`);
    }
    if (status.state?.statusDescription) {
      parts.push(`状` ${status.state.statusDescription}`);
    }
    return parts.join('\n');
  };

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 ${className}`}
              onClick={handleClick}
              disabled={syncing || state === 'syncing'}
            >
              <Icon
                className={`h-4 w-4 ${config.color} ${state === 'syncing' ? 'animate-spin' : ''}`}
              />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <pre className="text-xs whitespace-pre-wrap">{tooltipContent()}</pre>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={`gap-2 ${className}`}
            onClick={handleClick}
            disabled={syncing || state === 'syncing'}
          >
            <Icon
              className={`h-4 w-4 ${config.color} ${state === 'syncing' ? 'animate-spin' : ''}`}
            />
            {showLabel && <span className="text-sm">{config.label}</span>}
            {status?.pendingChangesCount && status.pendingChangesCount > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                {status.pendingChangesCount}
              </Badge>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <pre className="text-xs whitespace-pre-wrap">{tooltipContent()}</pre>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
