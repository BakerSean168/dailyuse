<script setup lang="ts">
/**
 * NoteCapsulePreview — 笔记胶囊摘要（§10）
 * Web 使用 GitHub projection；Desktop 使用 Local Vault 扫描。
 * 不再读取已退役的数据库 Repository/Resource CRUD。
 */
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRecentKnowledgeNotes } from '../../../modules/repository/composables/useRecentKnowledgeNotes';

const RECENT_LIMIT = 4;
const CACHE_MS = 45_000;

defineEmits<{
  'view-all': [];
  select: [id: string];
}>();

const { t } = useI18n();
const recentNotes = useRecentKnowledgeNotes();

const loadedAt = ref(0);

const recent = computed(() => recentNotes.notes.value.slice(0, RECENT_LIMIT));
const totalCount = computed(() => recentNotes.notes.value.length);
const isLoading = computed(() => recentNotes.isLoading.value);
const localError = computed(() => recentNotes.error.value);

function titleOf(item: { title: string; path: string; id: string }) {
  return item.title || item.path || item.id;
}

async function load(force = false) {
  if (!force && loadedAt.value && Date.now() - loadedAt.value < CACHE_MS) return;
  await recentNotes.load(Math.max(RECENT_LIMIT, 20));
  loadedAt.value = Date.now();
}

onMounted(() => {
  void load();
});
</script>

<template>
  <div class="flex max-h-80 flex-col" data-testid="note-capsule-preview">
    <div class="mb-2 flex items-center justify-between gap-2 border-b border-border/40 pb-1.5">
      <p class="text-xs font-bold">{{ t('nav.capsule.note') }}</p>
      <span class="font-mono text-[10px] text-muted-foreground" data-testid="note-capsule-count">
        {{ totalCount }}
      </span>
    </div>

    <div v-if="isLoading && recent.length === 0" class="space-y-2 py-2" data-testid="note-capsule-loading">
      <div v-for="i in 3" :key="i" class="h-8 animate-pulse rounded bg-muted" />
    </div>

    <div v-else-if="localError" class="space-y-2 py-3 text-center" data-testid="note-capsule-error">
      <p class="text-[11px] text-muted-foreground">{{ localError }}</p>
      <button type="button" class="text-[11px] font-medium text-primary" data-testid="note-capsule-retry" @click="load(true)">
        {{ t('common.retry') }}
      </button>
    </div>

    <div
      v-else-if="recent.length === 0"
      class="py-4 text-center text-[11px] text-muted-foreground"
      data-testid="note-capsule-empty"
    >
      {{ t('shell.preview.noteEmpty') }}
    </div>

    <ul v-else class="min-h-0 flex-1 space-y-1 overflow-y-auto" data-testid="note-capsule-list">
      <li v-for="item in recent" :key="item.id">
        <button
          type="button"
          class="w-full rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-accent"
          :data-testid="`note-capsule-item-${item.id}`"
          @click="$emit('select', String(item.id))"
        >
          <p class="truncate text-[11px] font-semibold leading-4">{{ titleOf(item) }}</p>
          <p class="mt-0.5 truncate text-[10px] text-muted-foreground">
            {{ item.path || t('shell.preview.noteResource') }}
          </p>
        </button>
      </li>
    </ul>

    <button
      type="button"
      class="mt-2 block w-full rounded-lg border border-border/60 bg-accent py-1.5 text-center text-xs font-medium transition-colors hover:bg-accent/80"
      data-testid="note-capsule-view-all"
      @click="$emit('view-all')"
    >
      {{ t('shell.enterModule') }}
    </button>
  </div>
</template>
