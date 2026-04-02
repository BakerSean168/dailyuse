import { useEffect, useMemo, useState } from 'react';

import type { ImportanceLevel } from '@dailyuse/contracts/shared';
import type { TaskTemplateStatus, TaskTimeConfigDTO } from '@dailyuse/contracts/task';
import type { TaskTemplate } from '@dailyuse/task/domain-client';

import { useAppSession } from './use-app-session';
import { useTaskService } from './use-task-service';

export type TaskTemplateSummary = {
  id: string;
  name: string;
  description: string | null;
  status: TaskTemplateStatus;
  importance: ImportanceLevel;
  priority: number | null;
  instanceCount: number;
  completedInstanceCount: number;
  pendingInstanceCount: number;
  completionRate: number;
  isBlocked: boolean;
  blockingReason: string | null;
  tags: string[];
  updatedAt: number;
};

export type TaskStatusFilter = 'all' | TaskTemplateStatus;
export type TaskSortOption = 'updated' | 'priority' | 'pending' | 'completion';

export type TaskTemplateDetail = TaskTemplateSummary & {
  createdAt: number;
  startDate: number | null;
  dueDate: number | null;
  estimatedMinutes: number | null;
  actualMinutes: number | null;
  comment: string | null;
  timeConfig: TaskTimeConfigDTO;
};

function mapTemplate(template: TaskTemplate): TaskTemplateSummary {
  return {
    id: String(template.id),
    name: template.name,
    description: template.description,
    status: template.status,
    importance: template.importance,
    priority: template.priority ?? null,
    instanceCount: template.instanceCount,
    completedInstanceCount: template.completedInstanceCount,
    pendingInstanceCount: template.pendingInstanceCount,
    completionRate: template.completionRate,
    isBlocked: template.isBlocked ?? false,
    blockingReason: template.blockingReason,
    tags: template.tags,
    updatedAt: template.updatedAt.getTime(),
  };
}

export function mapTaskTemplateDetail(template: TaskTemplate): TaskTemplateDetail {
  return {
    ...mapTemplate(template),
    createdAt: template.createdAt.getTime(),
    startDate: template.startDate?.getTime() ?? null,
    dueDate: template.dueDate?.getTime() ?? null,
    estimatedMinutes: template.estimatedMinutes,
    actualMinutes: template.actualMinutes,
    comment: template.comment,
    timeConfig: {
      timeType: template.timeConfig.timeType,
      startDate: template.timeConfig.startDate ? template.timeConfig.startDate.getTime() : null,
      timePoint: template.timeConfig.timePoint,
      timeRange: template.timeConfig.timeRange ?? null,
    },
  };
}

function sortTemplates(templates: TaskTemplateSummary[], sortBy: TaskSortOption) {
  const next = [...templates];

  next.sort((left, right) => {
    if (sortBy === 'priority') {
      return (right.priority ?? -1) - (left.priority ?? -1) || right.updatedAt - left.updatedAt;
    }

    if (sortBy === 'pending') {
      return right.pendingInstanceCount - left.pendingInstanceCount || right.updatedAt - left.updatedAt;
    }

    if (sortBy === 'completion') {
      return right.completionRate - left.completionRate || right.updatedAt - left.updatedAt;
    }

    return right.updatedAt - left.updatedAt;
  });

  return next;
}

export function useTaskTemplates() {
  const service = useTaskService();
  const { isRemoteAuthenticated } = useAppSession();

  const [templates, setTemplates] = useState<TaskTemplateSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatusFilter>('all');
  const [sortBy, setSortBy] = useState<TaskSortOption>('updated');
  const [blockedOnly, setBlockedOnly] = useState(false);

  async function fetchTemplates(filter: TaskStatusFilter) {
    const result = await service.listTemplates({
      page: 1,
      limit: 100,
      status: filter === 'all' ? undefined : filter,
    });

    if (!result.ok) {
      setTemplates([]);
      setError(result.error.message);
      setIsLoading(false);
      return;
    }

    setTemplates(result.data.templates.map((template) => mapTemplate(template)));
    setError(null);
    setIsLoading(false);
  }

  useEffect(() => {
    if (!isRemoteAuthenticated) {
      setTemplates([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    async function loadTemplates() {
      setIsLoading(true);
      setError(null);

      const result = await service.listTemplates({
        page: 1,
        limit: 100,
        status: statusFilter === 'all' ? undefined : statusFilter,
      });

      if (cancelled) {
        return;
      }

      if (!result.ok) {
        setTemplates([]);
        setError(result.error.message);
        setIsLoading(false);
        return;
      }

      setTemplates(result.data.templates.map((template) => mapTemplate(template)));
      setIsLoading(false);
    }

    void loadTemplates();

    return () => {
      cancelled = true;
    };
  }, [isRemoteAuthenticated, service, statusFilter]);

  async function refresh() {
    if (!isRemoteAuthenticated) {
      return;
    }

    setIsLoading(true);
    await fetchTemplates(statusFilter);
  }

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredTemplates = useMemo(() => {
    const byQuery =
      normalizedQuery.length === 0
        ? templates
        : templates.filter((template) => {
            const text = [template.name, template.description ?? '', template.tags.join(' ')].join(' ').toLowerCase();
            return text.includes(normalizedQuery);
          });

    const byBlocked = blockedOnly ? byQuery.filter((template) => template.isBlocked) : byQuery;
    return sortTemplates(byBlocked, sortBy);
  }, [blockedOnly, normalizedQuery, sortBy, templates]);

  return {
    blockedOnly,
    error,
    filteredTemplates,
    isLoading,
    isRemoteAuthenticated,
    refresh,
    searchQuery,
    setBlockedOnly,
    setSearchQuery,
    setSortBy,
    setStatusFilter,
    sortBy,
    statusFilter,
    templates,
  };
}
