<template>
  <!-- Phase 2：自带唯一主滚动宿主。 -->
  <div class="h-full min-h-0 overflow-y-auto" data-scroll-host="governance-history">
    <div class="max-w-[960px] mx-auto p-6">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold">{{ t('governance.revision.title') }}</h1>
        <p v-if="currentRule" class="text-sm text-muted-foreground mt-1">
          {{ currentRule.code }} · {{ currentRule.title }}
        </p>
      </div>
      <router-link
        :to="{ name: 'governance-detail', params: { id: props.id } }"
        class="px-3 py-1.5 rounded-md border text-sm hover:bg-muted transition-colors"
      >
        {{ t('governance.revision.backToDetail') }}
      </router-link>
    </div>

    <div v-if="isLoading" class="flex justify-center py-10">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>

    <div v-else-if="error" class="p-4 rounded-md bg-destructive/10 text-destructive text-sm mb-4">
      {{ error }}
    </div>

    <div
      v-else-if="revisions.length === 0"
      class="rounded-lg border p-6 text-center text-sm text-muted-foreground"
    >
      {{ t('governance.revision.empty') }}
    </div>

    <div v-else class="space-y-4 relative">
      <div class="absolute left-4 top-2 bottom-2 w-px bg-border"></div>
      <div v-for="revision in revisions" :key="revision.id" class="relative pl-10">
        <div
          class="absolute left-[9px] top-6 w-3 h-3 rounded-full bg-primary border-2 border-background"
        ></div>
        <RevisionCard :revision="revision" />
      </div>
    </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useGovernance } from '../composables/useGovernance';
import RevisionCard from '../components/RevisionCard.vue';

const { t } = useI18n();

const props = defineProps<{
  id: string;
}>();

const { currentRule, revisions, isLoading, error, fetchRule, fetchRevisions } = useGovernance();

async function loadHistory(id: string) {
  await fetchRule(id);
  await fetchRevisions(id);
}

onMounted(() => loadHistory(props.id));

watch(
  () => props.id,
  (newId) => {
    if (newId) {
      loadHistory(newId);
    }
  },
);
</script>
