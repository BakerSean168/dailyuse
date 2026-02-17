<template>
  <div 
    class="w-full h-full min-w-[80px] min-h-[80px] aspect-square bg-white/8 border border-dashed border-gray-400 dark:border-gray-600 rounded-xl flex items-center justify-center cursor-pointer transition-all duration-200 hover:bg-white/18 dark:hover:bg-white/12"
    @click="$emit('click')"
  >
    <slot>
      <!-- Default content, customizable: plus icon or empty -->
    </slot>
  </div>
</template>

<script setup lang="ts">
defineEmits<{
  (e: 'click'): void;
}>();
</script>
