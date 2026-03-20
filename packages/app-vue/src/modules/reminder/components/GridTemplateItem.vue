<template>
  <ActionableWrapper :actions="menuActions" :show-more-button="false" wrapper-class="rounded-xl">
    <div
      class="relative rounded-xl shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 cursor-pointer"
      :class="[
        'p-4 flex flex-col items-center justify-center gap-2',
        isTemplateEnabled ? 'bg-card hover:bg-accent/50' : 'bg-muted opacity-60',
      ]"
      draggable="true"
      @click="$emit('click', item)"
      @dragstart="onDragStart"
    >
      <!-- Icon -->
      <div
        :class="[
          'w-12 h-12 rounded-full flex items-center justify-center',
          isTemplateEnabled ? 'bg-primary/10' : 'bg-muted',
        ]"
      >
        <Bell :class="['h-6 w-6', isTemplateEnabled ? 'text-primary' : 'text-muted-foreground']" />
      </div>

      <!-- Name -->
      <p
        :class="[
          'text-xs text-center line-clamp-2 font-medium',
          isTemplateEnabled ? 'text-foreground' : 'text-muted-foreground',
        ]"
      >
        {{ item.name }}
      </p>

      <div class="space-y-1 text-center">
        <p class="text-[11px] font-medium text-muted-foreground">
          {{ lifecycleLabel }}
        </p>
        <p class="line-clamp-2 text-[10px] text-muted-foreground">
          {{ item.effectiveEnabledReason }}
        </p>
      </div>

      <div class="flex flex-wrap items-center justify-center gap-1">
        <span
          v-if="item.lifecycleSource === 'global'"
          class="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-800"
        >
          {{ lifecycleBadgeText }}
        </span>
        <span
          v-else-if="item.lifecycleSource === 'group'"
          class="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-medium text-sky-800"
        >
          {{ lifecycleBadgeText }}
        </span>
        <span
          v-else
          class="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-800"
        >
          {{ lifecycleBadgeText }}
        </span>

        <span
          v-if="item.groupName"
          class="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground"
        >
          {{ item.groupName }}
        </span>
      </div>

      <!-- Status Indicator -->
      <div
        v-if="!isTemplateEnabled"
        class="absolute top-2 right-2 w-2 h-2 rounded-full bg-muted-foreground"
      />
    </div>
  </ActionableWrapper>
</template>

<script setup lang="ts">
import { computed, inject } from 'vue';
import { useI18n } from 'vue-i18n';
import { Bell, FolderInput, Pencil, Power, Trash2 } from 'lucide-vue-next';
import type { ReminderTemplateClientDTO } from '@dailyuse/contracts/reminder';
import { ActionableWrapper, menuLabel } from '../../../components/shared';
import type { MenuAction } from '../../../components/shared';
import {
  getTemplateLifecycleBadgeText,
  getTemplateLifecycleSummary,
} from '../presentation/lifecyclePresentation';

const props = defineProps<{
  item: ReminderTemplateClientDTO;
}>();

const emit = defineEmits<{
  click: [item: ReminderTemplateClientDTO];
  move: [item: ReminderTemplateClientDTO];
  edit: [item: ReminderTemplateClientDTO];
  delete: [item: ReminderTemplateClientDTO];
  'toggle-enabled': [item: ReminderTemplateClientDTO];
}>();

const { t } = useI18n();
const isTemplateEnabled = computed(() => props.item.effectiveEnabled);
const lifecycleLabel = computed(() => getTemplateLifecycleSummary(t, props.item));
const lifecycleBadgeText = computed(() => getTemplateLifecycleBadgeText(t, props.item));

// Support both injected callbacks and emits for flexibility
const onMoveTemplate = inject<(item: ReminderTemplateClientDTO) => void>('onMoveTemplate', (item) =>
  emit('move', item),
);
const onEditTemplate = inject<(item: ReminderTemplateClientDTO) => void>('onEditTemplate', (item) =>
  emit('edit', item),
);
const onDeleteTemplate = inject<(item: ReminderTemplateClientDTO) => void>(
  'onDeleteTemplate',
  (item) => emit('delete', item),
);
const onToggleTemplate = inject<(item: ReminderTemplateClientDTO) => void>(
  'onToggleTemplate',
  (item) => emit('toggle-enabled', item),
);

const onDragStart = (event: DragEvent) => {
  event.dataTransfer?.setData('application/json', JSON.stringify(props.item));
};

const menuActions = computed<MenuAction[]>(() => [
  {
    key: 'toggle-enabled',
    label: props.item.effectiveEnabled ? menuLabel('pauseTemplate') : menuLabel('enableTemplate'),
    icon: Power,
    handler: () => onToggleTemplate(props.item),
  },
  {
    key: 'move',
    label: menuLabel('moveToGroup'),
    icon: FolderInput,
    handler: () => onMoveTemplate(props.item),
  },
  {
    key: 'edit',
    label: menuLabel('editTemplate'),
    icon: Pencil,
    handler: () => onEditTemplate(props.item),
  },
  {
    key: 'delete',
    label: menuLabel('deleteTemplate'),
    icon: Trash2,
    destructive: true,
    separator: true,
    handler: () => onDeleteTemplate(props.item),
  },
]);
</script>
