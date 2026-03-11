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
        <span class="text-sm font-medium">{{ t('repository.bookmarksPanel.title') }}</span>
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
                {{
                  bookmark.icon?.includes('folder')
                    ? t('repository.bookmarksPanel.folder')
                    : t('repository.bookmarksPanel.file')
                }}
              </div>
            </div>
          </div>
        </ActionableWrapper>
      </div>

      <!-- Empty State -->
      <div v-else class="flex flex-col items-center justify-center h-full px-8 py-12 text-center">
        <Bookmark class="w-16 h-16 mb-4 text-muted-foreground/50" />
        <p class="text-sm text-muted-foreground mb-1">{{ t('repository.bookmarksPanel.empty') }}</p>
        <p class="text-xs text-muted-foreground/60">
          {{ t('repository.bookmarksPanel.emptyHint') }}
        </p>
      </div>
    </div>

    <Dialog v-model:open="renameDialogOpen">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{{ t('repository.bookmarksPanel.renameTitle') }}</DialogTitle>
          <DialogDescription>{{
            t('repository.bookmarksPanel.renameDescription')
          }}</DialogDescription>
        </DialogHeader>

        <Input
          v-model="renameValue"
          :placeholder="t('repository.bookmarksPanel.renamePlaceholder')"
        />

        <DialogFooter>
          <Button variant="outline" @click="renameDialogOpen = false">{{
            t('common.cancel')
          }}</Button>
          <Button @click="confirmRename">{{ t('common.save') }}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { Bookmark, Folder, FileText, Pencil, ArrowUp, ArrowDown, Trash2 } from 'lucide-vue-next';
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
} from '@dailyuse/ui-vue-shadcn';
import { ActionableWrapper, menuLabel } from '../../../components/shared';
import type { MenuAction } from '../../../components/shared';
import type { ResourceBookmarkClientDTO as BookmarkType } from '@dailyuse/contracts/repository';

const props = defineProps<{
  bookmarks: BookmarkType[];
}>();

const { t } = useI18n();
const renameDialogOpen = ref(false);
const renameValue = ref('');
const renameTarget = ref<BookmarkType | null>(null);

const emit = defineEmits<{
  select: [bookmark: BookmarkType];
  rename: [payload: { bookmark: BookmarkType; name: string }];
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
      handler: () => openRenameDialog(bookmark),
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

function openRenameDialog(bookmark: BookmarkType) {
  renameTarget.value = bookmark;
  renameValue.value = bookmark.aliasName ?? '';
  renameDialogOpen.value = true;
}

function confirmRename() {
  if (!renameTarget.value) {
    return;
  }

  emit('rename', {
    bookmark: renameTarget.value,
    name: renameValue.value,
  });
  renameDialogOpen.value = false;
}
</script>
