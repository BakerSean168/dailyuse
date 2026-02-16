/**
 * Multi-Provider Sync Management Component
 *
 * Allows users to:
 * - Switch between cloud providers
 * - Migrate data between providers
 * - Manage multiple concurrent providers
 * - Compare provider features and pricing
 *
 * 多云提供商管�?- 在不同云服务间切换和迁移
 *
 * @module views/sync/MultiProviderSync
 */

import React, { useState, useCallback } from 'react';
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
  Check,
  X,
  ChevronRight,
  AlertCircle,
  RefreshCw,
  Copy,
  CheckCircle,
  Zap,
} from 'lucide-react';
import { cn } from '@dailyuse/ui-react-shadcn';

// Types
interface ProviderFeature {
  name: string;
  enabled: boolean;
}

interface CloudProvider {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  connected: boolean;
  features: ProviderFeature[];
  pricing: {
    free: string;
    paid: string;
  };
  region: string;
}

/**
 * Provider Comparison Component
 */
const ProviderComparison: React.FC<{
  providers: CloudProvider[];
}> = ({ providers }) => {
  const features = [
    'Unlimited Storage',
    'WebDAV Support',
    'OAuth2 Authentication',
    'End-to-End Encryption',
    'Batch Operations',
    'Version Control',
    'China Optimized',
    'Global Coverage',
    'Conflict Resolution',
    'Family Plans',
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b">
            <th className="text-left py-3 px-4 font-semibold">Feature</th>
            {providers.map(provider => (
              <th
                key={provider.id}
                className="text-center py-3 px-4 font-semibold"
              >
                <div className="flex flex-col items-center gap-2">
                  <div className="w-10 h-10 flex items-center justify-center">
                    {provider.icon}
                  </div>
                  <span>{provider.name}</span>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {features.map(feature => (
            <tr key={feature} className="border-b hover:bg-gray-50">
              <td className="py-3 px-4">{feature}</td>
              {providers.map(provider => {
                const hasFeature = provider.features.some(
                  f => f.name === feature && f.enabled
                );
                return (
                  <td
                    key={`${provider.id}-${feature}`}
                    className="text-center py-3 px-4"
                  >
                    {hasFeature ? (
                      <CheckCircle className="w-5 h-5 text-green-600 mx-auto" />
                    ) : (
                      <X className="w-5 h-5 text-gray-300 mx-auto" />
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

/**
 * Provider Migration Dialog
 */
const MigrationDialog: React.FC<{
  source: CloudProvider;
  target: CloudProvider;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ source, target, onConfirm, onCancel }) => {
  const [step, setStep] = useState<'confirm' | 'migrating' | 'complete'>(
    'confirm'
  );
  const [progress, setProgress] = useState(0);

  const handleStartMigration = () => {
    setStep('migrating');

    // Simulate migration progress
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setStep('complete');
          return 100;
        }
        return prev + Math.random() * 15;
      });
    }, 500);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5" />
            Migrate Data
          </CardTitle>
          <CardDescription>
            Move all your encrypted data from one provider to another
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {step === 'confirm' && (
            <>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {source.icon}
                    <span className="font-medium">{source.name}</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                  <div className="flex items-center gap-2">
                    {target.icon}
                    <span className="font-medium">{target.name}</span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  <div className="text-sm text-blue-800">
                    <p className="font-semibold mb-1">
                      Important: Before migrating
                    </p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Ensure you have configured {target.name}</li>
                      <li>
                        Migration cannot be interrupted - keep this window open
                      </li>
                      <li>Data will remain encrypted with your password</li>
                      <li>Original data on {source.name} will not be deleted</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button onClick={onCancel} variant="outline" className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleStartMigration} className="flex-1">
                  <Zap className="w-4 h-4 mr-2" />
                  Start Migration
                </Button>
              </div>
            </>
          )}

          {step === 'migrating' && (
            <>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">
                      Migrating data...
                    </span>
                    <span className="text-sm text-gray-600">
                      {Math.round(progress)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
                  <p>Uploading 320 items to {target.name}...</p>
                  <p>
                    Current: Goals (45/50 items)
                  </p>
                </div>
              </div>
            </>
          )}

          {step === 'complete' && (
            <>
              <div className="flex justify-center">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>

              <div className="text-center space-y-2">
                <p className="font-semibold">Migration Complete!</p>
                <p className="text-sm text-gray-600">
                  All 320 items have been successfully migrated to{' '}
                  {target.name}
                </p>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-800">
                  <strong>Next step:</strong> Switch your primary provider to{' '}
                  {target.name} in Settings
                </p>
              </div>

              <Button
                onClick={onConfirm}
                className="w-full"
              >
                <Check className="w-4 h-4 mr-2" />
                Finish
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

/**
 * Main Multi-Provider Management View
 */
export const MultiProviderSyncView: React.FC = () => {
  const [providers] = useState<CloudProvider[]>([
    {
      id: 'github',
      name: 'GitHub',
      description: 'Store data in private GitHub repositories',
      icon: <Github className="w-10 h-10" />,
      connected: true,
      features: [
        { name: 'Unlimited Storage', enabled: true },
        { name: 'WebDAV Support', enabled: false },
        { name: 'OAuth2 Authentication', enabled: true },
        { name: 'End-to-End Encryption', enabled: true },
        { name: 'Batch Operations', enabled: true },
        { name: 'Version Control', enabled: true },
        { name: 'China Optimized', enabled: false },
        { name: 'Global Coverage', enabled: true },
        { name: 'Conflict Resolution', enabled: true },
        { name: 'Family Plans', enabled: false },
      ],
      pricing: {
        free: 'Unlimited repositories',
        paid: '$4-21/month',
      },
      region: 'Global',
    },
    {
      id: 'nutstore',
      name: '坚果',
      description: 'WebDAV-based cloud storage optimized for China',
      icon: <Cloud className="w-10 h-10" />,
      connected: false,
      features: [
        { name: 'Unlimited Storage', enabled: false },
        { name: 'WebDAV Support', enabled: true },
        { name: 'OAuth2 Authentication', enabled: false },
        { name: 'End-to-End Encryption', enabled: true },
        { name: 'Batch Operations', enabled: true },
        { name: 'Version Control', enabled: false },
        { name: 'China Optimized', enabled: true },
        { name: 'Global Coverage', enabled: false },
        { name: 'Conflict Resolution', enabled: true },
        { name: 'Family Plans', enabled: false },
      ],
      pricing: {
        free: '30GB free',
        paid: '¥99/year (6TB)',
      },
      region: 'China',
    },
    {
      id: 'dropbox',
      name: 'Dropbox',
      description: 'Reliable cloud storage with global coverage',
      icon: <Cloud className="w-10 h-10" />,
      connected: false,
      features: [
        { name: 'Unlimited Storage', enabled: false },
        { name: 'WebDAV Support', enabled: false },
        { name: 'OAuth2 Authentication', enabled: true },
        { name: 'End-to-End Encryption', enabled: true },
        { name: 'Batch Operations', enabled: true },
        { name: 'Version Control', enabled: true },
        { name: 'China Optimized', enabled: false },
        { name: 'Global Coverage', enabled: true },
        { name: 'Conflict Resolution', enabled: true },
        { name: 'Family Plans', enabled: true },
      ],
      pricing: {
        free: '2GB free',
        paid: '$11.99-19.99/month',
      },
      region: 'Global',
    },
  ]);

  const [showMigration, setShowMigration] = useState(false);
  const [migration, setMigration] = useState<{
    source: string;
    target: string;
  } | null>(null);

  const handleMigrate = useCallback(
    (sourceId: string, targetId: string) => {
      setMigration({ source: sourceId, target: targetId });
      setShowMigration(true);
    },
    []
  );

  const primaryProvider = providers.find(p => p.connected);
  const secondaryProviders = providers.filter(p => !p.connected);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Cloud Provider Management</h1>
        <p className="text-gray-600 mt-1">
          Switch between providers, migrate data, and manage multiple cloud
          accounts
        </p>
      </div>

      {/* Primary Provider */}
      {primaryProvider && (
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Check className="w-5 h-5 text-blue-600" />
              Primary Provider
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0">{primaryProvider.icon}</div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold">
                  {primaryProvider.name}
                </h3>
                <p className="text-gray-600">{primaryProvider.description}</p>
              </div>
              <div className="flex-shrink-0">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-lg p-3">
                <p className="text-sm text-gray-600">Free Plan</p>
                <p className="font-semibold">{primaryProvider.pricing.free}</p>
              </div>
              <div className="bg-white rounded-lg p-3">
                <p className="text-sm text-gray-600">Region</p>
                <p className="font-semibold">{primaryProvider.region}</p>
              </div>
            </div>

            <Button variant="outline" className="w-full">
              Switch Provider
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Migration Options */}
      {secondaryProviders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Migrate to Another Provider</CardTitle>
            <CardDescription>
              Switch your primary storage while keeping all your data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {secondaryProviders.map(provider => (
              <div
                key={provider.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  {provider.icon}
                  <div>
                    <p className="font-semibold">{provider.name}</p>
                    <p className="text-sm text-gray-600">
                      {provider.description}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() =>
                    primaryProvider &&
                    handleMigrate(primaryProvider.id, provider.id)
                  }
                  size="sm"
                  variant="outline"
                >
                  Migrate
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Provider Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Feature Comparison</CardTitle>
          <CardDescription>
            Compare features across all available cloud providers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProviderComparison providers={providers} />
        </CardContent>
      </Card>

      {/* Migration Dialog */}
      {showMigration && migration && (
        <MigrationDialog
          source={providers.find(p => p.id === migration.source)!}
          target={providers.find(p => p.id === migration.target)!}
          onConfirm={() => setShowMigration(false)}
          onCancel={() => {
            setShowMigration(false);
            setMigration(null);
          }}
        />
      )}
    </div>
  );
};

export default MultiProviderSyncView;
