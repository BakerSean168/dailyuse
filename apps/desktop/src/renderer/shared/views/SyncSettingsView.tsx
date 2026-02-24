/**
 * Sync Settings View Component
 *
 * Manages sync configuration, viewing sync status, and managing connected providers.
 * 同步设置视图 - 显示和管理云同步配置
 *
 * @module views/sync/SyncSettings
 */

import React, { useState, useCallback, useEffect } from 'react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@dailyuse/ui-react-shadcn';
import { Button } from '@dailyuse/ui-react-shadcn';
import { Label } from '@dailyuse/ui-react-shadcn';
import {
  Github,
  Cloud,
  Trash2,
  Eye,
  EyeOff,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Clock,
  HardDrive,
  Settings,
  Plus,
} from 'lucide-react';
import { cn } from '@dailyuse/ui-react-shadcn';

// Types
interface SyncProvider {
  id: string;
  name: string;
  icon: React.ReactNode;
  connected: boolean;
  lastSync?: Date;
  nextSync?: Date;
  quota?: {
    used: number;
    total: number;
  };
  status: 'connected' | 'disconnected' | 'syncing' | 'error';
  error?: string;
}

interface SyncStats {
  totalItems: number;
  lastSync: Date | null;
  nextSync: Date | null;
  itemsSynced: number;
  itemsFailed: number;
  storageUsed: number;
  storageTotal: number;
}

/**
 * Sync Status Card Component
 */
const SyncStatusCard: React.FC<{ stats: SyncStats }> = ({ stats }) => {
  const usagePercent = (stats.storageUsed / stats.storageTotal) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="w-5 h-5" />
          Sync Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Last Sync</p>
            <p className="text-lg font-semibold">
              {stats.lastSync
                ? format(stats.lastSync, 'yyyy-MM-dd HH:mm:ss', { locale: zhCN })
                : 'Never'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Next Sync</p>
            <p className="text-lg font-semibold">
              {stats.nextSync
                ? format(stats.nextSync, 'HH:mm:ss', { locale: zhCN })
                : 'Not scheduled'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Items Synced</p>
            <p className="text-lg font-semibold text-green-600">
              {stats.itemsSynced}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Items Failed</p>
            <p className="text-lg font-semibold text-red-600">
              {stats.itemsFailed}
            </p>
          </div>
        </div>

        <div>
          <div className="flex justify-between mb-2">
            <p className="text-sm text-gray-600">Storage Usage</p>
            <p className="text-sm font-semibold">
              {(stats.storageUsed / 1024 / 1024).toFixed(2)} MB /{' '}
              {(stats.storageTotal / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={cn(
                'h-2 rounded-full transition-all',
                usagePercent > 90
                  ? 'bg-red-500'
                  : usagePercent > 70
                    ? 'bg-yellow-500'
                    : 'bg-green-500'
              )}
              style={{ width: `${Math.min(usagePercent, 100)}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Provider Card Component
 */
const ProviderCard: React.FC<{
  provider: SyncProvider;
  onDisconnect: (id: string) => void;
  onConfigure: (id: string) => void;
  onSync: (id: string) => void;
}> = ({ provider, onDisconnect, onConfigure, onSync }) => {
  const getStatusColor = () => {
    switch (provider.status) {
      case 'connected':
        return 'bg-green-50 border-green-200';
      case 'syncing':
        return 'bg-blue-50 border-blue-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'disconnected':
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = () => {
    switch (provider.status) {
      case 'connected':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'syncing':
        return (
          <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
        );
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'disconnected':
        return <Cloud className="w-5 h-5 text-gray-600" />;
    }
  };

  return (
    <div className={cn('border rounded-lg p-4', getStatusColor())}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3">
          <div className="mt-1">{provider.icon}</div>
          <div>
            <h3 className="font-semibold">{provider.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              {getStatusIcon()}
              <span className="text-sm capitalize">
                {provider.status === 'syncing'
                  ? 'Syncing...'
                  : provider.status}
              </span>
            </div>
          </div>
        </div>
      </div>

      {provider.error && (
        <div className="bg-red-100 border border-red-300 text-red-700 px-3 py-2 rounded mb-3 text-sm">
          {provider.error}
        </div>
      )}

      {provider.connected && (
        <div className="space-y-2 mb-3 text-sm">
          {provider.lastSync && (
            <div className="flex items-center gap-2 text-gray-600">
              <Clock className="w-4 h-4" />
              Last sync: {provider.lastSync.toLocaleString()}
            </div>
          )}
          {provider.quota && (
            <div className="flex items-center gap-2 text-gray-600">
              <HardDrive className="w-4 h-4" />
              {(provider.quota.used / 1024 / 1024).toFixed(2)} MB /{' '}
              {(provider.quota.total / 1024 / 1024).toFixed(2)} MB
            </div>
          )}
        </div>
      )}

      <div className="flex gap-2">
        {provider.connected ? (
          <>
            <Button
              onClick={() => onSync(provider.id)}
              disabled={provider.status === 'syncing'}
              size="sm"
              variant="outline"
              className="flex-1"
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              Sync Now
            </Button>
            <Button
              onClick={() => onConfigure(provider.id)}
              size="sm"
              variant="outline"
            >
              <Settings className="w-4 h-4" />
            </Button>
            <Button
              onClick={() => onDisconnect(provider.id)}
              size="sm"
              variant="destructive"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </>
        ) : (
          <Button
            onClick={() => onConfigure(provider.id)}
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Connect
          </Button>
        )}
      </div>
    </div>
  );
};

/**
 * Sync Settings Panel
 */
const SyncSettingsPanel: React.FC = () => {
  const [settings, setSettings] = useState({
    autoSync: true,
    syncInterval: 5,
    conflictResolution: 'manual',
    encryptionEnabled: true,
    showPassword: false,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Sync Settings
        </CardTitle>
        <CardDescription>
          Configure automatic sync behavior and conflict resolution
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={settings.autoSync}
              onChange={e =>
                setSettings(prev => ({ ...prev, autoSync: e.target.checked }))
              }
              className="w-4 h-4 rounded"
            />
            <span>Enable automatic sync</span>
          </Label>
          <p className="text-sm text-gray-600 ml-7 mt-1">
            Automatically synchronize your data at regular intervals
          </p>
        </div>

        {settings.autoSync && (
          <div>
            <Label htmlFor="syncInterval">Sync Interval (minutes)</Label>
            <input
              id="syncInterval"
              type="number"
              min="1"
              max="60"
              value={settings.syncInterval}
              onChange={e =>
                setSettings(prev => ({
                  ...prev,
                  syncInterval: parseInt(e.target.value),
                }))
              }
              className="w-full mt-1 px-3 py-2 border rounded-lg"
            />
            <p className="text-xs text-gray-500 mt-1">
              Data will sync automatically every {settings.syncInterval} minutes
            </p>
          </div>
        )}

        <div>
          <Label htmlFor="conflictResolution">Conflict Resolution</Label>
          <select
            id="conflictResolution"
            value={settings.conflictResolution}
            onChange={e =>
              setSettings(prev => ({
                ...prev,
                conflictResolution: e.target.value,
              }))
            }
            className="w-full mt-1 px-3 py-2 border rounded-lg"
          >
            <option value="manual">Manual - Ask me each time</option>
            <option value="local">Local - Always use local version</option>
            <option value="remote">Remote - Always use remote version</option>
            <option value="newest">Newest - Use most recent version</option>
            <option value="merge">Merge - Combine both versions</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">
            How to handle conflicting changes between devices
          </p>
        </div>

        <div>
          <Label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={settings.encryptionEnabled}
              onChange={e =>
                setSettings(prev => ({
                  ...prev,
                  encryptionEnabled: e.target.checked,
                }))
              }
              className="w-4 h-4 rounded"
              disabled
            />
            <span>End-to-end encryption</span>
          </Label>
          <p className="text-sm text-gray-600 ml-7 mt-1">
            Your data is always encrypted before uploading to cloud
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Main Sync Settings View
 */
export const SyncSettingsView: React.FC<{ onAddProvider?: () => void }> = ({
  onAddProvider,
}) => {
  const [providers, setProviders] = useState<SyncProvider[]>([
    {
      id: 'github',
      name: 'GitHub',
      icon: <Github className="w-8 h-8" />,
      connected: true,
      status: 'connected',
      lastSync: new Date(Date.now() - 5 * 60000), // 5 minutes ago
      nextSync: new Date(Date.now() + 5 * 60000), // 5 minutes from now
      quota: {
        used: 50 * 1024 * 1024,
        total: 1024 * 1024 * 1024, // 1GB
      },
    },
    {
      id: 'nutstore',
      name: '坚果云 (Nutstore)',
      icon: <Cloud className="w-8 h-8" />,
      connected: false,
      status: 'disconnected',
    },
    {
      id: 'dropbox',
      name: 'Dropbox',
      icon: <Cloud className="w-8 h-8" />,
      connected: false,
      status: 'disconnected',
    },
  ]);

  const [stats, setStats] = useState<SyncStats>({
    totalItems: 320,
    lastSync: new Date(Date.now() - 10 * 60000),
    nextSync: new Date(Date.now() + 5 * 60000),
    itemsSynced: 315,
    itemsFailed: 5,
    storageUsed: 150 * 1024 * 1024,
    storageTotal: 1024 * 1024 * 1024,
  });

  const handleDisconnect = useCallback((providerId: string) => {
    if (
      window.confirm(
        'Are you sure you want to disconnect this provider? Your encrypted data will remain on the cloud.'
      )
    ) {
      setProviders(prev =>
        prev.map(p =>
          p.id === providerId
            ? { ...p, connected: false, status: 'disconnected' }
            : p
        )
      );
    }
  }, []);

  const handleSync = useCallback((providerId: string) => {
    setProviders(prev =>
      prev.map(p =>
        p.id === providerId ? { ...p, status: 'syncing' } : p
      )
    );

    // Simulate sync
    setTimeout(() => {
      setProviders(prev =>
        prev.map(p =>
          p.id === providerId
            ? {
                ...p,
                status: 'connected',
                lastSync: new Date(),
                nextSync: new Date(Date.now() + 5 * 60000),
              }
            : p
        )
      );
    }, 3000);
  }, []);

  const handleConfigure = useCallback((providerId: string) => {
    console.log('Configure provider:', providerId);
    // TODO: Open configuration dialog
  }, []);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Cloud Sync Settings</h1>
          <p className="text-gray-600 mt-1">
            Manage your cloud sync configuration and connected providers
          </p>
        </div>
        <Button onClick={onAddProvider}>
          <Plus className="w-4 h-4 mr-2" />
          Add Provider
        </Button>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Status and Providers */}
        <div className="lg:col-span-2 space-y-6">
          {/* Sync Status */}
          <SyncStatusCard stats={stats} />

          {/* Connected Providers */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Cloud Providers</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {providers.map(provider => (
                <ProviderCard
                  key={provider.id}
                  provider={provider}
                  onDisconnect={handleDisconnect}
                  onConfigure={handleConfigure}
                  onSync={handleSync}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Settings */}
        <div>
          <SyncSettingsPanel />
        </div>
      </div>

      {/* Advanced Options */}
      <Card>
        <CardHeader>
          <CardTitle>Advanced Options</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button variant="outline" className="w-full justify-start">
            📥 Import Data from Cloud
          </Button>
          <Button variant="outline" className="w-full justify-start">
            📤 Export Data to Cloud
          </Button>
          <Button variant="outline" className="w-full justify-start">
            🔑 Change Encryption Password
          </Button>
          <Button variant="outline" className="w-full justify-start text-red-600">
            🗑️ Clear Sync History
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default SyncSettingsView;
