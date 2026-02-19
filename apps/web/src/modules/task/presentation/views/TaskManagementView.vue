<template>
  <div class="flex h-full flex-col">
    <!-- 标签切换 -->
    <div class="flex items-center gap-2 border-b px-6 py-3">
      <Button
        :variant="activeTab === 'templates' ? 'default' : 'ghost'"
        size="sm"
        @click="activeTab = 'templates'"
      >
        <LayoutTemplate class="mr-1 h-4 w-4" /> 任务模板
      </Button>
      <Button
        :variant="activeTab === 'instances' ? 'default' : 'ghost'"
        size="sm"
        @click="activeTab = 'instances'"
      >
        <ListTodo class="mr-1 h-4 w-4" /> 任务实例
      </Button>
    </div>

    <!-- 内容区域 -->
    <div class="flex-1 overflow-y-auto p-6">
      <!-- 模板管理 -->
      <div v-if="activeTab === 'templates'" class="space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold">任务模板</h2>
          <Button size="sm" @click="handleCreateTemplate">
            <Plus class="mr-1 h-4 w-4" /> 新建模板
          </Button>
        </div>

        <div class="space-y-2">
          <Card
            v-for="template in templates"
            :key="template.id"
            class="cursor-pointer hover:bg-accent/50"
            @click="$router.push(`/task/${template.id}`)"
          >
            <CardContent class="flex items-center justify-between p-4">
              <div class="flex items-center gap-3">
                <div
                  class="h-3 w-3 rounded-full"
                  :class="template.color ? '' : 'bg-primary'"
                  :style="template.color ? { backgroundColor: template.color } : {}"
                />
                <div>
                  <p class="font-medium">{{ template.title }}</p>
                  <p class="text-xs text-muted-foreground">{{ template.taskType }} · {{ template.importance }}</p>
                </div>
              </div>
              <Badge :variant="getStatusVariant(template.status?.value)">
                {{ template.status?.value || '未知' }}
              </Badge>
            </CardContent>
          </Card>

          <p v-if="templates.length === 0" class="py-8 text-center text-sm text-muted-foreground">
            暂无任务模板
          </p>
        </div>
      </div>

      <!-- 实例管理 -->
      <div v-else class="space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold">任务实例</h2>
          <Button variant="outline" size="sm" @click="fetchInstances()">
            <RefreshCw class="mr-1 h-4 w-4" /> 刷新
          </Button>
        </div>

        <div class="space-y-2">
          <Card
            v-for="instance in instances"
            :key="instance.id"
            class="hover:bg-accent/50"
          >
            <CardContent class="flex items-center justify-between p-4">
              <div>
                <p class="font-medium">{{ instance.templateId }}</p>
                <p class="text-xs text-muted-foreground">{{ new Date(instance.instanceDate).toLocaleDateString() }}</p>
              </div>
              <div class="flex items-center gap-2">
                <Badge :variant="instance.status === 'COMPLETED' ? 'default' : 'outline'">
                  {{ instance.status }}
                </Badge>
                <Button
                  v-if="instance.status === 'PENDING'"
                  size="sm"
                  variant="outline"
                  @click="startInstance(instance.id)"
                >
                  开始
                </Button>
                <Button
                  v-if="instance.status === 'IN_PROGRESS'"
                  size="sm"
                  @click="completeInstance(instance.id)"
                >
                  完成
                </Button>
              </div>
            </CardContent>
          </Card>

          <p v-if="instances.length === 0" class="py-8 text-center text-sm text-muted-foreground">
            暂无任务实例
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { toast } from 'vue-sonner';
import { LayoutTemplate, ListTodo, Plus, RefreshCw } from 'lucide-vue-next';
import { Button, Card, CardContent, Badge } from '@dailyuse/ui-vue-shadcn';
import { useTask } from '../composables/useTask';

const {
  templates, instances,
  fetchTemplates, fetchInstances,
  startInstance, completeInstance,
} = useTask();

const activeTab = ref<'templates' | 'instances'>('templates');

function getStatusVariant(status?: string) {
  if (status === 'ACTIVE') return 'default' as const;
  if (status === 'PAUSED') return 'secondary' as const;
  if (status === 'ARCHIVED') return 'outline' as const;
  return 'secondary' as const;
}

function handleCreateTemplate() { toast.info('创建任务模板功能开发中'); }

onMounted(() => {
  fetchTemplates();
  fetchInstances();
});
</script>
