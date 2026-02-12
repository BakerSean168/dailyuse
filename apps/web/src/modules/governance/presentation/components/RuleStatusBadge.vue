<template>
  <span
    class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium"
    :class="badgeClasses"
  >
    <component :is="iconComponent" :size="12" v-if="iconComponent" />
    {{ label }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { CheckCircle, Pencil, AlertTriangle } from 'lucide-vue-next';
import { RuleStatus } from '../../types';

const props = withDefaults(
  defineProps<{
    status: string;
  }>(),
  {},
);

const badgeClasses = computed(() => {
  switch (props.status) {
    case RuleStatus.Active:
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    case RuleStatus.Draft:
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
    case RuleStatus.Deprecated:
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
    default:
      return 'bg-muted text-muted-foreground';
  }
});

const iconComponent = computed(() => {
  switch (props.status) {
    case RuleStatus.Active:
      return CheckCircle;
    case RuleStatus.Draft:
      return Pencil;
    case RuleStatus.Deprecated:
      return AlertTriangle;
    default:
      return null;
  }
});

const label = computed(() => {
  switch (props.status) {
    case RuleStatus.Active:
      return '已发布';
    case RuleStatus.Draft:
      return '草稿';
    case RuleStatus.Deprecated:
      return '已弃用';
    default:
      return props.status;
  }
});
</script>
