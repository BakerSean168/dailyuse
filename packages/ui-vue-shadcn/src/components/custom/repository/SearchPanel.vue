<template>
  <Card class="rounded-lg">
    <CardContent class="p-4">
      <!-- Search input -->
      <div class="relative">
        <Search class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          v-model="localQuery"
          placeholder="搜索仓储内容..."
          class="pl-9"
          @keydown.enter="handleSearch"
          @keydown.esc="$emit('close')"
        />
      </div>

      <!-- Mode chips -->
      <div class="flex flex-wrap gap-2 mt-3">
        <Badge
          v-for="mode in searchModes"
          :key="mode.value"
          :variant="selectedMode === mode.value ? 'default' : 'outline'"
          class="cursor-pointer"
          @click="selectMode(mode.value)"
        >
          <component :is="mode.icon" class="h-3 w-3 mr-1" />
          {{ mode.label }}
        </Badge>
      </div>

      <!-- Advanced options -->
      <div v-if="showAdvanced" class="mt-3 space-y-2">
        <label class="flex items-center gap-2 text-sm">
          <input type="checkbox" v-model="caseSensitive" class="rounded" />
          区分大小写
        </label>
        <label class="flex items-center gap-2 text-sm">
          <input type="checkbox" v-model="useRegex" class="rounded" />
          使用正则表达式
        </label>
      </div>
    </CardContent>

    <Separator />

    <!-- Search Results -->
    <CardContent class="p-0 max-h-96 overflow-y-auto">
      <!-- Loading -->
      <div v-if="searching" class="flex flex-col items-center justify-center p-8">
        <Loader2 class="h-8 w-8 animate-spin text-primary" />
        <div class="text-sm text-muted-foreground mt-2">搜索中...</div>
      </div>

      <!-- Empty -->
      <div v-else-if="results.length === 0 && hasSearched" class="flex flex-col items-center justify-center p-8">
        <Search class="h-12 w-12 text-muted-foreground" />
        <div class="text-sm text-muted-foreground mt-2">未找到匹配结果</div>
      </div>

      <!-- Results -->
      <div v-else-if="results?.length ?? 0 > 0">
        <div
          v-for="result in results"
          :key="result.resourceId"
          class="border-b border-border last:border-0 hover:bg-accent cursor-pointer p-3"
          @click="$emit('select', result)"
        >
          <div class="flex items-start gap-2">
            <component :is="getFileIcon(result.resourceType)" class="h-4 w-4 mt-0.5 shrink-0" />
            <div class="flex-1 min-w-0">
              <div class="text-sm font-medium truncate" v-html="highlightMatch(result.resourceName)" />
              <div class="text-xs text-muted-foreground truncate">{{ result.resourcePath }}</div>
              
              <!-- Matches -->
              <div v-if="result.matches.length > 0" class="mt-2 space-y-1">
                <div
                  v-for="(match, idx) in result.matches.slice(0, 3)"
                  :key="idx"
                  class="text-xs font-mono bg-muted p-1 rounded"
                >
                  <span class="text-muted-foreground">{{ match.lineNumber }}:</span>
                  <span v-html="highlightMatchInLine(match)" />
                </div>
                <div v-if="result.matches.length > 3" class="text-xs text-muted-foreground">
                  +{{ result.matches.length - 3 }} 更多匹配
                </div>
              </div>
            </div>
            <Badge variant="secondary" class="shrink-0">{{ result.matchCount }}</Badge>
          </div>
        </div>
      </div>

      <!-- Initial state -->
      <div v-else class="flex flex-col items-center justify-center p-8">
        <FileSearch class="h-12 w-12 text-muted-foreground" />
        <div class="text-sm text-muted-foreground mt-2">输入关键词开始搜索</div>
      </div>
    </CardContent>

    <!-- Footer stats -->
    <Separator v-if="(results?.length ?? 0) > 0" />
    <CardFooter v-if="(results?.length ?? 0) > 0" class="text-xs text-muted-foreground px-4 py-2 justify-between">
      <span>找到 {{ totalResults }} 个文件，共 {{ totalMatches }} 处匹配</span>
      <span>{{ searchTime }}ms</span>
    </CardFooter>
  </Card>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Search, FileSearch, Loader2, FileText, Hash, Folder, Code2, Tag } from 'lucide-vue-next';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { SearchMode, SearchResultItem, SearchMatch } from '@dailyuse/contracts/repository';

interface Props {
  repositoryId: string;
  results?: SearchResultItem[];
  searching?: boolean;
  hasSearched?: boolean;
  totalResults?: number;
  totalMatches?: number;
  searchTime?: number;
}

defineProps<Props>();

const emit = defineEmits<{
  close: [];
  select: [result: SearchResultItem];
  search: [query: string, mode: SearchMode, options: { caseSensitive: boolean; useRegex: boolean }];
}>();

const localQuery = ref('');
const selectedMode = ref<SearchMode>('all');
const caseSensitive = ref(false);
const useRegex = ref(false);
const showAdvanced = ref(false);

const searchModes = [
  { value: 'all' as SearchMode, label: '全部', icon: FileSearch },
  { value: 'file' as SearchMode, label: '文件名', icon: FileText },
  { value: 'tag' as SearchMode, label: '标签', icon: Tag },
  { value: 'line' as SearchMode, label: '行内容', icon: FileText },
  { value: 'section' as SearchMode, label: '章节', icon: Hash },
  { value: 'path' as SearchMode, label: '路径', icon: Folder },
  { value: 'property' as SearchMode, label: '属性', icon: Code2 },
];

function selectMode(mode: SearchMode) {
  selectedMode.value = mode;
  handleSearch();
}

function handleSearch() {
  if (!localQuery.value.trim()) return;
  emit('search', localQuery.value, selectedMode.value, {
    caseSensitive: caseSensitive.value,
    useRegex: useRegex.value,
  });
}

function getFileIcon(type: string) {
  return FileText; // Simplified
}

function highlightMatch(text: string): string {
  if (!localQuery.value) return text;
  const regex = new RegExp(`(${localQuery.value})`, 'gi');
  return text.replace(regex, '<mark class="bg-yellow-200">$1</mark>');
}

function highlightMatchInLine(match: SearchMatch): string {
  const { lineContent, startIndex, endIndex } = match;
  const before = lineContent.substring(0, startIndex);
  const matchText = lineContent.substring(startIndex, endIndex);
  const after = lineContent.substring(endIndex);
  return `${before}<mark class="bg-yellow-200">${matchText}</mark>${after}`;
}
</script>
