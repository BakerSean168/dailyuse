<template>
  <div class="flex flex-col h-full">
    <!-- Resource items -->
    <div class="flex-1 overflow-y-auto">
      <div
        v-for="resource in resources"
        :key="resource.uuid"
        class="flex items-center gap-3 px-4 py-2 border-b border-border hover:bg-accent cursor-pointer transition-colors"
        :class="{ 'bg-accent': resource.uuid === selectedUuid }"
        @click="$emit('select', resource)"
        @dblclick="$emit('open', resource)"
        @contextmenu.prevent="$emit('contextmenu', $event, resource)"
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

        <!-- Actions menu -->
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button variant="ghost" size="icon-sm" @click.stop>
              <MoreVertical class="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem @select="$emit('open', resource)">
              <ExternalLink class="mr-2 h-4 w-4" />
              在新标签页打开
            </DropdownMenuItem>
            <DropdownMenuItem @select="$emit('rename', resource)">
              <Pencil class="mr-2 h-4 w-4" />
              重命名
            </DropdownMenuItem>
            <DropdownMenuItem @select="$emit('move', resource)">
              <FolderInput class="mr-2 h-4 w-4" />
              移动
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem @select="$emit('bookmark', resource)">
              <Bookmark class="mr-2 h-4 w-4" />
              {{ hasBookmark(resource.uuid) ? '已添加书签' : '添加到书签' }}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem class="text-destructive" @select="$emit('delete', resource)">
              <Trash2 class="mr-2 h-4 w-4" />
              删除
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <!-- Empty state -->
      <div v-if="resources.length === 0" class="flex flex-col items-center justify-center p-8 text-center">
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
  MoreVertical,
  ExternalLink,
  Pencil,
  FolderInput,
  Bookmark,
  Trash2,
} from 'lucide-vue-next';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { ResourceClientDTO } from '@dailyuse/contracts/repository';

interface Props {
  resources: ResourceClientDTO[];
  selectedUuid?: string;
  bookmarkedUuids?: string[];
}

defineProps<Props>();

const emit = defineEmits<{
  select: [resource: ResourceClientDTO];
  open: [resource: ResourceClientDTO];
  rename: [resource: ResourceClientDTO];
  move: [resource: ResourceClientDTO];
  bookmark: [resource: ResourceClientDTO];
  delete: [resource: ResourceClientDTO];
  contextmenu: [event: MouseEvent, resource: ResourceClientDTO];
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

function hasBookmark(uuid: string): boolean {
  return false; // Implement via props
}
</script>
