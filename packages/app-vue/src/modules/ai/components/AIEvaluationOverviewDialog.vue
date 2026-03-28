<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="sm:max-w-5xl">
      <DialogHeader>
        <DialogTitle>{{ t('aiAssistant.dialogs.evaluation.title') }}</DialogTitle>
      </DialogHeader>

      <div class="space-y-4">
        <div class="flex justify-end">
          <Button variant="outline" :disabled="loading" @click="emit('refresh')">
            {{
              loading
                ? t('aiAssistant.dialogs.evaluation.refreshing')
                : t('aiAssistant.dialogs.evaluation.refresh')
            }}
          </Button>
        </div>

        <div v-if="overview" class="grid gap-4 lg:grid-cols-2">
          <div class="space-y-4">
            <div class="rounded-2xl border border-border/60 bg-background/80 p-4">
              <div class="flex items-center justify-between gap-3">
                <p class="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  {{ t('aiAssistant.dialogs.evaluation.deterministicEval') }}
                </p>
                <span
                  :class="[
                    'rounded-full px-3 py-1 text-[11px] font-medium',
                    !overview.latest.deterministic
                      ? 'bg-muted text-muted-foreground'
                      : overview.latest.deterministic.gatePassed
                        ? 'bg-emerald-100 text-emerald-900'
                        : 'bg-rose-100 text-rose-900',
                  ]"
                >
                  {{
                    !overview.latest.deterministic
                      ? t('aiAssistant.dialogs.evaluation.noReport')
                      : overview.latest.deterministic.gatePassed
                        ? t('aiAssistant.dialogs.evaluation.gatePassed')
                        : t('aiAssistant.dialogs.evaluation.gateFailed')
                  }}
                </span>
              </div>

              <div v-if="overview.latest.deterministic" class="mt-3 space-y-3">
                <p class="text-sm text-muted-foreground">
                  {{ formatEvalTimestamp(overview.latest.deterministic.generatedAt) }}
                </p>
                <div class="grid gap-2 sm:grid-cols-3">
                  <div class="rounded-xl border border-border/60 bg-muted/20 p-3">
                    <p class="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                      {{ t('aiAssistant.dialogs.evaluation.passRate') }}
                    </p>
                    <p class="mt-1 text-lg font-semibold">
                      {{ formatPassRate(overview.latest.deterministic.passRate) }}
                    </p>
                  </div>
                  <div class="rounded-xl border border-border/60 bg-muted/20 p-3">
                    <p class="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                      {{ t('aiAssistant.dialogs.evaluation.cases') }}
                    </p>
                    <p class="mt-1 text-lg font-semibold">
                      {{ overview.latest.deterministic.passedCases }}/{{ overview.latest.deterministic.totalCases }}
                    </p>
                  </div>
                  <div class="rounded-xl border border-border/60 bg-muted/20 p-3">
                    <p class="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                      {{ t('aiAssistant.dialogs.evaluation.failures') }}
                    </p>
                    <p class="mt-1 text-lg font-semibold">
                      {{ overview.latest.deterministic.failedCases }}
                    </p>
                  </div>
                </div>
                <div v-if="overview.latest.deterministic.gateFailures.length">
                  <p class="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    {{ t('aiAssistant.dialogs.evaluation.gateFailures') }}
                  </p>
                  <div class="mt-2 space-y-2">
                    <div
                      v-for="failure in overview.latest.deterministic.gateFailures"
                      :key="failure"
                      class="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900"
                    >
                      {{ failure }}
                    </div>
                  </div>
                </div>
                <div v-if="resolveFailedResults(overview.latest.deterministic).length">
                  <p class="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    {{ t('aiAssistant.dialogs.evaluation.failedCases') }}
                  </p>
                  <div class="mt-2 space-y-2">
                    <div
                      v-for="item in resolveFailedResults(overview.latest.deterministic)"
                      :key="item.id"
                      class="rounded-xl border border-border/60 bg-muted/20 p-3"
                    >
                      <p class="text-sm font-medium">{{ item.id }}</p>
                      <p class="mt-1 text-xs text-muted-foreground">{{ item.description }}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div
                v-else
                class="mt-3 rounded-2xl border border-dashed border-border/60 bg-muted/10 p-6 text-center text-sm text-muted-foreground"
              >
                {{ t('aiAssistant.dialogs.evaluation.noDeterministicReport') }}
              </div>
            </div>

            <div class="rounded-2xl border border-border/60 bg-background/80 p-4">
              <p class="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                {{ t('aiAssistant.dialogs.evaluation.recentDeterministicHistory') }}
              </p>
              <div v-if="overview.history.deterministic.length" class="mt-3 space-y-2">
                <div
                  v-for="entry in overview.history.deterministic"
                  :key="entry.fileName"
                  class="rounded-xl border border-border/60 bg-muted/20 p-3"
                >
                  <div class="flex items-center justify-between gap-3">
                    <p class="text-sm font-medium">{{ formatEvalTimestamp(entry.generatedAt) }}</p>
                    <span class="text-xs text-muted-foreground">
                      {{ formatPassRate(entry.passRate) }}
                    </span>
                  </div>
                  <p class="mt-1 text-xs text-muted-foreground">
                    {{
                      t('aiAssistant.dialogs.evaluation.archivedSummary', {
                        passed: entry.totalCases - entry.failedCases,
                        total: entry.totalCases,
                      })
                    }}
                  </p>
                </div>
              </div>
              <p v-else class="mt-3 text-sm text-muted-foreground">
                {{ t('aiAssistant.dialogs.evaluation.noArchivedDeterministicRuns') }}
              </p>
            </div>
          </div>

          <div class="space-y-4">
            <div class="rounded-2xl border border-border/60 bg-background/80 p-4">
              <div class="flex items-center justify-between gap-3">
                <p class="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  {{ t('aiAssistant.dialogs.evaluation.liveProviderEval') }}
                </p>
                <span
                  :class="[
                    'rounded-full px-3 py-1 text-[11px] font-medium',
                    !overview.latest.live
                      ? 'bg-muted text-muted-foreground'
                      : overview.latest.live.gatePassed
                        ? 'bg-emerald-100 text-emerald-900'
                        : 'bg-rose-100 text-rose-900',
                  ]"
                >
                  {{
                    !overview.latest.live
                      ? t('aiAssistant.dialogs.evaluation.noReport')
                      : overview.latest.live.gatePassed
                        ? t('aiAssistant.dialogs.evaluation.gatePassed')
                        : t('aiAssistant.dialogs.evaluation.gateFailed')
                  }}
                </span>
              </div>

              <div v-if="overview.latest.live" class="mt-3 space-y-3">
                <p class="text-sm text-muted-foreground">
                  {{ formatEvalTimestamp(overview.latest.live.generatedAt) }}
                </p>
                <div class="grid gap-2 sm:grid-cols-3">
                  <div class="rounded-xl border border-border/60 bg-muted/20 p-3">
                    <p class="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                      {{ t('aiAssistant.dialogs.evaluation.provider') }}
                    </p>
                    <p class="mt-1 text-lg font-semibold">
                      {{ overview.latest.live.provider || t('common.unknown') }}
                    </p>
                  </div>
                  <div class="rounded-xl border border-border/60 bg-muted/20 p-3">
                    <p class="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                      {{ t('aiAssistant.dialogs.evaluation.model') }}
                    </p>
                    <p class="mt-1 text-lg font-semibold">
                      {{ overview.latest.live.model || t('common.unknown') }}
                    </p>
                  </div>
                  <div class="rounded-xl border border-border/60 bg-muted/20 p-3">
                    <p class="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                      {{ t('aiAssistant.dialogs.evaluation.passRate') }}
                    </p>
                    <p class="mt-1 text-lg font-semibold">
                      {{ formatPassRate(overview.latest.live.passRate) }}
                    </p>
                  </div>
                </div>
                <div v-if="overview.latest.live.gateFailures.length">
                  <p class="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    {{ t('aiAssistant.dialogs.evaluation.gateFailures') }}
                  </p>
                  <div class="mt-2 space-y-2">
                    <div
                      v-for="failure in overview.latest.live.gateFailures"
                      :key="failure"
                      class="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900"
                    >
                      {{ failure }}
                    </div>
                  </div>
                </div>
                <div v-if="resolveFailedResults(overview.latest.live).length">
                  <p class="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    {{ t('aiAssistant.dialogs.evaluation.failedCases') }}
                  </p>
                  <div class="mt-2 space-y-2">
                    <div
                      v-for="item in resolveFailedResults(overview.latest.live)"
                      :key="item.id"
                      class="rounded-xl border border-border/60 bg-muted/20 p-3"
                    >
                      <p class="text-sm font-medium">{{ item.id }}</p>
                      <p class="mt-1 text-xs text-muted-foreground">{{ item.description }}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div
                v-else
                class="mt-3 rounded-2xl border border-dashed border-border/60 bg-muted/10 p-6 text-center text-sm text-muted-foreground"
              >
                {{ t('aiAssistant.dialogs.evaluation.noLiveReport') }}
              </div>
            </div>

            <div class="rounded-2xl border border-border/60 bg-background/80 p-4">
              <p class="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                {{ t('aiAssistant.dialogs.evaluation.recentLiveHistory') }}
              </p>
              <div v-if="overview.history.live.length" class="mt-3 space-y-2">
                <div
                  v-for="entry in overview.history.live"
                  :key="entry.fileName"
                  class="rounded-xl border border-border/60 bg-muted/20 p-3"
                >
                  <div class="flex items-center justify-between gap-3">
                    <p class="text-sm font-medium">{{ formatEvalTimestamp(entry.generatedAt) }}</p>
                    <span class="text-xs text-muted-foreground">
                      {{ formatPassRate(entry.passRate) }}
                    </span>
                  </div>
                  <p class="mt-1 text-xs text-muted-foreground">
                    {{ entry.provider || t('common.unknown') }} ·
                    {{ entry.model || t('common.unknown') }}
                  </p>
                </div>
              </div>
              <p v-else class="mt-3 text-sm text-muted-foreground">
                {{ t('aiAssistant.dialogs.evaluation.noArchivedLiveRuns') }}
              </p>
            </div>
          </div>
        </div>

        <div
          v-else
          class="flex min-h-[18rem] items-center justify-center rounded-2xl border border-dashed border-border/60 bg-muted/10 p-6 text-center text-sm text-muted-foreground"
        >
          {{
            loading
              ? t('aiAssistant.dialogs.evaluation.loading')
              : t('aiAssistant.dialogs.evaluation.empty')
          }}
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle } from '@dailyuse/ui-vue-shadcn';
import type { EvaluationOverview, EvaluationReport, EvaluationResult } from './ai-workspace-tool.types';

interface Props {
  open: boolean;
  loading: boolean;
  overview: EvaluationOverview | null;
}

defineProps<Props>();

const emit = defineEmits<{
  'update:open': [value: boolean];
  refresh: [];
}>();

const { t, locale } = useI18n();

function formatEvalTimestamp(value: string): string {
  return new Date(value).toLocaleString(locale.value);
}

function formatPassRate(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function resolveFailedResults(report?: EvaluationReport): EvaluationResult[] {
  return report?.results.filter((item) => !item.passed) ?? [];
}
</script>
