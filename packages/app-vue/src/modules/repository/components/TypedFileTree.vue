<!--
  TypedFileTree - Type-based fixed resource navigation
  Resources are grouped by type (Notes/Images/Videos/Audio/Files/Other)
  for repository-first authoring instead of user-managed folders.
-->

<template>
  <div class="flex flex-col h-full bg-background">
    <!-- Toolbar -->
    <div class="flex items-center gap-1 px-2 py-2 border-b">
      <Button
        variant="ghost"
        size="icon"
        class="h-8 w-8"
        :title="t('repository.workspace.createNote')"
        :disabled="isLoading"
        @click="$emit('create-note')"
      >
        <FilePlus class="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        class="h-8 w-8"
        :title="t('repository.import.title')"
        @click="$emit('import')"
      >
        <Upload class="h-4 w-4" />
      </Button>

      <div class="flex-1" />

      <Button
        variant="ghost"
        size="icon"
        class="h-8 w-8"
        :disabled="isLoading"
        @click="$emit('refresh')"
      >
        <RefreshCw class="h-4 w-4" :class="{ 'animate-spin': isLoading }" />
      </Button>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-y-auto p-2">
      <!-- Loading -->
      <div
        v-if="isLoading && totalCount === 0"
        class="flex flex-col items-center justify-center h-full gap-4"
      >
        <Loader2 class="w-8 h-8 animate-spin text-muted-foreground" />
        <span class="text-sm text-muted-foreground"
          >{{ t('repository.workspace.noFiles') }}...</span
        >
      </div>

      <!-- Empty -->
      <div
        v-else-if="!isLoading && totalCount === 0"
        class="flex flex-col items-center justify-center h-full gap-4 text-center px-4"
      >
        <FolderOpen class="w-12 h-12 text-muted-foreground/50" />
        <span class="text-sm text-muted-foreground">{{ t('repository.workspace.noFiles') }}</span>
        <span class="text-xs text-muted-foreground">{{
          t('repository.workspace.noFilesDesc')
        }}</span>
        <div class="flex gap-2">
          <Button size="sm" variant="outline" @click="$emit('create-note')">
            <FilePlus class="mr-2 h-4 w-4" />
            {{ t('repository.workspace.createNote') }}
          </Button>
          <Button size="sm" variant="outline" @click="$emit('import')">
            <Upload class="mr-2 h-4 w-4" />
            {{ t('repository.import.title') }}
          </Button>
        </div>
      </div>

      <!-- Type Groups -->
      <div v-else class="space-y-0.5">
        <div v-for="group in typeGroups" :key="group.key">
          <!-- Group Header -->
          <ActionableWrapper
            :actions="getGroupActions(group.key)"
            :show-more-button="false"
            wrapper-class="w-full"
          >
            <div
              class="flex w-full items-center gap-1 px-2 py-1.5 rounded-md hover:bg-accent cursor-pointer group"
              @click="toggleGroup(group.key)"
            >
              <Button variant="ghost" size="icon" class="h-5 w-5 shrink-0 p-0">
                <ChevronRight
                  class="h-4 w-4 transition-transform"
                  :class="{ 'rotate-90': expandedGroups.has(group.key) }"
                />
              </Button>
              <component :is="group.icon" class="h-4 w-4 shrink-0" :class="group.iconClass" />
              <span class="text-sm font-medium flex-1">{{ group.label }}</span>
              <Badge v-if="group.count > 0" variant="secondary" class="text-xs h-5 px-1.5">
                {{ group.count }}
              </Badge>
            </div>
          </ActionableWrapper>

          <!-- Group Children (resources) -->
          <Transition
            enter-active-class="transition-all duration-150 ease-out"
            leave-active-class="transition-all duration-100 ease-in"
            enter-from-class="opacity-0 max-h-0"
            enter-to-class="opacity-100 max-h-[2000px]"
            leave-from-class="opacity-100"
            leave-to-class="opacity-0 max-h-0"
          >
            <div v-show="expandedGroups.has(group.key)" class="ml-4">
              <ActionableWrapper
                v-for="resource in group.resources"
                :key="resource.id"
                :actions="getResourceActions(resource)"
                :show-more-button="false"
                wrapper-class="w-full"
              >
                <div
                  class="flex w-full min-w-0 items-center gap-1 px-2 py-1.5 rounded-md hover:bg-accent cursor-pointer group"
                  :class="{ 'bg-accent': selectedId === resource.id }"
                  @click="$emit('open', resource)"
                  @dblclick.stop="$emit('open', resource)"
                >
                  <span class="w-5 shrink-0" />
                  <component
                    :is="getFileIcon(resource)"
                    class="h-4 w-4 shrink-0"
                    :class="getFileIconClass(resource)"
                  />
                  <span class="text-sm truncate flex-1" :title="resource.path">{{
                    getResourceDisplayName(resource)
                  }}</span>
                  <span
                    v-if="resource.metadata?.tags?.length"
                    class="text-xs text-muted-foreground shrink-0"
                  >
                    <Tag class="h-3 w-3 inline" />
                    {{ resource.metadata.tags.length }}
                  </span>
                </div>
              </ActionableWrapper>
              <div
                v-if="group.resources.length === 0"
                class="px-2 py-2 ml-5 text-xs text-muted-foreground italic"
              >
                {{ t('repository.workspace.noFiles') }}
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  BookOpen,
  FolderOpen,
  FilePlus,
  Pencil,
  Upload,
  RefreshCw,
  Loader2,
  ChevronRight,
  FileText,
  FileImage,
  FileVideo,
  FileAudio,
  FileIcon,
  File,
  Tag,
  Trash2,
} from 'lucide-vue-next';
import { Button, Badge } from '@dailyuse/ui-vue-shadcn';
import { ActionableWrapper, menuLabel } from '../../../components/shared';
import type { MenuAction } from '../../../components/shared';
import type { ResourceClientDTO, TreeNode } from '@dailyuse/contracts/repository';
import { findNotesFolderId } from '../utils/note-folder';
import { getResourceDisplayName } from '../utils/resource-presentation';

const props = withDefaults(
  defineProps<{
    resourcesByType: Record<string, ResourceClientDTO[]>;
    treeNodes?: TreeNode[];
    isLoading?: boolean;
    selectedId?: string | null;
  }>(),
  {
    isLoading: false,
    selectedId: null,
  },
);

const emit = defineEmits<{
  'create-note': [];
  import: [];
  refresh: [];
  open: [resource: ResourceClientDTO];
  rename: [resource: ResourceClientDTO];
  delete: [resource: ResourceClientDTO];
}>();

const { t } = useI18n();

const expandedGroups = ref(new Set<string>(['notes']));

const rootNoteFolderId = computed(() => findNotesFolderId(props.treeNodes ?? []));

const totalCount = computed(() =>
  Object.values(props.resourcesByType).reduce((sum, arr) => sum + arr.length, 0),
);

const typeGroups = computed(() => [
  {
    key: 'notes',
    label: t('repository.fileTypes.notes'),
    icon: FileText,
    iconClass: 'text-info',
    resources: props.resourcesByType.notes || [],
    count: (props.resourcesByType.notes || []).length,
  },
  {
    key: 'images',
    label: t('repository.fileTypes.images'),
    icon: FileImage,
    iconClass: 'text-purple-500',
    resources: props.resourcesByType.images || [],
    count: (props.resourcesByType.images || []).length,
  },
  {
    key: 'videos',
    label: t('repository.fileTypes.videos'),
    icon: FileVideo,
    iconClass: 'text-destructive',
    resources: props.resourcesByType.videos || [],
    count: (props.resourcesByType.videos || []).length,
  },
  {
    key: 'audio',
    label: t('repository.fileTypes.audio'),
    icon: FileAudio,
    iconClass: 'text-success',
    resources: props.resourcesByType.audio || [],
    count: (props.resourcesByType.audio || []).length,
  },
  {
    key: 'files',
    label: t('repository.fileTypes.files'),
    icon: FileIcon,
    iconClass: 'text-warning',
    resources: props.resourcesByType.files || [],
    count: (props.resourcesByType.files || []).length,
  },
  {
    key: 'other',
    label: t('repository.fileTypes.other'),
    icon: File,
    iconClass: 'text-muted-foreground',
    resources: props.resourcesByType.other || [],
    count: (props.resourcesByType.other || []).length,
  },
]);

function toggleGroup(key: string) {
  if (expandedGroups.value.has(key)) {
    expandedGroups.value.delete(key);
  } else {
    expandedGroups.value.add(key);
  }
}

function getResourceActions(resource: ResourceClientDTO): MenuAction[] {
  return [
    {
      key: 'open',
      label: menuLabel('open'),
      icon: BookOpen,
      handler: () => emit('open', resource),
    },
    {
      key: 'rename',
      label: menuLabel('rename'),
      icon: Pencil,
      handler: () => emit('rename', resource),
    },
    {
      key: 'delete',
      label: menuLabel('delete'),
      icon: Trash2,
      destructive: true,
      separator: true,
      handler: () => emit('delete', resource),
    },
  ];
}

function getGroupActions(groupKey: string): MenuAction[] {
  if (groupKey === 'notes') {
    return [
      {
        key: 'create-note',
        label: t('repository.workspace.createNote'),
        icon: FilePlus,
        handler: () => emit('create-note'),
      },
      {
        key: 'refresh',
        label: t('common.retry'),
        icon: RefreshCw,
        handler: () => emit('refresh'),
      },
    ];
  }

  return [
    {
      key: 'import',
      label: t('repository.import.title'),
      icon: Upload,
      handler: () => emit('import'),
    },
    {
      key: 'refresh',
      label: t('common.retry'),
      icon: RefreshCw,
      handler: () => emit('refresh'),
    },
  ];
}

function getFileIcon(resource: ResourceClientDTO) {
  const ext = resource.extension?.toLowerCase();
  const iconMap: Record<string, any> = {
    '.md': FileText,
    '.txt': FileText,
    '.png': FileImage,
    '.jpg': FileImage,
    '.jpeg': FileImage,
    '.gif': FileImage,
    '.svg': FileImage,
    '.webp': FileImage,
    '.mp4': FileVideo,
    '.webm': FileVideo,
    '.mov': FileVideo,
    '.mp3': FileAudio,
    '.wav': FileAudio,
    '.ogg': FileAudio,
    '.flac': FileAudio,
  };
  return iconMap[ext || ''] || File;
}

function getFileIconClass(resource: ResourceClientDTO) {
  const mime = resource.mimeType || '';
  if (mime.startsWith('text/markdown') || resource.extension === '.md') return 'text-info';
  if (mime.startsWith('image/')) return 'text-purple-500';
  if (mime.startsWith('video/')) return 'text-destructive';
  if (mime.startsWith('audio/')) return 'text-success';
  return 'text-muted-foreground';
}
</script>
