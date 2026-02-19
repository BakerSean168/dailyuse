<template>
  <div class="flex h-full flex-col p-6">
    <div class="mb-6 flex items-center gap-3">
      <Button variant="ghost" size="sm" @click="$router.back()">
        <ArrowLeft class="mr-1 h-4 w-4" /> 返回
      </Button>
      <Separator orientation="vertical" class="h-6" />
      <h2 class="text-lg font-semibold">创建复盘</h2>
    </div>

    <ScrollArea class="flex-1">
      <div class="mx-auto max-w-2xl space-y-6">
        <!-- 复盘类型 -->
        <div class="space-y-2">
          <Label>复盘类型</Label>
          <Select v-model="form.type">
            <SelectTrigger>
              <SelectValue placeholder="选择复盘类型" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="WEEKLY">每周复盘</SelectItem>
              <SelectItem value="MONTHLY">每月复盘</SelectItem>
              <SelectItem value="QUARTERLY">季度复盘</SelectItem>
              <SelectItem value="FINAL">最终复盘</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <!-- 评分 -->
        <div class="space-y-2">
          <Label>总体评分 (1-10)</Label>
          <div class="flex items-center gap-2">
            <Input v-model.number="form.rating" type="number" min="1" max="10" class="w-24" />
            <span class="text-sm text-muted-foreground">/ 10</span>
          </div>
        </div>

        <!-- 摘要 -->
        <div class="space-y-2">
          <Label>复盘摘要</Label>
          <Textarea v-model="form.summary" placeholder="总结本阶段的进展..." rows="3" />
        </div>

        <!-- 成就 -->
        <div class="space-y-2">
          <Label>主要成就</Label>
          <Textarea v-model="form.achievements" placeholder="完成了哪些重要事项..." rows="3" />
        </div>

        <!-- 挑战 -->
        <div class="space-y-2">
          <Label>遇到的挑战</Label>
          <Textarea v-model="form.challenges" placeholder="面临了哪些困难..." rows="3" />
        </div>

        <!-- 改进方向 -->
        <div class="space-y-2">
          <Label>改进方向</Label>
          <Textarea v-model="form.improvements" placeholder="下一阶段如何改进..." rows="3" />
        </div>

        <!-- 操作按钮 -->
        <div class="flex justify-end gap-3 pt-4">
          <Button variant="outline" @click="$router.back()">取消</Button>
          <Button :disabled="isSaving" @click="handleSubmit">
            {{ isSaving ? '保存中...' : '创建复盘' }}
          </Button>
        </div>
      </div>
    </ScrollArea>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { toast } from 'vue-sonner';
import { ArrowLeft } from 'lucide-vue-next';
import {
  Button, Input, Label, Textarea, ScrollArea, Separator,
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@dailyuse/ui-vue-shadcn';
import { useGoal } from '../composables/useGoal';

const route = useRoute();
const router = useRouter();
const goalId = route.params.goalId as string || route.params.id as string;

const { createReview, isSaving } = useGoal();

const form = reactive({
  type: 'WEEKLY' as string,
  rating: 7,
  summary: '',
  achievements: '',
  challenges: '',
  improvements: '',
});

async function handleSubmit() {
  if (!form.summary) {
    toast.warning('请填写复盘摘要');
    return;
  }
  const result = await createReview(goalId, {
    type: form.type as any,
    rating: form.rating,
    summary: form.summary,
    achievements: form.achievements,
    challenges: form.challenges,
    improvements: form.improvements,
  });
  if (result) {
    toast.success('复盘创建成功');
    router.back();
  }
}
</script>
