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
        <div
          v-for="bookmark in bookmarks"
          :key="bookmark.uuid"
          class="group flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent cursor-pointer"
          @click="$emit('select', bookmark)"
        >
          <component :is="getBookmarkIcon(bookmark)" class="w-4 h-4 shrink-0" />
          
          <div class="flex-1 min-w-0">
            <div class="text-sm truncate">{{ bookmark.name }}</div>
            <div class="text-xs text-muted-foreground">
              {{ bookmark.targetType === 'folder' ? '文件夹' : '文件' }}
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <Button
                variant="ghost"
                size="icon"
                class="h-6 w-6 opacity-0 group-hover:opacity-100"
                @click.stop
              >
                <MoreVertical class="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem @click.stop="$emit('rename', bookmark)">
                <Pencil class="mr-2 h-4 w-4" />
                重命名
              </DropdownMenuItem>
              <DropdownMenuItem
                @click.stop="$emit('move-up', bookmark)"
                :disabled="isFirst(bookmark)"
              >
                <ArrowUp class="mr-2 h-4 w-4" />
                上移
              </DropdownMenuItem>
              <DropdownMenuItem
                @click.stop="$emit('move-down', bookmark)"
                :disabled="isLast(bookmark)"
              >
                <ArrowDown class="mr-2 h-4 w-4" />
                下移
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                class="text-destructive"
                @click.stop="$emit('remove', bookmark)"
              >
                <Trash2 class="mr-2 h-4 w-4" />
                删除
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
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
import { computed } from 'vue';
import { Bookmark, Folder, FileText, MoreVertical, Pencil, ArrowUp, ArrowDown, Trash2 } from 'lucide-vue-next';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Bookmark as BookmarkType } from '@dailyuse/contracts/repository';

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
  return bookmark.targetType === 'folder' ? Folder : FileText;
}

function isFirst(bookmark: BookmarkType): boolean {
  return props.bookmarks[0]?.uuid === bookmark.uuid;
}

function isLast(bookmark: BookmarkType): boolean {
  const bookmarks = props.bookmarks;
  return bookmarks[bookmarks.length - 1]?.uuid === bookmark.uuid;
}
</script>
