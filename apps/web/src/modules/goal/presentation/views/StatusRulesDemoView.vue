<template>
  <div class="flex h-full flex-col p-6">
    <div class="mb-6">
      <h2 class="text-lg font-semibold">状态规则演示</h2>
      <p class="text-sm text-muted-foreground">配置目标的自动状态转换规则</p>
    </div>

    <ScrollArea class="flex-1">
      <div class="mx-auto max-w-3xl space-y-6">
        <!-- 规则编辑器 -->
        <Card>
          <CardHeader>
            <CardTitle class="flex items-center gap-2">
              <Settings class="h-4 w-4" /> 状态规则配置
            </CardTitle>
            <CardDescription>
              定义当特定条件满足时，目标状态的自动转换规则
            </CardDescription>
          </CardHeader>
          <CardContent>
            <StatusRuleEditor
              v-model:rules="rules"
              @save="handleSaveRules"
            />
          </CardContent>
        </Card>

        <!-- 时间线预览 -->
        <Card>
          <CardHeader>
            <CardTitle class="flex items-center gap-2">
              <Clock class="h-4 w-4" /> 规则时间线
            </CardTitle>
            <CardDescription>规则触发的时间线模拟</CardDescription>
          </CardHeader>
          <CardContent>
            <div v-if="rules.length === 0" class="py-8 text-center text-sm text-muted-foreground">
              请先添加规则
            </div>
            <div v-else class="space-y-4">
              <div
                v-for="(rule, idx) in rules"
                :key="idx"
                class="flex items-start gap-3"
              >
                <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                  {{ idx + 1 }}
                </div>
                <div class="flex-1 rounded-lg border p-3">
                  <div class="flex items-center gap-2">
                    <Badge variant="outline">{{ rule.fromStatus }}</Badge>
                    <ArrowRight class="h-4 w-4 text-muted-foreground" />
                    <Badge>{{ rule.toStatus }}</Badge>
                  </div>
                  <p class="mt-1 text-xs text-muted-foreground">
                    条件: {{ rule.condition || '无' }}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { toast } from 'vue-sonner';
import { Settings, Clock, ArrowRight } from 'lucide-vue-next';
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent,
  ScrollArea, Badge, StatusRuleEditor,
} from '@dailyuse/ui-vue-shadcn';

interface StatusRule {
  fromStatus: string;
  toStatus: string;
  condition: string;
}

const rules = ref<StatusRule[]>([]);

function handleSaveRules() {
  toast.success('状态规则已保存');
}
</script>
