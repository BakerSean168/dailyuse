<template>
  <ProgressBreakdownPanel
    :breakdown="breakdown"
    :loading="loading"
    :error="error"
    @close="$emit('close')"
    @retry="loadBreakdown"
  />
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ProgressBreakdownPanel } from '@dailyuse/ui-vue-shadcn';
import type { ProgressBreakdown } from '@dailyuse/contracts/goal';
import { useGoal } from '../composables/useGoal';

const props = defineProps<{
  goalUuid: string;
}>();

const emit = defineEmits<{
  close: [];
}>();

const { fetchProgressBreakdown } = useGoal();

const loading = ref(false);
const error = ref<string | null>(null);
const breakdown = ref<ProgressBreakdown | null>(null);

const loadBreakdown = async () => {
  try {
    loading.value = true;
    error.value = null;
    breakdown.value = await fetchProgressBreakdown(props.goalUuid);
  } catch (err) {
    error.value = err instanceof Error ? err.message : '加载失败';
    console.error('加载进度分解失败:', err);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadBreakdown();
});
</script>
