<!--
  ResourcesPanel - Resource management panel - shadcn/ui version
  Displays all non-note resources (images, audio, video, etc.)
-->

<template>
  <div class="flex flex-col h-full">
    <!-- Toolbar -->
    <div class="flex items-center gap-2 px-2 py-2 border-b">
      <div class="relative flex-1 max-w-xs">
        <Search class="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          v-model="searchQuery"
          placeholder="搜索资源..."
          class="pl-8 h-8"
        />
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <Button variant="ghost" size="icon" class="h-8 w-8">
            <Filter class="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuCheckboxItem
            v-for="type in resourceTypes"
            :key="type.value"
            :checked="selectedTypes.includes(type.value)"
            @select="toggleTypeFilter(type.value)"
          >
            <component :is="type.icon" class="mr-2 h-4 w-4" />
            {{ type.label }}
          </DropdownMenuCheckboxItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem @click="clearFilters">清除过滤</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Button
        variant="ghost"
        size="icon"
        class="h-8 w-8"
        @click="toggleDisplayMode"
      >
        <component :is="displayMode === 'grid' ? List : Grid3x3" class="h-4 w-4" />
      </Button>

      <Button variant="ghost" size="icon" class="h-8 w-8" @click="$emit('upload')">
        <Upload class="h-4 w-4" />
      </Button>

      <Button variant="ghost" size="icon" class="h-8 w-8" :disabled="isLoading" @click="$emit('refresh')">
        <RefreshCw class="h-4 w-4" :class="{ 'animate-spin': isLoading }" />
      </Button>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-y-auto p-2">
      <!-- Empty State -->
      <div v-if="!repositoryId" class="flex flex-col items-center justify-center h-full text-center px-4">
        <FolderOff class="w-12 h-12 mb-2 text-muted-foreground/50" />
        <span class="text-sm text-muted-foreground">请先选择仓储</span>
      </div>

      <!-- Loading -->
      <div v-else-if="isLoading && filteredResources.length === 0" class="flex items-center justify-center h-full">
        <Loader2 class="w-8 h-8 animate-spin text-muted-foreground" />
      </div>

      <!-- No Resources -->
      <div v-else-if="filteredResources.length === 0" class="flex flex-col items-center justify-center h-full text-center px-4">
        <ImageOff class="w-12 h-12 mb-2 text-muted-foreground/50" />
        <span class="text-sm text-muted-foreground mb-1">暂无资源文件</span>
        <span class="text-xs text-muted-foreground/60 mb-3">上传图片、音频、视频等文件</span>
        <Button size="sm" @click="$emit('upload')">
          <Upload class="mr-2 h-4 w-4" />
          上传资源
        </Button>
      </div>

      <!-- Grid View -->
      <div v-else-if="displayMode === 'grid'" class="grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-2">
        <div
          v-for="resource in filteredResources"
          :key="resource.id"
          class="flex flex-col items-center p-2 rounded-lg hover:bg-accent cursor-pointer transition-colors group"
          @click="$emit('preview', resource)"
          @contextmenu.prevent="handleContextMenu($event, resource)"
        >
          <div class="w-16 h-16 flex items-center justify-center bg-muted rounded-lg mb-2 overflow-hidden">
            <component
              v-if="!isImageType(resource.type)"
              :is="getResourceIcon(resource.type)"
              class="w-8 h-8 text-muted-foreground"
            />
            <img
              v-else
              :src="getResourceUrl(resource)"
              :alt="resource.name"
              class="w-full h-full object-cover"
            />
          </div>
          <span class="text-xs truncate max-w-full text-center">{{ resource.name }}</span>
          <Badge :variant="getResourceVariant(resource.type)" class="text-[10px] mt-1">
            {{ getResourceTypeLabel(resource.type) }}
          </Badge>
        </div>
      </div>

      <!-- List View -->
      <div v-else class="space-y-1">
        <div
          v-for="resource in filteredResources"
          :key="resource.id"
          class="flex items-center gap-2 p-2 rounded-md hover:bg-accent cursor-pointer"
          @click="$emit('preview', resource)"
          @contextmenu.prevent="handleContextMenu($event, resource)"
        >
          <div class="w-8 h-8 flex items-center justify-center bg-muted rounded overflow-hidden shrink-0">
            <component
              v-if="!isImageType(resource.type)"
              :is="getResourceIcon(resource.type)"
              class="w-4 h-4 text-muted-foreground"
            />
            <img
              v-else
              :src="getResourceUrl(resource)"
              :alt="resource.name"
              class="w-full h-full object-cover"
            />
          </div>
          <div class="flex-1 min-w-0">
            <div class="text-sm truncate">{{ resource.name }}</div>
            <div class="text-xs text-muted-foreground">
              {{ formatFileSize(resource.size) }} · {{ formatDate(resource.updatedAt) }}
            </div>
          </div>
          <Badge :variant="getResourceVariant(resource.type)" class="text-xs">
            {{ getResourceTypeLabel(resource.type) }}
          </Badge>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import {
  Search,
  Filter,
  Upload,
  RefreshCw,
  Grid3x3,
  List,
  FolderX,
  Loader2,
  ImageOff,
  ImageIcon,
  Video,
  Music,
  FileText,
  Link as LinkIcon,
  Code,
  File,
} from 'lucide-vue-next';
import { Button } from '@dailyuse/ui-vue-shadcn';
import { Input } from '@dailyuse/ui-vue-shadcn';
import { Badge } from '@dailyuse/ui-vue-shadcn';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@dailyuse/ui-vue-shadcn';

interface Resource {
  id: string;
  name: string;
  type: string;
  size: number;
  updatedAt: number;
  path?: string;
}

interface Props {
  repositoryId: string | null;
  resources: Resource[];
  isLoading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false,
});

const emit = defineEmits<{
  upload: [];
  refresh: [];
  preview: [resource: Resource];
  'context-menu': [event: MouseEvent, resource: Resource];
}>();

const searchQuery = ref('');
const selectedTypes = ref<string[]>([]);
const displayMode = ref<'grid' | 'list'>('grid');

const resourceTypes = [
  { value: 'IMAGE', label: '图片', icon: ImageIcon },
  { value: 'VIDEO', label: '视频', icon: Video },
  { value: 'AUDIO', label: '音频', icon: Music },
  { value: 'PDF', label: 'PDF', icon: FileText },
  { value: 'LINK', label: '链接', icon: LinkIcon },
  { value: 'CODE', label: '代码', icon: Code },
  { value: 'OTHER', label: '其他', icon: File },
];

const filteredResources = computed(() => {
  let filtered = props.resources.filter(r => r.type !== 'MARKDOWN');
  
  if (selectedTypes.value.length > 0) {
    filtered = filtered.filter(r => selectedTypes.value.includes(r.type));
  }
  
  const query = searchQuery.value.trim().toLowerCase();
  if (query) {
    filtered = filtered.filter(r => r.name.toLowerCase().includes(query));
  }
  
  return filtered;
});

function toggleTypeFilter(type: string) {
  const index = selectedTypes.value.indexOf(type);
  if (index > -1) {
    selectedTypes.value.splice(index, 1);
  } else {
    selectedTypes.value.push(type);
  }
}

function clearFilters() {
  selectedTypes.value = [];
}

function toggleDisplayMode() {
  displayMode.value = displayMode.value === 'grid' ? 'list' : 'grid';
}

function getResourceIcon(type: string) {
  const iconMap: Record<string, any> = {
    IMAGE: ImageIcon,
    VIDEO: Video,
    AUDIO: Music,
    PDF: FileText,
    LINK: LinkIcon,
    CODE: Code,
    OTHER: File,
  };
  return iconMap[type] || File;
}

function getResourceVariant(type: string): 'default' | 'secondary' | 'destructive' | 'outline' {
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

function getResourceTypeLabel(type: string): string {
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

function isImageType(type: string): boolean {
  return type === 'IMAGE';
}

function getResourceUrl(resource: Resource): string {
  return resource.path || `/api/resources/${resource.id}/content`;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('zh-CN');
}

function handleContextMenu(event: MouseEvent, resource: Resource) {
  emit('context-menu', event, resource);
}
</script>
