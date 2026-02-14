<script setup lang="ts">
import { cn } from '@dailyuse/ui-vue-shadcn/src/lib/utils'

defineProps<{
  label: string
  active?: boolean
  count?: number | string
  class?: string
}>()
</script>

<template>
  <button
    :class="cn(
      'flex items-center w-full gap-2 px-3 py-1.5 text-sm rounded-md transition-colors text-muted-foreground hover:bg-muted/50 hover:text-foreground',
      active ? 'bg-muted/80 text-foreground font-medium' : '',
      .class
    )"
  >
    <slot name="icon" />
    <span>{{ label }}</span>
    <span v-if="count" class="ml-auto text-xs opacity-60">{{ count }}</span>
  </button>
</template>
