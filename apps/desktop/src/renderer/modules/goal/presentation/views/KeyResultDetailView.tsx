/**
 * KeyResultDetailView Component
 *
 * 关键结果详情视图 - 展示关键结果的完整信息和进度记录
 */

import { useState, useEffect, useCallback } from 'react';
import type { Goal, KeyResult, GoalRecord } from '@dailyuse/goal/domain-client';
import { goalApplicationService } from '@dailyuse/goal/application-client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@dailyuse/ui-react-shadcn';
import { Button } from '@dailyuse/ui-react-shadcn';
import { Badge } from '@dailyuse/ui-react-shadcn';
import { Progress } from '@dailyuse/ui-react-shadcn';
import { ScrollArea } from '@dailyuse/ui-react-shadcn';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Clock,
  Edit,
  MoreHorizontal,
  Plus,
  Target,
  Trash2,
  TrendingUp,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  cn,
} from '@dailyuse/ui-react-shadcn';

// Components
import { GoalRecordCard } from '../components/GoalRecordCard';
import { GoalRecordDialog } from '../components/GoalRecordDialog';
import { KeyResultDialog } from '../components/KeyResultDialog';
import type { AddKeyResultRequest, UpdateKeyResultRequest } from '@dailyuse/contracts/goal';

// Hooks
import { useKeyResult } from '../hooks';

interface KeyResultDetailViewProps {
  goalId: string;
  keyResultId: string;
  onBack?: () => void;
  onGoalUpdated?: () => void;
}

export function KeyResultDetailView({
  goalId,
  keyResultId,
  onBack,
  onGoalUpdated,
}: KeyResultDetailViewProps) {
  // State
  const [goal, setGoal] = useState<Goal | null>(null);
  const [keyResult, setKeyResult] = useState<KeyResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog State
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showRecordDialog, setShowRecordDialog] = useState(false);

  // Hooks
  const {
    updateKeyResult,
    deleteKeyResult,
    createRecord,
    deleteRecord,
    loading: operationLoading,
  } = useKeyResult();

  const goalColor = goal?.color || '#3b82f6';

  // Load Data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const goalData = await goalApplicationService.getGoal(goalId);
      if (!goalData) {
        setError('目标不存');
        return;
      }
      setGoal(goalData);

      const krData = goalData.keyResults?.find((kr) => kr.id === keyResultId);
      if (krData) {
        setKeyResult(krData);
      } else {
        setError('关键结果不存');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
      console.error('[KeyResultDetailView] Failed to load:', err);
    } finally {
      setLoading(false);
    }
  }, [goalId, keyResultId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handlers
  const handleSaveKeyResult = async (data: AddKeyResultRequest | UpdateKeyResultRequest) => {
    if (!goal || !keyResult) return;

    // 这里只处理更新场�?
    await updateKeyResult(goal.id, keyResult.id, data as UpdateKeyResultRequest);

    await loadData();
    onGoalUpdated?.();
    setShowEditDialog(false);
  };

  const handleSaveRecord = async (data: { value: number; note?: string }) => {
    if (!goal || !keyResult) return;

    await createRecord(goal.id, keyResult.id, data);
    await loadData();
    onGoalUpdated?.();
    setShowRecordDialog(false);
  };

  const handleDeleteRecord = async (recordId: string) => {
    if (!goal || !keyResult || !confirm('确定要删除这条记录吗')) return;

    try {
      await deleteRecord(goal.id, keyResult.id, recordId);
      await loadData();
      onGoalUpdated?.();
    } catch (err) {
      console.error('[KeyResultDetailView] Failed to delete record:', err);
    }
  };

  const handleDelete = async () => {
    if (!goal || !keyResult || !confirm('确定要删除这个关键结果吗？相关记录也会被删除')) {
      return;
    }

    try {
      await deleteKeyResult(goal.id, keyResult.id);
      onGoalUpdated?.();
      onBack?.();
    } catch (err) {
      console.error('[KeyResultDetailView] Failed to delete key result:', err);
    }
  };

  // Loading State
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="text-destructive">{error}</div>
        <Button onClick={loadData}>重试</Button>
      </div>
    );
  }

  // No Data
  if (!goal || !keyResult) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Target className="h-16 w-16 text-muted-foreground" />
        <div className="text-muted-foreground">关键结果不存</div>
        <Button onClick={onBack}>返回</Button>
      </div>
    );
  }

  const isCompleted = keyResult.progressPercentage >= 100;
  const records = keyResult.records || [];

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b bg-card">
        <div className="flex items-start gap-4">
          {/* Back Button */}
          {onBack && (
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}

          {/* KeyResult Info */}
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 relative"
            style={{ backgroundColor: `${goalColor}20` }}
          >
            {isCompleted ? (
              <CheckCircle className="h-6 w-6 text-green-500" />
            ) : (
              <Target className="h-6 w-6" style={{ color: goalColor }} />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl font-bold truncate">{keyResult.title}</h1>
              {isCompleted && (
                <Badge className="bg-green-100 text-green-800">已完</Badge>
              )}
            </div>
            {keyResult.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {keyResult.description}
              </p>
            )}
            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
              <span>所属目标:</span>
              <Badge variant="outline" style={{ borderColor: goalColor, color: goalColor }}>
                {goal.title}
              </Badge>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button onClick={() => setShowRecordDialog(true)}>
              <Plus className="h-4 w-4 mr-1" />
              添加记录
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  编辑
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive" onClick={handleDelete}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  删除
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Progress */}
        <div className="mt-6 grid grid-cols-3 gap-4">
          {/* Progress Bar */}
          <div className="col-span-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">进度</span>
              <span className="text-sm font-bold" style={{ color: goalColor }}>
                {Math.round(keyResult.progressPercentage)}%
              </span>
            </div>
            <Progress value={keyResult.progressPercentage} className="h-3" />
          </div>

          {/* Value Display */}
          <Card className="p-4">
            <div className="flex items-center gap-2 justify-center">
              <Badge
                variant="secondary"
                className="text-lg font-bold"
                style={{ backgroundColor: `${goalColor}20`, color: goalColor }}
              >
                {keyResult.progress.currentValue}
              </Badge>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <Badge variant="outline" className="text-lg font-bold">
                {keyResult.progress.targetValue}
              </Badge>
            </div>
            <div className="text-xs text-center text-muted-foreground mt-2">
              当前�?�?目标�?
            </div>
          </Card>
        </div>

        {/* Meta Info */}
        <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <TrendingUp className="h-4 w-4" />
            <span>权重: {keyResult.weight}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{keyResult.aggregationMethodText}</span>
          </div>
          <div className="flex items-center gap-1">
            <Target className="h-4 w-4" />
            <span>{records.length} 条记�?/span>
          </div>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6">
          {/* Records List */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-lg">进度记录</CardTitle>
                <CardDescription>
                  {keyResult.calculationExplanation}
                </CardDescription>
              </div>
              <Button size="sm" onClick={() => setShowRecordDialog(true)}>
                <Plus className="h-4 w-4 mr-1" />
                添加
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {records.length > 0 ? (
                records.map((record) => (
                  <GoalRecordCard
                    key={record.id}
                    record={record}
                    goalColor={goalColor}
                    onDelete={handleDeleteRecord}
                  />
                ))
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="mb-4">暂无进度记录</p>
                  <Button onClick={() => setShowRecordDialog(true)}>
                    <Plus className="h-4 w-4 mr-1" />
                    添加第一条记�?
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Statistics */}
          {records.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">统计信息</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold" style={{ color: goalColor }}>
                    {records.length}
                  </div>
                  <div className="text-sm text-muted-foreground">记录</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {records.reduce((sum, r) => sum + r.value, 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">累计</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {(records.reduce((sum, r) => sum + r.value, 0) / records.length).toFixed(1)}
                  </div>
                  <div className="text-sm text-muted-foreground">平均</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {Math.max(...records.map((r) => r.value))}
                  </div>
                  <div className="text-sm text-muted-foreground">最大</div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </ScrollArea>

      {/* Dialogs */}
      <KeyResultDialog
        open={showEditDialog}
        goalId={goal.id}
        goal={goal}
        keyResult={keyResult}
        onClose={() => setShowEditDialog(false)}
        onSave={handleSaveKeyResult}
      />

      <GoalRecordDialog
        open={showRecordDialog}
        goalId={goal.id}
        keyResultId={keyResult.id}
        keyResult={keyResult}
        goalColor={goalColor}
        onClose={() => setShowRecordDialog(false)}
        onSave={handleSaveRecord}
      />
    </div>
  );
}

export default KeyResultDetailView;
