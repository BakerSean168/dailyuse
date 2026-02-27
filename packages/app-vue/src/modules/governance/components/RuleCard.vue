<template>
  <div
    class="group border rounded-lg p-4 cursor-pointer transition-colors hover:border-primary/50 hover:shadow-sm"
    :class="{ 'opacity-60': rule.status === 'Deprecated' }"
    @click="$emit('click', rule)"
  >
    <!-- Header -->
    <div class="flex items-start justify-between gap-2 mb-2">
      <div class="flex items-center gap-2 min-w-0">
        <component
          :is="severityIcon"
          :size="16"
          :class="rule.severity === 'Mandatory' ? 'text-destructive' : 'text-blue-500'"
          class="shrink-0"
        />
        <div class="min-w-0">
          <div class="flex items-center gap-2">
            <span class="text-sm text-muted-foreground font-mono">{{ rule.code }}</span>
            <span class="text-sm font-medium truncate">{{ rule.title }}</span>
          </div>
        </div>
      </div>
      <RuleStatusBadge :status="rule.status" />
    </div>

    <!-- Description -->
    <p class="text-sm text-muted-foreground line-clamp-2 mb-3">
      {{ truncatedDescription }}
    </p>

    <!-- Footer -->
    <div class="flex items-center justify-between">
      <!-- Tags -->
      <div class="flex items-center gap-1 flex-wrap">
        <span
          v-for="tag in rule.tags"
          :key="tag.value"
          class="inline-flex items-center px-2 py-0.5 rounded text-[11px] bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
        >
          {{ tag.value }}
        </span>
      </div>

      <!-- Counters -->
      <div class="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
        <span v-if="rule.goodExamples.length > 0" class="flex items-center gap-0.5">
          <CheckCircle :size="12" class="text-green-500" />
          {{ rule.goodExamples.length }}
        </span>
        <span v-if="rule.badExamples.length > 0" class="flex items-center gap-0.5">
          <XCircle :size="12" class="text-destructive" />
          {{ rule.badExamples.length }}
        </span>
        <span>{{ formatDate(rule.updatedAt) }}</span>
      </div>
    </div>

    <!-- Deprecation warning -->
    <div
      v-if="rule.status === 'Deprecated' && rule.deprecationReason"
      class="mt-3 p-2 rounded-md bg-yellow-50 dark:bg-yellow-900/20 text-sm text-yellow-800 dark:text-yellow-400 flex items-start gap-2"
    >
      <AlertTriangle :size="14" class="shrink-0 mt-0.5" />
      {{ rule.deprecationReason }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { AlertCircle, Info, CheckCircle, XCircle, AlertTriangle } from 'lucide-vue-next';
import RuleStatusBadge from './RuleStatusBadge.vue';
import type { RuleClientDTO } from '../types';

const props = defineProps<{
  rule: RuleClientDTO;
}>();

defineEmits<{
  click: [rule: RuleClientDTO];
}>();

const truncatedDescription = computed(() => {
  const desc = props.rule.description;
  return desc.length > 150 ? `${desc.slice(0, 150)}…` : desc;
});

const severityIcon = computed(() => (props.rule.severity === 'Mandatory' ? AlertCircle : Info));

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
}
</script>
