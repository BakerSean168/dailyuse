/**
 * SettingsView Component
 *
 * 设置页面主视�?
 * Story 11-6: Auxiliary Modules
 */

import { useState, useCallback } from 'react';
import { Settings, Palette, User, Database, Info, RotateCcw, Download, Upload } from 'lucide-react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@dailyuse/ui-react-shadcn';

import { ThemeSettings } from '../components/ThemeSettings';
import { GeneralSettings } from '../components/GeneralSettings';
import { useSettingStore } from '../stores/settingStore';
import { useAppSettings } from '../hooks/useAppSettings';
import type { AppSettings } from '../stores/settingStore';

// 简单的消息提示函数
const showMessage = (title: string, _description?: string) => {
  // TODO: 替换为统一的消息提示组�?
  console.log(`[Settings] ${title}`);
};

// 主题映射：本地格�?-> contracts 格式
const themeToContractFormat = (theme: 'light' | 'dark' | 'system'): 'LIGHT' | 'DARK' | 'AUTO' => {
  const map = { light: 'LIGHT', dark: 'DARK', system: 'AUTO' } as const;
  return map[theme];
};

export function SettingsView() {
  const { settings, setSettings, setSetting, resetToDefault } = useSettingStore();
  const { updateAppearance } = useAppSettings();

  const [activeTab, setActiveTab] = useState('general');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [saving, setSaving] = useState(false);

  // Save settings (通过 Hook 调用 ApplicationService)
  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      // 保存外观设置到后�?(language 属于 updateLocale)
      await updateAppearance({
        theme: themeToContractFormat(settings.theme),
      });
      showMessage('设置已保', '您的设置已成功保');
    } catch {
      showMessage('保存失败', '保存设置时发生错');
    } finally {
      setSaving(false);
    }
  }, [updateAppearance, settings.theme]);

  // Reset settings
  const handleReset = useCallback(() => {
    resetToDefault();
    setShowResetConfirm(false);
    showMessage('设置已重', '所有设置已恢复为默认');
  }, [resetToDefault]);

  // Export settings
  const handleExport = useCallback(() => {
    const data = JSON.stringify(settings, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dailyuse-settings-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showMessage('导出成功', '设置已导出为 JSON 文件');
  }, [settings]);

  // Import settings
  const handleImport = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const imported = JSON.parse(text) as Partial<AppSettings>;
        setSettings(imported);
        showMessage('导入成功', '设置已从文件导入');
      } catch {
        showMessage('导入失败', '文件格式无效');
      }
    };
    input.click();
  }, [setSettings]);

  // Handler shortcuts
  const handleShortcutChange = useCallback(
    (key: string, value: string) => {
      setSetting('shortcuts', {
        ...settings.shortcuts,
        [key]: value,
      });
    },
    [settings.shortcuts, setSetting]
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b">
        <div className="container max-w-4xl py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Settings className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">设置</h1>
                <p className="text-sm text-muted-foreground">管理应用偏好设置</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4 mr-1" />
                导出
              </Button>
              <Button variant="outline" size="sm" onClick={handleImport}>
                <Upload className="h-4 w-4 mr-1" />
                导入
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                {saving ? '保存中...' : '保存更改'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container max-w-4xl py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              通用
            </TabsTrigger>
            <TabsTrigger value="theme" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              主题
            </TabsTrigger>
            <TabsTrigger value="data" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              数据
            </TabsTrigger>
            <TabsTrigger value="about" className="flex items-center gap-2">
              <Info className="h-4 w-4" />
              关于
            </TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general" className="mt-6">
            <GeneralSettings
              language={settings.language}
              autoStart={settings.autoStart}
              minimizeToTray={settings.minimizeToTray}
              enableNotifications={settings.enableNotifications}
              notificationSound={settings.notificationSound}
              autoSync={settings.autoSync}
              syncInterval={settings.syncInterval}
              shortcuts={settings.shortcuts}
              onLanguageChange={(v) => setSetting('language', v)}
              onAutoStartChange={(v) => setSetting('autoStart', v)}
              onMinimizeToTrayChange={(v) => setSetting('minimizeToTray', v)}
              onEnableNotificationsChange={(v) => setSetting('enableNotifications', v)}
              onNotificationSoundChange={(v) => setSetting('notificationSound', v)}
              onAutoSyncChange={(v) => setSetting('autoSync', v)}
              onSyncIntervalChange={(v) => setSetting('syncInterval', v)}
              onShortcutChange={handleShortcutChange}
            />
          </TabsContent>

          {/* Theme Settings */}
          <TabsContent value="theme" className="mt-6">
            <ThemeSettings
              theme={settings.theme}
              accentColor={settings.accentColor}
              onThemeChange={(v) => setSetting('theme', v)}
              onAccentColorChange={(v) => setSetting('accentColor', v)}
            />
          </TabsContent>

          {/* Data Settings */}
          <TabsContent value="data" className="mt-6">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">数据管理</CardTitle>
                  <CardDescription>管理本地存储数据</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <p className="font-medium">清除缓存</p>
                      <p className="text-sm text-muted-foreground">
                        清除应用缓存数据，不影响用户数据
                      </p>
                    </div>
                    <Button variant="outline">清除缓存</Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-destructive">
                <CardHeader>
                  <CardTitle className="text-base text-destructive flex items-center gap-2">
                    <RotateCcw className="h-4 w-4" />
                    重置设置
                  </CardTitle>
                  <CardDescription>
                    将所有设置恢复为默认值，此操作不可撤销
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="destructive"
                    onClick={() => setShowResetConfirm(true)}
                  >
                    重置所有设�?
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* About */}
          <TabsContent value="about" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">关于 DailyUse</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-xl bg-primary flex items-center justify-center">
                    <span className="text-3xl text-primary-foreground">📅</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">DailyUse</h3>
                    <p className="text-sm text-muted-foreground">版本 1.0.0</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  DailyUse 是一款专注于日常效率的个人管理工具，帮助您管理目标、任务、日程和提醒�?
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    检查更�?
                  </Button>
                  <Button variant="outline" size="sm">
                    查看文档
                  </Button>
                  <Button variant="outline" size="sm">
                    反馈问题
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Reset Confirmation Dialog */}
      <AlertDialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确定要重置所有设置吗</AlertDialogTitle>
            <AlertDialogDescription>
              此操作将把所有设置恢复为默认值，包括主题、通知、同步等设置。此操作无法撤销�?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleReset}>确认重置</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default SettingsView;
