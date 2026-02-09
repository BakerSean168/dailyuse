<template>
  <div class="tag-filter-chips">
    <v-chip
      v-for="tag in tags"
      :key="tag"
      :color="isSelected(tag) ? 'primary' : undefined"
      :variant="isSelected(tag) ? 'flat' : 'outlined'"
      size="small"
      class="mr-1 mb-1"
      @click="$emit('toggle', tag)"
    >
      {{ tag }}
    </v-chip>

    <v-chip
      v-if="selectedTags.length > 0"
      variant="text"
      size="small"
      class="mr-1 mb-1"
      prepend-icon="mdi-close"
      @click="$emit('clear')"
    >
      清除
    </v-chip>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  tags: string[];
  selectedTags: string[];
}>();

defineEmits<{
  toggle: [tag: string];
  clear: [];
}>();

function isSelected(tag: string): boolean {
  return props.selectedTags.includes(tag);
}
</script>

<style scoped>
.tag-filter-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
}
</style>
