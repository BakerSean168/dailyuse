/**
 * GoalDetailView Component
 *
 * 目标详情视图 - 完整展示目标信息、关键结果、复盘记录
 */

import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import type { Goal, KeyResult, GoalReview } from '@dailyuse/goal/domain-client';
import { GoalStatus } from '@dailyuse/contracts/goal';
import { goalApplicationService } from '../../application/services';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@dailyuse/ui-shadcn';
import { Button } from '@dailyuse/ui-shadcn';
import { Badge } from '@dailyuse/ui-shadcn';
import { Progress } from '@dailyuse/ui-shadcn';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@dailyuse/ui-shadcn';
import { ScrollArea } from '@dailyuse/ui-shadcn';
import { Separator } from '@dailyuse/ui-shadcn';
import {
  ArrowLeft,
  Calendar,
  CheckCircle,
  Clock,
  Edit,
  Folder,
  MoreHorizontal,
  Plus,
  Target,
  Trash2,
  TrendingUp,
  Archive,
  Play,
  BookOpen,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@dailyuse/ui-shadcn';

// Components
import { KeyResultCard } from '../components/KeyResultCard';
import { GoalReviewCard } from '../components/GoalReviewCard';
import { KeyResultDialog } from '../components/KeyResultDialog';
import { GoalRecordDialog } from '../components/GoalRecordDialog';
import { GoalReviewDialog } from '../components/GoalReviewDialog';
import type { 
  AddKeyResultRequest, 
  UpdateKeyResultRequest,
  CreateGoalReviewRequest,
  UpdateGoalReviewRequest,
} from '@dailyuse/contracts/goal';

// Hooks
import { useKeyResult, useGoalReview } from '../hooks';

interface GoalDetailViewProps {
  goalUuid: string;
  onBack?: () => void;
  onGoalUpdated?: () => void;
}

// 状态配置
const STATUS_CONFIG: Record<GoalStatus, { label: string; color: string; icon: typeof Target }> = {
  [GoalStatus.DRAFT]: { label: '草稿', color: 'bg-gray-100 text-gray-800', icon: Edit },
  [GoalStatus.ACTIVE]: { label: '进行中', color: 'bg-blue-100 text-blue-800', icon: Play },
  [GoalStatus.COMPLETED]: { label: '已完成', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  [GoalStatus.ARCHIVED]: { label: '已归档', color: 'bg-yellow-100 text-yellow-800', icon: Archive },
};

export function GoalDetailView({ goalUuid, onBack, onGoalUpdated }: GoalDetailViewProps) {
  // Goal State
  const [goal, setGoal] = useState<Goal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Dialog State
  const [showKeyResultDialog, setShowKeyResultDialog] = useState(false);
  const [showRecordDialog, setShowRecordDialog] = useState(false);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [selectedKeyResult, setSelectedKeyResult] = useState<KeyResult | null>(null);

  // Hooks
  const {
    createKeyResult,
    updateKeyResult,
    deleteKeyResult,
    createRecord,
    loading: keyResultLoading,
  } = useKeyResult();

  const {
    reviews,
    loadReviews,
    createReview,
    deleteReview,
    loading: reviewLoading,
  } = useGoalReview();

  const goalColor = goal?.color || '#3b82f6';

  // Load Goal
  const loadGoal = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await goalApplicationService.getGoal(goalUuid);
      setGoal(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载目标失败');
      console.error('[GoalDetailView] Failed to load goal:', err);
    } finally {
      setLoading(false);
    }
  }, [goalUuid]);

  // Load Reviews when tab changes
  useEffect(() => {
    if (activeTab === 'reviews' && goal) {
      loadReviews(goal.uuid);
    }
  }, [activeTab, goal, loadReviews]);

  useEffect(() => {
    loadGoal();
  }, [loadGoal]);

  // Handlers
  const handleStatusChange = async (newStatus: 'complete' | 'archive' | 'activate') => {
    if (!goal) return;

    try {
      if (newStatus === 'complete') {
        await goalApplicationService.completeGoal(goal.uuid);
      } else if (newStatus === 'archive') {
        await goalApplicationService.archiveGoal(goal.uuid);
      } else if (newStatus === 'activate') {
        await goalApplicationService.activateGoal(goal.uuid);
      }
      await loadGoal();
      onGoalUpdated?.();
    } catch (err) {
      console.error('[GoalDetailView] Failed to change status:', err);
      setError(err instanceof Error ? err.message : '操作失败');
    }
  };

  const handleAddKeyResult = () => {
    setSelectedKeyResult(null);
    setShowKeyResultDialog(true);
  };

  const handleEditKeyResult = (keyResultUuid: string) => {
    const kr = goal?.keyResults?.find((k) => k.uuid === keyResultUuid);
    if (kr) {
      setSelectedKeyResult(kr);
      setShowKeyResultDialog(true);
    }
  };

  const handleAddRecord = (keyResultUuid: string) => {
    const kr = goal?.keyResults?.find((k) => k.uuid === keyResultUuid);
    if (kr) {
      setSelectedKeyResult(kr);
      setShowRecordDialog(true);
    }
  };

  const handleDeleteKeyResult = async (keyResultUuid: string) => {
    if (!goal || !confirm('确定要删除这个关键结果吗？相关记录也会被删除。')) return;

    try {
      await deleteKeyResult(goal.uuid, keyResultUuid);
      await loadGoal();
    } catch (err) {
      console.error('[GoalDetailView] Failed to delete key result:', err);
    }
  };

  const handleSaveKeyResult = async (data: AddKeyResultRequest | UpdateKeyResultRequest) => {
    if (!goal) return;

    if (selectedKeyResult) {
      // Update 模式 - data 是 UpdateKeyResultRequest
      const updateData = data as UpdateKeyResultRequest;
      await updateKeyResult(goal.uuid, selectedKeyResult.uuid, updateData);
    } else {
      // Create 模式 - data 是 AddKeyResultRequest
      const createData = data as AddKeyResultRequest;
      await createKeyResult(goal.uuid, createData);
    }
    await loadGoal();
    setShowKeyResultDialog(false);
  };

  const handleSaveRecord = async (data: { value: number; note?: string }) => {
    if (!goal || !selectedKeyResult) return;

    await createRecord(goal.uuid, selectedKeyResult.uuid, data);
    await loadGoal();
    setShowRecordDialog(false);
  };

  const handleSaveReview = async (data: CreateGoalReviewRequest | UpdateGoalReviewRequest) => {
    if (!goal) return;

    // 直接传递 contracts 类型
    await createReview(goal.uuid, data as CreateGoalReviewRequest);
    setShowReviewDialog(false);
  };

  const handleDeleteReview = async (reviewUuid: string) => {
    if (!goal || !confirm('确定要删除这条复盘记录吗？')) return;

    try {
      await deleteReview(goal.uuid, reviewUuid);
    } catch (err) {
      console.error('[GoalDetailView] Failed to delete review:', err);
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
        <Button onClick={loadGoal}>重试</Button>
      </div>
    );
  }

  // No Goal
  if (!goal) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Target className="h-16 w-16 text-muted-foreground" />
        <div className="text-muted-foreground">目标不存在</div>
        <Button onClick={onBack}>返回列表</Button>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[goal.status as GoalStatus] || STATUS_CONFIG[GoalStatus.DRAFT];
  const StatusIcon = statusConfig.icon;

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

          {/* Goal Info */}
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${goalColor}20` }}
          >
            <Target className="h-6 w-6" style={{ color: goalColor }} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl font-bold truncate">{goal.title}</h1>
              <Badge className={statusConfig.color}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {statusConfig.label}
              </Badge>
            </div>
            {goal.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {goal.description}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-1" />
              编辑
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {goal.status === GoalStatus.ACTIVE && (
                  <>
                    <DropdownMenuItem onClick={() => handleStatusChange('complete')}>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      完成目标
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleStatusChange('archive')}>
                      <Archive className="h-4 w-4 mr-2" />
                      归档目标
                    </DropdownMenuItem>
                  </>
                )}
                {goal.status === GoalStatus.ARCHIVED && (
                  <DropdownMenuItem onClick={() => handleStatusChange('activate')}>
                    <Play className="h-4 w-4 mr-2" />
                    重新激活
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  删除目标
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">总体进度</span>
            <span className="text-sm font-bold" style={{ color: goalColor }}>
              {goal.overallProgress}%
            </span>
          </div>
          <Progress value={goal.overallProgress} className="h-2" />
        </div>

        {/* Meta Info */}
        <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
          {goal.targetDate && (
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>
                {goal.daysRemaining != null && goal.daysRemaining > 0
                  ? `${goal.daysRemaining} 天后到期`
                  : goal.daysRemaining === 0
                  ? '今天到期'
                  : goal.isOverdue
                  ? `已逾期 ${Math.abs(goal.daysRemaining || 0)} 天`
                  : format(new Date(goal.targetDate), 'yyyy-MM-dd', { locale: zhCN })}
              </span>
            </div>
          )}
          {goal.folderUuid && (
            <div className="flex items-center gap-1">
              <Folder className="h-4 w-4" />
              <span>文件夹</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Target className="h-4 w-4" />
            <span>{goal.keyResultCount} 个关键结果</span>
          </div>
        </div>
      </div>

      {/* Tabs Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="border-b px-6">
          <TabsList className="h-12">
            <TabsTrigger value="overview" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              概览
            </TabsTrigger>
            <TabsTrigger value="keyresults" className="gap-2">
              <Target className="h-4 w-4" />
              关键结果
            </TabsTrigger>
            <TabsTrigger value="reviews" className="gap-2">
              <BookOpen className="h-4 w-4" />
              复盘记录
            </TabsTrigger>
          </TabsList>
        </div>

        <ScrollArea className="flex-1">
          {/* Overview Tab */}
          <TabsContent value="overview" className="p-6 space-y-6 m-0">
            {/* Key Results Preview */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg">关键结果</CardTitle>
                <Button size="sm" onClick={handleAddKeyResult}>
                  <Plus className="h-4 w-4 mr-1" />
                  添加
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {goal.keyResults && goal.keyResults.length > 0 ? (
                  goal.keyResults.slice(0, 3).map((kr) => (
                    <KeyResultCard
                      key={kr.uuid}
                      keyResult={kr}
                      goal={goal}
                      onClick={handleEditKeyResult}
                      onAddRecord={handleAddRecord}
                      onDelete={handleDeleteKeyResult}
                    />
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    暂无关键结果，点击"添加"创建第一个
                  </div>
                )}
                {goal.keyResults && goal.keyResults.length > 3 && (
                  <Button
                    variant="ghost"
                    className="w-full"
                    onClick={() => setActiveTab('keyresults')}
                  >
                    查看全部 {goal.keyResults.length} 个关键结果
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Time Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">时间信息</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">开始时间</div>
                  <div className="font-medium">
                    {goal.startDate
                      ? format(new Date(goal.startDate), 'yyyy-MM-dd', { locale: zhCN })
                      : '未设置'}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">目标时间</div>
                  <div className="font-medium">
                    {goal.targetDate
                      ? format(new Date(goal.targetDate), 'yyyy-MM-dd', { locale: zhCN })
                      : '未设置'}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">创建时间</div>
                  <div className="font-medium">
                    {format(new Date(goal.createdAt), 'yyyy-MM-dd', { locale: zhCN })}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">更新时间</div>
                  <div className="font-medium">
                    {format(new Date(goal.updatedAt), 'yyyy-MM-dd', { locale: zhCN })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Key Results Tab */}
          <TabsContent value="keyresults" className="p-6 m-0">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                关键结果 ({goal.keyResults?.length || 0})
              </h3>
              <Button onClick={handleAddKeyResult}>
                <Plus className="h-4 w-4 mr-1" />
                添加关键结果
              </Button>
            </div>
            <div className="space-y-3">
              {goal.keyResults && goal.keyResults.length > 0 ? (
                goal.keyResults.map((kr) => (
                  <KeyResultCard
                    key={kr.uuid}
                    keyResult={kr}
                    goal={goal}
                    onClick={handleEditKeyResult}
                    onAddRecord={handleAddRecord}
                    onDelete={handleDeleteKeyResult}
                  />
                ))
              ) : (
                <div className="text-center py-16 text-muted-foreground">
                  <Target className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="mb-4">暂无关键结果</p>
                  <Button onClick={handleAddKeyResult}>
                    <Plus className="h-4 w-4 mr-1" />
                    添加第一个关键结果
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Reviews Tab */}
          <TabsContent value="reviews" className="p-6 m-0">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                复盘记录 ({reviews.length})
              </h3>
              <Button onClick={() => setShowReviewDialog(true)}>
                <Plus className="h-4 w-4 mr-1" />
                创建复盘
              </Button>
            </div>
            <div className="space-y-3">
              {reviewLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              ) : reviews.length > 0 ? (
                reviews.map((review) => (
                  <GoalReviewCard
                    key={review.uuid}
                    review={review}
                    goalColor={goalColor}
                    onDelete={handleDeleteReview}
                  />
                ))
              ) : (
                <div className="text-center py-16 text-muted-foreground">
                  <BookOpen className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="mb-4">暂无复盘记录</p>
                  <Button onClick={() => setShowReviewDialog(true)}>
                    <Plus className="h-4 w-4 mr-1" />
                    创建第一条复盘
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
        </ScrollArea>
      </Tabs>

      {/* Dialogs */}
      <KeyResultDialog
        open={showKeyResultDialog}
        goalUuid={goal.uuid}
        goal={goal}
        keyResult={selectedKeyResult}
        onClose={() => setShowKeyResultDialog(false)}
        onSave={handleSaveKeyResult}
      />

      <GoalRecordDialog
        open={showRecordDialog}
        goalUuid={goal.uuid}
        keyResultUuid={selectedKeyResult?.uuid || ''}
        keyResult={selectedKeyResult}
        goalColor={goalColor}
        onClose={() => setShowRecordDialog(false)}
        onSave={handleSaveRecord}
      />

      <GoalReviewDialog
        open={showReviewDialog}
        goalUuid={goal.uuid}
        goal={goal}
        onClose={() => setShowReviewDialog(false)}
        onSave={handleSaveReview}
      />
    </div>
  );
}

export default GoalDetailView;
