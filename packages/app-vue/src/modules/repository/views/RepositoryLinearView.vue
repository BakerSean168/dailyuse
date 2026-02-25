<template>
  <div class="flex h-full overflow-hidden bg-background">
    <!-- Sidebar: Repositories -->
    <aside class="hidden w-64 shrink-0 flex-col border-r bg-sidebar md:flex">
      <div class="flex h-14 items-center border-b p-4">
        <div class="flex items-center gap-2 font-semibold">
          <BookOpen class="h-5 w-5 text-primary" />
          <span>知识仓库</span>
        </div>
      </div>

      <ScrollArea class="flex-1">
        <div class="space-y-1 p-2">
          <div
            v-for="repo in repositories"
            :key="repo.id"
            class="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors"
            :class="selectedRepoId === repo.id ? 'bg-accent text-accent-foreground' : 'hover:bg-muted'"
            @click="selectRepository(repo)"
          >
            <Folder class="h-4 w-4" />
            <span class="truncate">{{ repo.name }}</span>
            <Badge variant="secondary" class="ml-auto text-xs">{{ repo.resourceCount || 0 }}</Badge>
          </div>
        </div>
      </ScrollArea>

      <div class="border-t p-4">
        <Button variant="ghost" size="sm" class="w-full justify-start" @click="showCreateRepo = true">
          <Plus class="mr-2 h-4 w-4" /> 新建仓库
        </Button>
      </div>
    </aside>

    <!-- Main -->
    <main class="flex min-w-0 flex-1 flex-col overflow-hidden">
      <header class="z-10 flex h-14 shrink-0 items-center justify-between border-b bg-background/50 px-6 backdrop-blur-sm">
        <h1 class="text-lg font-medium text-foreground">
          {{ selectedRepo?.name || '选择仓库' }}
        </h1>
        <div class="flex items-center gap-2">
          <div class="relative hidden w-64 lg:block">
            <Search class="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              v-model="searchQuery"
              placeholder="搜索资源..."
              class="h-8 w-full border-transparent bg-secondary/50 pl-8 focus-visible:border-ring focus-visible:bg-background"
            />
          </div>
        </div>
      </header>

      <ScrollArea class="flex-1 p-6">
        <div class="mx-auto max-w-6xl">
          <div
            v-if="isLoading"
            class="flex h-[50vh] items-center justify-center text-muted-foreground"
          >
            加载中...
          </div>

          <div v-else-if="!selectedRepoId" class="flex h-[50vh] flex-col items-center justify-center text-muted-foreground">
            <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
              <BookOpen class="h-6 w-6 opacity-50" />
            </div>
            <h3 class="mb-1 text-lg font-medium text-foreground">选择一个仓库</h3>
            <p class="mb-6 text-sm">从左侧选择一个仓库开始浏览</p>
            <Button v-if="repositories.length === 0" @click="showCreateRepo = true">
              <Plus class="mr-2 h-4 w-4" /> 创建第一个仓库
            </Button>
          </div>

          <div v-else class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <RepoCard
              v-if="selectedRepo"
              :repository="selectedRepo"
              @view-details="handleViewDetails"
              @delete="handleDeleteRepo"
            />
          </div>
        </div>
      </ScrollArea>
    </main>

    <!-- Create Repo Dialog (inline simple version) -->
    <Teleport to="body">
      <div
        v-if="showCreateRepo"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        @click.self="showCreateRepo = false"
      >
        <Card class="w-full max-w-md">
          <CardHeader>
            <CardTitle>新建仓库</CardTitle>
          </CardHeader>
          <CardContent class="space-y-4">
            <div>
              <label class="mb-1 block text-sm font-medium">名称</label>
              <Input v-model="newRepoName" placeholder="仓库名称" />
            </div>
            <div>
              <label class="mb-1 block text-sm font-medium">描述</label>
              <Input v-model="newRepoDesc" placeholder="可选描述" />
            </div>
          </CardContent>
          <div class="flex justify-end gap-2 p-6 pt-0">
            <Button variant="outline" @click="showCreateRepo = false">取消</Button>
            <Button @click="handleCreateRepo">创建</Button>
          </div>
        </Card>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { toast } from 'vue-sonner';
import { BookOpen, Folder, Plus, Search } from 'lucide-vue-next';
import { Button, Badge, ScrollArea, Input, Card, CardHeader, CardTitle, CardContent } from '@dailyuse/ui-vue-shadcn';
import RepoCard from '../components/RepoCard.vue';
import { useRepository } from '../composables/useRepository';
import type { RepositoryClientDTO } from '@dailyuse/contracts/repository';

const { repositories, isLoading, fetchRepositories, createRepository, deleteRepository } = useRepository();

const selectedRepoId = ref<string | null>(null);
const searchQuery = ref('');
const showCreateRepo = ref(false);
const newRepoName = ref('');
const newRepoDesc = ref('');

const selectedRepo = computed(() =>
  repositories.value.find((r) => r.id === selectedRepoId.value) || null,
);

function selectRepository(repo: RepositoryClientDTO) {
  selectedRepoId.value = repo.id;
}

function handleViewDetails(repo: RepositoryClientDTO) {
  toast.info(`查看仓库: ${repo.name}`);
}

async function handleDeleteRepo(repo: RepositoryClientDTO) {
  if (!window.confirm(`确认删除仓库「${repo.name}」？`)) return;
  const ok = await deleteRepository(repo.id);
  if (ok) {
    if (selectedRepoId.value === repo.id) selectedRepoId.value = null;
    toast.success('仓库已删除');
  }
}

async function handleCreateRepo() {
  if (!newRepoName.value.trim()) return;
  const result = await createRepository({
    name: newRepoName.value.trim(),
    description: newRepoDesc.value.trim() || undefined,
    type: 'Local',
  });
  if (result) {
    showCreateRepo.value = false;
    newRepoName.value = '';
    newRepoDesc.value = '';
    toast.success('仓库已创建');
  }
}

onMounted(async () => {
  await fetchRepositories();
});
</script>
