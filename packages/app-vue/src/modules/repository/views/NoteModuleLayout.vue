<template>
  <div
    class="flex h-full min-h-0 w-full flex-col overflow-hidden bg-background"
    data-testid="note-module-layout"
  >
    <NoteSegmentBar :active="activeSegment" @select="selectSegment" />
    <div class="min-h-0 flex-1 overflow-hidden">
      <router-view />
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * NoteModuleLayout — Note 模块壳（UI 重构 V2 §3 / §6 Note）
 *
 * 顶部固定 [笔记 | 规范] 分区切换；内容区渲染
 * `/repository`（含 `?note=` 深链）、`/governance/**`。
 * 深链打开 governance 时 activeSegment 自动落「规范」。
 */
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import NoteSegmentBar, { type NoteSegment } from '../components/NoteSegmentBar.vue';

const route = useRoute();
const router = useRouter();

const activeSegment = computed<NoteSegment>(() =>
  route.path === '/governance' || route.path.startsWith('/governance/')
    ? 'governance'
    : 'notes',
);

function selectSegment(segment: NoteSegment) {
  if (segment === activeSegment.value) return;
  if (segment === 'governance') {
    void router.push('/governance');
    return;
  }
  // 回笔记分区：优先工作区落地页（不强制保留某篇 note，避免跨分区脏状态）
  void router.push('/repository');
}
</script>
