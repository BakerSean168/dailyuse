/**
 * Settings View
 *
 * 设置视图 - 用户偏好、应用配置和系统设置
 */

import { useState, useEffect } from 'react';
import { GitHubSyncSettings } from './GitHubSyncSettings';

interface AppSettings {
  theme: 'light' | 'dark' | 'auto';
  language: 'zh' | 'en';
  autoStartOnLogin: boolean;
  notificationsEnabled: boolean;
  notificationSound: boolean;
  updateCheckInterval: number; // in hours
  autoSync: boolean;
  syncInterval: number; // in minutes
}

const defaultSettings: AppSettings = {
  theme: 'auto',
  language: 'zh',
  autoStartOnLogin: true,
  notificationsEnabled: true,
  notificationSound: true,
  updateCheckInterval: 24,
  autoSync: true,
  syncInterval: 30,
};

export default function SettingsView() {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [isDirty, setIsDirty] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'notifications' | 'sync' | 'about'>(
    'general'
  );

  // 加载设置
  useEffect(() => {
    // 从 localStorage 加载
    const stored = localStorage.getItem('app-settings');
    if (stored) {
      try {
        setSettings(JSON.parse(stored));
      } catch {
        console.error('Failed to load settings');
      }
    }
  }, []);

  const handleSettingChange = <K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setIsDirty(true);
  };

  const handleSave = () => {
    localStorage.setItem('app-settings', JSON.stringify(settings));
    setIsDirty(false);
    // 显示保存成功消息
    alert('✅ 设置已保存');
  };

  const handleReset = () => {
    if (!window.confirm('确定要重置所有设置到默认值吗？')) return;
    setSettings(defaultSettings);
    setIsDirty(true);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">设置</h1>
          <p className="text-muted-foreground">应用设置和偏好配置</p>
        </div>
        {isDirty && (
          <div className="flex gap-2">
            <button
              onClick={handleReset}
              className="px-4 py-2 border border-destructive/50 text-destructive rounded-md hover:bg-destructive/10 transition-colors"
            >
              ↺ 重置
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              💾 保存
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        {[
          { id: 'general', label: '⚙️ 常规' },
          { id: 'notifications', label: '🔔 通知' },
          { id: 'sync', label: '🔄 同步' },
          { id: 'about', label: 'ℹ️ 关于' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* General Settings */}
      {activeTab === 'general' && (
        <div className="space-y-6 max-w-2xl">
          {/* Theme */}
          <div className="space-y-3">
            <label className="block text-sm font-medium">主题</label>
            <div className="flex gap-3">
              {['light', 'dark', 'auto'].map((theme) => (
                <label
                  key={theme}
                  className="flex items-center gap-2 cursor-pointer p-3 border rounded-lg hover:bg-secondary transition-colors"
                >
                  <input
                    type="radio"
                    name="theme"
                    value={theme}
                    checked={settings.theme === theme}
                    onChange={(e) => handleSettingChange('theme', e.target.value as any)}
                  />
                  <span className="capitalize">
                    {theme === 'light' && '☀️ 浅色'}
                    {theme === 'dark' && '🌙 深色'}
                    {theme === 'auto' && '🔄 自动'}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Language */}
          <div className="space-y-3">
            <label className="block text-sm font-medium">语言</label>
            <select
              value={settings.language}
              onChange={(e) => handleSettingChange('language', e.target.value as any)}
              className="w-full px-4 py-2 border rounded-md bg-background"
            >
              <option value="zh">中文</option>
              <option value="en">English</option>
            </select>
          </div>

          {/* Auto Start */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">开机时自动启动</p>
              <p className="text-sm text-muted-foreground">
                在系统启动时自动打开应用程序
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.autoStartOnLogin}
                onChange={(e) => handleSettingChange('autoStartOnLogin', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
            </label>
          </div>
        </div>
      )}

      {/* Notification Settings */}
      {activeTab === 'notifications' && (
        <div className="space-y-6 max-w-2xl">
          {/* Enable Notifications */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">启用通知</p>
              <p className="text-sm text-muted-foreground">
                接收应用程序的通知和提醒
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.notificationsEnabled}
                onChange={(e) => handleSettingChange('notificationsEnabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
            </label>
          </div>

          {/* Notification Sound */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">通知声音</p>
              <p className="text-sm text-muted-foreground">
                在通知时播放声音
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.notificationSound}
                onChange={(e) => handleSettingChange('notificationSound', e.target.checked)}
                disabled={!settings.notificationsEnabled}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
            </label>
          </div>

          {/* Update Check Interval */}
          <div className="space-y-3">
            <label className="block text-sm font-medium">检查更新间隔</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={settings.updateCheckInterval}
                onChange={(e) =>
                  handleSettingChange('updateCheckInterval', parseInt(e.target.value) || 24)
                }
                min="1"
                max="168"
                className="px-4 py-2 border rounded-md bg-background w-24"
              />
              <span className="text-muted-foreground">小时</span>
            </div>
            <p className="text-xs text-muted-foreground">
              每隔多长时间检查一次应用更新
            </p>
          </div>
        </div>
      )}

      {/* Sync Settings */}
      {activeTab === 'sync' && (
        <div className="max-w-2xl">
          <GitHubSyncSettings />
        </div>
      )}

      {/* About */}
      {activeTab === 'about' && (
        <div className="space-y-6 max-w-2xl">
          <div className="border rounded-lg p-6 space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">应用名称</p>
              <p className="text-lg font-medium">DailyUse</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">版本</p>
              <p className="text-lg font-medium">0.1.10</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">作者</p>
              <p className="text-lg font-medium">bakersean</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">说明</p>
              <p className="text-sm text-muted-foreground mt-1">
                一个强大的个人任务和目标管理应用程序
              </p>
            </div>

            <hr className="my-4" />

            <div className="space-y-2">
              <p className="text-sm font-medium">链接</p>
              <div className="flex flex-col gap-2">
                <a
                  href="#"
                  className="text-primary hover:underline text-sm"
                >
                  📖 查看文档
                </a>
                <a
                  href="#"
                  className="text-primary hover:underline text-sm"
                >
                  🐛 报告问题
                </a>
                <a
                  href="#"
                  className="text-primary hover:underline text-sm"
                >
                  💬 反馈建议
                </a>
              </div>
            </div>
          </div>

          {/* System Info */}
          <div className="border rounded-lg p-6 space-y-3">
            <p className="text-sm font-medium">系统信息</p>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>操作系统: {process.platform === 'darwin' ? 'macOS' : process.platform === 'win32' ? 'Windows' : 'Linux'}</p>
              <p>Node.js: {process.versions.node}</p>
              <p>Electron: {process.versions.electron}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
