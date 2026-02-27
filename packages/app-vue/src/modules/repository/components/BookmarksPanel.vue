<!--
  Bookmarks Panel Component - shadcn/ui version
  Story 11.4: Bookmarks 功能
-->

<template>
  <div class="flex flex-col h-full">
    <!-- Header -->
    <div class="flex items-center justify-between px-3 py-2 border-b">
      <div class="flex items-center gap-2">
        <Bookmark class="w-4 h-4" />
        <span class="text-sm font-medium">书签</span>
        <Badge v-if="bookmarks.length > 0" variant="secondary" class="text-xs">
          {{ bookmarks.length }}
        </Badge>
      </div>
    </div>

    <!-- Bookmarks List -->
    <div class="flex-1 overflow-y-auto">
      <div v-if="bookmarks.length > 0" class="p-2 space-y-1">
        <ActionableWrapper
          v-for="(bookmark, index) in bookmarks"
          :key="bookmark.id"
          :actions="getBookmarkActions(bookmark, index)"
          :show-more-button="false"
        >
          <div
            class="group flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent cursor-pointer"
            @click="$emit('select', bookmark)"
          >
            <component :is="getBookmarkIcon(bookmark)" class="w-4 h-4 shrink-0" />

            <div class="flex-1 min-w-0">
              <div class="text-sm truncate">{{ bookmark.displayName }}</div>
              <div class="text-xs text-muted-foreground">
                {{ bookmark.icon?.includes('folder') ? '文件夹' : '文件' }}
              </div>
            </div>
          </div>
        </ActionableWrapper>
      </div>

      <!-- Empty State -->
      <div v-else class="flex flex-col items-center justify-center h-full px-8 py-12 text-center">
        <Bookmark class="w-16 h-16 mb-4 text-muted-foreground/50" />
        <p class="text-sm text-muted-foreground mb-1">暂无书签</p>
        <p class="text-xs text-muted-foreground/60">右键文件或文件夹选择"添加书签"</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Bookmark, Folder, FileText, Pencil, ArrowUp, ArrowDown, Trash2 } from 'lucide-vue-next';
import { Badge } from '@dailyuse/ui-vue-shadcn';
import { ActionableWrapper, menuLabel } from '../../../components/shared';
import type { MenuAction } from '../../../components/shared';
import type { ResourceBookmarkClientDTO as BookmarkType } from '@dailyuse/contracts/repository';

interface Props {
  bookmarks: BookmarkType[];
}

const props = defineProps<Props>();

const emit = defineEmits<{
  select: [bookmark: BookmarkType];
  rename: [bookmark: BookmarkType];
  'move-up': [bookmark: BookmarkType];
  'move-down': [bookmark: BookmarkType];
  remove: [bookmark: BookmarkType];
}>();

function getBookmarkIcon(bookmark: BookmarkType) {
  if (bookmark.icon) {
    // Map material icons to lucide
    if (bookmark.icon.includes('folder')) return Folder;
    if (bookmark.icon.includes('file')) return FileText;
  }
  return FileText;
}

function getBookmarkActions(bookmark: BookmarkType, index: number): MenuAction[] {
  return [
    {
      key: 'rename',
      label: menuLabel('rename'),
      icon: Pencil,
      handler: () => emit('rename', bookmark),
    },
    {
      key: 'move-up',
      label: menuLabel('moveUp'),
      icon: ArrowUp,
      disabled: index === 0,
      handler: () => emit('move-up', bookmark),
    },
    {
      key: 'move-down',
      label: menuLabel('moveDown'),
      icon: ArrowDown,
      disabled: index === props.bookmarks.length - 1,
      handler: () => emit('move-down', bookmark),
    },
    {
      key: 'delete',
      label: menuLabel('delete'),
      icon: Trash2,
      destructive: true,
      separator: true,
      handler: () => emit('remove', bookmark),
    },
  ];
}
</script>
