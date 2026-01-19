<template>
    <v-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)" max-width="800px"
        persistent>
        <v-card>
            <!-- Dialog Header -->
            <v-card-title class="d-flex align-center justify-space-between">
                <span class="text-h5">✨ 为关键结果生成任务</span>
                <v-btn icon="mdi-close" variant="text" @click="closeDialog" />
            </v-card-title>

            <v-divider />

            <v-card-text class="pa-6">
                <!-- Loading State -->
                <div v-if="isGenerating" class="text-center py-8">
                    <v-progress-circular indeterminate color="primary" size="64" class="mb-4" />
                    <p class="text-h6">正在生成任务...</p>
                    <p class="text-caption text-medium-emphasis">AI 正在根据您的关键结果生成任务计划</p>
                </div>

                <!-- Success State -->
                <div v-else-if="generatedTasks.length > 0">
                    <!-- Success Alert -->
                    <v-alert v-if="!importing" type="success" variant="tonal" class="mb-4" icon="mdi-check-circle">
                        已生成 {{ generatedTasks.length }} 个任务
                    </v-alert>

                    <!-- Task List -->
                    <v-list class="pa-0">
                        <v-list-item v-for="(task, index) in sortedTasks" :key="index" class="px-0 mb-2">
                            <template #prepend>
                                <v-checkbox v-model="task.selected" hide-details density="compact" class="mr-2" />
                            </template>

                            <v-list-item-title class="d-flex align-center mb-2">
                                <!-- Priority Badge -->
                                <v-chip :color="getPriorityColor(task.priority)" size="small" label class="mr-2">
                                    {{ task.priority }}
                                </v-chip>

                                <!-- Task Title (Editable) -->
                                <v-text-field v-model="task.title" density="compact" hide-details variant="outlined"
                                    class="flex-grow-1" />
                            </v-list-item-title>

                            <v-list-item-subtitle class="d-flex align-center gap-2 mb-2">
                                <!-- Estimated Hours (Editable) -->
                                <v-icon size="small">mdi-clock-outline</v-icon>
                                <v-text-field v-model.number="task.estimatedHours" type="number" density="compact"
                                    hide-details variant="outlined" min="1" max="40" style="width: 80px" suffix="小时" />

                                <!-- Priority Selector -->
                                <v-select v-model="task.priority" :items="priorityOptions" density="compact"
                                    hide-details variant="outlined" style="width: 120px" />
                            </v-list-item-subtitle>

                            <!-- Description (Editable) -->
                            <v-list-item-subtitle v-if="task.description" class="mt-2">
                                <v-textarea v-model="task.description" density="compact" hide-details variant="outlined"
                                    rows="2" auto-grow />
                            </v-list-item-subtitle>
                        </v-list-item>
                    </v-list>

                    <!-- Import Progress -->
                    <v-progress-linear v-if="importing" :model-value="importProgress" color="primary" height="8"
                        class="mt-4" />
                </div>

                <!-- Error State -->
                <v-alert v-else-if="error" type="error" variant="tonal" class="mb-4">
                    {{ error }}
                </v-alert>
            </v-card-text>

            <v-divider />

            <v-card-actions class="px-6 py-4">
                <v-spacer />
                <v-btn variant="text" @click="closeDialog" :disabled="importing">
                    取消
                </v-btn>
                <v-btn v-if="generatedTasks.length > 0" color="primary" variant="flat"
                    :disabled="selectedCount === 0 || importing" :loading="importing" @click="importSelectedTasks">
                    导入所选任务 ({{ selectedCount }})
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useAIGeneration } from '@/modules/ai/presentation/composables/useAIGeneration';
import { getTaskTemplateApiClient } from '@dailyuse/infrastructure-client';

const taskTemplateApiClient = getTaskTemplateApiClient();
import { useMessage } from '@dailyuse/ui-vuetify';
import { useTaskStore } from '@/modules/task/presentation/stores/taskStore';
import { TaskType, TimeType } from '@dailyuse/contracts/task';
import { ImportanceLevel, UrgencyLevel } from '@dailyuse/contracts/shared';

// Props
const props = defineProps<{
    modelValue: boolean;
    keyResultTitle: string;
    keyResultDescription?: string;
    targetValue: number;
    currentValue: number;
    unit?: string;
    timeRemaining: number;
    goalUuid?: string;
    keyResultUuid?: string;
    accountUuid: string;
}>();

// Emits
const emit = defineEmits<{
    'update:modelValue': [value: boolean];
    'tasksImported': [count: number];
}>();

// Composables
const { generateTasks } = useAIGeneration();
const message = useMessage();
const router = useRouter();
const taskStore = useTaskStore();

// State
interface EditableTask {
    title: string;
    description?: string;
    estimatedHours: number;
    priority: 'high' | 'normal' | 'low' | 'urgent';
    dependencies: number[];
    tags?: string[];
    selected: boolean;
}

const generatedTasks = ref<EditableTask[]>([]);
const isGenerating = ref(false);
const importing = ref(false);
const importProgress = ref(0);
const error = ref<string | null>(null);

// Priority Options
const priorityOptions = [
    { title: 'HIGH', value: 'high' },
    { title: 'NORMAL', value: 'normal' },
    { title: 'LOW', value: 'low' },
    { title: 'URGENT', value: 'urgent' },
];

// Computed
const selectedCount = computed(() => {
    return generatedTasks.value.filter((t) => t.selected).length;
});

const sortedTasks = computed(() => {
    const priorityOrder: Record<string, number> = { urgent: 0, high: 1, normal: 2, low: 3 };
    return [...generatedTasks.value].sort((a, b) => {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
});

// Methods
function getPriorityColor(priority: string): string {
    switch (priority) {
        case 'urgent':
        case 'high':
            return 'error';
        case 'normal':
            return 'warning';
        case 'low':
            return 'info';
        default:
            return 'default';
    }
}

function closeDialog() {
    if (!importing.value) {
        emit('update:modelValue', false);
    }
}

async function loadTasks() {
    if (!props.modelValue) return;

    try {
        isGenerating.value = true;
        error.value = null;

        const result = await generateTasks({
            keyResultTitle: props.keyResultTitle,
            keyResultDescription: props.keyResultDescription,
            targetValue: props.targetValue,
            currentValue: props.currentValue,
            unit: props.unit,
            timeRemaining: props.timeRemaining,
        });

        // Convert API response to editable tasks
        generatedTasks.value = result.tasks.map((task: any) => ({
            ...task,
            selected: true, // Auto-select all tasks by default
        }));

        message.success(`已生成 ${result.tasks.length} 个任务`);
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '生成任务失败';
        error.value = errorMessage;

        // Handle specific error codes
        if (errorMessage.includes('429')) {
            message.error('已达到每日配额限制。配额将在明天重置。');
        } else if (errorMessage.includes('504')) {
            message.warning('生成任务超时，请重试');
        } else {
            message.error(errorMessage);
        }
    } finally {
        isGenerating.value = false;
    }
}

async function importSelectedTasks() {
    const selectedTasks = generatedTasks.value.filter((t) => t.selected);
    if (selectedTasks.length === 0) return;

    try {
        importing.value = true;
        importProgress.value = 0;

        const totalTasks = selectedTasks.length;
        let importedCount = 0;
        const failedTasks: { task: EditableTask; error: string }[] = [];

        // Import tasks individually (parallel)
        const importPromises = selectedTasks.map(async (task) => {
            try {
                const createRequest = {
                    accountUuid: props.accountUuid,
                    title: task.title,
                    description: task.description || '',
                    taskType: TaskType.ONE_TIME,
                    timeConfig: {
                        timeType: TimeType.TIME_RANGE,
                        timeRange: {
                            start: Date.now(),
                            end: Date.now() + task.estimatedHours * 60 * 60 * 1000,
                        },
                    },
                    importance: task.priority === 'urgent' ? ImportanceLevel.Vital :
                        task.priority === 'high' ? ImportanceLevel.Important :
                            task.priority === 'normal' ? ImportanceLevel.Moderate : ImportanceLevel.Minor,
                    urgency: task.priority === 'urgent' ? UrgencyLevel.Critical :
                        task.priority === 'high' ? UrgencyLevel.High :
                            task.priority === 'normal' ? UrgencyLevel.Medium : UrgencyLevel.Low,
                    goalBinding: props.keyResultUuid ? {
                        goalUuid: props.goalUuid!,
                        keyResultUuid: props.keyResultUuid,
                        bindingType: 'CONTRIBUTION' as const,
                        incrementValue: 1,
                    } : undefined,
                    tags: task.tags || [],
                };

                const createdTask = await taskTemplateApiClient.createTaskTemplate(createRequest);

                // Add to store (need to convert DTO to domain object)
                // taskStore.addTaskTemplate(createdTask);

                importedCount++;
                importProgress.value = (importedCount / totalTasks) * 100;

                return createdTask;
            } catch (err) {
                failedTasks.push({
                    task,
                    error: err instanceof Error ? err.message : 'Unknown error',
                });
                throw err;
            }
        });

        await Promise.allSettled(importPromises);

        // Show results
        if (failedTasks.length === 0) {
            message.success(`成功导入 ${importedCount} 个任务`);
            emit('tasksImported', importedCount);

            // Navigate to task list
            if (props.goalUuid) {
                router.push(`/goals/${props.goalUuid}/tasks`);
            } else {
                router.push('/tasks');
            }

            closeDialog();
        } else {
            const successCount = importedCount - failedTasks.length;
            message.warning(
                `成功导入 ${successCount} 个任务。${failedTasks.length} 个任务导入失败。`
            );
            emit('tasksImported', successCount);
        }
    } catch (err) {
        message.error('导入任务时发生错误');
    } finally {
        importing.value = false;
        importProgress.value = 0;
    }
}

// Watch for dialog open
watch(
    () => props.modelValue,
    (newValue) => {
        if (newValue) {
            // Reset state
            generatedTasks.value = [];
            error.value = null;
            importProgress.value = 0;

            // Load tasks
            loadTasks();
        }
    }
);
</script>

<style scoped>
.gap-2 {
    gap: 8px;
}
</style>

