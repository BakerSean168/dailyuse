<script setup lang="ts">
import { cn } from '@dailyuse/ui-vue-shadcn'

const props = defineProps<{
  class?: string
}>()
</script>

<template>
  <div
    :class="cn(
      'h-full border-r border-border bg-sidebar/50 text-sidebar-foreground flex flex-col',
      props.class
    )"
  >
    <slot />
  </div>
</template>
