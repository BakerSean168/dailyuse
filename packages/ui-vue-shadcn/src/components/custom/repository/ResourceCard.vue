<!--
  ResourceCard - Resource card component - shadcn/ui version
-->

<template>
  <Card class="hover:shadow-lg transition-all duration-300 cursor-pointer group">
    <CardHeader class="pb-3">
      <div class="flex items-start justify-between">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg flex items-center justify-center" :class="getIconBgClass()">
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

        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button variant="ghost" size="icon" class="h-8 w-8 opacity-0 group-hover:opacity-100">
              <MoreVertical class="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem @click="$emit('view', resource)">
              <Eye class="mr-2 h-4 w-4" />
              查看
            </DropdownMenuItem>
            <DropdownMenuItem @click="$emit('edit', resource)">
              <Edit3 class="mr-2 h-4 w-4" />
              编辑
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem class="text-destructive" @click="$emit('delete', resource)">
              <Trash2 class="mr-2 h-4 w-4" />
              删除
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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
          <Edit3 class="mr-2 h-4 w-4" />
          编辑
        </Button>
      </div>
    </CardFooter>
  </Card>
</template>

<script setup lang="ts">
import {
  File,
  Image,
  Video,
  Music,
  FileText,
  Link2,
  Code,
  MoreVertical,
  Eye,
  Edit3,
  Trash2,
} from 'lucide-vue-next';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Resource } from '@dailyuse/contracts/repository';

interface Props {
  resource: Resource;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  view: [resource: Resource];
  edit: [resource: Resource];
  delete: [resource: Resource];
}>();

function getResourceIcon() {
  const type = (props.resource as any).type;
  const iconMap: Record<string, any> = {
    IMAGE: Image,
    VIDEO: Video,
    AUDIO: Music,
    PDF: FileText,
    LINK: Link2,
    CODE: Code,
    OTHER: File,
  };
  return iconMap[type] || File;
}

function getIconBgClass(): string {
  const type = (props.resource as any).type;
  const classMap: Record<string, string> = {
    IMAGE: 'bg-green-100 dark:bg-green-900/20',
    VIDEO: 'bg-purple-100 dark:bg-purple-900/20',
    AUDIO: 'bg-orange-100 dark:bg-orange-900/20',
    PDF: 'bg-red-100 dark:bg-red-900/20',
    LINK: 'bg-cyan-100 dark:bg-cyan-900/20',
    CODE: 'bg-blue-100 dark:bg-blue-900/20',
    OTHER: 'bg-gray-100 dark:bg-gray-900/20',
  };
  return classMap[type] || classMap.OTHER;
}

function getIconClass(): string {
  const type = (props.resource as any).type;
  const classMap: Record<string, string> = {
    IMAGE: 'text-green-600 dark:text-green-400',
    VIDEO: 'text-purple-600 dark:text-purple-400',
    AUDIO: 'text-orange-600 dark:text-orange-400',
    PDF: 'text-red-600 dark:text-red-400',
    LINK: 'text-cyan-600 dark:text-cyan-400',
    CODE: 'text-blue-600 dark:text-blue-400',
    OTHER: 'text-gray-600 dark:text-gray-400',
  };
  return classMap[type] || classMap.OTHER;
}

function getTypeVariant(): 'default' | 'secondary' | 'destructive' | 'outline' {
  const type = (props.resource as any).type;
  const variantMap: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    IMAGE: 'default',
    VIDEO: 'secondary',
    AUDIO: 'secondary',
    PDF: 'destructive',
    LINK: 'outline',
    CODE: 'outline',
    OTHER: 'secondary',
  };
  return variantMap[type] || 'secondary';
}

function getTypeLabel(): string {
  const type = (props.resource as any).type;
  const labelMap: Record<string, string> = {
    IMAGE: '图片',
    VIDEO: '视频',
    AUDIO: '音频',
    PDF: 'PDF',
    LINK: '链接',
    CODE: '代码',
    OTHER: '其他',
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
