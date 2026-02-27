<template>
  <div class="flex flex-col h-full">
    <!-- Resource items -->
    <div class="flex-1 overflow-y-auto">
      <ActionableWrapper
        v-for="resource in resources"
        :key="resource.id"
        :actions="getResourceActions(resource)"
        :show-more-button="false"
      >
        <div
          class="flex items-center gap-3 px-4 py-2 border-b border-border hover:bg-accent cursor-pointer transition-colors"
          :class="{ 'bg-accent': resource.id === selectedId }"
          @click="$emit('select', resource)"
          @dblclick="$emit('open', resource)"
        >
          <!-- Icon -->
          <component :is="getResourceIcon(resource.type)" class="h-4 w-4 shrink-0" />

          <!-- Content -->
          <div class="flex-1 min-w-0">
            <div class="text-sm font-medium truncate">{{ resource.name }}</div>
            <div v-if="resource.metadata?.wordCount" class="text-xs text-muted-foreground">
              {{ resource.metadata.wordCount }} 字
            </div>
          </div>
        </div>
      </ActionableWrapper>

      <!-- Empty state -->
      <div
        v-if="resources.length === 0"
        class="flex flex-col items-center justify-center p-8 text-center"
      >
        <FileText class="h-8 w-8 mb-2 text-muted-foreground" />
        <span class="text-sm text-muted-foreground">暂无资源</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  FileText,
  Image,
  Music,
  Video,
  FileCode,
  Link,
  File,
  ExternalLink,
  Pencil,
  FolderInput,
  Bookmark,
  Trash2,
} from 'lucide-vue-next';
import { ActionableWrapper, menuLabel } from '../../../components/shared';
import type { MenuAction } from '../../../components/shared';
import type { ResourceClientDTO } from '@dailyuse/contracts/repository';

interface Props {
  resources: ResourceClientDTO[];
  selectedId?: string;
  bookmarkedIds?: string[];
}

const props = withDefaults(defineProps<Props>(), {
  bookmarkedIds: () => [],
});

const emit = defineEmits<{
  select: [resource: ResourceClientDTO];
  open: [resource: ResourceClientDTO];
  rename: [resource: ResourceClientDTO];
  move: [resource: ResourceClientDTO];
  bookmark: [resource: ResourceClientDTO];
  delete: [resource: ResourceClientDTO];
}>();

function getResourceIcon(type: string) {
  const iconMap: Record<string, any> = {
    MARKDOWN: FileText,
    IMAGE: Image,
    VIDEO: Video,
    AUDIO: Music,
    PDF: FileText,
    LINK: Link,
    CODE: FileCode,
    OTHER: File,
  };
  return iconMap[type] || File;
}

function hasBookmark(id: string): boolean {
  return props.bookmarkedIds.includes(id);
}

function getResourceActions(resource: ResourceClientDTO): MenuAction[] {
  return [
    {
      key: 'open',
      label: menuLabel('openInNewTab'),
      icon: ExternalLink,
      handler: () => emit('open', resource),
    },
    {
      key: 'rename',
      label: menuLabel('rename'),
      icon: Pencil,
      handler: () => emit('rename', resource),
    },
    {
      key: 'move',
      label: menuLabel('move'),
      icon: FolderInput,
      handler: () => emit('move', resource),
    },
    {
      key: 'bookmark',
      label: hasBookmark(resource.id) ? menuLabel('removeBookmark') : menuLabel('addBookmark'),
      icon: Bookmark,
      separator: true,
      handler: () => emit('bookmark', resource),
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
</script>
