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
import { CheckCircle, Pencil, AlertTriangle } from '@lucide/vue';

// Rule status enum
enum RuleStatus {
  Active = 'Active',
  Draft = 'Draft',
  Deprecated = 'Deprecated',
}

const props = withDefaults(
  defineProps<{
    status: string;
  }>(),
  {},
);

const badgeClasses = computed(() => {
  switch (props.status) {
    case RuleStatus.Active:
      return 'bg-success/15 text-success dark:bg-success/30 dark:text-success';
    case RuleStatus.Draft:
      return 'bg-warning/15 text-warning dark:bg-warning/30 dark:text-warning';
    case RuleStatus.Deprecated:
      return 'bg-destructive/15 text-destructive dark:bg-destructive/30 dark:text-destructive';
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
