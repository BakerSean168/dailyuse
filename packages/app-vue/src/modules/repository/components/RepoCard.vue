<!--
  RepoCard - Repository card component - shadcn/ui version
-->

<template>
  <ActionableWrapper :actions="menuActions">
    <Card class="hover:shadow-lg transition-all duration-300 cursor-pointer">
      <CardHeader class="pb-3">
        <div class="flex items-start justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Folder class="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle class="text-lg mb-1">{{ repository.name }}</CardTitle>
              <Badge :variant="getStatusVariant()">
                <component :is="getStatusIcon()" class="mr-1 h-3 w-3" />
                {{ getStatusText() }}
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent class="pb-3">
        <p v-if="repository.description" class="text-sm text-muted-foreground mb-3">
          {{ repository.description }}
        </p>

        <div class="flex items-center justify-between text-xs text-muted-foreground">
          <Badge variant="outline">{{ repository.type }}</Badge>
          <span>更新于 {{ formatDate(repository.updatedAt) }}</span>
        </div>
      </CardContent>

      <CardFooter class="pt-3 border-t bg-muted/30">
        <div class="flex gap-2 ml-auto">
          <Button variant="ghost" size="sm" @click.stop="$emit('view-details', repository)">
            <Eye class="mr-2 h-4 w-4" />
            查看详情
          </Button>
          <Button variant="ghost" size="sm" @click.stop="$emit('edit', repository)">
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
  Folder,
  Settings,
  Pencil,
  Trash2,
  Eye,
  CheckCircle,
  Archive,
  XCircle,
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
import type { RepositoryClientDTO } from '@dailyuse/contracts/repository';

interface Props {
  repository: RepositoryClientDTO;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'view-details': [repository: RepositoryClientDTO];
  settings: [repository: RepositoryClientDTO];
  edit: [repository: RepositoryClientDTO];
  delete: [repository: RepositoryClientDTO];
}>();

const menuActions = computed<MenuAction[]>(() => [
  {
    key: 'settings',
    label: menuLabel('settings'),
    icon: Settings,
    handler: () => emit('settings', props.repository),
  },
  {
    key: 'edit',
    label: menuLabel('edit'),
    icon: Pencil,
    handler: () => emit('edit', props.repository),
  },
  {
    key: 'delete',
    label: menuLabel('delete'),
    icon: Trash2,
    destructive: true,
    separator: true,
    handler: () => emit('delete', props.repository),
  },
]);

function getStatusVariant(): 'default' | 'secondary' | 'destructive' | 'outline' {
  const status = (props.repository as any).status;
  const map: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    ACTIVE: 'default',
    ARCHIVED: 'secondary',
    DELETED: 'destructive',
  };
  return map[status] || 'outline';
}

function getStatusIcon() {
  const status = (props.repository as any).status;
  const iconMap: Record<string, any> = {
    ACTIVE: CheckCircle,
    ARCHIVED: Archive,
    DELETED: XCircle,
  };
  return iconMap[status] || CheckCircle;
}

function getStatusText(): string {
  const status = (props.repository as any).status;
  const textMap: Record<string, string> = {
    ACTIVE: '活跃',
    ARCHIVED: '已归档',
    DELETED: '已删除',
  };
  return textMap[status] || status;
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('zh-CN');
}
</script>
