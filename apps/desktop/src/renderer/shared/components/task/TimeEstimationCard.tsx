/**
 * TimeEstimationCard Component
 *
 * 时间预估卡片 - 显示和管理任务的时间预估
 * 
 * TODO: 完整实现�?EPIC-013 AI 辅助功能
 */

import type { TimeEstimate } from '@dailyuse/contracts/goal';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@dailyuse/ui-react-shadcn';
import { Clock, Loader2 } from 'lucide-react';
import { Button } from '@dailyuse/ui-react-shadcn';

export interface TimeEstimationCardProps {
  estimate?: TimeEstimate | null;
  isEstimating?: boolean;
  showDetails?: boolean;
  onRequestEstimate?: () => void;
  onReEstimate?: () => void | Promise<void>;
  onEstimateChange?: (minutes: number) => void | Promise<void>;
}

export function TimeEstimationCard({
  estimate,
  isEstimating,
  showDetails,
  onRequestEstimate,
  onReEstimate,
  onEstimateChange,
}: TimeEstimationCardProps) {
  if (isEstimating) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
          <span className="text-sm text-muted-foreground">正在估算时间...</span>
        </CardContent>
      </Card>
    );
  }

  if (!estimate) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Clock className="h-4 w-4" />
            时间预估
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-sm text-muted-foreground mb-3">
            暂无时间预估数据
          </p>
          {onRequestEstimate && (
            <Button variant="outline" size="sm" onClick={onRequestEstimate}>
              获取 AI 预估
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Clock className="h-4 w-4" />
          时间预估
        </CardTitle>
        <CardDescription>
          预估完成时间: {estimate.estimatedMinutes} 分钟
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        {showDetails && estimate.confidenceScore !== undefined && (
          <p className="text-xs text-muted-foreground">
            置信�? {Math.round(estimate.confidenceScore * 100)}%
          </p>
        )}
        {showDetails && estimate.reasoning && (
          <p className="text-xs text-muted-foreground mt-1">
            {estimate.reasoning}
          </p>
        )}
        {(onReEstimate || onEstimateChange) && (
          <div className="flex gap-2 mt-3">
            {onReEstimate && (
              <Button variant="outline" size="sm" onClick={onReEstimate}>
                重新估算
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
