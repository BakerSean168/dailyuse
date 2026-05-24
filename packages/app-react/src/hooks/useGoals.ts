import { useEffect, useMemo, useState } from 'react';

import type { GoalStatus, KeyResultClientDTO } from '@dailyuse/contracts/goal';
import type { ImportanceLevel } from '@dailyuse/contracts/shared';
import type { Goal } from '@dailyuse/goal/domain-client';

import { useAppSession } from './useAppSession';
import { useGoalService } from './useGoalService';

export type GoalSummary = {
  id: string;
  name: string;
  description: string | null;
  status: GoalStatus;
  importance: ImportanceLevel;
  priority: number;
  tags: string[];
  startDate: number | null;
  targetDate: number | null;
  updatedAt: number;
  color: string | null;
  totalKeyResults: number;
  completedKeyResults: number;
  overallProgress: number;
};

export type GoalStatusFilter = 'all' | GoalStatus;

export type GoalSortField = 'importance' | 'priority' | 'progress' | 'targetDate' | 'updatedAt';
export type GoalSortDirection = 'asc' | 'desc';

export interface GoalSortOption {
  field: GoalSortField;
  direction: GoalSortDirection;
}

const IMPORTANCE_ORDER: Record<ImportanceLevel, number> = {
  Vital: 5,
  Important: 4,
  Moderate: 3,
  Minor: 2,
  Trivial: 1,
};

export type GoalDetail = GoalSummary & {
  motivation: string | null;
  category: string | null;
  keyResults: Array<{
    id: string;
    title: string;
    description: string | null;
    currentValue: number;
    targetValue: number;
    initialValue: number;
    unit: string | null;
    progress: number;
  }>;
  reviewsCount: number;
};

function computeProgress(keyResult: KeyResultClientDTO) {
  const initialValue = keyResult.progress.initialValue;
  const targetValue = keyResult.progress.targetValue;
  const currentValue = keyResult.progress.currentValue;

  if (targetValue === initialValue) {
    return 100;
  }

  return Math.min(
    100,
    Math.max(0, Math.round(((currentValue - initialValue) / (targetValue - initialValue)) * 100)),
  );
}

function mapGoal(goal: Goal): GoalSummary {
  const dto = goal.toDTO();

  return {
    id: String(goal.id),
    name: goal.name,
    description: goal.description,
    status: goal.status,
    importance: goal.importance,
    priority: goal.priority,
    tags: goal.tags,
    startDate: goal.startDate?.getTime() ?? null,
    targetDate: goal.targetDate?.getTime() ?? null,
    updatedAt: goal.updatedAt.getTime(),
    color: goal.color,
    totalKeyResults: dto.totalKeyResults ?? 0,
    completedKeyResults: dto.completedKeyResults ?? 0,
    overallProgress: dto.overallProgress ?? 0,
  };
}

export function mapGoalDetail(
  goal: Goal,
  keyResults: KeyResultClientDTO[],
  reviewsCount: number,
): GoalDetail {
  return {
    ...mapGoal(goal),
    motivation: goal.motivation,
    category: goal.category,
    keyResults: keyResults.map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      currentValue: item.progress.currentValue,
      targetValue: item.progress.targetValue,
      initialValue: item.progress.initialValue,
      unit: item.progress.unit,
      progress: computeProgress(item),
    })),
    reviewsCount,
  };
}

export function useGoals() {
  const service = useGoalService();
  const { isRemoteAuthenticated } = useAppSession();

  const [goals, setGoals] = useState<GoalSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<GoalStatusFilter>('all');
  const [sortOption, setSortOption] = useState<GoalSortOption>({
    field: 'importance',
    direction: 'desc',
  });

  useEffect(() => {
    if (!isRemoteAuthenticated) {
      setGoals([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    async function loadGoals() {
      setIsLoading(true);
      setError(null);

      const result = await service.listGoals({
        page: 1,
        pageSize: 60,
        status: statusFilter === 'all' ? undefined : [statusFilter],
      });

      if (cancelled) {
        return;
      }

      if (!result.ok) {
        setGoals([]);
        setError(result.error.message);
        setIsLoading(false);
        return;
      }

      setGoals(result.data.goals.map((goal) => mapGoal(goal)));
      setIsLoading(false);
    }

    void loadGoals();

    return () => {
      cancelled = true;
    };
  }, [isRemoteAuthenticated, service, statusFilter]);

  async function refresh() {
    if (!isRemoteAuthenticated) {
      return;
    }

    setIsLoading(true);
    const result = await service.listGoals({
      page: 1,
      pageSize: 60,
      status: statusFilter === 'all' ? undefined : [statusFilter],
    });

    if (!result.ok) {
      setGoals([]);
      setError(result.error.message);
      setIsLoading(false);
      return;
    }

    setGoals(result.data.goals.map((goal) => mapGoal(goal)));
    setError(null);
    setIsLoading(false);
  }

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredGoals = useMemo(() => {
    let result = goals;

    // Apply search filter
    if (normalizedQuery.length > 0) {
      result = result.filter((goal) => {
        const text = [goal.name, goal.description ?? '', goal.tags.join(' ')]
          .join(' ')
          .toLowerCase();
        return text.includes(normalizedQuery);
      });
    }

    // Apply sorting
    result = [...result].sort((a, b) => {
      let comparison = 0;

      switch (sortOption.field) {
        case 'importance':
          comparison = IMPORTANCE_ORDER[a.importance] - IMPORTANCE_ORDER[b.importance];
          break;
        case 'priority':
          comparison = a.priority - b.priority;
          break;
        case 'progress':
          comparison = a.overallProgress - b.overallProgress;
          break;
        case 'targetDate':
          // Null dates go to the end
          if (a.targetDate === null && b.targetDate === null) comparison = 0;
          else if (a.targetDate === null) comparison = 1;
          else if (b.targetDate === null) comparison = -1;
          else comparison = a.targetDate - b.targetDate;
          break;
        case 'updatedAt':
          comparison = a.updatedAt - b.updatedAt;
          break;
      }

      return sortOption.direction === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [goals, normalizedQuery, sortOption]);

  return {
    error,
    filteredGoals,
    goals,
    isLoading,
    isRemoteAuthenticated,
    refresh,
    searchQuery,
    setSearchQuery,
    setSortOption,
    setStatusFilter,
    sortOption,
    statusFilter,
  };
}
