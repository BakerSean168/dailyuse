<!--
  ResourceCard - Resource card component - shadcn/ui version
-->

<template>
  <ActionableWrapper :actions="menuActions">
    <Card class="hover:shadow-lg transition-all duration-300 cursor-pointer">
      <CardHeader class="pb-3">
        <div class="flex items-start justify-between">
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-lg flex items-center justify-center"
              :class="getIconBgClass()"
            >
              <component :is="getResourceIcon()" class="h-5 w-5" :class="getIconClass()" />
            </div>
            <div>
              <CardTitle class="text-lg mb-1">{{ resource.name }}</CardTitle>
              <Badge :variant="getTypeVariant()">
                <component :is="getResourceIcon()" class="mr-1 h-3 w-3" />
                {{ getTypeLabel() }}
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent class="pb-3">
        <div class="flex items-center gap-4 text-xs text-muted-foreground">
          <Badge variant="outline">
            <File class="mr-1 h-3 w-3" />
            {{ formatFileSize(resource.size) }}
          </Badge>
          <span>创建于 {{ formatDate(resource.createdAt) }}</span>
        </div>
      </CardContent>

      <CardFooter class="pt-3 border-t bg-muted/30">
        <div class="flex gap-2 ml-auto">
          <Button variant="ghost" size="sm" @click.stop="$emit('view', resource)">
            <Eye class="mr-2 h-4 w-4" />
            查看
          </Button>
          <Button variant="ghost" size="sm" @click.stop="$emit('edit', resource)">
            <Pencil class="mr-2 h-4 w-4" />
            编辑
          </Button>
        </div>
      </CardFooter>
    </Card>
  </ActionableWrapper>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import {
  File,
  FileText,
  Eye,
  Pencil,
  Trash2,
} from 'lucide-vue-next';
import {
  Button,
  Badge,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@dailyuse/ui-vue-shadcn';
import { ActionableWrapper, menuLabel } from '../../../components/shared';
import type { MenuAction } from '../../../components/shared';
import type { ResourceClientDTO } from '@dailyuse/contracts/repository';

const props = defineProps<{
  resource: ResourceClientDTO;
}>();

const emit = defineEmits<{
  view: [resource: ResourceClientDTO];
  edit: [resource: ResourceClientDTO];
  delete: [resource: ResourceClientDTO];
}>();

const menuActions = computed<MenuAction[]>(() => [
  {
    key: 'view',
    label: menuLabel('view'),
    icon: Eye,
    handler: () => emit('view', props.resource),
  },
  {
    key: 'edit',
    label: menuLabel('edit'),
    icon: Pencil,
    handler: () => emit('edit', props.resource),
  },
  {
    key: 'delete',
    label: menuLabel('delete'),
    icon: Trash2,
    destructive: true,
    separator: true,
    handler: () => emit('delete', props.resource),
  },
]);

function getResourceIcon() {
  const type = props.resource.type;
  const iconMap: Record<string, unknown> = {
    File: FileText,
    Folder: File,
  };
  return iconMap[type] || File;
}

function getIconBgClass(): string {
  const type = props.resource.type;
  const classMap: Record<string, string> = {
    File: 'bg-info/15 dark:bg-info/20',
    Folder: 'bg-muted dark:bg-muted/20',
  };
  return classMap[type] || 'bg-muted dark:bg-muted/20';
}

function getIconClass(): string {
  const type = props.resource.type;
  const classMap: Record<string, string> = {
    File: 'text-info dark:text-info',
    Folder: 'text-muted-foreground dark:text-muted-foreground',
  };
  return classMap[type] || 'text-muted-foreground dark:text-muted-foreground';
}

function getTypeVariant(): 'default' | 'secondary' | 'destructive' | 'outline' {
  const type = props.resource.type;
  const variantMap: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    File: 'default',
    Folder: 'secondary',
  };
  return variantMap[type] || 'secondary';
}

function getTypeLabel(): string {
  const type = props.resource.type;
  const labelMap: Record<string, string> = {
    File: '文件',
    Folder: '文件夹',
  };
  return labelMap[type] || '未知';
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('zh-CN');
}
</script>
