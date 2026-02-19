<template>
  <div class="flex h-full flex-col p-6">
    <div class="mb-6 flex items-center justify-between">
      <h2 class="text-xl font-semibold">依赖验证演示</h2>
      <Button variant="outline" size="sm" @click="$router.back()">
        <ArrowLeft class="mr-1 h-4 w-4" /> 返回
      </Button>
    </div>

    <div class="grid grid-cols-2 gap-6">
      <!-- 任务列表 -->
      <Card>
        <CardHeader>
          <CardTitle class="text-base">任务列表</CardTitle>
        </CardHeader>
        <CardContent class="space-y-2">
          <div
            v-for="task in mockTasks"
            :key="task.id"
            class="flex items-center justify-between rounded-lg border p-3"
          >
            <div>
              <p class="font-medium">{{ task.title }}</p>
              <p class="text-xs text-muted-foreground">{{ task.id }}</p>
            </div>
            <Badge :variant="task.isBlocked ? 'destructive' : 'default'">
              {{ task.isBlocked ? '已阻塞' : '可执行' }}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <!-- 依赖关系 -->
      <Card>
        <CardHeader>
          <CardTitle class="text-base">依赖关系</CardTitle>
        </CardHeader>
        <CardContent class="space-y-2">
          <div
            v-for="dep in mockDependencies"
            :key="dep.id"
            class="flex items-center gap-2 rounded-lg border p-3 text-sm"
          >
            <span class="font-medium">{{ dep.predecessorTaskId }}</span>
            <ArrowRight class="h-4 w-4 text-muted-foreground" />
            <span class="font-medium">{{ dep.successorTaskId }}</span>
            <Badge variant="outline" class="ml-auto">{{ dep.dependencyType }}</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ArrowLeft, ArrowRight } from 'lucide-vue-next';
import { Button, Card, CardHeader, CardTitle, CardContent, Badge } from '@dailyuse/ui-vue-shadcn';

const mockTasks = ref([
  { id: 'task-1', title: '设计数据库模型', isBlocked: false },
  { id: 'task-2', title: '实现 API 接口', isBlocked: true },
  { id: 'task-3', title: '编写前端页面', isBlocked: true },
  { id: 'task-4', title: '编写测试', isBlocked: true },
]);

const mockDependencies = ref([
  { id: 'dep-1', predecessorTaskId: 'task-1', successorTaskId: 'task-2', dependencyType: 'FINISH_TO_START' },
  { id: 'dep-2', predecessorTaskId: 'task-2', successorTaskId: 'task-3', dependencyType: 'FINISH_TO_START' },
  { id: 'dep-3', predecessorTaskId: 'task-3', successorTaskId: 'task-4', dependencyType: 'FINISH_TO_START' },
]);
</script>
