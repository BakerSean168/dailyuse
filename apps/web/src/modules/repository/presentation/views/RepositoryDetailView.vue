<template>
  <div class="flex h-full flex-col">
    <!-- 顶部操作栏 -->
    <div class="flex items-center justify-between border-b px-6 py-4">
      <div>
        <Button variant="ghost" size="sm" @click="$router.back()">
          <ArrowLeft class="mr-1 h-4 w-4" /> 返回
        </Button>
      </div>
      <div class="flex gap-2">
        <Button variant="outline" size="sm" @click="handleEditRepository">
          <Pencil class="mr-1 h-4 w-4" /> 编辑
        </Button>
        <Button variant="destructive" size="sm" @click="handleDeleteRepository">
          <Trash2 class="mr-1 h-4 w-4" /> 删除
        </Button>
      </div>
    </div>

    <!-- 仓库信息 -->
    <div class="flex-1 overflow-y-auto p-6">
      <div v-if="currentRepository" class="mx-auto max-w-4xl space-y-6">
        <!-- 基本信息卡片 -->
        <Card>
          <CardHeader>
            <CardTitle class="flex items-center gap-2">
              <Database class="h-5 w-5" />
              {{ currentRepository.name }}
            </CardTitle>
            <CardDescription>{{ currentRepository.description || '暂无描述' }}</CardDescription>
          </CardHeader>
          <CardContent>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <span class="text-sm text-muted-foreground">类型</span>
                <p class="font-medium">{{ currentRepository.type }}</p>
              </div>
              <div>
                <span class="text-sm text-muted-foreground">路径</span>
                <p class="font-medium">{{ currentRepository.path || '未设置' }}</p>
              </div>
              <div>
                <span class="text-sm text-muted-foreground">状态</span>
                <Badge :variant="currentRepository.status === 'Active' ? 'default' : 'secondary'">
                  {{ currentRepository.status }}
                </Badge>
              </div>
              <div>
                <span class="text-sm text-muted-foreground">版本</span>
                <p class="font-medium">v{{ currentRepository.version }}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- 资源列表标签页 -->
        <Tabs default-value="resources">
          <TabsList>
            <TabsTrigger value="resources">资源列表</TabsTrigger>
            <TabsTrigger value="settings">仓库设置</TabsTrigger>
          </TabsList>

          <TabsContent value="resources" class="mt-4">
            <div class="space-y-2">
              <div
                v-for="resource in resources"
                :key="resource.id"
                class="flex items-center justify-between rounded-lg border p-3 hover:bg-accent"
              >
                <div class="flex items-center gap-3">
                  <FileText class="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p class="text-sm font-medium">{{ resource.name }}</p>
                    <p class="text-xs text-muted-foreground">{{ resource.path }}</p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger as-child>
                    <Button variant="ghost" size="icon" class="h-8 w-8">
                      <MoreHorizontal class="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem @click="editResource(resource.id)">编辑</DropdownMenuItem>
                    <DropdownMenuItem @click="handleDeleteResource(resource.id)">删除</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <p v-if="resources.length === 0" class="py-8 text-center text-sm text-muted-foreground">
                暂无资源
              </p>
            </div>
          </TabsContent>

          <TabsContent value="settings" class="mt-4">
            <Card>
              <CardContent class="p-6">
                <p class="text-sm text-muted-foreground">仓库配置功能开发中</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <!-- 加载中 -->
      <div v-else class="flex h-full items-center justify-center">
        <p class="text-muted-foreground">加载中...</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { toast } from 'vue-sonner';
import {
  ArrowLeft, Pencil, Trash2, Database, FileText, MoreHorizontal,
} from 'lucide-vue-next';
import {
  Button, Card, CardHeader, CardTitle, CardDescription, CardContent,
  Badge, Tabs, TabsList, TabsTrigger, TabsContent,
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from '@dailyuse/ui-vue-shadcn';
import { useRepository } from '../composables/useRepository';

const route = useRoute();
const router = useRouter();
const {
  currentRepository, resources,
  fetchRepository, fetchResources, deleteRepository, deleteResource,
} = useRepository();

function handleEditRepository() { toast.info('编辑仓库功能开发中'); }

async function handleDeleteRepository() {
  if (!currentRepository.value) return;
  if (!window.confirm('确定要删除此仓库吗？')) return;
  const success = await deleteRepository(currentRepository.value.id);
  if (success) {
    toast.success('仓库已删除');
    router.push('/repository');
  }
}

function editResource(id: string) { toast.info('编辑资源功能开发中'); }

async function handleDeleteResource(id: string) {
  if (!window.confirm('确定要删除此资源吗？')) return;
  const success = await deleteResource(currentRepository.value!.id, id);
  if (success) toast.success('删除成功');
}

onMounted(async () => {
  const id = route.params.id as string;
  await fetchRepository(id);
  if (currentRepository.value) {
    await fetchResources(currentRepository.value.id);
  }
});
</script>
