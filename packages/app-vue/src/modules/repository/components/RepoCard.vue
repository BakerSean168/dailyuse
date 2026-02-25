<!--
  RepoCard - Repository card component - shadcn/ui version
-->

<template>
  <Card class="hover:shadow-lg transition-all duration-300 cursor-pointer group">
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

        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button variant="ghost" size="icon" class="h-8 w-8 opacity-0 group-hover:opacity-100">
              <MoreVertical class="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem @click="$emit('settings', repository)">
              <Settings class="mr-2 h-4 w-4" />
              设置
            </DropdownMenuItem>
            <DropdownMenuItem @click="$emit('edit', repository)">
              <Edit3 class="mr-2 h-4 w-4" />
              编辑
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem class="text-destructive" @click="$emit('delete', repository)">
              <Trash2 class="mr-2 h-4 w-4" />
              删除
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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
          <Edit3 class="mr-2 h-4 w-4" />
          编辑
        </Button>
      </div>
    </CardFooter>
  </Card>
</template>

<script setup lang="ts">
import { Folder, MoreVertical, Settings, Edit3, Trash2, Eye, CheckCircle, Archive, XCircle } from 'lucide-vue-next';
import { Button } from '@dailyuse/ui-vue-shadcn';
import { Badge } from '@dailyuse/ui-vue-shadcn';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@dailyuse/ui-vue-shadcn';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@dailyuse/ui-vue-shadcn';
import type { RepositoryClientDTO } from '@dailyuse/contracts/repository';

interface Props {
  repository: RepositoryClientDTO;
}

const emit = defineEmits<{
  'view-details': [repository: RepositoryClientDTO];
  settings: [repository: RepositoryClientDTO];
  edit: [repository: RepositoryClientDTO];
  delete: [repository: RepositoryClientDTO];
}>();

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

const props = defineProps<Props>();
</script>
