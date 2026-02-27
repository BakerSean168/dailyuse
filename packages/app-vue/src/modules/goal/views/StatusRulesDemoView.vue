<template>
  <div class="flex h-full flex-col p-6">
    <div class="mb-6">
      <h2 class="text-lg font-semibold">{{ t('goal.statusRulesDemo.title') }}</h2>
      <p class="text-sm text-muted-foreground">{{ t('goal.statusRulesDemo.subtitle') }}</p>
    </div>

    <ScrollArea class="flex-1">
      <div class="mx-auto max-w-3xl space-y-6">
        <!-- 规则编辑器 -->
        <Card>
          <CardHeader>
            <CardTitle class="flex items-center gap-2">
              <Settings class="h-4 w-4" /> {{ t('goal.statusRulesDemo.rulesConfig') }}
            </CardTitle>
            <CardDescription> {{ t('goal.statusRulesDemo.rulesConfigDesc') }} </CardDescription>
          </CardHeader>
          <CardContent>
            <StatusRuleEditor v-model:rules="rules" @save="handleSaveRules" />
          </CardContent>
        </Card>

        <!-- 时间线预览 -->
        <Card>
          <CardHeader>
            <CardTitle class="flex items-center gap-2">
              <Clock class="h-4 w-4" /> {{ t('goal.statusRulesDemo.rulesTimeline') }}
            </CardTitle>
            <CardDescription>{{ t('goal.statusRulesDemo.rulesTimelineDesc') }}</CardDescription>
          </CardHeader>
          <CardContent>
            <div v-if="rules.length === 0" class="py-8 text-center text-sm text-muted-foreground">
              {{ t('goal.statusRulesDemo.addRulesFirst') }}
            </div>
            <div v-else class="space-y-4">
              <div v-for="(rule, idx) in rules" :key="idx" class="flex items-start gap-3">
                <div
                  class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary"
                >
                  {{ idx + 1 }}
                </div>
                <div class="flex-1 rounded-lg border p-3">
                  <div class="flex items-center gap-2">
                    <Badge variant="outline">{{ rule.fromStatus }}</Badge>
                    <ArrowRight class="h-4 w-4 text-muted-foreground" />
                    <Badge>{{ rule.toStatus }}</Badge>
                  </div>
                  <p class="mt-1 text-xs text-muted-foreground">
                    {{ t('goal.statusRulesDemo.condition') }}
                    {{ rule.condition || t('goal.statusRulesDemo.none') }}
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
import { useI18n } from 'vue-i18n';
import { Settings, Clock, ArrowRight } from 'lucide-vue-next';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  ScrollArea,
  Badge,
} from '@dailyuse/ui-vue-shadcn';
import { StatusRuleEditor } from '../components';

const { t } = useI18n();

interface StatusRule {
  fromStatus: string;
  toStatus: string;
  condition: string;
}

const rules = ref<StatusRule[]>([]);

function handleSaveRules() {
  toast.success(t('goal.statusRulesDemo.rulesSaved'));
}
</script>
