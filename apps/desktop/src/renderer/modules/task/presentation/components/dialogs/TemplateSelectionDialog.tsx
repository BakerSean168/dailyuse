/**
 * TemplateSelectionDialog Component
 *
 * 任务模板选择对话框
 * 功能：
 * 1. 显示可用的任务模板列表
 * 2. 支持搜索和过滤
 * 3. 选择模板后回调
 * 
 * EPIC-015 重构: 使用 Entity 类型
 */

import { useState, useCallback, useMemo } from 'react';
import type { TaskTemplate } from '@dailyuse/task/domain-client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@dailyuse/ui-shadcn';
import { Button } from '@dailyuse/ui-shadcn';
import { Input } from '@dailyuse/ui-shadcn';
import { Badge } from '@dailyuse/ui-shadcn';
import { ScrollArea } from '@dailyuse/ui-shadcn';
import {
  Search,
  LayoutTemplate,
  Repeat,
  Target,
  Check,
} from 'lucide-react';

// ===================== 接口定义 =====================

interface TemplateSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templates: TaskTemplate[];
  isLoading?: boolean;
  onSelect?: (template: TaskTemplate) => void;
  onCancel?: () => void;
  title?: string;
  description?: string;
}

// ===================== 工具函数 =====================

const getTaskTypeLabel = (taskType: string): string => {
  const labelMap: Record<string, string> = {
    HABIT: '习惯',
    EVENT: '事件',
    DEADLINE: '截止日',
    GENERAL: '通用',
  };
  return labelMap[taskType] || taskType;
};

const getTaskTypeColor = (taskType: string): string => {
  const colorMap: Record<string, string> = {
    HABIT: 'bg-green-100 text-green-800',
    EVENT: 'bg-blue-100 text-blue-800',
    DEADLINE: 'bg-red-100 text-red-800',
    GENERAL: 'bg-gray-100 text-gray-800',
  };
  return colorMap[taskType] || 'bg-gray-100 text-gray-800';
};

const getRecurrenceLabel = (rule?: { frequency?: string; interval?: number }): string | null => {
  if (!rule?.frequency) return null;
  
  const typeMap: Record<string, string> = {
    DAILY: '每天',
    WEEKLY: '每周',
    MONTHLY: '每月',
    YEARLY: '每年',
  };
  
  const interval = rule.interval || 1;
  const typeLabel = typeMap[rule.frequency] || rule.frequency;
  
  if (interval === 1) return typeLabel;
  return `每${interval}${typeLabel.slice(1)}`;
};

// ===================== 组件 =====================

export function TemplateSelectionDialog({
  open,
  onOpenChange,
  templates,
  isLoading = false,
  onSelect,
  onCancel,
  title = '选择任务模板',
  description = '从现有模板中选择一个作为基础',
}: TemplateSelectionDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUuid, setSelectedUuid] = useState<string | null>(null);

  // 过滤模板
  const filteredTemplates = useMemo(() => {
    if (!searchQuery.trim()) return templates;
    
    const query = searchQuery.toLowerCase();
    return templates.filter((template) => 
      template.title.toLowerCase().includes(query) ||
      template.description?.toLowerCase().includes(query) ||
      template.tags?.some(tag => tag.toLowerCase().includes(query))
    );
  }, [templates, searchQuery]);

  // 选中的模板
  const selectedTemplate = useMemo(() => {
    if (!selectedUuid) return null;
    return templates.find((t) => t.uuid === selectedUuid) || null;
  }, [templates, selectedUuid]);

  const handleSelect = useCallback(() => {
    if (selectedTemplate) {
      onSelect?.(selectedTemplate);
      onOpenChange(false);
    }
  }, [selectedTemplate, onSelect, onOpenChange]);

  const handleCancel = useCallback(() => {
    setSelectedUuid(null);
    setSearchQuery('');
    onCancel?.();
    onOpenChange(false);
  }, [onCancel, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-full bg-primary/10">
              <LayoutTemplate className="h-5 w-5 text-primary" />
            </div>
            <DialogTitle>{title}</DialogTitle>
          </div>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 搜索框 */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索模板..."
              className="pl-10"
            />
          </div>

          {/* 模板列表 */}
          <ScrollArea className="h-[400px] pr-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="text-muted-foreground">加载中...</div>
              </div>
            ) : filteredTemplates.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                <LayoutTemplate className="h-8 w-8 mb-2 opacity-50" />
                <p>{searchQuery ? '未找到匹配的模板' : '暂无可用模板'}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredTemplates.map((template) => {
                  const isSelected = selectedUuid === template.uuid;
                  return (
                    <div
                      key={template.uuid}
                      className={`
                        relative p-4 rounded-lg border cursor-pointer transition-all
                        hover:shadow-md hover:border-primary/30
                        ${isSelected ? 'border-primary bg-primary/5 shadow-md' : 'border-border'}
                      `}
                      onClick={() => setSelectedUuid(template.uuid)}
                    >
                      {/* 选中指示器 */}
                      {isSelected && (
                        <div className="absolute top-2 right-2 p-1 rounded-full bg-primary">
                          <Check className="h-3 w-3 text-primary-foreground" />
                        </div>
                      )}

                      {/* 模板信息 */}
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium truncate">{template.title}</h4>
                            <Badge className={`text-xs shrink-0 ${getTaskTypeColor(template.taskType)}`}>
                              {getTaskTypeLabel(template.taskType)}
                            </Badge>
                          </div>

                          {template.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                              {template.description}
                            </p>
                          )}

                          {/* 元信息 */}
                          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                            {template.recurrenceRule && (
                              <div className="flex items-center gap-1">
                                <Repeat className="h-3 w-3" />
                                <span>{getRecurrenceLabel({ frequency: template.recurrenceRule.frequency, interval: template.recurrenceRule.interval })}</span>
                              </div>
                            )}

                            {template.goalBinding && (
                              <div className="flex items-center gap-1">
                                <Target className="h-3 w-3" />
                                <span>已关联目标</span>
                              </div>
                            )}
                          </div>

                          {/* 标签 */}
                          {template.tags && template.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {template.tags.slice(0, 5).map((tag) => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                              {template.tags.length > 5 && (
                                <Badge variant="outline" className="text-xs">
                                  +{template.tags.length - 5}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            取消
          </Button>
          <Button onClick={handleSelect} disabled={!selectedTemplate}>
            <Check className="h-4 w-4 mr-2" />
            选择此模板
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default TemplateSelectionDialog;
