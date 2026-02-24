/**
 * ReminderGroupDialog - 提醒分组创建/编辑对话�?
 *
 * 功能�?
 * - 创建新分�?
 * - 编辑现有分组
 * - 设置名称、描述、图标、颜�?
 * - 设置控制模式和排序权�?
 *
 * @module reminder/presentation/components/dialogs
 */

import { useState, useEffect, useCallback } from 'react';
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
} from '@dailyuse/ui-react-shadcn';

import {
  Folder,
  Info,
  Palette,
  Settings,
  Briefcase,
  Home,
  GraduationCap,
  Heart,
  ShoppingCart,
  Gamepad2,
  Plane,
  DollarSign,
  Users,
} from 'lucide-react';
import type { 
  ReminderGroupClientDTO,
  CreateReminderGroupRequest,
  UpdateReminderGroupRequest,
} from '@dailyuse/contracts/reminder';
import { ControlMode } from '@dailyuse/contracts/reminder';

// ============ Types ============

/**
 * 表单 UI 状态（内部使用�?
 * 最终会转换�?CreateReminderGroupRequest �?UpdateReminderGroupRequest
 */
interface FormState {
  name: string;
  description: string;
  icon: string;
  color: string;
  controlMode: ControlMode;
  order: number;
}

export interface ReminderGroupDialogProps {
  /** 是否打开 */
  open: boolean;
  /** 编辑的分组（为空则为创建模式�?*/
  group?: ReminderGroupClientDTO | null;
  /** 关闭回调 */
  onClose: () => void;
  /** 保存回调 - 使用 contracts 类型 */
  onSave: (data: CreateReminderGroupRequest | UpdateReminderGroupRequest, isEdit: boolean) => Promise<void>;
}

// ============ Constants ============

const ICON_OPTIONS = [
  { value: 'folder', label: '文件', icon: Folder },
  { value: 'briefcase', label: '工作', icon: Briefcase },
  { value: 'home', label: '家庭', icon: Home },
  { value: 'graduation-cap', label: '学习', icon: GraduationCap },
  { value: 'heart', label: '健康', icon: Heart },
  { value: 'shopping-cart', label: '购物', icon: ShoppingCart },
  { value: 'gamepad-2', label: '娱乐', icon: Gamepad2 },
  { value: 'plane', label: '旅行', icon: Plane },
  { value: 'dollar-sign', label: '财务', icon: DollarSign },
  { value: 'users', label: '社交', icon: Users },
];

const COLOR_OPTIONS = [
  { value: '#2196F3', label: '蓝色' },
  { value: '#4CAF50', label: '绿色' },
  { value: '#FF9800', label: '橙色' },
  { value: '#F44336', label: '红色' },
  { value: '#9C27B0', label: '紫色' },
  { value: '#E91E63', label: '粉色' },
  { value: '#00BCD4', label: '青色' },
  { value: '#9E9E9E', label: '灰色' },
];

const CONTROL_MODE_OPTIONS = [
  {
    value: ControlMode.INDIVIDUAL,
    title: '个体控制',
    description: '每个模板独立控制启用/禁用状',
  },
  {
    value: ControlMode.GROUP,
    title: '组控',
    description: '分组统一控制所有模板的启用/禁用状',
  },
];

const DEFAULT_FORM_STATE: FormState = {
  name: '',
  description: '',
  icon: 'folder',
  color: '#2196F3',
  controlMode: ControlMode.INDIVIDUAL,
  order: 0,
};

// ============ Helper Functions ============

/**
 * 将表单状态转换为 CreateReminderGroupRequest
 */
function formStateToCreateRequest(form: FormState): CreateReminderGroupRequest {
  return {
    name: form.name,
    description: form.description || undefined,
    color: form.color,
    icon: form.icon,
    controlMode: form.controlMode,
    order: form.order,
  };
}

/**
 * 将表单状态转换为 UpdateReminderGroupRequest
 */
function formStateToUpdateRequest(form: FormState): UpdateReminderGroupRequest {
  return {
    name: form.name,
    description: form.description || undefined,
    color: form.color,
    icon: form.icon,
    controlMode: form.controlMode,
    order: form.order,
  };
}

// ============ Component ============

export function ReminderGroupDialog({
  open,
  group,
  onClose,
  onSave,
}: ReminderGroupDialogProps) {
  const [formState, setFormState] = useState<FormState>(DEFAULT_FORM_STATE);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditMode = !!group?.id;

  // 初始化表单数�?
  useEffect(() => {
    if (open) {
      if (group) {
        setFormState({
          name: group.name || '',
          description: group.description || '',
          icon: group.icon || 'folder',
          color: group.color || '#2196F3',
          controlMode: group.controlMode || ControlMode.INDIVIDUAL,
          order: group.order || 0,
        });
      } else {
        setFormState(DEFAULT_FORM_STATE);
      }
      setErrors({});
    }
  }, [open, group]);

  // 验证表单
  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formState.name.trim()) {
      newErrors.name = '分组名称不能为空';
    } else if (formState.name.length > 50) {
      newErrors.name = '分组名称不能超过50个字';
    }

    if (formState.description && formState.description.length > 200) {
      newErrors.description = '描述不能超过200个字';
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
      console.error('保存分组失败:', error);
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
    // 清除该字段的错误
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [errors]);

  const isFormValid = formState.name.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
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
              {isEditMode ? '编辑分组' : '创建分组'}
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

            {/* 分组名称和颜�?*/}
            <div className="flex items-start gap-4">
              <div className="flex-1 space-y-2">
                <Label htmlFor="name">分组名称 *</Label>
                <Input
                  id="name"
                  value={formState.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  placeholder="例如: 工作提醒、生活提"
                  maxLength={50}
                  autoFocus
                />
                {errors.name && (
                  <p className="text-xs text-destructive">{errors.name}</p>
                )}
                <p className="text-xs text-muted-foreground text-right">
                  {formState.name.length}/50
                </p>
              </div>

              {/* 颜色选择 */}
              <div className="space-y-2">
                <Label>颜色</Label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_OPTIONS.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${
                        formState.color === color.value
                          ? 'border-primary ring-2 ring-primary/30'
                          : 'border-transparent'
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
              <Label htmlFor="description">分组描述</Label>
              <Textarea
                id="description"
                value={formState.description}
                onChange={(e) => updateField('description', e.target.value)}
                placeholder="描述该分组的用途..."
                rows={3}
                maxLength={200}
              />
              {errors.description && (
                <p className="text-xs text-destructive">{errors.description}</p>
              )}
              <p className="text-xs text-muted-foreground text-right">
                {formState.description.length}/200
              </p>
            </div>
          </div>

          {/* 外观配置 */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              <Palette className="h-4 w-4 text-primary" />
              外观配置
            </div>
            <Separator />

            {/* 图标选择 */}
            <div className="space-y-2">
              <Label>选择图标</Label>
              <div className="grid grid-cols-5 gap-2">
                {ICON_OPTIONS.map((option) => {
                  const IconComponent = option.icon;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      className={`flex flex-col items-center gap-1 p-3 rounded-lg border transition-colors ${
                        formState.icon === option.value
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:bg-accent'
                      }`}
                      onClick={() => updateField('icon', option.value)}
                    >
                      <IconComponent className="h-5 w-5" />
                      <span className="text-xs">{option.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 排序权重 */}
            <div className="space-y-2">
              <Label htmlFor="order">排序权重</Label>
              <Input
                id="order"
                type="number"
                value={formState.order}
                onChange={(e) => updateField('order', parseInt(e.target.value) || 0)}
                placeholder="0"
              />
              <p className="text-xs text-muted-foreground">数字越小越靠</p>
            </div>
          </div>

          {/* 控制模式 */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              <Settings className="h-4 w-4 text-primary" />
              控制模式
            </div>
            <Separator />

            <div className="space-y-2">
              <Label>控制模式</Label>
              <Select
                value={formState.controlMode}
                onValueChange={(value) => updateField('controlMode', value as ControlMode)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONTROL_MODE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div>
                        <p className="font-medium">{option.title}</p>
                        <p className="text-xs text-muted-foreground">{option.description}</p>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ReminderGroupDialog;
