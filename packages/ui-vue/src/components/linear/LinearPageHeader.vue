<script setup lang="ts">
defineProps<{
  title: string
  description?: string
}>()
</script>

<template>
  <div class="flex items-center justify-between px-6 py-3 border-b border-border bg-background sticky top-0 z-10">
    <div>
      <h1 class="text-base font-semibold tracking-tight text-foreground">{{ title }}</h1>
      <p v-if="description" class="text-xs text-muted-foreground mt-0.5">{{ description }}</p>
    </div>
    <div class="flex items-center gap-2">
      <slot name="actions" />
    </div>
  </div>
</template>
