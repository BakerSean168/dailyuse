<template>
  <div v-if="resource" class="flex h-full flex-col border-l bg-background">
    <div class="border-b px-4 py-3">
      <h3 class="text-sm font-semibold">{{ t('repository.resourceDetails.title') }}</h3>
      <p class="truncate text-xs text-muted-foreground">
        {{ resourceDisplayName }}
      </p>
    </div>

    <div class="space-y-4 overflow-auto p-4 text-sm">
      <div
        v-if="isBrokenReferenceTarget"
        class="rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-xs text-warning"
      >
        {{ t('repository.resourceDetails.brokenReferenceWarning') }}
      </div>

      <div class="space-y-2">
        <div class="font-medium">{{ t('repository.resourceDetails.metadata') }}</div>
        <div class="space-y-1 text-muted-foreground">
          <div>{{ t('repository.resourceDetails.path') }}: {{ resource.path }}</div>
          <div>{{ t('repository.resourceDetails.type') }}: {{ resource.mimeType }}</div>
          <div>{{ t('repository.resourceDetails.size') }}: {{ resourceFormattedSize }}</div>
          <div>{{ t('repository.resourceDetails.createdAt') }}: {{ resourceCreatedAtText }}</div>
          <div>{{ t('repository.resourceDetails.updatedAt') }}: {{ resourceUpdatedAtText }}</div>
          <div>
            {{ t('repository.resourceDetails.references') }}: {{ inboundReferences.length }}
          </div>
          <div v-if="resource.metadata?.tags?.length">
            {{ t('repository.resourceDetails.tags') }}: {{ resource.metadata.tags.join(', ') }}
          </div>
        </div>
      </div>

      <div class="space-y-2">
        <div class="font-medium">{{ t('repository.resourceDetails.usedBy') }}</div>
        <div v-if="inboundReferences.length === 0" class="text-xs text-muted-foreground">
          {{ t('repository.resourceDetails.noReferences') }}
        </div>
        <button
          v-for="usage in inboundReferences"
          :key="`${usage.noteId}-${usage.reference.start}`"
          type="button"
          class="block w-full rounded-md border px-3 py-2 text-left transition hover:bg-accent"
          @click="$emit('navigate-note', usage.noteId)"
        >
          <div class="truncate text-sm font-medium">{{ usage.noteTitle }}</div>
          <div class="truncate text-xs text-muted-foreground">{{ usage.notePath }}</div>
        </button>
      </div>

      <div class="space-y-2 border-t pt-4">
        <Button variant="destructive" size="sm" @click="$emit('delete-resource')">
          {{ t('repository.resourceDetails.delete') }}
        </Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { Button } from '@dailyuse/ui-vue-shadcn';
import type { ResourceClientDTO } from '@dailyuse/contracts/repository';
import type { ResourceReferenceUsage } from '../../editor/utils/resource-reference-index';
import {
  getResourceCreatedAtText,
  getResourceDisplayName,
  getResourceFormattedSize,
  getResourceUpdatedAtText,
} from '../utils/resource-presentation';

const props = defineProps<{
  resource: ResourceClientDTO | null;
  inboundReferences: ResourceReferenceUsage[];
}>();

defineEmits<{
  'navigate-note': [noteId: string];
  'delete-resource': [];
}>();

const { t } = useI18n();
const isBrokenReferenceTarget = computed(
  () => props.resource != null && props.inboundReferences.some((usage) => usage.reference.isBroken),
);
const resourceDisplayName = computed(() =>
  props.resource ? getResourceDisplayName(props.resource) : '',
);
const resourceFormattedSize = computed(() =>
  props.resource ? getResourceFormattedSize(props.resource) : '-',
);
const resourceCreatedAtText = computed(() =>
  props.resource ? getResourceCreatedAtText(props.resource) : '-',
);
const resourceUpdatedAtText = computed(() =>
  props.resource ? getResourceUpdatedAtText(props.resource) : '-',
);
</script>
