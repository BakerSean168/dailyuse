<template>
    <v-dialog
        :model-value="modelValue"
        @update:model-value="$emit('update:modelValue', $event)"
        max-width="800px"
        persistent
    >
        <v-card>
            <v-card-title class="d-flex align-center justify-space-between">
                <span class="text-h5">✨ 为关键结果生成任务</span>
                <v-btn icon="mdi-close" variant="text" @click="onCancel" :disabled="importing" />
            </v-card-title>

            <v-divider />

            <v-card-text class="pa-6">
                <div v-if="loading" class="text-center py-8">
                    <v-progress-circular indeterminate color="primary" size="64" class="mb-4" />
                    <p class="text-h6">{{ loadingText || '正在生成任务...' }}</p>
                    <p class="text-caption text-medium-emphasis">AI 正在根据您的关键结果生成任务计划</p>
                </div>

                <v-alert v-else-if="error" type="error" variant="tonal" class="mb-4">
                    {{ error }}
                </v-alert>

                <div v-else-if="localTasks.length > 0">
                    <v-alert v-if="!importing" type="success" variant="tonal" class="mb-4" icon="mdi-check-circle">
                        已生成 {{ localTasks.length }} 个任务
                    </v-alert>

                    <v-list class="pa-0">
                        <v-list-item v-for="(task, index) in sortedTasks" :key="index" class="px-0 mb-2">
                            <template #prepend>
                                <v-checkbox v-model="task.selected" hide-details density="compact" class="mr-2" />
                            </template>

                            <v-list-item-title class="d-flex align-center mb-2">
                                <v-chip :color="getPriorityColor(task.priority)" size="small" label class="mr-2">
                                    {{ task.priority }}
                                </v-chip>

                                <v-text-field
                                    v-model="task.title"
                                    density="compact"
                                    hide-details
                                    variant="outlined"
                                    class="flex-grow-1"
                                />
                            </v-list-item-title>

                            <v-list-item-subtitle class="d-flex align-center gap-2 mb-2">
                                <v-icon size="small">mdi-clock-outline</v-icon>
                                <v-text-field
                                    v-model.number="task.estimatedHours"
                                    type="number"
                                    density="compact"
                                    hide-details
                                    variant="outlined"
                                    min="1"
                                    max="40"
                                    style="width: 80px"
                                    suffix="小时"
                                />

                                <v-select
                                    v-model="task.priority"
                                    :items="priorityOptions"
                                    density="compact"
                                    hide-details
                                    variant="outlined"
                                    style="width: 120px"
                                />
                            </v-list-item-subtitle>

                            <v-list-item-subtitle v-if="task.description" class="mt-2">
                                <v-textarea
                                    v-model="task.description"
                                    density="compact"
                                    hide-details
                                    variant="outlined"
                                    rows="2"
                                    auto-grow
                                />
                            </v-list-item-subtitle>
                        </v-list-item>
                    </v-list>

                    <v-progress-linear v-if="importing" :model-value="importProgress" color="primary" height="8" class="mt-4" />
                </div>
            </v-card-text>

            <v-divider />

            <v-card-actions class="px-6 py-4">
                <v-spacer />
                <v-btn variant="text" @click="onCancel" :disabled="importing">取消</v-btn>
                <v-btn
                    v-if="localTasks.length > 0"
                    color="primary"
                    variant="flat"
                    :disabled="selectedCount === 0 || importing"
                    :loading="importing"
                    @click="onConfirmImport"
                >
                    导入所选任务 ({{ selectedCount }})
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { EditableTaskUI, UIPriority } from './types';

const props = defineProps<{
    modelValue: boolean;
    loading: boolean;
    loadingText?: string;
    importing: boolean;
    importProgress?: number;
    error?: string | null;
    tasks: EditableTaskUI[];
}>();

const emit = defineEmits<{
    'update:modelValue': [value: boolean];
    cancel: [];
    'confirm-import': [tasks: EditableTaskUI[]];
}>();

const localTasks = ref<EditableTaskUI[]>([]);

const priorityOptions = [
    { title: 'HIGH', value: 'high' },
    { title: 'NORMAL', value: 'normal' },
    { title: 'LOW', value: 'low' },
    { title: 'URGENT', value: 'urgent' },
];

const selectedCount = computed(() => {
    return localTasks.value.filter((task) => task.selected).length;
});

const sortedTasks = computed(() => {
    const priorityOrder: Record<UIPriority, number> = {
        urgent: 0,
        high: 1,
        normal: 2,
        low: 3,
    };
    return [...localTasks.value].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
});

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

function onCancel() {
    if (props.importing) return;
    emit('cancel');
    emit('update:modelValue', false);
}

function onConfirmImport() {
    const selected = localTasks.value.filter((task) => task.selected);
    emit('confirm-import', selected);
}

watch(
    () => props.tasks,
    (newTasks) => {
        localTasks.value = newTasks.map((task) => ({ ...task }));
    },
    { immediate: true, deep: true }
);
</script>

<style scoped>
.gap-2 {
    gap: 8px;
}
</style>

