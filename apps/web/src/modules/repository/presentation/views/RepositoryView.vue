<template>
  <div class="flex h-full flex-col">
    <!-- Obsidian 风格双栏布局 -->
    <div class="flex flex-1 overflow-hidden">
      <!-- 文件树面板 -->
      <div class="flex w-64 flex-col border-r bg-muted/30">
        <div class="flex items-center justify-between border-b px-3 py-2">
          <span class="text-sm font-medium">文件</span>
          <Button variant="ghost" size="icon" class="h-6 w-6" @click="toast.info('新建文件开发中')">
            <Plus class="h-4 w-4" />
          </Button>
        </div>
        <ScrollArea class="flex-1">
          <FileTreePanel
            v-if="currentRepository"
            :nodes="[]"
            :repository-id="currentRepository.id"
          />
          <p v-else class="p-4 text-center text-xs text-muted-foreground">请选择仓库</p>
        </ScrollArea>
      </div>

      <!-- 编辑器区域 -->
      <div class="flex flex-1 flex-col">
        <!-- 标签栏 -->
        <div class="flex items-center border-b bg-muted/20 px-2">
          <TabManager :tabs="[]" />
        </div>

        <!-- 编辑器内容 -->
        <div class="flex-1 overflow-y-auto">
          <div v-if="currentResource" class="h-full">
            <ResourceEditor :resource-id="currentResource.id" />
          </div>
          <div v-else class="flex h-full flex-col items-center justify-center">
            <FileText class="h-16 w-16 text-muted-foreground/30" />
            <p class="mt-4 text-muted-foreground">选择一个文件开始编辑</p>
          </div>
        </div>
      </div>

      <!-- 右侧面板 (可选) -->
      <div v-if="rightPanelOpen" class="flex w-64 flex-col border-l bg-muted/30">
        <Tabs default-value="outline" class="flex h-full flex-col">
          <TabsList class="mx-2 mt-2">
            <TabsTrigger value="outline">大纲</TabsTrigger>
            <TabsTrigger value="backlinks">反向链接</TabsTrigger>
            <TabsTrigger value="tags">标签</TabsTrigger>
          </TabsList>
          <TabsContent value="outline" class="flex-1 overflow-y-auto p-2">
            <p class="text-xs text-muted-foreground">大纲功能开发中</p>
          </TabsContent>
          <TabsContent value="backlinks" class="flex-1 overflow-y-auto p-2">
            <p class="text-xs text-muted-foreground">反向链接开发中</p>
          </TabsContent>
          <TabsContent value="tags" class="flex-1 overflow-y-auto p-2">
            <p class="text-xs text-muted-foreground">标签管理开发中</p>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { toast } from 'vue-sonner';
import { Plus, FileText } from 'lucide-vue-next';
import {
  Button, ScrollArea, Tabs, TabsList, TabsTrigger, TabsContent,
  FileTreePanel, TabManager, ResourceEditor,
} from '@dailyuse/ui-vue-shadcn';
import { useRepository } from '../composables/useRepository';

const { currentRepository, currentResource, fetchRepositories } = useRepository();

const rightPanelOpen = ref(false);

onMounted(() => { fetchRepositories(); });
</script>
