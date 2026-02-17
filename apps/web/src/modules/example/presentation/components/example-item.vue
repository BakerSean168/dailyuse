<script setup lang="ts">
import { defineProps } from 'vue';
import type { ItemClientDTO } from '@dailyuse/contracts/example';

defineProps<{
  item: ItemClientDTO
}>();
</script>

<template>
  <div class="example-item">
    <span>{{ item.name }}</span>
  </div>
</template>
