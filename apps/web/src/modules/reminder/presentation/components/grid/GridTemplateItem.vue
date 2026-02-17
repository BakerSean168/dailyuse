<script setup lang="ts">
/**
 * GridTemplateItem - Reminder Template Grid Item
 * Re-exported from @dailyuse/ui-vue-shadcn
 * 
 * This component has been extracted to the shared UI library.
 * All logic and styling now resides in packages/ui-vue-shadcn/src/components/custom/reminder/GridTemplateItem.vue
 */
import { GridTemplateItem as GridTemplateItemBase } from '@dailyuse/ui-vue-shadcn';
import type { ReminderTemplateClientDTO } from '@dailyuse/contracts/reminder';

type ReminderTemplate = ReminderTemplateClientDTO;

defineProps<{
  item: ReminderTemplate;
}>();
</script>

<template>
  <GridTemplateItemBase :item="item" />
</template>

