/**
 * CreateScheduleDialog Component
 *
 * 创建日程事件对话�?
 * 功能�?
 * 1. 表单输入：标题、描述、时间、地�?
 * 2. 支持编辑模式
 * 3. 表单验证
 */

import { useState, useCallback, useEffect } from 'react';
import type { ScheduleClientDTO, CreateScheduleRequest, UpdateScheduleRequest } from '../../stores/scheduleStore';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@dailyuse/ui-react-shadcn';
import { Button } from '@dailyuse/ui-react-shadcn';
import { Input } from '@dailyuse/ui-react-shadcn';
import { Textarea } from '@dailyuse/ui-react-shadcn';
import { Label } from '@dailyuse/ui-react-shadcn';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@dailyuse/ui-react-shadcn';
import { Calendar, Clock, MapPin, Users, X } from 'lucide-react';

// ===================== 接口定义 =====================

interface CreateScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingSchedule?: ScheduleClientDTO | null;
  isLoading?: boolean;
  onSubmit?: (data: CreateScheduleRequest | UpdateScheduleRequest) => void;
  onCancel?: () => void;
}

interface FormData {
  title: string;
  description: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  priority: number | null;
  location: string;
  attendees: string[];
}

// ===================== 初始�?=====================

const initialFormData: FormData = {
  title: '',
  description: '',
  startDate: '',
  startTime: '',
  endDate: '',
  endTime: '',
  priority: null,
  location: '',
  attendees: [],
};

const priorityOptions = [
  { label: '最�?(1)', value: '1' },
  { label: '�?(2)', value: '2' },
  { label: '�?(3)', value: '3' },
  { label: '�?(4)', value: '4' },
  { label: '最�?(5)', value: '5' },
];

// ===================== 组件 =====================

export function CreateScheduleDialog({
  open,
  onOpenChange,
  editingSchedule,
  isLoading = false,
  onSubmit,
  onCancel,
}: CreateScheduleDialogProps) {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditing = !!editingSchedule;

  // 编辑模式时填充表�?
  useEffect(() => {
    if (editingSchedule) {
      const startDate = new Date(editingSchedule.startTime);
      const endDate = new Date(editingSchedule.endTime);

      setFormData({
        title: editingSchedule.title,
        description: editingSchedule.description || '',
        startDate: startDate.toISOString().split('T')[0],
        startTime: startDate.toTimeString().slice(0, 5),
        endDate: endDate.toISOString().split('T')[0],
        endTime: endDate.toTimeString().slice(0, 5),
        priority: editingSchedule.priority || null,
        location: editingSchedule.location || '',
        attendees: [...((editingSchedule as any).attendees || [])],
      });
    } else {
      setFormData(initialFormData);
    }
    setErrors({});
  }, [editingSchedule, open]);

  // 更新表单字段
  const updateField = useCallback((field: keyof FormData, value: string | number | null | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  }, []);

  // 表单验证
  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = '请输入标�?;
    } else if (formData.title.length > 200) {
      newErrors.title = '标题最�?00个字�?;
    }

    if (!formData.startDate) {
      newErrors.startDate = '请选择开始日�?;
    }

    if (!formData.startTime) {
      newErrors.startTime = '请选择开始时�?;
    }

    if (!formData.endDate) {
      newErrors.endDate = '请选择结束日期';
    }

    if (!formData.endTime) {
      newErrors.endTime = '请选择结束时间';
    }

    // 检查结束时间是否晚于开始时�?
    if (formData.startDate && formData.startTime && formData.endDate && formData.endTime) {
      const startTimestamp = new Date(`${formData.startDate}T${formData.startTime}`).getTime();
      const endTimestamp = new Date(`${formData.endDate}T${formData.endTime}`).getTime();
      if (endTimestamp <= startTimestamp) {
        newErrors.endTime = '结束时间必须晚于开始时�?;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // 提交表单
  const handleSubmit = useCallback(() => {
    if (!validate()) return;

    const startTimestamp = new Date(`${formData.startDate}T${formData.startTime}`).getTime();
    const endTimestamp = new Date(`${formData.endDate}T${formData.endTime}`).getTime();

    const data = {
      title: formData.title.trim(),
      description: formData.description.trim() || undefined,
      startTime: startTimestamp,
      endTime: endTimestamp,
      priority: formData.priority || undefined,
      location: formData.location.trim() || undefined,
      attendees: formData.attendees.length > 0 ? formData.attendees : undefined,
    };

    onSubmit?.(data);
  }, [formData, validate, onSubmit]);

  // 取消
  const handleCancel = useCallback(() => {
    setFormData(initialFormData);
    setErrors({});
    onCancel?.();
    onOpenChange(false);
  }, [onCancel, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-full bg-primary/10">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <DialogTitle>{isEditing ? '编辑日程事件' : '创建日程事件'}</DialogTitle>
          </div>
          <DialogDescription>
            {isEditing ? '修改日程事件信息' : '填写日程事件信息并创�?}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 标题 */}
          <div className="space-y-2">
            <Label htmlFor="title">标题 *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => updateField('title', e.target.value)}
              placeholder="输入日程标题"
              maxLength={200}
              className={errors.title ? 'border-destructive' : ''}
            />
            {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
          </div>

          {/* 描述 */}
          <div className="space-y-2">
            <Label htmlFor="description">描述</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => updateField('description', e.target.value)}
              placeholder="输入日程描述"
              rows={3}
              maxLength={1000}
            />
          </div>

          {/* 时间选择 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">开始日�?*</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => updateField('startDate', e.target.value)}
                className={errors.startDate ? 'border-destructive' : ''}
              />
              {errors.startDate && <p className="text-xs text-destructive">{errors.startDate}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="startTime">开始时�?*</Label>
              <Input
                id="startTime"
                type="time"
                value={formData.startTime}
                onChange={(e) => updateField('startTime', e.target.value)}
                className={errors.startTime ? 'border-destructive' : ''}
              />
              {errors.startTime && <p className="text-xs text-destructive">{errors.startTime}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="endDate">结束日期 *</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => updateField('endDate', e.target.value)}
                className={errors.endDate ? 'border-destructive' : ''}
              />
              {errors.endDate && <p className="text-xs text-destructive">{errors.endDate}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">结束时间 *</Label>
              <Input
                id="endTime"
                type="time"
                value={formData.endTime}
                onChange={(e) => updateField('endTime', e.target.value)}
                className={errors.endTime ? 'border-destructive' : ''}
              />
              {errors.endTime && <p className="text-xs text-destructive">{errors.endTime}</p>}
            </div>
          </div>

          {/* 优先�?*/}
          <div className="space-y-2">
            <Label>优先�?/Label>
            <Select
              value={formData.priority?.toString() || ''}
              onValueChange={(value) => updateField('priority', value ? parseInt(value) : null)}
            >
              <SelectTrigger>
                <SelectValue placeholder="选择优先�? />
              </SelectTrigger>
              <SelectContent>
                {priorityOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 地点 */}
          <div className="space-y-2">
            <Label htmlFor="location" className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              地点
            </Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => updateField('location', e.target.value)}
              placeholder="输入地点"
              maxLength={200}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? '处理�?..' : isEditing ? '保存' : '创建'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default CreateScheduleDialog;
