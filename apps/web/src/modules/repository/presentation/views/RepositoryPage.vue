<template>
  <div class="flex h-screen flex-col">
    <div class="flex flex-1 overflow-hidden">
      <!-- 左侧边栏 -->
      <div class="flex w-72 flex-col border-r bg-muted/30">
        <!-- 顶部：搜索 -->
        <div class="border-b p-3">
          <div class="relative">
            <Search class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input v-model="sidebarSearch" placeholder="搜索文件..." class="pl-9" />
          </div>
        </div>

        <!-- 文件树列表 -->
        <ScrollArea class="flex-1">
          <div class="p-2">
            <button
              v-for="folder in folders"
              :key="folder.id"
              class="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent"
              :class="{ 'bg-accent': currentFolderId === folder.id }"
              @click="selectFolder(folder.id)"
            >
              <component :is="folder.icon" class="h-4 w-4" />
              <span>{{ folder.name }}</span>
            </button>
          </div>

          <Separator class="my-2" />

          <div class="px-4 py-1 text-xs text-muted-foreground">
            文件 ({{ filteredResources.length }})
          </div>

          <div class="p-2">
            <button
              v-for="resource in filteredResources"
              :key="resource.id"
              class="flex w-full flex-col items-start rounded-md px-3 py-2 text-sm hover:bg-accent"
              @click="selectResource(resource.id)"
            >
              <div class="flex items-center gap-2">
                <FileText class="h-4 w-4 text-muted-foreground" />
                <span>{{ resource.name }}</span>
              </div>
              <span class="ml-6 text-xs text-muted-foreground">{{ resource.path }}</span>
            </button>

            <p v-if="filteredResources.length === 0" class="py-4 text-center text-xs text-muted-foreground">
              暂无文件
            </p>
          </div>
        </ScrollArea>

        <!-- 底部：切换仓库 -->
        <div class="mt-auto border-t">
          <button
            class="flex w-full items-center gap-3 px-3 py-3 text-sm hover:bg-accent"
            @click="managementDialogOpen = true"
          >
            <Folder class="h-4 w-4" />
            <div class="flex-1 text-left">
              <div class="font-medium">{{ currentRepositoryName }}</div>
              <div class="text-xs text-muted-foreground">{{ currentRepositoryPath }}</div>
            </div>
            <Settings class="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      <!-- 右侧内容区 -->
      <div class="flex flex-1 flex-col overflow-hidden">
        <!-- 顶部工具栏 -->
        <RepoHeader
          v-model="currentView"
          @search="handleSearch"
          @refresh="handleRefresh"
          @sync="handleSync"
          @export="handleExport"
          @import="handleImport"
        />

        <!-- 内容区域 -->
        <div class="flex-1 overflow-y-auto p-4">
          <!-- 预览编辑视图 -->
          <div v-if="currentView === 'preview'" class="flex h-full flex-col items-center justify-center">
            <FileEdit class="h-16 w-16 text-muted-foreground/50" />
            <p class="mt-4 text-lg text-muted-foreground">编辑器预览</p>
            <p class="text-sm text-muted-foreground">此功能将在 Editor 模块中实现</p>
          </div>

          <!-- 管理视图 -->
          <div v-else class="flex h-full flex-col">
            <div class="mb-4 flex items-center justify-between">
              <h3 class="text-lg font-semibold">{{ currentFolderName }}</h3>
              <div class="flex gap-2">
                <Button size="sm" @click="handleCreateResource">
                  <Plus class="mr-1 h-4 w-4" /> 新建
                </Button>
                <Button size="sm" variant="outline" @click="handleImport">
                  <Upload class="mr-1 h-4 w-4" /> 导入
                </Button>
              </div>
            </div>

            <!-- 卡片网格 -->
            <div class="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
              <Card
                v-for="resource in filteredResources"
                :key="resource.id"
                class="cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-md"
                @click="selectResource(resource.id)"
              >
                <CardContent class="p-4">
                  <div class="mb-2 flex items-center justify-between">
                    <FileText class="h-8 w-8 text-primary" />
                    <DropdownMenu>
                      <DropdownMenuTrigger as-child>
                        <Button variant="ghost" size="icon" class="h-6 w-6" @click.stop>
                          <MoreVertical class="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem @click.stop="editResource(resource.id)">编辑</DropdownMenuItem>
                        <DropdownMenuItem @click.stop="handleDeleteResource(resource.id)">删除</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div class="mb-1 text-sm font-bold">{{ resource.name }}</div>
                  <div class="text-xs text-muted-foreground">{{ resource.path }}</div>
                </CardContent>
              </Card>

              <div v-if="filteredResources.length === 0" class="col-span-full flex flex-col items-center justify-center py-16">
                <FolderOpen class="h-16 w-16 text-muted-foreground/50" />
                <p class="mt-4 text-muted-foreground">暂无文件</p>
                <Button class="mt-2" @click="handleCreateResource">
                  <Plus class="mr-1 h-4 w-4" /> 创建第一个文件
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { toast } from 'vue-sonner';
import {
  Search, FileText, Folder, FolderOpen, Settings, FileEdit,
  Plus, Upload, MoreVertical, FolderClosed, Clock, Star,
} from 'lucide-vue-next';
import {
  Input, Button, Card, CardContent, ScrollArea, Separator,
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
  RepoHeader,
} from '@dailyuse/ui-vue-shadcn';
import { useRepository } from '../composables/useRepository';

const {
  repositories, resources, isLoading,
  fetchRepositories, fetchResources, deleteResource,
} = useRepository();

const managementDialogOpen = ref(false);
const currentView = ref<'preview' | 'manage'>('preview');
const sidebarSearch = ref('');
const currentFolderId = ref<string | null>(null);
const selectedRepositoryId = ref<string | null>(null);

const folders = ref([
  { id: 'all', name: '全部文件', icon: FolderClosed },
  { id: 'recent', name: '最近使用', icon: Clock },
  { id: 'favorites', name: '收藏夹', icon: Star },
]);

const currentRepository = computed(() =>
  repositories.value.find((r) => r.id === selectedRepositoryId.value),
);
const currentRepositoryName = computed(() => currentRepository.value?.name || '选择仓库');
const currentRepositoryPath = computed(() => currentRepository.value?.path || '未选择');
const currentFolderName = computed(() => {
  const folder = folders.value.find((f) => f.id === currentFolderId.value);
  return folder?.name || '全部文件';
});

const filteredResources = computed(() => {
  if (!selectedRepositoryId.value) return [];
  let filtered = resources.value.filter((r) => r.repositoryId === selectedRepositoryId.value);
  if (sidebarSearch.value) {
    const query = sidebarSearch.value.toLowerCase();
    filtered = filtered.filter(
      (r) => r.name?.toLowerCase().includes(query) || r.path?.toLowerCase().includes(query),
    );
  }
  return filtered;
});

async function loadRepositoryResources(repoId: string) {
  selectedRepositoryId.value = repoId;
  await fetchResources(repoId);
}

function selectFolder(folderId: string) { currentFolderId.value = folderId; }

function selectResource(id: string) {
  if (currentView.value === 'preview') {
    toast.info('预览功能在 Editor 模块中实现');
  }
}

function handleSearch(query: string) { sidebarSearch.value = query; }

async function handleRefresh() {
  if (!selectedRepositoryId.value) { toast.warning('请先选择一个仓库'); return; }
  await loadRepositoryResources(selectedRepositoryId.value);
}

function handleSync() { toast.info('同步功能开发中'); }
function handleExport() { toast.info('导出功能开发中'); }
function handleImport() { toast.info('导入功能开发中'); }
function handleCreateResource() { toast.info('创建资源功能开发中'); }
function editResource(id: string) { toast.info('编辑功能开发中'); }

async function handleDeleteResource(id: string) {
  if (!window.confirm('确定要删除此文件吗？')) return;
  const success = await deleteResource(selectedRepositoryId.value!, id);
  if (success) toast.success('删除成功');
}

onMounted(async () => {
  await fetchRepositories();
  if (repositories.value.length > 0) {
    await loadRepositoryResources(repositories.value[0].id);
  }
});
</script>
