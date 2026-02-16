/**
 * ReminderTemplateDialog - 提醒模板创建/编辑对话�?
 *
 * 功能�?
 * - 创建新模�?
 * - 编辑现有模板
 * - 设置标题、描述、分�?
 * - 配置触发器类型和时间
 * - 设置外观（图标、颜色、标签）
 * - 高级通知设置
 *
 * @module reminder/presentation/components/dialogs
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Button,
  Input,
  Label,
  Textarea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Badge,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@dailyuse/ui-react-shadcn';

import {
  Info,
  Clock,
  Palette,
  Settings,
  Bell,
  Folder,
  Flag,
  ChevronDown,
  X,
} from 'lucide-react';
import type { 
  ReminderTemplateClientDTO, 
  ReminderGroupClientDTO,
  CreateReminderTemplateRequest,
  UpdateReminderTemplateRequest,
  NotificationConfigServerDTO,
} from '@dailyuse/contracts/reminder';
import { TriggerType, ReminderType, NotificationChannel } from '@dailyuse/contracts/reminder';
import { ImportanceLevel } from '@dailyuse/contracts/shared';

// ============ Types ============

/**
 * 表单 UI 状态（内部使用，扁平化便于表单绑定�?
 * 最终会转换�?CreateReminderTemplateRequest �?UpdateReminderTemplateRequest
 */
interface FormState {
  title: string;
  description: string;
  groupUuid: string | null;
  importanceLevel: ImportanceLevel;
  triggerType: TriggerType;
  fixedTime: string;
  intervalMinutes: number;
  icon: string;
  color: string;
  tags: string[];
  notificationTitle: string;
  notificationBody: string;
}

export interface ReminderTemplateDialogProps {
  /** 是否打开 */
  open: boolean;
  /** 编辑的模板（为空则为创建模式�?*/
  template?: ReminderTemplateClientDTO | null;
  /** 可用的分组列�?*/
  groups: ReminderGroupClientDTO[];
  /** 关闭回调 */
  onClose: () => void;
  /** 保存回调 - 使用 contracts 类型 */
  onSave: (data: CreateReminderTemplateRequest | UpdateReminderTemplateRequest, isEdit: boolean) => Promise<void>;
}

// ============ Constants ============

const TRIGGER_TYPES = [
  { value: TriggerType.FIXED_TIME, label: '固定时间' },
  { value: TriggerType.INTERVAL, label: '间隔触发' },
];

const IMPORTANCE_LEVELS = [
  { value: ImportanceLevel.Vital, label: '极其重要' },
  { value: ImportanceLevel.Important, label: '非常重要' },
  { value: ImportanceLevel.Moderate, label: '中等重要' },
  { value: ImportanceLevel.Minor, label: '不太重要' },
  { value: ImportanceLevel.Trivial, label: '无关紧要' },
];

const COLOR_OPTIONS = [
  { value: '#E3F2FD', label: '浅蓝' },
  { value: '#E8F5E9', label: '浅绿' },
  { value: '#FFF3E0', label: '浅橙' },
  { value: '#FFEBEE', label: '浅红' },
  { value: '#F3E5F5', label: '浅紫' },
  { value: '#FCE4EC', label: '浅粉' },
  { value: '#E0F7FA', label: '浅青' },
  { value: '#F5F5F5', label: '浅灰' },
];

const DEFAULT_FORM_STATE: FormState = {
  title: '',
  description: '',
  groupUuid: null,
  importanceLevel: ImportanceLevel.Moderate,
  triggerType: TriggerType.FIXED_TIME,
  fixedTime: '09:00',
  intervalMinutes: 60,
  icon: 'bell',
  color: '#E3F2FD',
  tags: [],
  notificationTitle: '',
  notificationBody: '',
};

// ============ Helper Functions ============

/**
 * 将表单状态转换为 CreateReminderTemplateRequest
 */
function formStateToCreateRequest(form: FormState): CreateReminderTemplateRequest {
  const notificationConfig: NotificationConfigServerDTO = {
    channels: [NotificationChannel.PUSH],
    title: form.notificationTitle || null,
    body: form.notificationBody || null,
  };

  return {
    title: form.title,
    type: ReminderType.RECURRING, // 默认为循环提�?
    trigger: {
      type: form.triggerType,
      fixedTime: form.triggerType === TriggerType.FIXED_TIME 
        ? { time: form.fixedTime } 
        : null,
      interval: form.triggerType === TriggerType.INTERVAL 
        ? { minutes: form.intervalMinutes } 
        : null,
    },
    activeTime: {
      activatedAt: Date.now(),
    },
    notificationConfig,
    description: form.description || undefined,
    importanceLevel: form.importanceLevel,
    tags: form.tags.length > 0 ? form.tags : undefined,
    color: form.color,
    icon: form.icon,
    groupUuid: form.groupUuid || undefined,
  };
}

/**
 * 将表单状态转换为 UpdateReminderTemplateRequest
 */
function formStateToUpdateRequest(form: FormState): UpdateReminderTemplateRequest {
  const notificationConfig: NotificationConfigServerDTO = {
    channels: [NotificationChannel.PUSH],
    title: form.notificationTitle || null,
    body: form.notificationBody || null,
  };

  return {
    title: form.title,
    trigger: {
      type: form.triggerType,
      fixedTime: form.triggerType === TriggerType.FIXED_TIME 
        ? { time: form.fixedTime } 
        : null,
      interval: form.triggerType === TriggerType.INTERVAL 
        ? { minutes: form.intervalMinutes } 
        : null,
    },
    notificationConfig,
    description: form.description || undefined,
    importanceLevel: form.importanceLevel,
    tags: form.tags.length > 0 ? form.tags : undefined,
    color: form.color,
    icon: form.icon,
    groupUuid: form.groupUuid || undefined,
  };
}

// ============ Component ============

export function ReminderTemplateDialog({
  open,
  template,
  groups,
  onClose,
  onSave,
}: ReminderTemplateDialogProps) {
  const [formState, setFormState] = useState<FormState>(DEFAULT_FORM_STATE);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [tagInput, setTagInput] = useState('');
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const isEditMode = !!template?.uuid;

  // 初始化表单数�?
  useEffect(() => {
    if (open) {
      if (template) {
        setFormState({
          title: template.title || '',
          description: template.description || '',
          groupUuid: template.groupUuid || null,
          importanceLevel: template.importanceLevel || ImportanceLevel.Moderate,
          triggerType: (template.trigger?.type as TriggerType) || TriggerType.FIXED_TIME,
          fixedTime: template.trigger?.fixedTime?.time || '09:00',
          intervalMinutes: template.trigger?.interval?.minutes || 60,
          icon: template.icon || 'bell',
          color: template.color || '#E3F2FD',
          tags: template.tags || [],
          notificationTitle: template.notificationConfig?.title || '',
          notificationBody: template.notificationConfig?.body || '',
        });
      } else {
        setFormState(DEFAULT_FORM_STATE);
      }
      setErrors({});
      setTagInput('');
      setAdvancedOpen(false);
    }
  }, [open, template]);

  // 分组选项
  const groupOptions = useMemo(() => {
    return [
      { value: '', label: '无分' },
      ...groups.map((g) => ({ value: g.uuid, label: g.name })),
    ];
  }, [groups]);

  // 验证表单
  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formState.title.trim()) {
      newErrors.title = '标题不能为空';
    }

    if (formState.triggerType === TriggerType.FIXED_TIME) {
      if (!formState.fixedTime || !/^\d{2}:\d{2}$/.test(formState.fixedTime)) {
        newErrors.fixedTime = '请输入有效的时间格式 (HH:MM)';
      }
    }

    if (formState.triggerType === TriggerType.INTERVAL) {
      if (formState.intervalMinutes <= 0) {
        newErrors.intervalMinutes = '间隔时间必须大于0';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formState]);

  // 处理保存 - 转换�?contracts 类型
  const handleSave = useCallback(async () => {
    if (!validateForm()) return;

    setIsSaving(true);
    try {
      // 根据模式转换为对应的 Request 类型
      const request = isEditMode 
        ? formStateToUpdateRequest(formState)
        : formStateToCreateRequest(formState);
      
      await onSave(request, isEditMode);
      onClose();
    } catch (error) {
      console.error('保存模板失败:', error);
    } finally {
      setIsSaving(false);
    }
  }, [formState, isEditMode, onSave, onClose, validateForm]);

  // 更新表单字段
  const updateField = useCallback(<K extends keyof FormState>(
    field: K,
    value: FormState[K]
  ) => {
    setFormState(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [errors]);

  // 添加标签
  const addTag = useCallback(() => {
    const tag = tagInput.trim();
    if (tag && !formState.tags.includes(tag)) {
      updateField('tags', [...formState.tags, tag]);
    }
    setTagInput('');
  }, [tagInput, formState.tags, updateField]);

  // 删除标签
  const removeTag = useCallback((tag: string) => {
    updateField('tags', formState.tags.filter(t => t !== tag));
  }, [formState.tags, updateField]);

  // 处理标签输入回车
  const handleTagKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  }, [addTag]);

  const isFormValid = formState.title.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        {/* 标题�?*/}
        <DialogHeader>
          <div className="flex items-center justify-between">
            <Button
              variant="destructive"
              onClick={onClose}
              disabled={isSaving}
            >
              取消
            </Button>
            <DialogTitle className="text-xl">
              {isEditMode ? '编辑提醒模板' : '创建提醒模板'}
            </DialogTitle>
            <Button
              onClick={handleSave}
              disabled={!isFormValid || isSaving}
            >
              {isSaving ? '保存中...' : '完成'}
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* 基础信息 */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              <Info className="h-4 w-4 text-primary" />
              基础信息
            </div>
            <Separator />

            {/* 标题和颜�?*/}
            <div className="flex items-start gap-4">
              <div className="flex-1 space-y-2">
                <Label htmlFor="title">标题 *</Label>
                <Input
                  id="title"
                  value={formState.title}
                  onChange={(e) => updateField('title', e.target.value)}
                  placeholder="例如：每日喝水提"
                  autoFocus
                />
                {errors.title && (
                  <p className="text-xs text-destructive">{errors.title}</p>
                )}
              </div>

              {/* 颜色选择 */}
              <div className="space-y-2">
                <Label>颜色</Label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_OPTIONS.slice(0, 4).map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${
                        formState.color === color.value
                          ? 'border-primary ring-2 ring-primary/30'
                          : 'border-gray-200'
                      }`}
                      style={{ backgroundColor: color.value }}
                      onClick={() => updateField('color', color.value)}
                      title={color.label}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* 描述 */}
            <div className="space-y-2">
              <Label htmlFor="description">描述</Label>
              <Textarea
                id="description"
                value={formState.description}
                onChange={(e) => updateField('description', e.target.value)}
                placeholder="描述这个提醒的目的和注意事项"
                rows={2}
              />
            </div>

            {/* 分组和重要程�?*/}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>所属分</Label>
                <Select
                  value={formState.groupUuid || ''}
                  onValueChange={(value) => updateField('groupUuid', value || null)}
                >
                  <SelectTrigger>
                    <Folder className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="选择分组" />
                  </SelectTrigger>
                  <SelectContent>
                    {groupOptions.map((option) => (
                      <SelectItem key={option.value || 'none'} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">可选：将模板添加到分组</p>
              </div>

              <div className="space-y-2">
                <Label>重要程度</Label>
                <Select
                  value={formState.importanceLevel}
                  onValueChange={(value) => updateField('importanceLevel', value as ImportanceLevel)}
                >
                  <SelectTrigger>
                    <Flag className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {IMPORTANCE_LEVELS.map((level) => (
                      <SelectItem key={level.value} value={level.value}>
                        {level.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* 时间配置 */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              <Clock className="h-4 w-4 text-primary" />
              时间配置
            </div>
            <Separator />

            {/* 触发类型 */}
            <div className="space-y-2">
              <Label>触发类型 *</Label>
              <Select
                value={formState.triggerType}
                onValueChange={(value) => updateField('triggerType', value as TriggerType)}
              >
                <SelectTrigger>
                  <Bell className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TRIGGER_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 固定时间 */}
            {formState.triggerType === TriggerType.FIXED_TIME && (
              <div className="space-y-2">
                <Label htmlFor="fixedTime">固定时间 (HH:MM)</Label>
                <Input
                  id="fixedTime"
                  type="time"
                  value={formState.fixedTime}
                  onChange={(e) => updateField('fixedTime', e.target.value)}
                  placeholder="09:00"
                />
                {errors.fixedTime && (
                  <p className="text-xs text-destructive">{errors.fixedTime}</p>
                )}
                <p className="text-xs text-muted-foreground">格式: 小时:分钟 (例如: 09:00, 14:30)</p>
              </div>
            )}

            {/* 间隔时间 */}
            {formState.triggerType === TriggerType.INTERVAL && (
              <div className="space-y-2">
                <Label htmlFor="intervalMinutes">间隔时间（分钟）</Label>
                <Input
                  id="intervalMinutes"
                  type="number"
                  value={formState.intervalMinutes}
                  onChange={(e) => updateField('intervalMinutes', parseInt(e.target.value) || 0)}
                  min={1}
                />
                {errors.intervalMinutes && (
                  <p className="text-xs text-destructive">{errors.intervalMinutes}</p>
                )}
                <p className="text-xs text-muted-foreground">每隔多少分钟触发一</p>
              </div>
            )}
          </div>

          {/* 外观配置 */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              <Palette className="h-4 w-4 text-primary" />
              外观配置
            </div>
            <Separator />

            {/* 标签 */}
            <div className="space-y-2">
              <Label>标签</Label>
              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  placeholder="输入标签后按回车添加"
                />
                <Button type="button" variant="outline" onClick={addTag}>
                  添加
                </Button>
              </div>
              {formState.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formState.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="gap-1">
                      {tag}
                      <X
                        className="h-3 w-3 cursor-pointer hover:text-destructive"
                        onClick={() => removeTag(tag)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground">添加标签以便筛选和管理（可选）</p>
            </div>
          </div>

          {/* 高级通知设置 */}
          <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between">
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  <span className="font-medium">高级通知设置</span>
                  <Badge variant="outline" className="text-xs">可</Badge>
                </div>
                <ChevronDown className={`h-4 w-4 transition-transform ${advancedOpen ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 pt-4">
              <p className="text-xs text-muted-foreground">
                自定义通知文案。留空则使用模板的标题和描述�?
              </p>
              <div className="space-y-2">
                <Label htmlFor="notificationTitle">通知标题</Label>
                <Input
                  id="notificationTitle"
                  value={formState.notificationTitle}
                  onChange={(e) => updateField('notificationTitle', e.target.value)}
                  placeholder="留空则使用模板标"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notificationBody">通知内容</Label>
                <Textarea
                  id="notificationBody"
                  value={formState.notificationBody}
                  onChange={(e) => updateField('notificationBody', e.target.value)}
                  placeholder="留空则使用模板描"
                  rows={2}
                />
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ReminderTemplateDialog;
