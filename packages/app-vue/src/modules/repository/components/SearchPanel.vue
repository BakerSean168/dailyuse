<template>
  <Card class="rounded-lg">
    <CardContent class="p-4">
      <!-- Search input -->
      <div class="relative">
        <Search class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          v-model="localQuery"
          :placeholder="t('repository.search.inputPlaceholder')"
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
          {{ t(mode.labelKey) }}
        </Badge>
      </div>

      <!-- Advanced options -->
      <div class="mt-3 flex flex-wrap gap-4">
        <label class="flex items-center gap-2 text-sm">
          <input type="checkbox" v-model="caseSensitive" class="rounded" />
          {{ t('repository.search.caseSensitive') }}
        </label>
        <label class="flex items-center gap-2 text-sm">
          <input type="checkbox" v-model="useRegex" class="rounded" />
          {{ t('repository.search.useRegex') }}
        </label>
      </div>
    </CardContent>

    <Separator />

    <!-- Search Results -->
    <CardContent class="p-0 max-h-96 overflow-y-auto">
      <!-- Loading -->
      <div v-if="searching" class="flex flex-col items-center justify-center p-8">
        <Loader2 class="h-8 w-8 animate-spin text-primary" />
        <div class="text-sm text-muted-foreground mt-2">{{ t('repository.search.searching') }}</div>
      </div>

      <!-- Empty -->
      <div
        v-else-if="(results?.length ?? 0) === 0 && hasSearched"
        class="flex flex-col items-center justify-center p-8"
      >
        <Search class="h-12 w-12 text-muted-foreground" />
        <div class="text-sm text-muted-foreground mt-2">{{ t('repository.search.noMatch') }}</div>
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
              <div class="text-sm font-medium truncate">
                <template
                  v-for="(segment, segmentIndex) in highlightResourceName(result.resourceName)"
                  :key="segmentIndex"
                >
                  <mark v-if="segment.match" class="bg-yellow-200 px-0 text-inherit">{{
                    segment.text
                  }}</mark>
                  <span v-else>{{ segment.text }}</span>
                </template>
              </div>
              <div class="text-xs text-muted-foreground truncate">{{ result.resourcePath }}</div>

              <!-- Matches -->
              <div v-if="result.matches.length > 0" class="mt-2 space-y-1">
                <div
                  v-for="(match, idx) in result.matches.slice(0, 3)"
                  :key="idx"
                  class="text-xs font-mono bg-muted p-1 rounded"
                >
                  <span class="text-muted-foreground">{{ match.lineNumber }}:</span>
                  <span>
                    <template
                      v-for="(segment, segmentIndex) in highlightLineMatch(match)"
                      :key="segmentIndex"
                    >
                      <mark v-if="segment.match" class="bg-yellow-200 px-0 text-inherit">{{
                        segment.text
                      }}</mark>
                      <span v-else>{{ segment.text }}</span>
                    </template>
                  </span>
                </div>
                <div v-if="result.matches.length > 3" class="text-xs text-muted-foreground">
                  +{{ result.matches.length - 3 }} {{ t('repository.search.moreMatches') }}
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
        <div class="text-sm text-muted-foreground mt-2">
          {{ t('repository.search.enterKeyword') }}
        </div>
      </div>
    </CardContent>

    <!-- Footer stats -->
    <Separator v-if="(results?.length ?? 0) > 0" />
    <CardFooter
      v-if="(results?.length ?? 0) > 0"
      class="text-xs text-muted-foreground px-4 py-2 justify-between"
    >
      <span>{{
        t('repository.search.stats', { fileCount: totalResults, matchCount: totalMatches })
      }}</span>
      <span>{{ searchTime }}ms</span>
    </CardFooter>
  </Card>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { Search, FileSearch, Loader2, FileText, Hash, Folder, Code2, Tag } from 'lucide-vue-next';
import { Card, CardContent, CardFooter } from '@dailyuse/ui-vue-shadcn';
import { Input } from '@dailyuse/ui-vue-shadcn';
import { Badge } from '@dailyuse/ui-vue-shadcn';
import { Separator } from '@dailyuse/ui-vue-shadcn';
import type { SearchMode, SearchResultItem, SearchMatch } from '@dailyuse/contracts/repository';
import {
  buildHighlightSegments,
  buildIndexedHighlightSegments,
  type HighlightOptions,
} from '../composables/repositorySearch';

defineProps<{
  repositoryId: string;
  results?: SearchResultItem[];
  searching?: boolean;
  hasSearched?: boolean;
  totalResults?: number;
  totalMatches?: number;
  searchTime?: number;
}>();

const { t } = useI18n();

const emit = defineEmits<{
  close: [];
  select: [result: SearchResultItem];
  search: [query: string, mode: SearchMode, options: { caseSensitive: boolean; useRegex: boolean }];
}>();

const localQuery = ref('');
const selectedMode = ref<SearchMode>('all');
const caseSensitive = ref(false);
const useRegex = ref(false);
const submittedQuery = ref('');
const submittedHighlightOptions = ref<HighlightOptions>({
  caseSensitive: false,
  useRegex: false,
});

const searchModes = [
  { value: 'all' as SearchMode, labelKey: 'repository.search.modeAll', icon: FileSearch },
  { value: 'file' as SearchMode, labelKey: 'repository.search.modeFile', icon: FileText },
  { value: 'tag' as SearchMode, labelKey: 'repository.search.modeTag', icon: Tag },
  { value: 'line' as SearchMode, labelKey: 'repository.search.modeLine', icon: FileText },
  { value: 'section' as SearchMode, labelKey: 'repository.search.modeSection', icon: Hash },
  { value: 'path' as SearchMode, labelKey: 'repository.search.modePath', icon: Folder },
  { value: 'property' as SearchMode, labelKey: 'repository.search.modeProperty', icon: Code2 },
];

function selectMode(mode: SearchMode) {
  selectedMode.value = mode;
  handleSearch();
}

function handleSearch() {
  if (!localQuery.value.trim()) return;
  submittedQuery.value = localQuery.value;
  submittedHighlightOptions.value = {
    caseSensitive: caseSensitive.value,
    useRegex: useRegex.value,
  };
  emit('search', localQuery.value, selectedMode.value, {
    caseSensitive: caseSensitive.value,
    useRegex: useRegex.value,
  });
}

function getFileIcon(_type: string) {
  return FileText; // Simplified
}

function highlightResourceName(text: string) {
  return buildHighlightSegments(text, submittedQuery.value, submittedHighlightOptions.value);
}

function highlightLineMatch(match: SearchMatch) {
  return buildIndexedHighlightSegments(match.lineContent, match.startIndex, match.endIndex);
}
</script>
