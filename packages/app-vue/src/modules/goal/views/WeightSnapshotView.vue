<template>
  <div class="flex h-full flex-col p-6">
    <div class="mb-6">
      <h2 class="text-lg font-semibold">权重管理</h2>
      <p class="text-sm text-muted-foreground">管理目标关键结果的权重分配与快照</p>
    </div>

    <Tabs v-model="activeTab" class="flex-1">
      <TabsList>
        <TabsTrigger value="comparison">权重对比</TabsTrigger>
        <TabsTrigger value="snapshots">权重快照</TabsTrigger>
        <TabsTrigger value="trend">权重趋势</TabsTrigger>
        <TabsTrigger value="suggestion">智能建议</TabsTrigger>
      </TabsList>

      <TabsContent value="comparison" class="mt-4">
        <Card>
          <CardHeader>
            <CardTitle>权重分配对比</CardTitle>
            <CardDescription>可视化比较不同关键结果的权重占比</CardDescription>
          </CardHeader>
          <CardContent>
            <WeightComparison
              v-if="keyResults.length > 0"
              :goal-id="goalId"
            />
            <p v-else class="py-8 text-center text-sm text-muted-foreground">
              暂无关键结果数据
            </p>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="snapshots" class="mt-4">
        <Card>
          <CardHeader>
            <CardTitle>权重快照历史</CardTitle>
            <CardDescription>查看权重调整的历史记录</CardDescription>
          </CardHeader>
          <CardContent>
            <WeightSnapshotList
              v-if="keyResults.length > 0"
              :goal-id="goalId"
            />
            <p v-else class="py-8 text-center text-sm text-muted-foreground">
              暂无快照数据
            </p>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="trend" class="mt-4">
        <Card>
          <CardHeader>
            <CardTitle>权重趋势</CardTitle>
            <CardDescription>权重随时间的变化趋势</CardDescription>
          </CardHeader>
          <CardContent>
            <WeightTrendChart
              v-if="keyResults.length > 0"
              :goal-id="goalId"
            />
            <p v-else class="py-8 text-center text-sm text-muted-foreground">
              暂无趋势数据
            </p>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="suggestion" class="mt-4">
        <Card>
          <CardHeader>
            <CardTitle>权重建议</CardTitle>
            <CardDescription>基于进度与目标分析的智能权重建议</CardDescription>
          </CardHeader>
          <CardContent>
            <WeightSuggestionPanel
              v-if="keyResults.length > 0"
              :key-results="keyResults"
            />
            <p v-else class="py-8 text-center text-sm text-muted-foreground">
              暂无分析数据
            </p>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent,
  Tabs, TabsList, TabsTrigger, TabsContent,
  WeightComparison, WeightSnapshotList, WeightTrendChart, WeightSuggestionPanel,
} from '@dailyuse/ui-vue-shadcn';
import { useGoal } from '../composables/useGoal';

const route = useRoute();
const goalId = route.params.goalId as string || route.params.id as string;

const { keyResults, fetchKeyResults } = useGoal();
const activeTab = ref('comparison');

onMounted(async () => {
  if (goalId) await fetchKeyResults(goalId);
});
</script>
