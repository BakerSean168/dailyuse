<template>
  <div class="flex flex-col h-full p-3">
    <!-- Header -->
    <div class="flex items-center justify-between mb-3">
      <span class="text-sm font-medium">标签</span>
      <Badge v-if="statistics.length > 0" variant="secondary">
        {{ statistics.length }} 个标签
      </Badge>
    </div>

    <!-- Search -->
    <div v-if="statistics.length > 0" class="mb-3">
      <div class="relative">
        <Search class="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          v-model="searchQuery"
          placeholder="搜索标签..."
          class="h-8 pl-8 text-sm"
        />
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex flex-col items-center justify-center flex-1">
      <Loader2 class="h-8 w-8 animate-spin text-muted-foreground" />
      <p class="text-xs mt-2 text-muted-foreground">加载标签中...</p>
    </div>

    <!-- Error -->
    <Alert v-else-if="error" variant="destructive" class="mb-3">
      <AlertCircle class="h-4 w-4" />
      <AlertDescription>{{ error }}</AlertDescription>
    </Alert>

    <!-- Tags cloud -->
    <div v-else-if="filteredStatistics.length > 0" class="flex flex-wrap gap-2 flex-1 overflow-y-auto">
      <Badge
        v-for="stat in filteredStatistics"
        :key="stat.tag"
        :variant="selectedTag === stat.tag ? 'default' : 'outline'"
        class="cursor-pointer"
        @click="handleSelectTag(stat.tag)"
      >
        <Tag class="h-3 w-3 mr-1" />
        {{ stat.tag }}
        <span class="ml-1 text-xs">({{ stat.count }})</span>
      </Badge>
    </div>

    <!-- Empty state -->
    <div v-else class="flex flex-col items-center justify-center flex-1 text-center">
      <Tag class="h-12 w-12 mb-2 text-muted-foreground" />
      <p class="text-sm text-muted-foreground">
        {{ searchQuery ? '未找到匹配的标签' : '暂无标签' }}
      </p>
      <p v-if="!searchQuery" class="text-xs text-muted-foreground mt-1">
        在笔记的 YAML frontmatter 中添加 tags 字段
      </p>
    </div>

    <!-- Tag filtered resources -->
    <template v-if="selectedTag && filteredResources.length > 0">
      <Separator class="my-3" />
      
      <div class="flex items-center justify-between mb-2">
        <span class="text-xs font-medium">{{ selectedTag }}</span>
        <Button variant="ghost" size="icon-sm" @click="$emit('clear-selection')">
          <X class="h-3.5 w-3.5" />
        </Button>
      </div>

      <div class="flex-1 overflow-y-auto space-y-1">
        <div
          v-for="resource in filteredResources"
          :key="resource.id"
          class="flex items-start gap-2 p-2 rounded hover:bg-accent cursor-pointer text-sm"
          @click="$emit('open-resource', resource)"
        >
          <FileText class="h-4 w-4 mt-0.5 shrink-0" />
          <div class="flex-1 min-w-0">
            <div class="font-medium truncate">{{ resource.title }}</div>
            <div class="text-xs text-muted-foreground truncate">{{ resource.path }}</div>
          </div>
          <span class="text-xs text-muted-foreground shrink-0">
            {{ formatDate(resource.updatedAt) }}
          </span>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { Search, Tag, Loader2, FileText, X, AlertCircle } from 'lucide-vue-next';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface TagStatistic {
  tag: string;
  count: number;
}

interface TaggedResource {
  id: string;
  title: string;
  path: string;
  updatedAt: string;
}

interface Props {
  statistics: TagStatistic[];
  selectedTag?: string | null;
  filteredResources?: TaggedResource[];
  loading?: boolean;
  error?: string | null;
}

const props = withDefaults(defineProps<Props>(), {
  selectedTag: null,
  filteredResources: () => [],
  loading: false,
  error: null,
});

const emit = defineEmits<{
  'select-tag': [tag: string];
  'clear-selection': [];
  'open-resource': [resource: TaggedResource];
}>();

const searchQuery = ref('');

const filteredStatistics = computed(() => {
  if (!searchQuery.value) return props.statistics;
  const query = searchQuery.value.toLowerCase();
  return props.statistics.filter((stat) =>
    stat.tag.toLowerCase().includes(query)
  );
});

function handleSelectTag(tag: string) {
  emit('select-tag', tag);
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return '今天';
  if (diffDays === 1) return '昨天';
  if (diffDays < 7) return `${diffDays}天前`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}周前`;

  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}
</script>
