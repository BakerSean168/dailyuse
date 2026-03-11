<template>
  <ResourcePickerDialog
    :open="open"
    :items="imageItems"
    :recent-items="recentImageItems"
    @update:open="(value) => emit('update:open', value)"
    @select="handleSelect"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { ResourceClientDTO } from '@dailyuse/contracts/repository';
import ResourcePickerDialog from './ResourcePickerDialog.vue';
import {
  toResourceInsertionItem,
  type ResourceInsertionItem,
} from '../composables/useResourceInsertion';

const props = withDefaults(
  defineProps<{
    open: boolean;
    resources: ResourceClientDTO[];
    recentResources?: ResourceClientDTO[];
  }>(),
  {
    open: false,
    recentResources: () => [],
  },
);

const emit = defineEmits<{
  'update:open': [value: boolean];
  select: [resource: ResourceClientDTO];
}>();

const imageItems = computed(() =>
  props.resources.map((resource) => toResourceInsertionItem(resource)),
);
const recentImageItems = computed(() =>
  props.recentResources.map((resource) => toResourceInsertionItem(resource)),
);

function handleSelect(payload: { item: ResourceInsertionItem }) {
  emit('select', payload.item.resource);
  emit('update:open', false);
}
</script>
