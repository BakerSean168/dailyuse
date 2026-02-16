/**
 * AISettingsView
 *
 * AI 设置页面（API Key、模型配置）
 * Story-009: AI Module UI
 */

import { useState, type FormEvent } from 'react';
import { useAISettings } from '../hooks/useAISettings';
import { AIProviderType } from '@dailyuse/contracts/ai';

export function AISettingsView() {
  const {
    providers,
    currentProvider,
    loading,
    testing,
    error,
    testResult,
    loadProviders,
    createProvider,
    updateProvider,
    deleteProvider,
    selectProvider,
    setDefaultProvider,
    testConnection,
    refreshModels,
    clearError,
    clearTestResult,
  } = useAISettings();

  // Form state for new provider
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    providerType: AIProviderType.OPENAI as AIProviderType,
    baseUrl: '',
    apiKey: '',
  });

  // Provider type options
  const providerTypeOptions = [
    { value: AIProviderType.OPENAI, label: 'OpenAI', defaultUrl: 'https://api.openai.com/v1' },
    { value: AIProviderType.ANTHROPIC, label: 'Anthropic (Claude)', defaultUrl: 'https://api.anthropic.com' },
    { value: AIProviderType.DEEPSEEK, label: 'DeepSeek', defaultUrl: 'https://api.deepseek.com' },
    { value: AIProviderType.QINIU, label: '七牛云 AI', defaultUrl: '' },
    { value: AIProviderType.SILICONFLOW, label: '硅基流动', defaultUrl: 'https://api.siliconflow.cn/v1' },
    { value: AIProviderType.GOOGLE, label: 'Google AI', defaultUrl: 'https://generativelanguage.googleapis.com' },
    { value: AIProviderType.GROQ, label: 'Groq', defaultUrl: 'https://api.groq.com/openai/v1' },
    { value: AIProviderType.OPENROUTER, label: 'OpenRouter', defaultUrl: 'https://openrouter.ai/api/v1' },
    { value: AIProviderType.CUSTOM_OPENAI_COMPATIBLE, label: '自定义 (OpenAI 兼容)', defaultUrl: '' },
  ];

  // Handle provider type change
  const handleProviderTypeChange = (type: AIProviderType) => {
    const option = providerTypeOptions.find((o) => o.value === type);
    setFormData((prev) => ({
      ...prev,
      providerType: type,
      baseUrl: option?.defaultUrl || prev.baseUrl,
    }));
  };

  // Handle create provider
  const handleCreateProvider = async (e: FormEvent) => {
    e.preventDefault();
    clearError();

    try {
      await createProvider({
        name: formData.name.trim(),
        providerType: formData.providerType,
        baseUrl: formData.baseUrl.trim(),
        apiKey: formData.apiKey,
      });
      setShowAddForm(false);
      setFormData({
        name: '',
        providerType: AIProviderType.OPENAI,
        baseUrl: '',
        apiKey: '',
      });
    } catch {
      // Error is already set
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">AI 设置</h1>
            <p className="text-muted-foreground">配置 AI 服务提供商和模型参数</p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            disabled={showAddForm}
            className="py-2 px-4 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            ➕ 添加服务商
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm flex items-center justify-between">
            <span>{error}</span>
            <button onClick={clearError} className="text-red-500 hover:text-red-700">
              ✕
            </button>
          </div>
        )}

        {/* Test Result */}
        {testResult && (
          <div
            className={`mb-4 p-3 rounded-md text-sm flex items-center justify-between ${
              testResult.ok
                ? 'bg-green-50 border border-green-200 text-green-700'
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}
          >
            <span>
              {testResult.ok ? '✅' : '❌'} {testResult.message}
            </span>
            <button
              onClick={clearTestResult}
              className={testResult.ok ? 'text-green-500' : 'text-red-500'}
            >
              ✕
            </button>
          </div>
        )}

        {/* Add Provider Form */}
        {showAddForm && (
          <div className="rounded-lg border bg-card p-6 shadow-sm mb-6">
            <h2 className="text-lg font-semibold mb-4">添加 AI 服务商</h2>
            <form onSubmit={handleCreateProvider} className="space-y-4">
              {/* Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-1">
                  配置名称 <span className="text-red-500">*</span>
                </label>
                <input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="如：我的 OpenAI"
                  className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>

              {/* Provider Type */}
              <div>
                <label htmlFor="providerType" className="block text-sm font-medium mb-1">
                  服务提供商 <span className="text-red-500">*</span>
                </label>
                <select
                  id="providerType"
                  value={formData.providerType}
                  onChange={(e) =>
                    handleProviderTypeChange(e.target.value as AIProviderType)
                  }
                  className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {providerTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Base URL */}
              <div>
                <label htmlFor="baseUrl" className="block text-sm font-medium mb-1">
                  API 地址 <span className="text-red-500">*</span>
                </label>
                <input
                  id="baseUrl"
                  type="url"
                  value={formData.baseUrl}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, baseUrl: e.target.value }))
                  }
                  placeholder="https://api.openai.com/v1"
                  className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>

              {/* API Key */}
              <div>
                <label htmlFor="apiKey" className="block text-sm font-medium mb-1">
                  API Key <span className="text-red-500">*</span>
                </label>
                <input
                  id="apiKey"
                  type="password"
                  value={formData.apiKey}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, apiKey: e.target.value }))
                  }
                  placeholder="sk-..."
                  className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  API Key 将被安全加密存储
                </p>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2 px-4 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  {loading ? '保存中...' : '保存'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="py-2 px-4 border rounded-md hover:bg-muted transition-colors"
                >
                  取消
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Provider List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">已配置的服务商</h2>
            <button
              onClick={() => loadProviders()}
              disabled={loading}
              className="text-sm text-primary hover:underline"
            >
              {loading ? '刷新中...' : '刷新列表'}
            </button>
          </div>

          {providers.length === 0 ? (
            <div className="rounded-lg border bg-card p-8 text-center">
              <div className="text-4xl mb-4">🤖</div>
              <h3 className="font-medium mb-2">尚未配置 AI 服务商</h3>
              <p className="text-sm text-muted-foreground mb-4">
                添加 AI 服务商后，即可使用 AI 助手功能
              </p>
              <button
                onClick={() => setShowAddForm(true)}
                className="py-2 px-4 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                添加服务商
              </button>
            </div>
          ) : (
            <div className="grid gap-4">
              {providers.map((provider) => (
                <div
                  key={provider.id}
                  className={`rounded-lg border bg-card p-4 shadow-sm ${
                    currentProvider?.id === provider.id ? 'ring-2 ring-primary' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          provider.isActive ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                      />
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          {provider.name}
                          {provider.isDefault && (
                            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                              默认
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {provider.providerType} · {provider.defaultModel || '未选择模型'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => testConnection(provider.id)}
                        disabled={testing}
                        className="py-1 px-3 text-sm border rounded-md hover:bg-muted transition-colors"
                        title="测试连接"
                      >
                        {testing ? '⏳' : '🔌'} 测试
                      </button>
                      <button
                        onClick={() => refreshModels(provider.id)}
                        disabled={loading}
                        className="py-1 px-3 text-sm border rounded-md hover:bg-muted transition-colors"
                        title="刷新模型"
                      >
                        🔄
                      </button>
                      {!provider.isDefault && (
                        <button
                          onClick={() => setDefaultProvider(provider.id)}
                          disabled={loading}
                          className="py-1 px-3 text-sm border rounded-md hover:bg-muted transition-colors"
                          title="设为默认"
                        >
                          ⭐
                        </button>
                      )}
                      <button
                        onClick={() => selectProvider(provider.id)}
                        className="py-1 px-3 text-sm border rounded-md hover:bg-muted transition-colors"
                        title="编辑"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('确定删除此服务商配置？')) {
                            deleteProvider(provider.id);
                          }
                        }}
                        className="py-1 px-3 text-sm border border-red-200 text-red-600 rounded-md hover:bg-red-50 transition-colors"
                        title="删除"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Provider Details */}
        {currentProvider && (
          <div className="rounded-lg border bg-card p-6 shadow-sm mt-6">
            <h2 className="text-lg font-semibold mb-4">
              {currentProvider.name} - 详细配置
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">
                  服务提供商
                </h3>
                <p>{currentProvider.providerType}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">
                  API 地址
                </h3>
                <p className="truncate">{currentProvider.baseUrl}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">
                  API Key
                </h3>
                <p>{currentProvider.apiKeyMasked}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">
                  默认模型
                </h3>
                <p>{currentProvider.defaultModel || '未选择'}</p>
              </div>
            </div>

            {/* Available Models */}
            {currentProvider.availableModels && currentProvider.availableModels.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-medium text-muted-foreground mb-2">
                  可用模型 ({currentProvider.availableModels.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {currentProvider.availableModels.map((model) => (
                    <button
                      key={model.id}
                      onClick={() =>
                        updateProvider(currentProvider.id, { defaultModel: model.id })
                      }
                      className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                        currentProvider.defaultModel === model.id
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'hover:bg-muted'
                      }`}
                      title={model.description || model.name}
                    >
                      {model.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => selectProvider('')}
              className="mt-4 text-sm text-muted-foreground hover:text-foreground"
            >
              关闭详情
            </button>
          </div>
        )}

        {/* Tips */}
        <div className="mt-8 rounded-lg border bg-muted/30 p-4">
          <h3 className="font-medium mb-2">💡 配置提示</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• OpenAI 需要有效的 API Key，可从 platform.openai.com 获取</li>
            <li>• 本地模型需要先安装并运行 Ollama</li>
            <li>• 国内用户建议使用百度千帆或阿里通义千问</li>
            <li>• 设置默认服务商后，AI 助手将优先使用该服务商</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default AISettingsView;
