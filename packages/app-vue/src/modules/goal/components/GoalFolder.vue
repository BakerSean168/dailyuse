<template>
  <div class="flex flex-col gap-1">
    <!-- Header with Add Button -->
    <div class="flex items-center justify-between px-2 py-1.5 mb-2">
      <span class="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
        >Folders</span
      >
      <Button variant="ghost" size="icon" class="h-5 w-5 hover:bg-muted" @click="emit('create')">
        <Plus class="h-3 w-3" />
      </Button>
    </div>

    <!-- All Goals -->
    <Button
      variant="ghost"
      :class="
        cn(
          'w-full justify-start gap-2 px-2 h-9 font-normal',
          selectedFolderId === 'all' && 'bg-secondary text-foreground font-medium',
        )
      "
      @click="selectFolder('all')"
    >
      <LayoutGrid class="h-4 w-4 text-muted-foreground" />
      <span class="flex-1 text-left">All Goals</span>
      <Badge
        variant="secondary"
        class="ml-auto text-[10px] h-5 px-1.5 min-w-[20px] justify-center bg-muted text-muted-foreground"
      >
        12
      </Badge>
    </Button>

    <!-- Dynamic Folders -->
    <ActionableWrapper
      v-for="folder in goalFolders"
      :key="folder.id"
      :actions="getFolderActions(folder)"
      :show-more-button="false"
    >
      <Button
        variant="ghost"
        :class="
          cn(
            'w-full justify-start gap-2 px-2 h-9 font-normal',
            selectedFolderId === folder.id && 'bg-secondary text-foreground font-medium',
          )
        "
        @click="selectFolder(folder.id)"
      >
        <Folder class="h-4 w-4 text-muted-foreground" />
        <span class="flex-1 text-left truncate">{{ folder.name }}</span>
        <Badge
          v-if="folder.count"
          variant="secondary"
          class="ml-auto text-[10px] h-5 px-1.5 min-w-[20px] justify-center bg-muted text-muted-foreground"
        >
          {{ folder.count }}
        </Badge>
      </Button>
    </ActionableWrapper>

    <!-- Archived -->
    <Button
      variant="ghost"
      :class="
        cn(
          'w-full justify-start gap-2 px-2 h-9 font-normal mt-1',
          selectedFolderId === 'archived' && 'bg-secondary text-foreground font-medium',
        )
      "
      @click="selectFolder('archived')"
    >
      <Archive class="h-4 w-4 text-muted-foreground" />
      <span class="flex-1 text-left">Archived</span>
    </Button>
  </div>
</template>

<script setup lang="ts">
import { Button } from '@dailyuse/ui-vue-shadcn';
import { Badge } from '@dailyuse/ui-vue-shadcn';
import { Plus, LayoutGrid, Folder, Archive, Pencil, Trash2 } from 'lucide-vue-next';
import { cn } from '@dailyuse/ui-vue-shadcn';
import { ActionableWrapper, menuLabel } from '../../../components/shared';
import type { MenuAction } from '../../../components/shared';

const props = defineProps<{
  goalFolders: any[];
  selectedFolderId: string;
}>();

const emit = defineEmits<{
  select: [id: string];
  create: [];
  edit: [folder: any];
  delete: [id: string];
}>();

const selectFolder = (id: string) => {
  emit('select', id);
};

function getFolderActions(folder: any): MenuAction[] {
  return [
    {
      key: 'edit',
      label: menuLabel('editFolder'),
      icon: Pencil,
      handler: () => emit('edit', folder),
    },
    {
      key: 'delete',
      label: menuLabel('deleteFolder'),
      icon: Trash2,
      destructive: true,
      separator: true,
      handler: () => emit('delete', folder.id),
    },
  ];
}
</script>
