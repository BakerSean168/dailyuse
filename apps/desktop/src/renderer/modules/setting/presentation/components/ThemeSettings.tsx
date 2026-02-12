/**
 * ThemeSettings Component
 *
 * 主题设置组件
 * Story 11-6: Auxiliary Modules
 */

import { Moon, Sun, Monitor, Palette, Check } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Label,
  RadioGroup,
  RadioGroupItem,
  cn,
} from '@dailyuse/ui-react-shadcn';

interface ThemeSettingsProps {
  theme: 'light' | 'dark' | 'system';
  accentColor: string;
  onThemeChange: (theme: 'light' | 'dark' | 'system') => void;
  onAccentColorChange: (color: string) => void;
}

const themeOptions = [
  {
    value: 'light' as const,
    label: '浅色模式',
    description: '明亮的界面风�?,
    icon: Sun,
  },
  {
    value: 'dark' as const,
    label: '深色模式',
    description: '护眼的深色界�?,
    icon: Moon,
  },
  {
    value: 'system' as const,
    label: '跟随系统',
    description: '自动跟随系统设置',
    icon: Monitor,
  },
];

const accentColors = [
  { value: '#3b82f6', label: '蓝色' },
  { value: '#8b5cf6', label: '紫色' },
  { value: '#ec4899', label: '粉色' },
  { value: '#ef4444', label: '红色' },
  { value: '#f97316', label: '橙色' },
  { value: '#eab308', label: '黄色' },
  { value: '#22c55e', label: '绿色' },
  { value: '#14b8a6', label: '青色' },
];

export function ThemeSettings({
  theme,
  accentColor,
  onThemeChange,
  onAccentColorChange,
}: ThemeSettingsProps) {
  return (
    <div className="space-y-6">
      {/* Theme Mode */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Monitor className="h-4 w-4" />
            外观模式
          </CardTitle>
          <CardDescription>选择您喜欢的界面主题</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={theme}
            onValueChange={(value) => onThemeChange(value as 'light' | 'dark' | 'system')}
            className="grid grid-cols-3 gap-4"
          >
            {themeOptions.map((option) => (
              <Label
                key={option.value}
                htmlFor={option.value}
                className={cn(
                  'flex flex-col items-center gap-3 rounded-lg border-2 p-4 cursor-pointer transition-all hover:bg-muted',
                  theme === option.value
                    ? 'border-primary bg-primary/5'
                    : 'border-transparent bg-muted/50'
                )}
              >
                <RadioGroupItem
                  value={option.value}
                  id={option.value}
                  className="sr-only"
                />
                <div
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-full',
                    theme === option.value
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted-foreground/10'
                  )}
                >
                  <option.icon className="h-5 w-5" />
                </div>
                <div className="text-center">
                  <p className="font-medium text-sm">{option.label}</p>
                  <p className="text-xs text-muted-foreground">{option.description}</p>
                </div>
              </Label>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Accent Color */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Palette className="h-4 w-4" />
            主题�?
          </CardTitle>
          <CardDescription>选择应用的主题强调色</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {accentColors.map((color) => (
              <button
                key={color.value}
                onClick={() => onAccentColorChange(color.value)}
                className={cn(
                  'relative h-10 w-10 rounded-full border-2 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2',
                  accentColor === color.value
                    ? 'border-foreground scale-110'
                    : 'border-transparent'
                )}
                style={{ backgroundColor: color.value }}
                title={color.label}
              >
                {accentColor === color.value && (
                  <Check className="absolute inset-0 m-auto h-5 w-5 text-white drop-shadow-md" />
                )}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            当前选择: {accentColors.find((c) => c.value === accentColor)?.label || '蓝色'}
          </p>
        </CardContent>
      </Card>

      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">预览</CardTitle>
          <CardDescription>查看当前主题设置效果</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div
                className="h-8 w-8 rounded-full"
                style={{ backgroundColor: accentColor }}
              />
              <div>
                <p className="font-medium">示例标题</p>
                <p className="text-sm text-muted-foreground">这是一段示例描述文�?/p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                className="px-4 py-2 rounded-md text-white text-sm font-medium"
                style={{ backgroundColor: accentColor }}
              >
                主要按钮
              </button>
              <button className="px-4 py-2 rounded-md border text-sm font-medium">
                次要按钮
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default ThemeSettings;
