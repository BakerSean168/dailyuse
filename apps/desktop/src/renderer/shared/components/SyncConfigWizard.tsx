/**
 * Cloud Sync Configuration Wizard
 *
 * A 4-step wizard to guide users through cloud sync setup:
 * 1. Select cloud platform (GitHub, Nutstore, Dropbox, Self-hosted)
 * 2. Authentication (provider-specific credentials)
 * 3. Encryption password setup
 * 4. Data sync options and direction
 *
 * @module renderer/shared/components/SyncConfigWizard
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@dailyuse/ui-react-shadcn';
import { Button } from '@dailyuse/ui-react-shadcn';
import { Input } from '@dailyuse/ui-react-shadcn';
import { Label } from '@dailyuse/ui-react-shadcn';
import { Progress } from '@dailyuse/ui-react-shadcn';
import {
  Github,
  Cloud,
  Lock,
  Settings,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  RefreshCw,
  Info,
} from 'lucide-react';
import { cn } from '@dailyuse/ui-react-shadcn';

/**
 * Definition of a synchronization provider.
 */
interface SyncProvider {
  /** Unique identifier for the provider. */
  id: 'github' | 'nutstore' | 'dropbox' | 'self-hosted';
  /** Display name of the provider. */
  name: string;
  /** Short description. */
  description: string;
  /** Provider icon component. */
  icon: React.ReactNode;
  /** List of key features. */
  features: string[];
  /** Description of free tier capacity. */
  freeCapacity: string;
  /** Whether the provider requires a paid subscription for full features. */
  isPaid: boolean;
  /** Geographical region of the provider servers. */
  region: string;
}

/**
 * Configuration state collected by the wizard.
 */
interface SyncConfig {
  /** Selected provider ID. */
  provider: SyncProvider['id'] | undefined;
  /** Provider-specific credentials (tokens, usernames, etc.). */
  credentials: Record<string, string>;
  /** User-defined password for client-side encryption. */
  encryptionPassword: string;
  /** Initial synchronization direction. */
  syncDirection: 'upload' | 'download' | 'manual';
  /** List of entity types enabled for sync. */
  selectedEntityTypes: string[];
}

/**
 * Props passed to each step component.
 */
interface StepProps {
  /** Current configuration state. */
  config: SyncConfig;
  /** Callback to update configuration. */
  onConfigChange: (config: Partial<SyncConfig>) => void;
  /** Callback to proceed to next step (optional for some steps). */
  onNext: () => Promise<void>;
  /** Loading state flag. */
  isLoading: boolean;
  /** Error message to display. */
  error?: string;
}

// Provider definitions
const SYNC_PROVIDERS: SyncProvider[] = [
  {
    id: 'github',
    name: 'GitHub',
    description: 'Store data in private GitHub repositories',
    icon: <Github className="w-12 h-12" />,
    features: ['Unlimited storage', 'Version control', 'Private repos'],
    freeCapacity: 'Unlimited',
    isPaid: false,
    region: 'Global',
  },
  {
    id: 'nutstore',
    name: '坚果云 (Nutstore)',
    description: 'Secure cloud storage optimized for Chinese users',
    icon: <Cloud className="w-12 h-12" />,
    features: ['30GB free', 'WebDAV support', 'Optimized for China'],
    freeCapacity: '30GB',
    isPaid: false,
    region: 'China',
  },
  {
    id: 'dropbox',
    name: 'Dropbox',
    description: 'Reliable cloud storage with global coverage',
    icon: <Cloud className="w-12 h-12" />,
    features: ['2GB free', 'OAuth2', 'Global sync'],
    freeCapacity: '2GB',
    isPaid: false,
    region: 'Global',
  },
  {
    id: 'self-hosted',
    name: 'Self-hosted',
    description: 'Deploy on your own server (WebDAV)',
    icon: <Settings className="w-12 h-12" />,
    features: ['Full control', 'WebDAV protocol', 'On-premises'],
    freeCapacity: 'Custom',
    isPaid: false,
    region: 'Custom',
  },
];

// Entity types for sync
const ENTITY_TYPES = [
  { id: 'goals', label: 'Goals', icon: '🎯' },
  { id: 'tasks', label: 'Tasks', icon: '✅' },
  { id: 'reminders', label: 'Reminders', icon: '🔔' },
  { id: 'schedules', label: 'Schedules', icon: '📅' },
  { id: 'accounts', label: 'Accounts', icon: '👤' },
];

/**
 * Step 1: Select Cloud Provider
 * Allows user to choose a backend for synchronization.
 */
const Step1SelectProvider: React.FC<StepProps> = ({
  config,
  onConfigChange,
}) => {
  const selectedProvider = SYNC_PROVIDERS.find(p => p.id === config.provider);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold mb-2">Select Cloud Platform</h2>
        <p className="text-gray-600">
          Choose where you want to store your DailyUse data
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {SYNC_PROVIDERS.map(provider => (
          <div
            key={provider.id}
            onClick={() =>
              onConfigChange({
                provider: provider.id,
                credentials: {},
                selectedEntityTypes: ENTITY_TYPES.map(e => e.id),
              })
            }
            className={cn(
              'p-4 border-2 rounded-lg cursor-pointer transition-all',
              config.provider === provider.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            )}
          >
            <div className="flex items-start gap-3 mb-3">
              <div className="text-blue-500">{provider.icon}</div>
              <div className="flex-1">
                <h3 className="font-semibold">{provider.name}</h3>
                <p className="text-sm text-gray-600">{provider.description}</p>
              </div>
              {config.provider === provider.id && (
                <CheckCircle className="w-5 h-5 text-blue-500" />
              )}
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Free capacity:</span>
                <span className="font-medium">{provider.freeCapacity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Region:</span>
                <span className="font-medium">{provider.region}</span>
              </div>
              <div className="pt-2">
                <div className="flex flex-wrap gap-1">
                  {provider.features.map(feature => (
                    <span
                      key={feature}
                      className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedProvider && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex gap-2">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-blue-900">
                {selectedProvider.name} Storage
              </p>
              <p className="text-sm text-blue-800 mt-1">
                You will need valid credentials to proceed with authentication
                in the next step.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Step 2: Authentication
 * Collects provider-specific credentials.
 */
const Step2Authentication: React.FC<StepProps> = ({
  config,
  onConfigChange,
  onNext,
  isLoading,
  error,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const provider = SYNC_PROVIDERS.find(p => p.id === config.provider);

  if (!provider) {
    return <div>Please select a provider first</div>;
  }

  const handleCredentialChange = (key: string, value: string) => {
    onConfigChange({
      credentials: {
        ...config.credentials,
        [key]: value,
      },
    });
  };

  const renderCredentialFields = () => {
    switch (config.provider) {
      case 'github':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="token">GitHub Personal Access Token</Label>
              <Input
                id="token"
                type={showPassword ? 'text' : 'password'}
                placeholder="ghp_..."
                value={config.credentials.token || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleCredentialChange('token', e.target.value)}
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                Create a token at github.com/settings/tokens with repo scope
              </p>
            </div>
          </div>
        );

      case 'nutstore':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="username">Email</Label>
              <Input
                id="username"
                type="email"
                placeholder="your@email.com"
                value={config.credentials.username || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleCredentialChange('username', e.target.value)
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative mt-1">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={config.credentials.token || ''}
                  onChange={e => handleCredentialChange('token', e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 text-gray-500" />
                  ) : (
                    <Eye className="w-4 h-4 text-gray-500" />
                  )}
                </button>
              </div>
            </div>
          </div>
        );

      case 'dropbox':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="token">Dropbox Access Token</Label>
              <Input
                id="token"
                type={showPassword ? 'text' : 'password'}
                placeholder="sl.Bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"
                value={config.credentials.token || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleCredentialChange('token', e.target.value)}
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                Generate a token at dropbox.com/developers/apps
              </p>
            </div>
          </div>
        );

      case 'self-hosted':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="serverUrl">Server URL</Label>
              <Input
                id="serverUrl"
                type="url"
                placeholder="https://your-server.com/dav"
                value={config.credentials.serverUrl || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleCredentialChange('serverUrl', e.target.value)
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                placeholder="username"
                value={config.credentials.username || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleCredentialChange('username', e.target.value)
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative mt-1">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={config.credentials.password || ''}
                  onChange={e =>
                    handleCredentialChange('password', e.target.value)
                  }
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 text-gray-500" />
                  ) : (
                    <Eye className="w-4 h-4 text-gray-500" />
                  )}
                </button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold mb-2">Authentication</h2>
        <p className="text-gray-600">
          Enter your {provider.name} credentials to verify access
        </p>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg space-y-4">
        {renderCredentialFields()}
      </div>

      {error && (
        <div className="flex gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-900">Authentication failed</p>
            <p className="text-sm text-red-800">{error}</p>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <Button
          onClick={onNext}
          disabled={isLoading}
          className="flex-1"
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Verifying...
            </>
          ) : (
            <>
              Verify Connection
              <ChevronRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

/**
 * Step 3: Encryption Password Setup
 * Sets up a password for end-to-end encryption.
 */
const Step3EncryptionPassword: React.FC<StepProps> = ({
  config,
  onConfigChange,
  isLoading,
}) => {
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const passwordStrength = useMemo(() => {
    const pwd = config.encryptionPassword;
    if (!pwd) return { score: 0, label: 'None', color: 'bg-gray-200' };

    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^a-zA-Z0-9]/.test(pwd)) score++;

    const labels = ['None', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
    const colors = [
      'bg-gray-200',
      'bg-red-500',
      'bg-orange-500',
      'bg-yellow-500',
      'bg-green-500',
      'bg-green-600',
    ];

    return {
      score,
      label: labels[score],
      color: colors[score],
    };
  }, [config.encryptionPassword]);

  const isPasswordMatch =
    config.encryptionPassword === confirmPassword &&
    config.encryptionPassword.length > 0;

  const generateRandomPassword = () => {
    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 16; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    onConfigChange({ encryptionPassword: password });
    setConfirmPassword(password);
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold mb-2">Encryption Password</h2>
        <p className="text-gray-600">
          Create a strong password to encrypt your data before uploading
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex gap-2">
          <Lock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-blue-900">
              Your data will be encrypted end-to-end
            </p>
            <p className="text-sm text-blue-800 mt-1">
              We use AES-256-GCM encryption. Your password is never stored on
              our servers.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="password">Password</Label>
          <div className="relative mt-1">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter a strong password"
              value={config.encryptionPassword}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                onConfigChange({ encryptionPassword: e.target.value })
              }
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-2.5"
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4 text-gray-500" />
              ) : (
                <Eye className="w-4 h-4 text-gray-500" />
              )}
            </button>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <Label>Password Strength</Label>
            <span className="text-sm font-medium">{passwordStrength.label}</span>
          </div>
          <Progress
            value={(passwordStrength.score / 5) * 100}
            className="h-2"
          />
          <div className="text-xs text-gray-500 mt-2">
            �?Use at least 8 characters
            <br />
            �?Include uppercase and lowercase letters
            <br />
            �?Include numbers and special characters
          </div>
        </div>

        <div>
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <div className="relative mt-1">
            <Input
              id="confirmPassword"
              type={showConfirm ? 'text' : 'password'}
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
              className={cn(
                confirmPassword &&
                  !isPasswordMatch &&
                  'border-red-500'
              )}
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-2.5"
            >
              {showConfirm ? (
                <EyeOff className="w-4 h-4 text-gray-500" />
              ) : (
                <Eye className="w-4 h-4 text-gray-500" />
              )}
            </button>
          </div>
          {confirmPassword && !isPasswordMatch && (
            <p className="text-sm text-red-600 mt-1">
              Passwords do not match
            </p>
          )}
        </div>

        <Button
          onClick={generateRandomPassword}
          variant="outline"
          className="w-full"
          disabled={isLoading}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Generate Random Password
        </Button>
      </div>
    </div>
  );
};

/**
 * Step 4: Sync Options
 * Configures sync direction and entity filters.
 */
const Step4SyncOptions: React.FC<StepProps> = ({
  config,
  onConfigChange,
}) => {
  const totalEntities = 150; // Example: total entities in local database

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold mb-2">Sync Options</h2>
        <p className="text-gray-600">
          Choose how you want to synchronize your data
        </p>
      </div>

      <div className="space-y-3">
        <div>
          <Label className="text-base font-semibold mb-3 block">
            Initial Sync Direction
          </Label>
          <div className="space-y-3">
            {[
              {
                value: 'upload',
                title: 'Upload local data to cloud',
                description:
                  'All your local data will be uploaded to the cloud',
              },
              {
                value: 'download',
                title: 'Download cloud data to local',
                description:
                  'All cloud data will be downloaded to your local device',
              },
              {
                value: 'manual',
                title: 'Manual selection',
                description:
                  'Choose which entities to sync for each type',
              },
            ].map(option => (
              <div
                key={option.value}
                onClick={() =>
                  onConfigChange({ syncDirection: option.value as any })
                }
                className={cn(
                  'p-3 border-2 rounded-lg cursor-pointer transition-all',
                  config.syncDirection === option.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                )}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    checked={config.syncDirection === option.value}
                    readOnly
                    className="mt-1"
                  />
                  <div>
                    <p className="font-medium">{option.title}</p>
                    <p className="text-sm text-gray-600">
                      {option.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <Label className="text-base font-semibold mb-3 block">
            Entity Types to Sync
          </Label>
          <div className="space-y-2">
            {ENTITY_TYPES.map(entity => (
              <label
                key={entity.id}
                className="flex items-center gap-3 p-2 cursor-pointer hover:bg-gray-50 rounded"
              >
                <input
                  type="checkbox"
                  checked={config.selectedEntityTypes.includes(entity.id)}
                  onChange={e => {
                    const types = config.selectedEntityTypes;
                    if (e.target.checked) {
                      types.push(entity.id);
                    } else {
                      types.splice(types.indexOf(entity.id), 1);
                    }
                    onConfigChange({ selectedEntityTypes: [...types] });
                  }}
                />
                <span className="text-lg">{entity.icon}</span>
                <span className="font-medium">{entity.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">
            <strong>Estimated data to sync:</strong> {totalEntities} items
            across {config.selectedEntityTypes.length} entity types
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Expected time: 30-60 seconds
          </p>
        </div>
      </div>
    </div>
  );
};

/**
 * Main Sync Configuration Wizard Component.
 * Orchestrates the multi-step configuration process.
 *
 * @param {Object} props - Component props.
 * @param {() => void} [props.onComplete] - Callback executed when wizard finishes successfully.
 */
export const SyncConfigWizard: React.FC<{ onComplete?: () => void }> = ({
  onComplete,
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [config, setConfig] = useState<SyncConfig>({
    provider: undefined,
    credentials: {},
    encryptionPassword: '',
    syncDirection: 'upload',
    selectedEntityTypes: ENTITY_TYPES.map(e => e.id),
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>();

  const handleConfigChange = useCallback(
    (updates: Partial<SyncConfig>) => {
      setConfig(prev => ({ ...prev, ...updates }));
    },
    []
  );

  const handleNext = useCallback(async () => {
    setError(undefined);

    // Validation based on step
    if (currentStep === 1 && !config.provider) {
      setError('Please select a provider');
      return;
    }

    if (currentStep === 2) {
      // TODO: Validate credentials with actual connection test
      setIsLoading(true);
      try {
        // Simulate credential verification
        await new Promise(resolve => setTimeout(resolve, 1500));
        setCurrentStep(prev => Math.min(prev + 1, 4));
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Authentication failed. Please check your credentials.'
        );
      } finally {
        setIsLoading(false);
      }
      return;
    }

    if (currentStep === 3) {
      if (!config.encryptionPassword) {
        setError('Please enter an encryption password');
        return;
      }
      if (config.encryptionPassword.length < 8) {
        setError('Password must be at least 8 characters');
        return;
      }
    }

    setCurrentStep(prev => Math.min(prev + 1, 4));
  }, [currentStep, config.provider, config.encryptionPassword]);

  const handlePrev = useCallback(() => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    setError(undefined);
  }, []);

  const handleComplete = useCallback(async () => {
    setIsLoading(true);
    try {
      // TODO: Save config and initiate sync
      console.log('Starting sync with config:', config);
      await new Promise(resolve => setTimeout(resolve, 2000));
      onComplete?.();
    } finally {
      setIsLoading(false);
    }
  }, [config, onComplete]);

  const stepContent = {
    1: <Step1SelectProvider config={config} onConfigChange={handleConfigChange} onNext={handleNext} isLoading={isLoading} error={error} />,
    2: <Step2Authentication config={config} onConfigChange={handleConfigChange} onNext={handleNext} isLoading={isLoading} error={error} />,
    3: <Step3EncryptionPassword config={config} onConfigChange={handleConfigChange} onNext={handleNext} isLoading={isLoading} />,
    4: <Step4SyncOptions config={config} onConfigChange={handleConfigChange} onNext={handleNext} isLoading={isLoading} />,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 pt-8">
          <h1 className="text-4xl font-bold mb-2">Cloud Sync Setup</h1>
          <p className="text-lg text-gray-600">
            Configure secure cloud synchronization in 4 easy steps
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex justify-between items-center mb-8">
          {[1, 2, 3, 4].map(step => (
            <div key={step} className="flex items-center flex-1">
              <div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center font-semibold',
                  step < currentStep
                    ? 'bg-green-500 text-white'
                    : step === currentStep
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-300 text-gray-600'
                )}
              >
                {step < currentStep ? '✓' : step}
              </div>
              {step < 4 && (
                <div
                  className={cn(
                    'flex-1 h-1 mx-2',
                    step < currentStep ? 'bg-green-500' : 'bg-gray-300'
                  )}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step labels */}
        <div className="flex justify-between mb-8 text-sm text-gray-600">
          <div>Select Platform</div>
          <div>Authentication</div>
          <div>Encryption</div>
          <div>Sync Options</div>
        </div>

        {/* Content */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            {stepContent[currentStep as keyof typeof stepContent]}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex gap-3">
          <Button
            onClick={handlePrev}
            variant="outline"
            disabled={currentStep === 1 || isLoading}
            className="flex-1"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          {currentStep < 4 ? (
            <Button
              onClick={handleNext}
              disabled={isLoading}
              className="flex-1"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleComplete}
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Starting Sync...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Complete Setup
                </>
              )}
            </Button>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-600">
            Step {currentStep} of 4 �?All your data is encrypted and secure
          </p>
        </div>
      </div>
    </div>
  );
};

export default SyncConfigWizard;
