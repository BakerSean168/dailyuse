<script setup lang="ts">
import { cn } from '@dailyuse/ui-vue-shadcn/src/lib/utils'

defineProps<{
  class?: string
}>()
</script>

<template>
  <div
    :class="cn(
      'h-full border-r border-border bg-sidebar/50 text-sidebar-foreground flex flex-col',
      .class
    )"
  >
    <slot />
  </div>
</template>
