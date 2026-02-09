<template>
  <v-chip
    :color="chipColor"
    :variant="variant"
    :size="size"
    :prepend-icon="prependIcon"
    label
  >
    {{ label }}
  </v-chip>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { RuleStatus } from '../../types';

const props = withDefaults(
  defineProps<{
    status: string;
    size?: 'x-small' | 'small' | 'default' | 'large';
    variant?: 'flat' | 'outlined' | 'tonal';
  }>(),
  {
    size: 'small',
    variant: 'tonal',
  },
);

const chipColor = computed(() => {
  switch (props.status) {
    case RuleStatus.Active:
      return 'success';
    case RuleStatus.Draft:
      return 'warning';
    case RuleStatus.Deprecated:
      return 'error';
    default:
      return 'grey';
  }
});

const prependIcon = computed(() => {
  switch (props.status) {
    case RuleStatus.Active:
      return 'mdi-check-circle';
    case RuleStatus.Draft:
      return 'mdi-pencil';
    case RuleStatus.Deprecated:
      return 'mdi-alert';
    default:
      return undefined;
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
