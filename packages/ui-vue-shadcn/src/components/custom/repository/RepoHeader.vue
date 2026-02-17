<template>
  <div class="flex items-center justify-between p-2 border-b bg-background gap-2">
    <!-- Left: View Toggle -->
    <div class="flex items-center gap-2">
      <div class="inline-flex rounded-md border">
        <Button
          :variant="currentView === 'preview' ? 'default' : 'ghost'"
          size="sm"
          class="rounded-r-none"
          @click="handleViewChange('preview')"
        >
          <BookOpen class="h-4 w-4 mr-1" />
          编辑预览
        </Button>
        <Button
          :variant="currentView === 'manage' ? 'default' : 'ghost'"
          size="sm"
          class="rounded-l-none border-l"
          @click="handleViewChange('manage')"
        >
          <LayoutGrid class="h-4 w-4 mr-1" />
          管理视图
        </Button>
      </div>
    </div>

    <!-- Right: Search and Actions -->
    <div class="flex items-center gap-2">
      <div class="relative w-[250px]">
        <Search class="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          v-model="searchQuery"
          placeholder="搜索..."
          class="pl-8"
          @update:model-value="handleSearch"
        />
      </div>

      <Button
        variant="ghost"
        size="icon"
        :disabled="refreshing"
        @click="handleRefresh"
      >
        <RefreshCw :class="['h-4 w-4', refreshing && 'animate-spin']" />
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <Button variant="ghost" size="icon">
            <MoreVertical class="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem @click="$emit('sync')">
            <RefreshCcw class="mr-2 h-4 w-4" />
            同步
          </DropdownMenuItem>
          <DropdownMenuItem @click="$emit('export')">
            <Download class="mr-2 h-4 w-4" />
            导出
          </DropdownMenuItem>
          <DropdownMenuItem @click="$emit('import')">
            <Upload class="mr-2 h-4 w-4" />
            导入
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../ui/dropdown-menu';
import {
  BookOpen,
  LayoutGrid,
  Search,
  RefreshCw,
  MoreVertical,
  RefreshCcw,
  Download,
  Upload,
} from 'lucide-vue-next';

interface Props {
  modelValue: 'preview' | 'manage';
  debounceMs?: number;
}

const props = withDefaults(defineProps<Props>(), {
  debounceMs: 300,
});

const emit = defineEmits<{
  'update:modelValue': [value: 'preview' | 'manage'];
  search: [query: string];
  refresh: [];
  sync: [];
  export: [];
  import: [];
}>();

const currentView = ref(props.modelValue);
const searchQuery = ref('');
const refreshing = ref(false);

let searchTimeout: NodeJS.Timeout | null = null;

watch(
  () => props.modelValue,
  (newValue) => {
    currentView.value = newValue;
  },
);

function handleViewChange(view: 'preview' | 'manage') {
  currentView.value = view;
  emit('update:modelValue', view);
}

function handleSearch(query: string) {
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }
  searchTimeout = setTimeout(() => {
    emit('search', query);
  }, props.debounceMs);
}

async function handleRefresh() {
  refreshing.value = true;
  try {
    emit('refresh');
    await new Promise((resolve) => setTimeout(resolve, 500));
  } finally {
    refreshing.value = false;
  }
}
</script>
