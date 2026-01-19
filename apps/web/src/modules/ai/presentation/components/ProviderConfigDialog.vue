<template>
    <v-dialog 
        v-model="dialogVisible" 
        max-width="700" 
        persistent
        scrollable
    >
        <v-card>
            <!-- 标题 -->
            <v-card-title class="d-flex align-center">
                <span>{{ isEditing ? '编辑提供商' : '添加 AI 服务提供商' }}</span>
                <v-spacer />
                <v-btn icon variant="text" @click="closeDialog">
                    <v-icon>mdi-close</v-icon>
                </v-btn>
            </v-card-title>

            <!-- 步骤指示器 -->
            <v-stepper 
                v-if="!isEditing" 
                v-model="currentStep" 
                alt-labels 
                flat
                class="stepper-header"
            >
                <v-stepper-header>
                    <v-stepper-item
                        :value="1"
                        :complete="currentStep > 1"
                        title="选择服务"
                        subtitle="选择 AI 提供商"
                    />
                    <v-divider />
                    <v-stepper-item
                        :value="2"
                        :complete="currentStep > 2"
                        title="配置凭证"
                        subtitle="输入 API Key"
                    />
                    <v-divider />
                    <v-stepper-item
                        :value="3"
                        title="选择模型"
                        subtitle="验证并选择"
                    />
                </v-stepper-header>
            </v-stepper>

            <v-divider />

            <v-card-text class="pa-6">
                <!-- Step 1: 选择模板 -->
                <div v-show="currentStep === 1 && !isEditing">
                    <h4 class="text-h6 mb-4">选择您的 AI 服务提供商</h4>
                    <p class="text-body-2 text-medium-emphasis mb-4">
                        选择一个预设模板快速配置，或选择"自定义"手动配置其他服务
                    </p>
                    <ProviderTemplateSelector
                        v-model="selectedTemplateId"
                        @select="handleTemplateSelect"
                    />
                </div>

                <!-- Step 2: 配置凭证 (或编辑模式的主表单) -->
                <div v-show="currentStep === 2 || isEditing">
                    <h4 v-if="!isEditing" class="text-h6 mb-4">配置 API 凭证</h4>
                    
                    <v-form ref="formRef" v-model="formValid">
                        <!-- 名称 -->
                        <v-text-field
                            v-model="formData.name"
                            label="配置名称"
                            :placeholder="`例如：我的${selectedTemplate?.name || 'AI 服务'}`"
                            :rules="[rules.required, rules.maxLength(50)]"
                            prepend-icon="mdi-tag"
                            class="mb-3"
                        />

                        <!-- 提供商类型（编辑模式或自定义时显示） -->
                        <v-select
                            v-if="isEditing || selectedTemplateId === 'custom'"
                            v-model="formData.providerType"
                            label="提供商类型"
                            :items="providerTypeOptions"
                            item-title="label"
                            item-value="value"
                            :rules="[rules.required]"
                            prepend-icon="mdi-cloud"
                            class="mb-3"
                        />

                        <!-- API 地址 -->
                        <v-text-field
                            v-model="formData.baseUrl"
                            label="API 地址"
                            placeholder="https://api.example.com/v1"
                            :rules="[rules.required, rules.url]"
                            prepend-icon="mdi-link"
                            class="mb-3"
                            :hint="selectedTemplate?.baseUrl ? `推荐: ${selectedTemplate.baseUrl}` : ''"
                            persistent-hint
                        />

                        <!-- API Key 输入区域 -->
                        <v-row no-gutters class="mb-3">
                            <v-col>
                                <v-text-field
                                    v-model="formData.apiKey"
                                    :label="isEditing ? 'API Key (留空保持不变)' : 'API Key'"
                                    :placeholder="isEditing ? '••••••••' : '输入您的 API Key'"
                                    :rules="isEditing ? [] : [rules.required]"
                                    :type="showApiKey ? 'text' : 'password'"
                                    prepend-icon="mdi-key"
                                    :append-inner-icon="apiKeyAppendIcon"
                                    :color="validationInputColor"
                                    @click:append-inner="handleApiKeyAppendClick"
                                    hide-details="auto"
                                >
                                    <template #append>
                                        <v-fade-transition>
                                            <v-progress-circular
                                                v-if="validationStatus === 'validating'"
                                                indeterminate
                                                size="20"
                                                width="2"
                                                color="primary"
                                            />
                                            <v-icon
                                                v-else-if="validationStatus === 'success'"
                                                color="success"
                                                size="20"
                                            >
                                                mdi-check-circle
                                            </v-icon>
                                            <v-icon
                                                v-else-if="validationStatus === 'error'"
                                                color="error"
                                                size="20"
                                            >
                                                mdi-alert-circle
                                            </v-icon>
                                        </v-fade-transition>
                                    </template>
                                </v-text-field>
                            </v-col>
                            <v-col cols="auto" class="ml-2 d-flex align-center">
                                <v-btn
                                    v-if="selectedTemplate?.apiKeyUrl"
                                    size="small"
                                    variant="tonal"
                                    :href="selectedTemplate.apiKeyUrl"
                                    target="_blank"
                                    rel="noopener"
                                >
                                    <v-icon start size="16">mdi-open-in-new</v-icon>
                                    获取 Key
                                </v-btn>
                            </v-col>
                        </v-row>

                        <!-- 验证状态显示 -->
                        <v-expand-transition>
                            <v-alert
                                v-if="validationStatus !== 'idle'"
                                :type="validationAlertType"
                                variant="tonal"
                                density="compact"
                                class="mb-3"
                            >
                                <div class="d-flex align-center">
                                    <v-progress-circular
                                        v-if="validationStatus === 'validating'"
                                        indeterminate
                                        size="16"
                                        width="2"
                                        class="mr-2"
                                    />
                                    <span>{{ validationMessage }}</span>
                                </div>
                            </v-alert>
                        </v-expand-transition>
                    </v-form>
                </div>

                <!-- Step 3: 选择模型 -->
                <div v-show="currentStep === 3 && !isEditing">
                    <h4 class="text-h6 mb-4">选择默认模型</h4>
                    
                    <!-- 验证成功时显示模型列表 -->
                    <template v-if="modelsFetched && availableModels.length > 0">
                        <v-alert type="success" variant="tonal" density="compact" class="mb-4">
                            <v-icon start>mdi-check-circle</v-icon>
                            连接验证成功，已获取 {{ availableModels.length }} 个可用模型
                        </v-alert>
                        
                        <v-select
                            v-model="formData.defaultModel"
                            label="默认模型"
                            :items="modelOptions"
                            item-title="title"
                            item-value="value"
                            prepend-icon="mdi-brain"
                            class="mb-3"
                            hint="选择一个默认使用的模型"
                            persistent-hint
                        >
                            <template #item="{ props: itemProps, item }">
                                <v-list-item v-bind="itemProps">
                                    <template #subtitle v-if="item.raw.subtitle">
                                        {{ item.raw.subtitle }}
                                    </template>
                                </v-list-item>
                            </template>
                        </v-select>
                    </template>
                    
                    <!-- 未验证或验证失败时 -->
                    <template v-else>
                        <v-alert 
                            :type="validationStatus === 'error' ? 'warning' : 'info'" 
                            variant="tonal" 
                            density="compact" 
                            class="mb-4"
                        >
                            <template v-if="validationStatus === 'error'">
                                <v-icon start>mdi-alert</v-icon>
                                验证未通过，您可以手动获取模型或输入模型名称
                            </template>
                            <template v-else>
                                <v-icon start>mdi-information</v-icon>
                                请先验证 API Key 以获取可用模型列表
                            </template>
                        </v-alert>
                        
                        <!-- 手动获取模型按钮 -->
                        <div class="d-flex align-center mb-4">
                            <v-btn
                                color="primary"
                                variant="tonal"
                                :loading="fetchingModels"
                                :disabled="!canFetchModels"
                                @click="handleFetchModels"
                            >
                                <v-icon start>mdi-cloud-download</v-icon>
                                获取可用模型
                            </v-btn>
                        </div>
                        
                        <!-- 手动输入模型 -->
                        <v-text-field
                            v-model="formData.defaultModel"
                            label="默认模型"
                            placeholder="输入模型名称，如 gpt-4, deepseek-chat"
                            prepend-icon="mdi-brain"
                            class="mb-3"
                            :hint="selectedTemplate?.recommendedModels?.length 
                                ? `推荐: ${selectedTemplate.recommendedModels.join(', ')}` 
                                : ''"
                            persistent-hint
                        />
                    </template>

                    <!-- 设置选项 -->
                    <v-divider class="my-4" />
                    <v-checkbox
                        v-model="formData.isDefault"
                        label="设为默认提供商"
                        color="primary"
                        hide-details
                    />
                    <v-checkbox
                        v-model="formData.isActive"
                        label="启用此提供商"
                        color="primary"
                        hide-details
                    />
                </div>

                <!-- 编辑模式的额外选项 -->
                <div v-if="isEditing" class="mt-4">
                    <v-divider class="mb-4" />
                    
                    <!-- 模型选择区域 -->
                    <div class="mb-3">
                        <div class="d-flex align-center justify-space-between mb-2">
                            <span class="text-subtitle-2">默认模型</span>
                            <v-btn
                                color="primary"
                                variant="tonal"
                                size="small"
                                :loading="fetchingModels"
                                :disabled="!canFetchModels"
                                @click="handleFetchModels"
                            >
                                <v-icon start size="16">mdi-refresh</v-icon>
                                刷新模型
                            </v-btn>
                        </div>
                        
                        <v-select
                            v-if="modelsFetched || availableModels.length > 0"
                            v-model="formData.defaultModel"
                            label="默认模型"
                            :items="modelOptions"
                            item-title="title"
                            item-value="value"
                            prepend-icon="mdi-brain"
                            density="compact"
                        />
                        <v-text-field
                            v-else
                            v-model="formData.defaultModel"
                            label="默认模型"
                            placeholder="输入模型名称或点击刷新获取列表"
                            prepend-icon="mdi-brain"
                            density="compact"
                        />
                    </div>

                    <v-checkbox
                        v-model="formData.isDefault"
                        label="设为默认提供商"
                        color="primary"
                        hide-details
                        density="compact"
                    />
                    <v-checkbox
                        v-model="formData.isActive"
                        label="启用此提供商"
                        color="primary"
                        hide-details
                        density="compact"
                    />
                </div>
            </v-card-text>

            <v-divider />

            <!-- 操作按钮 -->
            <v-card-actions class="pa-4">
                <v-btn
                    v-if="currentStep > 1 && !isEditing"
                    variant="text"
                    @click="prevStep"
                >
                    <v-icon start>mdi-chevron-left</v-icon>
                    上一步
                </v-btn>
                <v-spacer />
                <v-btn variant="text" @click="closeDialog">取消</v-btn>
                
                <!-- 下一步/创建按钮 -->
                <v-btn
                    v-if="currentStep < 3 && !isEditing"
                    color="primary"
                    :disabled="!canProceed"
                    @click="nextStep"
                >
                    下一步
                    <v-icon end>mdi-chevron-right</v-icon>
                </v-btn>
                <v-btn
                    v-else
                    color="primary"
                    :loading="loading"
                    :disabled="!canSave"
                    @click="handleSave"
                >
                    {{ isEditing ? '保存' : '创建' }}
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue';
import { useDebounceFn } from '@vueuse/core';
import ProviderTemplateSelector from './ProviderTemplateSelector.vue';
import { AIProviderType, getTemplateById, type AIProviderTemplate, type AIModelInfo } from '@dailyuse/contracts/ai';
import type { AIProviderConfigClientDTO } from '@dailyuse/contracts/ai';
import { getAIProviderConfigApiClient } from '@dailyuse/infrastructure-client';

const aiProviderApiClient = getAIProviderConfigApiClient();

// ===== Props & Emits =====
const props = defineProps<{
    modelValue: boolean;
    editingProvider?: AIProviderConfigClientDTO | null;
    existingProvidersCount?: number;
}>();

const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void;
    (e: 'save', data: SaveData): void;
    (e: 'close'): void;
}>();

interface SaveData {
    name: string;
    providerType: AIProviderType;
    baseUrl: string;
    apiKey: string;
    defaultModel?: string;
    isDefault: boolean;
    isActive: boolean;
}

// ===== 对话框状态 =====
const dialogVisible = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value),
});

const isEditing = computed(() => !!props.editingProvider);
const currentStep = ref(1);
const formRef = ref();
const formValid = ref(false);
const showApiKey = ref(false);
const loading = ref(false);

// ===== 模板状态 =====
const selectedTemplateId = ref<string>('');
const selectedTemplate = computed(() => getTemplateById(selectedTemplateId.value));

// ===== 验证状态 =====
const validationStatus = ref<'idle' | 'validating' | 'success' | 'error'>('idle');
const validationMessage = ref('');
const autoValidateEnabled = ref(true); // 是否启用自动验证

const validationAlertType = computed(() => {
    switch (validationStatus.value) {
        case 'success': return 'success';
        case 'error': return 'error';
        default: return 'info';
    }
});

// ===== 实时验证 (Debounced) =====
const debouncedValidateCredentials = useDebounceFn(async () => {
    // 只在有完整凭证时验证
    if (!formData.baseUrl || !formData.apiKey) {
        validationStatus.value = 'idle';
        validationMessage.value = '';
        return;
    }

    // URL 格式验证
    try {
        new URL(formData.baseUrl);
    } catch {
        validationStatus.value = 'error';
        validationMessage.value = 'API 地址格式无效';
        return;
    }

    validationStatus.value = 'validating';
    validationMessage.value = '正在验证凭证...';

    try {
        const result = await aiProviderApiClient.fetchModels({
            providerType: formData.providerType,
            baseUrl: formData.baseUrl,
            apiKey: formData.apiKey,
        });

        if (result.ok) {
            availableModels.value = result.models;
            modelsFetched.value = true;
            validationStatus.value = 'success';
            validationMessage.value = `✓ 验证成功！获取到 ${result.models.length} 个模型`;

            // 自动选择推荐模型或第一个模型
            if (!formData.defaultModel && result.models.length > 0) {
                const recommended = selectedTemplate.value?.recommendedModels?.[0];
                const matchingModel = recommended 
                    ? result.models.find(m => m.id === recommended || m.id.includes(recommended))
                    : null;
                formData.defaultModel = matchingModel?.id || result.models[0].id;
            }
        } else {
            validationStatus.value = 'error';
            validationMessage.value = `✗ ${result.error || '验证失败，请检查 API Key'}`;
            // 即使验证失败也设置默认模型列表
            if (result.models?.length > 0) {
                availableModels.value = result.models;
                modelsFetched.value = true;
            }
        }
    } catch (err: any) {
        validationStatus.value = 'error';
        validationMessage.value = `✗ 连接失败: ${err.message || '网络错误'}`;
    }
}, 500); // 500ms debounce

// ===== 模型状态 =====
const fetchingModels = ref(false);
const availableModels = ref<AIModelInfo[]>([]);
const modelsFetched = ref(false);
const modelsError = ref<string | null>(null);

// ===== 表单数据 =====
const formData = reactive({
    name: '',
    providerType: AIProviderType.CUSTOM_OPENAI_COMPATIBLE as AIProviderType,
    baseUrl: '',
    apiKey: '',
    defaultModel: '',
    isDefault: false,
    isActive: true,
});

// ===== 提供商类型选项 =====
const providerTypeOptions = [
    { label: '七牛云 AI', value: AIProviderType.QINIU },
    { label: 'OpenAI', value: AIProviderType.OPENAI },
    { label: 'Anthropic Claude', value: AIProviderType.ANTHROPIC },
    { label: '自定义 OpenAI 兼容', value: AIProviderType.CUSTOM_OPENAI_COMPATIBLE },
];

// ===== 验证规则 =====
const rules = {
    required: (v: string) => !!v || '此字段必填',
    maxLength: (max: number) => (v: string) => !v || v.length <= max || `最多 ${max} 个字符`,
    url: (v: string) => {
        if (!v) return true;
        try {
            new URL(v);
            return true;
        } catch {
            return '请输入有效的 URL';
        }
    },
};

// ===== Computed =====
const canProceed = computed(() => {
    if (currentStep.value === 1) {
        return !!selectedTemplateId.value;
    }
    if (currentStep.value === 2) {
        // Step 2 需要：表单有效 + 验证成功（或至少不是正在验证中）
        const basicValid = formValid.value && formData.name && formData.baseUrl && formData.apiKey;
        // 允许验证成功或验证失败时继续（用户可能想手动输入模型）
        const validationOk = validationStatus.value !== 'validating';
        return basicValid && validationOk;
    }
    return true;
});

const canFetchModels = computed(() => {
    return formData.providerType && formData.baseUrl && formData.apiKey;
});

const canSave = computed(() => {
    if (isEditing.value) {
        return formData.name && formData.baseUrl;
    }
    return formData.name && formData.baseUrl && formData.apiKey;
});

const modelOptions = computed(() => {
    return availableModels.value.map(m => ({
        title: m.name || m.id,
        value: m.id,
        subtitle: m.description,
    }));
});

// API Key 输入框的 append-inner 图标
const apiKeyAppendIcon = computed(() => {
    return showApiKey.value ? 'mdi-eye-off' : 'mdi-eye';
});

// API Key 输入框颜色（根据验证状态）
const validationInputColor = computed(() => {
    switch (validationStatus.value) {
        case 'success': return 'success';
        case 'error': return 'error';
        default: return undefined;
    }
});

// 处理 API Key 输入框的 append-inner 点击
function handleApiKeyAppendClick() {
    showApiKey.value = !showApiKey.value;
}

// ===== Watchers =====
watch(() => props.modelValue, (visible) => {
    if (visible) {
        if (props.editingProvider) {
            // 编辑模式：填充现有数据
            initEditMode();
        } else {
            // 创建模式：重置
            resetForm();
        }
    }
});

watch(() => props.editingProvider, (provider) => {
    if (provider && props.modelValue) {
        initEditMode();
    }
});

// 监听 API Key 变化，触发自动验证
watch(() => formData.apiKey, (newKey) => {
    if (autoValidateEnabled.value && newKey && formData.baseUrl) {
        // 重置之前的验证状态
        availableModels.value = [];
        modelsFetched.value = false;
        modelsError.value = null;
        debouncedValidateCredentials();
    } else if (!newKey) {
        validationStatus.value = 'idle';
        validationMessage.value = '';
    }
});

// 监听 URL 变化，重置验证状态
watch(() => formData.baseUrl, (newUrl, oldUrl) => {
    if (newUrl !== oldUrl) {
        validationStatus.value = 'idle';
        validationMessage.value = '';
        availableModels.value = [];
        modelsFetched.value = false;
        modelsError.value = null;
        
        // 如果已有 API Key，触发验证
        if (autoValidateEnabled.value && formData.apiKey && newUrl) {
            debouncedValidateCredentials();
        }
    }
});

// ===== Methods =====
function initEditMode() {
    const provider = props.editingProvider;
    if (!provider) return;

    currentStep.value = 2; // 编辑模式直接跳到第2步
    formData.name = provider.name;
    formData.providerType = provider.providerType as AIProviderType;
    formData.baseUrl = provider.baseUrl || '';
    formData.apiKey = '';
    formData.defaultModel = provider.defaultModel || '';
    formData.isDefault = provider.isDefault;
    formData.isActive = provider.isActive;

    // 设置已有模型
    availableModels.value = provider.availableModels || [];
    modelsFetched.value = availableModels.value.length > 0;
}

function resetForm() {
    currentStep.value = 1;
    selectedTemplateId.value = '';
    formData.name = '';
    formData.providerType = AIProviderType.CUSTOM_OPENAI_COMPATIBLE;
    formData.baseUrl = '';
    formData.apiKey = '';
    formData.defaultModel = '';
    formData.isDefault = (props.existingProvidersCount ?? 0) === 0;
    formData.isActive = true;
    showApiKey.value = false;
    validationStatus.value = 'idle';
    validationMessage.value = '';
    availableModels.value = [];
    modelsFetched.value = false;
    modelsError.value = null;
}

function handleTemplateSelect(template: AIProviderTemplate) {
    formData.providerType = template.providerType;
    formData.baseUrl = template.baseUrl;
    formData.name = template.name === '自定义' ? '' : `我的${template.name}`;
    
    // 重置模型状态
    availableModels.value = [];
    modelsFetched.value = false;
    modelsError.value = null;
}

function nextStep() {
    if (currentStep.value < 3) {
        currentStep.value++;
    }
}

function prevStep() {
    if (currentStep.value > 1) {
        currentStep.value--;
    }
}

function closeDialog() {
    dialogVisible.value = false;
    emit('close');
}

async function handleFetchModels() {
    if (!canFetchModels.value) return;

    fetchingModels.value = true;
    modelsError.value = null;

    try {
        const result = await aiProviderApiClient.fetchModels({
            providerType: formData.providerType,
            baseUrl: formData.baseUrl,
            apiKey: formData.apiKey,
        });

        if (result.ok) {
            availableModels.value = result.models;
            modelsFetched.value = true;
            validationStatus.value = 'success';
            validationMessage.value = `连接成功！获取到 ${result.models.length} 个模型`;

            // 自动选择第一个模型
            if (!formData.defaultModel && result.models.length > 0) {
                formData.defaultModel = result.models[0].id;
            }
        } else {
            modelsError.value = result.error || '获取模型失败';
            availableModels.value = result.models || [];
            modelsFetched.value = true;
            validationStatus.value = 'error';
            validationMessage.value = `获取失败: ${result.error}`;
        }
    } catch (err: any) {
        modelsError.value = err.message || '获取模型失败';
        validationStatus.value = 'error';
        validationMessage.value = `连接失败: ${err.message}`;
    } finally {
        fetchingModels.value = false;
    }
}

async function handleSave() {
    loading.value = true;

    try {
        emit('save', {
            name: formData.name,
            providerType: formData.providerType,
            baseUrl: formData.baseUrl,
            apiKey: formData.apiKey,
            defaultModel: formData.defaultModel || undefined,
            isDefault: formData.isDefault,
            isActive: formData.isActive,
        });
    } finally {
        loading.value = false;
    }
}
</script>

<style scoped>
.stepper-header {
    background: transparent;
}

.stepper-header :deep(.v-stepper-header) {
    box-shadow: none;
}
</style>
