<template>
    <v-dialog v-model="dialogVisible" max-width="700" persistent>
        <v-card>
            <!-- 标题栏 -->
            <v-card-title class="d-flex align-center pa-4">
                <v-icon class="mr-2" color="primary">mdi-magic-staff</v-icon>
                AI 智能创建目标
                <v-spacer />
                <v-btn icon variant="text" @click="handleClose">
                    <v-icon>mdi-close</v-icon>
                </v-btn>
            </v-card-title>

            <v-divider />

            <v-card-text class="pa-6">
                <!-- Step 1: 输入想法 -->
                <div v-if="currentStep === 'input'" class="step-input">
                    <p class="text-body-1 mb-4">
                        描述你想要实现的目标，AI 将帮你生成一个结构化的 OKR 目标。
                    </p>

                    <!-- 想法输入 -->
                    <v-textarea v-model="ideaInput" label="描述你的想法或目标" placeholder="例如：我想在三个月内提升英语口语能力，能够进行日常对话" rows="4"
                        counter="2000" :rules="[v => !!v || '请输入想法', v => v.length >= 5 || '至少输入 5 个字符']"
                        prepend-inner-icon="mdi-lightbulb-on" class="mb-4" auto-grow />

                    <!-- 额外上下文（可选） -->
                    <v-expansion-panels variant="accordion" class="mb-4">
                        <v-expansion-panel>
                            <v-expansion-panel-title>
                                <v-icon class="mr-2">mdi-text-box-plus</v-icon>
                                添加更多上下文（可选）
                            </v-expansion-panel-title>
                            <v-expansion-panel-text>
                                <v-textarea v-model="contextInput" label="补充信息"
                                    placeholder="例如：我是一名软件工程师，每天有 1 小时的学习时间..." rows="3" auto-grow />
                            </v-expansion-panel-text>
                        </v-expansion-panel>
                    </v-expansion-panels>

                    <!-- Provider 选择 -->
                    <v-select v-if="hasMultipleProviders" v-model="selectedProviderUuid" label="选择 AI 服务"
                        :items="providerOptions" item-title="name" item-value="uuid" prepend-inner-icon="mdi-robot"
                        clearable hint="留空使用默认服务" persistent-hint />

                    <!-- 生成按钮 -->
                    <div class="d-flex justify-end mt-6">
                        <v-btn color="primary" size="large" :loading="loading"
                            :disabled="!ideaInput || ideaInput.length < 5" @click="handleGenerate">
                            <v-icon start>mdi-auto-fix</v-icon>
                            生成目标
                        </v-btn>
                    </div>
                </div>

                <!-- Step 2: 预览结果 -->
                <div v-else-if="currentStep === 'preview'" class="step-preview">
                    <!-- 生成信息 -->
                    <v-chip-group class="mb-4">
                        <v-chip size="small" color="info" variant="tonal">
                            <v-icon start size="16">mdi-robot</v-icon>
                            {{ providerUsed }}
                        </v-chip>
                        <v-chip size="small" color="secondary" variant="tonal">
                            <v-icon start size="16">mdi-brain</v-icon>
                            {{ modelUsed }}
                        </v-chip>
                        <v-chip v-if="tokenUsage" size="small" variant="tonal">
                            <v-icon start size="16">mdi-counter</v-icon>
                            {{ tokenUsage.totalTokens }} tokens
                        </v-chip>
                    </v-chip-group>

                    <!-- 目标预览卡片 -->
                    <v-card variant="outlined" class="mb-4">
                        <v-card-text>
                            <!-- 标题和类别 -->
                            <div class="d-flex align-center mb-3">
                                <v-chip :color="getCategoryColor(generatedGoal?.category)" size="small" class="mr-2">
                                    {{ getCategoryLabel(generatedGoal?.category) }}
                                </v-chip>
                                <h3 class="text-h5 flex-grow-1">{{ generatedGoal?.title }}</h3>
                            </div>

                            <!-- 描述 -->
                            <p class="text-body-1 mb-4">{{ generatedGoal?.description }}</p>

                            <!-- 动机 -->
                            <div v-if="generatedGoal?.motivation" class="mb-4">
                                <div class="text-subtitle-2 text-medium-emphasis mb-1">
                                    <v-icon size="18" class="mr-1">mdi-heart</v-icon>
                                    动机
                                </div>
                                <p class="text-body-2">{{ generatedGoal.motivation }}</p>
                            </div>

                            <!-- 重要性 (priority 由后端根据 importance + targetDate 计算) -->
                            <div class="d-flex ga-4 mb-4">
                                <div>
                                    <div class="text-caption text-medium-emphasis">重要性</div>
                                    <v-rating :model-value="generatedGoal?.importance || 0" readonly density="compact"
                                        size="small" :length="4" color="primary" active-color="primary" />
                                </div>
                            </div>

                            <!-- 建议时间范围 -->
                            <div class="d-flex align-center mb-4">
                                <v-icon size="18" class="mr-2" color="primary">mdi-calendar-range</v-icon>
                                <span class="text-body-2">
                                    {{ formatDate(generatedGoal?.suggestedStartDate) }} -
                                    {{ formatDate(generatedGoal?.suggestedEndDate) }}
                                </span>
                            </div>

                            <!-- 标签 -->
                            <div class="mb-4">
                                <v-chip v-for="tag in generatedGoal?.tags" :key="tag" size="small" class="mr-1 mb-1"
                                    color="secondary" variant="tonal">
                                    {{ tag }}
                                </v-chip>
                            </div>

                            <!-- 可行性分析 -->
                            <div v-if="generatedGoal?.feasibilityAnalysis">
                                <v-divider class="my-3" />
                                <div class="text-subtitle-2 text-medium-emphasis mb-1">
                                    <v-icon size="18" class="mr-1">mdi-chart-timeline-variant</v-icon>
                                    可行性分析
                                </div>
                                <p class="text-body-2">{{ generatedGoal.feasibilityAnalysis }}</p>
                            </div>

                            <!-- AI 建议 -->
                            <div v-if="generatedGoal?.aiInsights">
                                <v-divider class="my-3" />
                                <div class="text-subtitle-2 text-medium-emphasis mb-1">
                                    <v-icon size="18" class="mr-1">mdi-lightbulb</v-icon>
                                    AI 建议
                                </div>
                                <p class="text-body-2">{{ generatedGoal.aiInsights }}</p>
                            </div>
                        </v-card-text>
                    </v-card>

                    <!-- 操作按钮 -->
                    <div class="d-flex justify-space-between">
                        <v-btn variant="outlined" @click="handleBack">
                            <v-icon start>mdi-arrow-left</v-icon>
                            重新生成
                        </v-btn>
                        <div class="d-flex ga-2">
                            <v-btn variant="text" @click="handleClose">取消</v-btn>
                            <v-btn color="primary" @click="handleConfirm">
                                <v-icon start>mdi-check</v-icon>
                                创建目标
                            </v-btn>
                        </div>
                    </div>
                </div>

                <!-- 错误状态 -->
                <v-alert v-if="error" type="error" variant="tonal" class="mt-4" closable @click:close="error = null">
                    {{ error }}
                </v-alert>
            </v-card-text>
        </v-card>
    </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useGoalGeneration } from '../composables/useGoalGeneration';
import { useAIProviders } from '../composables/useAIProviders';
import type { AIProviderConfigClientDTO, AIUsageQuotaClientDTO, GeneratedGoalDraft } from '@dailyuse/contracts/ai';

// ===== Props & Emits =====
const props = withDefaults(defineProps<{
    modelValue?: boolean;
}>(), {
    modelValue: undefined,
});

const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void;
    (e: 'confirm', goal: GeneratedGoalDraft): void;
    (e: 'goal-created', goal: GeneratedGoalDraft): void;
}>();

// ===== Composables =====
const {
    loading,
    error,
    generatedGoal,
    tokenUsage,
    providerUsed,
    modelUsed,
    generateGoal,
    reset,
} = useGoalGeneration();

const {
    providers,
    hasProviders,
    loadProviders,
} = useAIProviders();

// ===== 状态 =====
// 支持两种模式：v-model 和 ref.open()
const internalVisible = ref(false);

const dialogVisible = computed({
    get: () => props.modelValue !== undefined ? props.modelValue : internalVisible.value,
    set: (value) => {
        if (props.modelValue !== undefined) {
            emit('update:modelValue', value);
        } else {
            internalVisible.value = value;
        }
    },
});

const currentStep = ref<'input' | 'preview'>('input');
const ideaInput = ref('');
const contextInput = ref('');
const selectedProviderUuid = ref<string | null>(null);

// ===== 计算属性 =====
const hasMultipleProviders = computed(() => providers.value.length > 1);

const providerOptions = computed(() => {
    return [
        { uuid: null, name: '使用默认' },
        ...providers.value.filter(p => p.isActive),
    ];
});

// ===== 工具方法 =====
function formatDate(timestamp?: number): string {
    if (!timestamp) return '未设置';
    return new Date(timestamp).toLocaleDateString('zh-CN');
}

function getCategoryColor(category?: string): string {
    const colors: Record<string, string> = {
        work: 'blue',
        health: 'green',
        learning: 'purple',
        personal: 'orange',
        finance: 'teal',
        relationship: 'pink',
        other: 'grey',
    };
    return colors[category || 'other'] || 'grey';
}

function getCategoryLabel(category?: string): string {
    const labels: Record<string, string> = {
        work: '工作',
        health: '健康',
        learning: '学习',
        personal: '个人',
        finance: '财务',
        relationship: '人际关系',
        other: '其他',
    };
    return labels[category || 'other'] || '其他';
}

// ===== 事件处理 =====
async function handleGenerate() {
    const result = await generateGoal({
        idea: ideaInput.value,
        context: contextInput.value || undefined,
        providerUuid: selectedProviderUuid.value || undefined,
    });

    if (result) {
        currentStep.value = 'preview';
    }
}

function handleBack() {
    currentStep.value = 'input';
    reset();
}

function handleClose() {
    dialogVisible.value = false;
    // 延迟重置状态，等待对话框关闭动画
    setTimeout(() => {
        currentStep.value = 'input';
        ideaInput.value = '';
        contextInput.value = '';
        selectedProviderUuid.value = null;
        reset();
    }, 300);
}

function handleConfirm() {
    if (generatedGoal.value) {
        emit('confirm', generatedGoal.value);
        emit('goal-created', generatedGoal.value);
        handleClose();
    }
}

// ===== 公开方法 =====
function open() {
    dialogVisible.value = true;
}

function close() {
    handleClose();
}

// ===== 生命周期 =====
watch(dialogVisible, (visible) => {
    if (visible && !hasProviders.value) {
        loadProviders();
    }
});

// 暴露给父组件
defineExpose({
    open,
    close,
});
</script>

<style scoped>
.step-input,
.step-preview {
    min-height: 300px;
}
</style>

