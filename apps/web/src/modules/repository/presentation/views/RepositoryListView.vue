<template>
  <div class="flex h-full flex-col">
    <!-- 顶部 -->
    <div class="flex items-center justify-between border-b px-6 py-4">
      <h2 class="text-xl font-semibold">仓库</h2>
      <div class="flex items-center gap-3">
        <div class="relative">
          <Search class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input v-model="searchQuery" placeholder="搜索仓库..." class="w-64 pl-9" />
        </div>
        <Button @click="handleCreateRepository">
          <Plus class="mr-1 h-4 w-4" /> 新建仓库
        </Button>
      </div>
    </div>

    <!-- 过滤标签 -->
    <div class="flex items-center gap-2 border-b px-6 py-2">
      <Button
        v-for="type in repositoryTypes"
        :key="type.value"
        :variant="filterType === type.value ? 'default' : 'ghost'"
        size="sm"
        @click="filterType = type.value"
      >
        {{ type.label }}
      </Button>
    </div>

    <!-- 仓库卡片网格 -->
    <ScrollArea class="flex-1 p-6">
      <div class="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
        <Card
          v-for="repo in filteredRepositories"
          :key="repo.id"
          class="cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-md"
          @click="$router.push(`/repository/${repo.id}`)"
        >
          <CardHeader class="pb-3">
            <div class="flex items-center justify-between">
              <CardTitle class="text-base">{{ repo.name }}</CardTitle>
              <Badge :variant="repo.status === 'Active' ? 'default' : 'secondary'" class="text-xs">
                {{ repo.status }}
              </Badge>
            </div>
            <CardDescription class="line-clamp-2">
              {{ repo.description || '暂无描述' }}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div class="flex items-center gap-4 text-xs text-muted-foreground">
              <span class="flex items-center gap-1">
                <Badge variant="outline" class="text-xs">{{ repo.type }}</Badge>
              </span>
              <span v-if="repo.stats" class="flex items-center gap-1">
                <FileText class="h-3 w-3" /> {{ repo.stats.resourceCount }} 文件
              </span>
            </div>
          </CardContent>
        </Card>

        <div v-if="filteredRepositories.length === 0" class="col-span-full flex flex-col items-center justify-center py-16">
          <Database class="h-16 w-16 text-muted-foreground/50" />
          <p class="mt-4 text-muted-foreground">暂无仓库</p>
          <Button class="mt-2" @click="handleCreateRepository">
            <Plus class="mr-1 h-4 w-4" /> 创建第一个仓库
          </Button>
        </div>
      </div>
    </ScrollArea>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { toast } from 'vue-sonner';
import { Search, Plus, FileText, Database } from 'lucide-vue-next';
import {
  Input, Button, Card, CardHeader, CardTitle, CardDescription, CardContent,
  Badge, ScrollArea,
} from '@dailyuse/ui-vue-shadcn';
import { useRepository } from '../composables/useRepository';

const { repositories, fetchRepositories } = useRepository();

const searchQuery = ref('');
const filterType = ref<string | null>(null);

const repositoryTypes = [
  { value: null, label: '全部' },
  { value: 'Markdown', label: 'Markdown' },
  { value: 'Code', label: '代码' },
  { value: 'Mixed', label: '混合' },
];

const filteredRepositories = computed(() => {
  let list = repositories.value;
  if (filterType.value) {
    list = list.filter((r) => r.type === filterType.value);
  }
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    list = list.filter((r) => r.name?.toLowerCase().includes(q) || r.description?.toLowerCase().includes(q));
  }
  return list;
});

function handleCreateRepository() { toast.info('创建仓库功能开发中'); }

onMounted(() => { fetchRepositories(); });
</script>
