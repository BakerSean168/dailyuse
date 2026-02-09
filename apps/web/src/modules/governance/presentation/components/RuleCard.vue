<template>
  <v-card
    class="rule-card"
    :class="{ 'rule-card--deprecated': rule.status === 'Deprecated' }"
    variant="outlined"
    hover
    @click="$emit('click', rule)"
  >
    <v-card-item>
      <template #prepend>
        <v-icon
          :icon="severityIcon"
          :color="severityColor"
          size="small"
        />
      </template>

      <v-card-title class="text-subtitle-1 font-weight-medium">
        <span class="text-medium-emphasis mr-2">{{ rule.code }}</span>
        {{ rule.title }}
      </v-card-title>

      <template #append>
        <RuleStatusBadge :status="rule.status" />
      </template>
    </v-card-item>

    <v-card-text class="pt-0">
      <p class="text-body-2 text-medium-emphasis description-text">
        {{ truncatedDescription }}
      </p>

      <div class="d-flex align-center mt-2 flex-wrap ga-1">
        <v-chip
          v-for="tag in rule.tags"
          :key="tag"
          size="x-small"
          variant="tonal"
          color="info"
          label
        >
          {{ tag }}
        </v-chip>

        <v-spacer />

        <div class="d-flex align-center ga-2 text-caption text-medium-emphasis">
          <span v-if="rule.goodExamples.length > 0">
            <v-icon size="x-small" icon="mdi-check" color="success" />
            {{ rule.goodExamples.length }}
          </span>
          <span v-if="rule.badExamples.length > 0">
            <v-icon size="x-small" icon="mdi-close" color="error" />
            {{ rule.badExamples.length }}
          </span>
          <span>
            {{ formatDate(rule.updatedAt) }}
          </span>
        </div>
      </div>

      <!-- Deprecation warning -->
      <v-alert
        v-if="rule.status === 'Deprecated' && rule.deprecationReason"
        type="warning"
        variant="tonal"
        density="compact"
        class="mt-2"
        icon="mdi-alert"
      >
        {{ rule.deprecationReason }}
      </v-alert>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { RuleClientDTO } from '../../types';
import RuleStatusBadge from './RuleStatusBadge.vue';

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

const severityIcon = computed(() =>
  props.rule.severity === 'Mandatory' ? 'mdi-alert-circle' : 'mdi-information',
);

const severityColor = computed(() =>
  props.rule.severity === 'Mandatory' ? 'error' : 'info',
);

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
}
</script>

<style scoped>
.rule-card {
  transition: border-color 0.2s;
}

.rule-card--deprecated {
  opacity: 0.7;
}

.description-text {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
