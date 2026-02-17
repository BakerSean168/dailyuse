<template>
  <GridBlankItem @click="$emit('click')">
    <slot />
  </GridBlankItem>
</template>

<script setup lang="ts">
import { GridBlankItem } from '@dailyuse/ui-vue-shadcn';

defineEmits<{
  (e: 'click'): void;
}>();
</script>
