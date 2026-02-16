/**
 * ConflictAlert Component
 *
 * 时间冲突警告组件
 * 功能�?
 * 1. 显示冲突数量和详�?
 * 2. 提供解决建议
 * 3. 可关�?
 */

import { useMemo } from 'react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import type { ConflictDetectionResult, ConflictSuggestion } from '@dailyuse/contracts/schedule';
import { Alert, AlertDescription, AlertTitle } from '@dailyuse/ui-react-shadcn';
import { Badge } from '@dailyuse/ui-react-shadcn';
import { Button } from '@dailyuse/ui-react-shadcn';
import { AlertTriangle, Clock, X, Lightbulb } from 'lucide-react';

// ===================== 接口定义 =====================

interface ConflictAlertProps {
  conflictResult: ConflictDetectionResult | null;
  onDismiss?: () => void;
  onApplySuggestion?: (suggestion: ConflictSuggestion) => void;
}

// ===================== 工具函数 =====================

function formatDuration(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  const hours = Math.floor(minutes / 60);
  if (hours > 0) {
    const remainingMins = minutes % 60;
    return remainingMins > 0 ? `${hours}小时${remainingMins}分钟` : `${hours}小时`;
  }
  return `${minutes}分钟`;
}

function formatTime(date: Date | number): string {
  const d = typeof date === 'number' ? new Date(date) : date;
  return format(d, 'HH:mm', { locale: zhCN });
}

function formatSuggestion(suggestion: ConflictSuggestion): string {
  const startTime = formatTime(suggestion.newStartTime);
  const endTime = formatTime(suggestion.newEndTime);

  switch (suggestion.type) {
    case 'move_earlier':
      return `提前`${startTime}-${endTime}`;
    case 'move_later':
      return `延后`${startTime}-${endTime}`;
    case 'shorten':
      return `缩短`${startTime}-${endTime}`;
    default:
      return `调整`${startTime}-${endTime}`;
  }
}

function getSuggestionLabel(type: string): string {
  switch (type) {
    case 'move_earlier':
      return '提前';
    case 'move_later':
      return '延后';
    case 'shorten':
      return '缩短';
    default:
      return '调整';
  }
}

// ===================== 组件 =====================

export function ConflictAlert({
  conflictResult,
  onDismiss,
  onApplySuggestion,
}: ConflictAlertProps) {
  // 如果没有冲突，不渲染
  if (!conflictResult || !conflictResult.hasConflict) {
    return null;
  }

  const { conflicts, suggestions } = conflictResult;

  return (
    <Alert className="bg-yellow-50 border-yellow-200 relative">
      {/* 关闭按钮 */}
      {onDismiss && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 h-6 w-6"
          onClick={onDismiss}
        >
          <X className="h-4 w-4" />
        </Button>
      )}

      <AlertTriangle className="h-4 w-4 text-yellow-600" />
      
      <AlertTitle className="text-yellow-800 flex items-center gap-2">
        检测到 {conflicts.length} 个时间冲�?
      </AlertTitle>

      <AlertDescription className="mt-2 space-y-3">
        {/* 冲突详情 */}
        <div className="space-y-1">
          {conflicts.map((conflict) => (
            <div
              key={conflict.scheduleUuid}
              className="flex items-center gap-2 text-sm text-yellow-700"
            >
              <Clock className="h-3 w-3 shrink-0" />
              <span>
                与「{conflict.scheduleTitle}」重�?{formatDuration(conflict.overlapDuration)}
              </span>
            </div>
          ))}
        </div>

        {/* 解决建议 */}
        {suggestions && suggestions.length > 0 && (
          <div className="pt-2 border-t border-yellow-200">
            <div className="flex items-center gap-1 text-sm font-medium text-yellow-800 mb-2">
              <Lightbulb className="h-4 w-4" />
              建议解决方案
            </div>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="cursor-pointer hover:bg-yellow-100 text-yellow-700 border-yellow-300"
                  onClick={() => onApplySuggestion?.(suggestion)}
                >
                  {getSuggestionLabel(suggestion.type)}: {formatSuggestion(suggestion)}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
}

export default ConflictAlert;
