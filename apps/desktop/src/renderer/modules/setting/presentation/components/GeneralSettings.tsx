/**
 * GeneralSettings Component
 *
 * 通用设置组件
 * Story 11-6: Auxiliary Modules
 */

import { Globe, Bell, RefreshCw, Keyboard, Monitor } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Label,
  Switch,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Input,
} from '@dailyuse/ui-react-shadcn';

interface GeneralSettingsProps {
  language: 'zh-CN' | 'en-US';
  autoStart: boolean;
  minimizeToTray: boolean;
  enableNotifications: boolean;
  notificationSound: boolean;
  autoSync: boolean;
  syncInterval: number;
  shortcuts: Record<string, string>;
  onLanguageChange: (language: 'zh-CN' | 'en-US') => void;
  onAutoStartChange: (enabled: boolean) => void;
  onMinimizeToTrayChange: (enabled: boolean) => void;
  onEnableNotificationsChange: (enabled: boolean) => void;
  onNotificationSoundChange: (enabled: boolean) => void;
  onAutoSyncChange: (enabled: boolean) => void;
  onSyncIntervalChange: (interval: number) => void;
  onShortcutChange: (key: string, value: string) => void;
}

export function GeneralSettings({
  language,
  autoStart,
  minimizeToTray,
  enableNotifications,
  notificationSound,
  autoSync,
  syncInterval,
  shortcuts,
  onLanguageChange,
  onAutoStartChange,
  onMinimizeToTrayChange,
  onEnableNotificationsChange,
  onNotificationSoundChange,
  onAutoSyncChange,
  onSyncIntervalChange,
  onShortcutChange,
}: GeneralSettingsProps) {
  const shortcutLabels: Record<string, string> = {
    newGoal: '新建目标',
    newTask: '新建任务',
    newReminder: '新建提醒',
    search: '全局搜索',
  };

  return (
    <div className="space-y-6">
      {/* Language Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Globe className="h-4 w-4" />
            语言与地�?
          </CardTitle>
          <CardDescription>设置应用的显示语言</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>界面语言</Label>
              <p className="text-sm text-muted-foreground">选择应用显示语言</p>
            </div>
            <Select value={language} onValueChange={(v) => onLanguageChange(v as 'zh-CN' | 'en-US')}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="zh-CN">简体中</SelectItem>
                <SelectItem value="en-US">English</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Startup Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Monitor className="h-4 w-4" />
            启动设置
          </CardTitle>
          <CardDescription>配置应用启动行为</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>开机自启</Label>
              <p className="text-sm text-muted-foreground">系统启动时自动运行应用</p>
            </div>
            <Switch checked={autoStart} onCheckedChange={onAutoStartChange} />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>最小化到托盘</Label>
              <p className="text-sm text-muted-foreground">关闭窗口时最小化到系统托盘</p>
            </div>
            <Switch checked={minimizeToTray} onCheckedChange={onMinimizeToTrayChange} />
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="h-4 w-4" />
            通知设置
          </CardTitle>
          <CardDescription>配置应用通知行为</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>启用通知</Label>
              <p className="text-sm text-muted-foreground">接收桌面推送通知</p>
            </div>
            <Switch
              checked={enableNotifications}
              onCheckedChange={onEnableNotificationsChange}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>通知声音</Label>
              <p className="text-sm text-muted-foreground">通知时播放提示音</p>
            </div>
            <Switch
              checked={notificationSound}
              onCheckedChange={onNotificationSoundChange}
              disabled={!enableNotifications}
            />
          </div>
        </CardContent>
      </Card>

      {/* Sync Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            同步设置
          </CardTitle>
          <CardDescription>配置数据同步行为</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>自动同步</Label>
              <p className="text-sm text-muted-foreground">自动与服务器同步数据</p>
            </div>
            <Switch checked={autoSync} onCheckedChange={onAutoSyncChange} />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>同步间隔</Label>
              <p className="text-sm text-muted-foreground">自动同步的时间间隔（分钟）</p>
            </div>
            <Select
              value={String(syncInterval)}
              onValueChange={(v) => onSyncIntervalChange(Number(v))}
              disabled={!autoSync}
            >
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 分钟</SelectItem>
                <SelectItem value="5">5 分钟</SelectItem>
                <SelectItem value="15">15 分钟</SelectItem>
                <SelectItem value="30">30 分钟</SelectItem>
                <SelectItem value="60">1 小时</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Keyboard Shortcuts */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Keyboard className="h-4 w-4" />
            快捷�?
          </CardTitle>
          <CardDescription>自定义键盘快捷键</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(shortcutLabels).map(([key, label], index) => (
            <div key={key}>
              {index > 0 && <Separator className="mb-4" />}
              <div className="flex items-center justify-between">
                <Label>{label}</Label>
                <Input
                  value={shortcuts[key] || ''}
                  onChange={(e) => onShortcutChange(key, e.target.value)}
                  placeholder="按下快捷键..."
                  className="w-40 text-center font-mono text-sm"
                  readOnly
                  onKeyDown={(e) => {
                    e.preventDefault();
                    const keys: string[] = [];
                    if (e.ctrlKey) keys.push('Ctrl');
                    if (e.altKey) keys.push('Alt');
                    if (e.shiftKey) keys.push('Shift');
                    if (e.metaKey) keys.push('Cmd');
                    if (e.key !== 'Control' && e.key !== 'Alt' && e.key !== 'Shift' && e.key !== 'Meta') {
                      keys.push(e.key.toUpperCase());
                    }
                    if (keys.length > 1 || (keys.length === 1 && !['Ctrl', 'Alt', 'Shift', 'Cmd'].includes(keys[0]))) {
                      onShortcutChange(key, keys.join('+'));
                    }
                  }}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export default GeneralSettings;
