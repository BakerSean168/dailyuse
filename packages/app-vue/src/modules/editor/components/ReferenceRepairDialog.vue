<template>
  <Dialog :open="open" @update:open="handleOpenChange">
    <DialogContent class="sm:max-w-3xl">
      <DialogHeader>
        <DialogTitle>{{ t('editor.diagnostics.repairTitle') }}</DialogTitle>
        <DialogDescription>
          {{ t('editor.diagnostics.repairDescription') }}
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-4">
        <div v-if="reference" class="rounded-lg border bg-muted/20 p-3 text-sm">
          <div class="font-medium text-destructive">{{ reference.destination }}</div>
          <div class="mt-1 break-all text-xs text-muted-foreground">{{ reference.raw }}</div>
        </div>

        <div class="rounded-lg border bg-muted/10 px-3 py-3 text-sm">
          <div class="font-medium">
            {{ t(`editor.diagnostics.repairKindTitle.${candidateKind}`) }}
          </div>
          <div class="mt-1 text-xs text-muted-foreground">
            {{ t(`editor.diagnostics.repairKindDescription.${candidateKind}`) }}
          </div>
        </div>

        <Input
          ref="searchInputRef"
          v-model="query"
          :placeholder="t('editor.diagnostics.repairSearchPlaceholder')"
        />

        <div class="rounded-lg border bg-muted/10 px-3 py-2 text-xs text-muted-foreground">
          {{ t('editor.diagnostics.candidateCount', { count: filteredCandidates.length }) }}
        </div>

        <ScrollArea class="max-h-[420px] rounded-md border">
          <div
            v-if="filteredCandidates.length === 0"
            class="px-4 py-8 text-center text-sm text-muted-foreground"
          >
            {{ emptyMessage }}
          </div>

          <div v-else class="divide-y">
            <button
              v-for="candidate in filteredCandidates"
              :key="candidate.id"
              type="button"
              class="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-accent"
              @click="selectCandidate(candidate)"
            >
              <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted">
                <component :is="getKindIcon(candidateKind)" class="h-4 w-4 text-muted-foreground" />
              </div>
              <div class="min-w-0 flex-1">
                <div class="truncate text-sm font-medium">
                  {{ getResourceDisplayName(candidate) }}
                </div>
                <div class="truncate text-xs text-muted-foreground">{{ candidate.path }}</div>
              </div>
            </button>
          </div>
        </ScrollArea>
      </div>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Input,
  ScrollArea,
} from '@dailyuse/ui-vue-shadcn';
import { getResourceDisplayName } from '../../repository/utils/resource-presentation';
import { File, FileImage } from 'lucide-vue-next';
import type { ResourceClientDTO } from '@dailyuse/contracts/repository';
import type { ResolvedMarkdownResourceReference } from '../utils/markdown-resource-references';

const props = withDefaults(
  defineProps<{
    open: boolean;
    reference: ResolvedMarkdownResourceReference | null;
    candidates: ResourceClientDTO[];
  }>(),
  {
    open: false,
  },
);

const emit = defineEmits<{
  'update:open': [value: boolean];
  select: [resource: ResourceClientDTO];
}>();

const { t } = useI18n();
const query = ref('');
const searchInputRef = ref<HTMLInputElement | null>(null);

const candidateKind = computed(() => (props.reference?.kind === 'image' ? 'image' : 'other'));
const filteredCandidates = computed(() => {
  const normalizedQuery = query.value.trim().toLowerCase();

  return props.candidates.filter((candidate) => {
    if (!normalizedQuery) {
      return true;
    }

    return [getResourceDisplayName(candidate), candidate.name, candidate.path]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .includes(normalizedQuery);
  });
});
const emptyMessage = computed(() => {
  if (props.candidates.length === 0) {
    return t(`editor.diagnostics.noReplacementForKind.${candidateKind.value}`);
  }

  return t('editor.diagnostics.noReplacementSearchMatch');
});

watch(
  () => props.open,
  (isOpen) => {
    if (!isOpen) {
      return;
    }

    query.value = '';
    requestAnimationFrame(() => {
      searchInputRef.value?.focus();
    });
  },
);

function handleOpenChange(value: boolean) {
  emit('update:open', value);
}

function selectCandidate(resource: ResourceClientDTO) {
  emit('select', resource);
  emit('update:open', false);
}

function getKindIcon(kind: 'image' | 'other') {
  return kind === 'image' ? FileImage : File;
}
</script>
