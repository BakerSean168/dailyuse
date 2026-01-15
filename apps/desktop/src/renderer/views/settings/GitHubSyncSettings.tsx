/**
 * GitHubSyncSettings - GitHub Gist 同步设置组件
 *
 * 提供 GitHub Gist 同步功能的配置界面：
 * - GitHub OAuth 认证
 * - 同步状态显示
 * - 手动同步控制
 * - 数据导入/导出
 */

import { useState, useEffect, useCallback } from 'react';

// 从 window.electronAPI 调用
const electronAPI = window.electronAPI;

/**
 * GitHub 用户信息
 */
interface GitHubUser {
  id: number;
  login: string;
  name?: string;
  avatarUrl: string;
  email?: string;
}

/**
 * 同步状态类型
 */
type SyncStatus = 'idle' | 'syncing' | 'success' | 'error' | 'offline';

/**
 * GitHub 同步状态
 */
interface GitHubSyncStatus {
  connected: boolean;
  user?: GitHubUser;
  gistId?: string;
  lastSyncTime?: number;
  syncStatus: SyncStatus;
}

/**
 * 同步结果
 */
interface SyncResult {
  ok: boolean;
  operation: string;
  syncedCount: number;
  conflictCount: number;
  error?: string;
  timestamp: number;
}

export function GitHubSyncSettings() {
  const [status, setStatus] = useState<GitHubSyncStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<SyncResult | null>(null);

  // 加载同步状态
  const loadStatus = useCallback(async () => {
    try {
      const result = await electronAPI.invoke<GitHubSyncStatus>('sync:github:get-status');
      setStatus(result);
      setError(null);
    } catch (err) {
      console.error('Failed to load sync status:', err);
      setError('无法获取同步状态');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  // 连接 GitHub
  const handleConnect = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await electronAPI.invoke<{ ok: boolean; error?: string }>(
        'sync:github:connect'
      );

      if (result.ok) {
        await loadStatus();
      } else {
        setError(result.error || '连接失败');
      }
    } catch (err) {
      console.error('GitHub connect failed:', err);
      setError('连接 GitHub 失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 断开连接
  const handleDisconnect = async () => {
    if (!window.confirm('确定要断开 GitHub 连接吗？这不会删除云端数据。')) {
      return;
    }

    setIsLoading(true);
    try {
      await electronAPI.invoke('sync:github:disconnect');
      await loadStatus();
    } catch (err) {
      console.error('GitHub disconnect failed:', err);
      setError('断开连接失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 执行同步
  const handleSync = async (operation: 'push' | 'pull' | 'full-sync') => {
    setIsSyncing(true);
    setError(null);
    setLastResult(null);

    try {
      const channel =
        operation === 'push'
          ? 'sync:github:push'
          : operation === 'pull'
            ? 'sync:github:pull'
            : 'sync:github:full-sync';

      const result = await electronAPI.invoke<SyncResult>(channel);
      setLastResult(result);

      if (!result.ok) {
        setError(result.error || '同步失败');
      }

      await loadStatus();
    } catch (err) {
      console.error('Sync failed:', err);
      setError('同步操作失败，请重试');
    } finally {
      setIsSyncing(false);
    }
  };

  // 格式化时间
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-CN');
  };

  // 获取状态图标
  const getStatusIcon = (syncStatus: SyncStatus) => {
    switch (syncStatus) {
      case 'idle':
        return '⚪';
      case 'syncing':
        return '🔄';
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'offline':
        return '📴';
      default:
        return '⚪';
    }
  };

  // 获取状态文本
  const getStatusText = (syncStatus: SyncStatus) => {
    switch (syncStatus) {
      case 'idle':
        return '空闲';
      case 'syncing':
        return '同步中...';
      case 'success':
        return '已同步';
      case 'error':
        return '同步失败';
      case 'offline':
        return '离线';
      default:
        return '未知';
    }
  };

  if (isLoading && !status) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* GitHub Connection Section */}
      <div className="p-6 border rounded-lg bg-card">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            {/* GitHub Logo */}
            <div className="w-12 h-12 rounded-full bg-gray-900 dark:bg-white flex items-center justify-center">
              <svg
                className="w-8 h-8 text-white dark:text-gray-900"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
              </svg>
            </div>

            <div>
              <h3 className="text-lg font-semibold">GitHub Gist 同步</h3>
              <p className="text-sm text-muted-foreground">
                使用 GitHub Gist 安全地同步您的数据
              </p>
            </div>
          </div>

          {/* Connection Status */}
          {status?.connected ? (
            <div className="flex items-center gap-2 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              已连接
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full text-sm">
              <span className="w-2 h-2 bg-gray-400 rounded-full" />
              未连接
            </div>
          )}
        </div>

        {/* User Info (if connected) */}
        {status?.connected && status.user && (
          <div className="mt-4 pt-4 border-t flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={status.user.avatarUrl}
                alt={status.user.login}
                className="w-10 h-10 rounded-full"
              />
              <div>
                <p className="font-medium">{status.user.name || status.user.login}</p>
                <p className="text-sm text-muted-foreground">@{status.user.login}</p>
              </div>
            </div>

            <button
              onClick={handleDisconnect}
              disabled={isLoading}
              className="px-4 py-2 text-sm border border-destructive/50 text-destructive rounded-md hover:bg-destructive/10 transition-colors disabled:opacity-50"
            >
              断开连接
            </button>
          </div>
        )}

        {/* Connect Button (if not connected) */}
        {!status?.connected && (
          <div className="mt-4 pt-4 border-t">
            <button
              onClick={handleConnect}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {isLoading ? (
                <span>连接中...</span>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
                  </svg>
                  使用 GitHub 账号连接
                </>
              )}
            </button>
            <p className="mt-3 text-xs text-center text-muted-foreground">
              我们只请求访问 Gist 的权限，不会访问您的其他数据
            </p>
          </div>
        )}
      </div>

      {/* Sync Controls (if connected) */}
      {status?.connected && (
        <div className="p-6 border rounded-lg bg-card space-y-4">
          <h3 className="font-semibold">同步控制</h3>

          {/* Sync Status */}
          <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{getStatusIcon(status.syncStatus)}</span>
              <div>
                <p className="font-medium">{getStatusText(status.syncStatus)}</p>
                {status.lastSyncTime && (
                  <p className="text-sm text-muted-foreground">
                    上次同步: {formatTime(status.lastSyncTime)}
                  </p>
                )}
              </div>
            </div>

            {status.gistId && (
              <a
                href={`https://gist.github.com/${status.gistId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline"
              >
                查看 Gist ↗
              </a>
            )}
          </div>

          {/* Sync Buttons */}
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => handleSync('push')}
              disabled={isSyncing}
              className="flex flex-col items-center justify-center gap-2 p-4 border rounded-lg hover:bg-secondary transition-colors disabled:opacity-50"
            >
              <span className="text-2xl">⬆️</span>
              <span className="text-sm font-medium">上传到云端</span>
            </button>

            <button
              onClick={() => handleSync('pull')}
              disabled={isSyncing}
              className="flex flex-col items-center justify-center gap-2 p-4 border rounded-lg hover:bg-secondary transition-colors disabled:opacity-50"
            >
              <span className="text-2xl">⬇️</span>
              <span className="text-sm font-medium">从云端下载</span>
            </button>

            <button
              onClick={() => handleSync('full-sync')}
              disabled={isSyncing}
              className="flex flex-col items-center justify-center gap-2 p-4 border rounded-lg hover:bg-secondary transition-colors disabled:opacity-50"
            >
              <span className="text-2xl">🔄</span>
              <span className="text-sm font-medium">完整同步</span>
            </button>
          </div>

          {/* Sync Result */}
          {lastResult && (
            <div
              className={`p-4 rounded-lg ${
                lastResult.ok
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                  : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
              }`}
            >
              {lastResult.ok ? (
                <p>
                  ✅ 同步成功！已同步 {lastResult.syncedCount} 个项目
                </p>
              ) : (
                <p>❌ 同步失败: {lastResult.error}</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Data Export/Import */}
      <div className="p-6 border rounded-lg bg-card space-y-4">
        <h3 className="font-semibold">数据导入/导出</h3>
        <p className="text-sm text-muted-foreground">
          将您的数据导出为文件，或从文件导入数据
        </p>

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => {
              // TODO: 实现导出功能
              alert('导出功能即将推出');
            }}
            className="flex items-center justify-center gap-2 p-4 border rounded-lg hover:bg-secondary transition-colors"
          >
            <span className="text-xl">📤</span>
            <span className="font-medium">导出数据</span>
          </button>

          <button
            onClick={() => {
              // TODO: 实现导入功能
              alert('导入功能即将推出');
            }}
            className="flex items-center justify-center gap-2 p-4 border rounded-lg hover:bg-secondary transition-colors"
          >
            <span className="text-xl">📥</span>
            <span className="font-medium">导入数据</span>
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg">
          <p className="font-medium">❌ 错误</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Info */}
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <h4 className="font-medium text-blue-700 dark:text-blue-300 mb-2">
          💡 关于 GitHub Gist 同步
        </h4>
        <ul className="text-sm text-blue-600 dark:text-blue-400 space-y-1">
          <li>• 您的数据会安全地存储在您自己的 GitHub Gist 中</li>
          <li>• 默认使用私有 Gist，只有您可以访问</li>
          <li>• 数据同步完全免费，无需付费订阅</li>
          <li>• 您可以随时在 GitHub 上查看或删除同步数据</li>
        </ul>
      </div>
    </div>
  );
}

export default GitHubSyncSettings;
