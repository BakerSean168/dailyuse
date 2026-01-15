<template>
    <v-container fluid>
        <v-row>
            <v-col cols="12">
                <div class="d-flex align-center justify-space-between mb-4">
                    <h3 class="text-h5">
                        <v-icon class="mr-2">mdi-robot</v-icon>
                        AI 服务提供商
                    </h3>
                    <v-btn
                        v-if="providers.length > 0"
                        color="primary"
                        prepend-icon="mdi-plus"
                        @click="openCreateDialog"
                    >
                        添加提供商
                    </v-btn>
                </div>
            </v-col>
        </v-row>

        <!-- 说明信息 -->
        <v-row>
            <v-col cols="12">
                <v-alert type="info" variant="tonal" prominent border="start" class="mb-4">
                    <v-alert-title>配置您的 AI 服务</v-alert-title>
                    <div class="text-body-2">
                        配置 AI 服务提供商以使用 AI 功能。支持 OpenRouter、Groq、七牛云等多种服务，
                        部分服务提供免费额度。您可以添加多个提供商并设置一个默认提供商。
                    </div>
                </v-alert>
            </v-col>
        </v-row>

        <!-- 加载状态 -->
        <v-row v-if="loading && !providers.length">
            <v-col cols="12" class="text-center py-8">
                <v-progress-circular indeterminate color="primary" size="48" />
                <p class="mt-4 text-body-1">加载配置中...</p>
            </v-col>
        </v-row>

        <!-- 错误状态 -->
        <v-row v-else-if="error && !providers.length">
            <v-col cols="12">
                <v-alert type="error" variant="tonal" closable @click:close="error = null">
                    {{ error }}
                </v-alert>
            </v-col>
        </v-row>

        <!-- Provider 列表 -->
        <v-row v-else>
            <v-col cols="12">
                <!-- 空状态 -->
                <v-card v-if="!providers.length" variant="outlined" class="pa-8">
                    <div class="text-center mb-6">
                        <v-icon size="64" color="grey-lighten-1" class="mb-4">mdi-robot-off</v-icon>
                        <p class="text-h6 mb-2">尚未配置 AI 服务</p>
                        <p class="text-body-2 text-medium-emphasis mb-4">
                            添加您的第一个 AI 服务提供商以开始使用 AI 功能
                        </p>
                    </div>
                    
                    <!-- 快速入门模板 -->
                    <div class="mb-4">
                        <p class="text-subtitle-2 text-medium-emphasis mb-3">🚀 推荐的免费服务（快速开始）</p>
                        <v-row dense>
                            <v-col 
                                v-for="template in freeTemplates" 
                                :key="template.id" 
                                cols="6" 
                                sm="4" 
                                md="3"
                            >
                                <v-card
                                    variant="outlined"
                                    hover
                                    class="quick-template-card"
                                    @click="openCreateDialogWithTemplate(template)"
                                >
                                    <v-card-text class="text-center pa-3">
                                        <v-avatar :color="template.color" size="40" class="mb-2">
                                            <v-icon color="white" size="20">{{ template.icon }}</v-icon>
                                        </v-avatar>
                                        <div class="text-subtitle-2">{{ template.name }}</div>
                                        <v-chip color="success" size="x-small" variant="tonal" class="mt-1">
                                            免费
                                        </v-chip>
                                    </v-card-text>
                                </v-card>
                            </v-col>
                        </v-row>
                    </div>
                    
                    <div class="text-center">
                        <v-btn color="primary" prepend-icon="mdi-plus" @click="openCreateDialog">
                            查看所有提供商
                        </v-btn>
                    </div>
                </v-card>

                <!-- Provider 卡片列表 -->
                <template v-else>
                    <v-row>
                        <v-col v-for="provider in providers" :key="provider.uuid" cols="12" md="6">
                            <v-card :color="provider.isDefault ? 'primary' : undefined"
                                :variant="provider.isDefault ? 'tonal' : 'outlined'" hover>
                                <v-card-text>
                                    <div class="d-flex align-center mb-3">
                                        <v-avatar :color="getProviderColor(provider.providerType)" size="40"
                                            class="mr-3">
                                            <v-icon color="white">{{ getProviderIcon(provider.providerType) }}</v-icon>
                                        </v-avatar>
                                        <div class="flex-grow-1">
                                            <div class="d-flex align-center">
                                                <span class="text-h6">{{ provider.name }}</span>
                                                <v-chip v-if="provider.isDefault" color="primary" size="x-small"
                                                    class="ml-2">
                                                    默认
                                                </v-chip>
                                            </div>
                                            <span class="text-caption text-medium-emphasis">
                                                {{ getProviderTypeName(provider.providerType) }}
                                            </span>
                                        </div>
                                        <v-chip :color="provider.isActive ? 'success' : 'grey'" size="small"
                                            variant="tonal">
                                            {{ provider.isActive ? '启用' : '禁用' }}
                                        </v-chip>
                                    </div>

                                    <!-- Provider 详情 -->
                                    <div class="text-body-2 mb-3">
                                        <div class="d-flex align-center mb-1">
                                            <v-icon size="16" class="mr-2">mdi-link</v-icon>
                                            <span class="text-truncate" style="max-width: 200px;">
                                                {{ provider.baseUrl || '默认地址' }}
                                            </span>
                                        </div>
                                        <div class="d-flex align-center">
                                            <v-icon size="16" class="mr-2">mdi-brain</v-icon>
                                            <span>{{ provider.defaultModel || '默认模型' }}</span>
                                        </div>
                                    </div>

                                    <!-- 操作按钮 -->
                                    <div class="d-flex ga-2">
                                        <v-btn size="small" variant="tonal"
                                            :loading="testingProviderUuid === provider.uuid"
                                            @click="handleTestConnection(provider.uuid)">
                                            <v-icon start>mdi-connection</v-icon>
                                            测试
                                        </v-btn>
                                        <v-btn v-if="!provider.isDefault" size="small" variant="tonal"
                                            @click="handleSetDefault(provider.uuid)">
                                            设为默认
                                        </v-btn>
                                        <v-spacer />
                                        <v-btn size="small" icon variant="text" @click="openEditDialog(provider)">
                                            <v-icon>mdi-pencil</v-icon>
                                        </v-btn>
                                        <v-btn size="small" icon variant="text" color="error"
                                            @click="confirmDelete(provider)">
                                            <v-icon>mdi-delete</v-icon>
                                        </v-btn>
                                    </div>
                                </v-card-text>
                            </v-card>
                        </v-col>
                    </v-row>
                </template>
            </v-col>
        </v-row>

        <!-- 创建/编辑对话框 -->
        <ProviderConfigDialog
            v-model="dialogVisible"
            :editing-provider="editingProvider"
            :existing-providers-count="providers.length"
            @save="handleDialogSave"
            @close="closeDialog"
        />

        <!-- 删除确认对话框 -->
        <v-dialog v-model="deleteDialogVisible" max-width="400">
            <v-card>
                <v-card-title class="text-h6">确认删除</v-card-title>
                <v-card-text>
                    确定要删除提供商 "{{ deletingProvider?.name }}" 吗？此操作不可撤销。
                </v-card-text>
                <v-card-actions>
                    <v-spacer />
                    <v-btn variant="text" @click="deleteDialogVisible = false">取消</v-btn>
                    <v-btn color="error" :loading="loading" @click="handleDelete">删除</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <!-- 测试结果 Snackbar -->
        <v-snackbar v-model="snackbar.visible" :color="snackbar.color" :timeout="3000">
            {{ snackbar.message }}
            <template #actions>
                <v-btn variant="text" @click="snackbar.visible = false">关闭</v-btn>
            </template>
        </v-snackbar>
    </v-container>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
import { useAIProviders } from '../composables/useAIProviders';
import { AIProviderType, AI_PROVIDER_TEMPLATES } from '@dailyuse/contracts/ai';
import type { AIProviderConfigClientDTO, AIProviderTemplate } from '@dailyuse/contracts/ai';
import ProviderConfigDialog from './ProviderConfigDialog.vue';

// ===== Types =====
interface DialogSaveData {
    name: string;
    providerType: AIProviderType;
    baseUrl: string;
    apiKey: string;
    defaultModel?: string;
    isDefault: boolean;
    isActive: boolean;
}

// ===== Composables =====
const {
    providers,
    loading,
    error,
    testingProviderUuid,
    loadProviders,
    createProvider,
    updateProvider,
    deleteProvider,
    testConnection,
    setDefaultProvider,
} = useAIProviders();

// ===== 对话框状态 =====
const dialogVisible = ref(false);
const deleteDialogVisible = ref(false);
const editingProvider = ref<AIProviderConfigClientDTO | null>(null);
const deletingProvider = ref<AIProviderConfigClientDTO | null>(null);

// ===== Snackbar =====
const snackbar = reactive({
    visible: false,
    message: '',
    color: 'success' as 'success' | 'error' | 'info',
});

// ===== Computed =====
const freeTemplates = computed(() => {
    return AI_PROVIDER_TEMPLATES.filter(t => t.hasFreeQuota && t.id !== 'custom').slice(0, 4);
});

// ===== 提供商类型选项 =====
const providerTypeOptions = [
    { label: 'OpenRouter', value: AIProviderType.OPENROUTER },
    { label: 'Groq', value: AIProviderType.GROQ },
    { label: 'DeepSeek', value: AIProviderType.DEEPSEEK },
    { label: '七牛云 AI', value: AIProviderType.QINIU },
    { label: 'SiliconFlow', value: AIProviderType.SILICONFLOW },
    { label: 'OpenAI', value: AIProviderType.OPENAI },
    { label: 'Anthropic Claude', value: AIProviderType.ANTHROPIC },
    { label: 'Google AI Studio', value: AIProviderType.GOOGLE },
    { label: '自定义 OpenAI 兼容', value: AIProviderType.CUSTOM_OPENAI_COMPATIBLE },
];

// ===== 工具方法 =====
function getProviderIcon(type: string): string {
    switch (type) {
        case AIProviderType.OPENAI:
            return 'mdi-head-snowflake';
        case AIProviderType.QINIU:
            return 'mdi-cloud';
        case AIProviderType.ANTHROPIC:
            return 'mdi-account-voice';
        case AIProviderType.OPENROUTER:
            return 'mdi-router-wireless';
        case AIProviderType.GROQ:
            return 'mdi-lightning-bolt';
        case AIProviderType.DEEPSEEK:
            return 'mdi-brain';
        case AIProviderType.SILICONFLOW:
            return 'mdi-chip';
        case AIProviderType.GOOGLE:
            return 'mdi-google';
        default:
            return 'mdi-robot';
    }
}

function getProviderColor(type: string): string {
    switch (type) {
        case AIProviderType.OPENAI:
            return 'green';
        case AIProviderType.QINIU:
            return 'blue';
        case AIProviderType.ANTHROPIC:
            return 'orange';
        case AIProviderType.OPENROUTER:
            return 'indigo';
        case AIProviderType.GROQ:
            return 'deep-orange';
        case AIProviderType.DEEPSEEK:
            return 'blue-darken-2';
        case AIProviderType.SILICONFLOW:
            return 'purple';
        case AIProviderType.GOOGLE:
            return 'blue';
        default:
            return 'purple';
    }
}

function getProviderTypeName(type: string): string {
    const option = providerTypeOptions.find(o => o.value === type);
    return option?.label || type;
}

function showMessage(message: string, color: 'success' | 'error' | 'info' = 'success') {
    snackbar.message = message;
    snackbar.color = color;
    snackbar.visible = true;
}

// ===== 对话框操作 =====
function openCreateDialog() {
    editingProvider.value = null;
    dialogVisible.value = true;
}

function openCreateDialogWithTemplate(template: AIProviderTemplate) {
    editingProvider.value = null;
    dialogVisible.value = true;
    // 模板会在 ProviderConfigDialog 中处理
}

function openEditDialog(provider: AIProviderConfigClientDTO) {
    editingProvider.value = provider;
    dialogVisible.value = true;
}

function closeDialog() {
    dialogVisible.value = false;
    editingProvider.value = null;
}

function confirmDelete(provider: AIProviderConfigClientDTO) {
    deletingProvider.value = provider;
    deleteDialogVisible.value = true;
}

// ===== 操作处理 =====
async function handleDialogSave(data: DialogSaveData) {
    if (editingProvider.value) {
        // 更新
        const success = await updateProvider(editingProvider.value.uuid, {
            name: data.name,
            baseUrl: data.baseUrl,
            apiKey: data.apiKey || undefined,
            defaultModel: data.defaultModel || undefined,
            isActive: data.isActive,
        });
        if (success) {
            // 如果需要设为默认，调用专门的 API
            if (data.isDefault && !editingProvider.value.isDefault) {
                await setDefaultProvider(editingProvider.value.uuid);
            }
            showMessage('提供商更新成功');
            closeDialog();
        }
    } else {
        // 创建
        const result = await createProvider({
            name: data.name,
            providerType: data.providerType,
            baseUrl: data.baseUrl,
            apiKey: data.apiKey,
            defaultModel: data.defaultModel || undefined,
            setAsDefault: data.isDefault,
        });
        if (result) {
            showMessage('提供商创建成功');
            closeDialog();
        }
    }
}

async function handleDelete() {
    if (!deletingProvider.value) return;

    const success = await deleteProvider(deletingProvider.value.uuid);
    if (success) {
        showMessage('提供商已删除');
        deleteDialogVisible.value = false;
        deletingProvider.value = null;
    }
}

async function handleTestConnection(uuid: string) {
    const result = await testConnection(uuid);
    if (result.ok) {
        showMessage(`连接成功！延迟: ${result.latencyMs}ms`, 'success');
    } else {
        showMessage(`连接失败: ${result.error}`, 'error');
    }
}

async function handleSetDefault(uuid: string) {
    const success = await setDefaultProvider(uuid);
    if (success) {
        showMessage('已设为默认提供商');
    }
}

// ===== 生命周期 =====
onMounted(() => {
    loadProviders();
});
</script>

<style scoped>
.quick-template-card {
    cursor: pointer;
    transition: all 0.2s ease;
}

.quick-template-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
</style>




