<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref } from 'vue';
import type { Component } from 'vue';
import { useI18n } from 'vue-i18n';
import { ChevronDown } from '@lucide/vue';
import { Popover, PopoverContent, PopoverTrigger } from '@memoflow/ui-vue-shadcn';

const props = defineProps<{
  id: string;
  label: string;
  route: string;
  icon: Component;
  /** 未读/待办计数；null/0 不显示（Phase 5 / UI-008）。 */
  badge?: number | null;
}>();

const emit = defineEmits<{
  (e: 'open', payload: { id: string; route: string }): void;
}>();

defineSlots<{
  default?: (props: { closePreview: () => void }) => unknown;
}>();

const { t } = useI18n();

const open = ref(false);
const pinned = ref(false);
// Match the app-wide tooltip dwell so capsule previews feel consistent with other hover affordances.
const HOVER_OPEN_DELAY_MS = 300;
let openTimer: ReturnType<typeof setTimeout> | null = null;
let closeTimer: ReturnType<typeof setTimeout> | null = null;

function clearOpenTimer(): void {
  if (openTimer) {
    clearTimeout(openTimer);
    openTimer = null;
  }
}

function clearCloseTimer(): void {
  if (closeTimer) {
    clearTimeout(closeTimer);
    closeTimer = null;
  }
}

function openPreviewImmediately(): void {
  clearOpenTimer();
  clearCloseTimer();
  open.value = true;
}

function scheduleHoverOpen(): void {
  if (open.value || pinned.value || openTimer) return;
  clearCloseTimer();
  openTimer = setTimeout(() => {
    openTimer = null;
    if (!pinned.value) open.value = true;
  }, HOVER_OPEN_DELAY_MS);
}

function scheduleClose(): void {
  clearOpenTimer();
  if (pinned.value) return;
  clearCloseTimer();
  closeTimer = setTimeout(() => {
    if (!pinned.value) open.value = false;
    closeTimer = null;
  }, 180);
}

function focusPreviewContent(): void {
  const content = [
    ...document.querySelectorAll<HTMLElement>('[data-capsule-preview-content]'),
  ].find((entry) => entry.dataset.capsulePreviewContent === props.id);
  const target = content?.querySelector<HTMLElement>(
    'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
  );
  target?.focus({ preventScroll: true });
}

function togglePinned(event: MouseEvent): void {
  clearOpenTimer();
  clearCloseTimer();
  pinned.value = !pinned.value;
  open.value = pinned.value;
  if (pinned.value && event.detail === 0) {
    void nextTick(focusPreviewContent);
  }
}

function handleOpenChange(value: boolean): void {
  // PopoverTrigger also toggles the primitive. A pinned preview owns its open
  // state until an explicit trigger toggle, Escape, or outside interaction.
  if (!value && pinned.value) return;
  open.value = value;
  if (!value) pinned.value = false;
}

function dismissPreview(): void {
  clearOpenTimer();
  clearCloseTimer();
  pinned.value = false;
  open.value = false;
}

function enterModule(): void {
  open.value = false;
  pinned.value = false;
  emit('open', { id: props.id, route: props.route });
}

onBeforeUnmount(() => {
  clearOpenTimer();
  clearCloseTimer();
});
</script>

<template>
  <Popover :open="open" @update:open="handleOpenChange">
    <div
      class="flex shrink-0 items-center overflow-hidden rounded-full border border-border/70 bg-background/80 shadow-sm transition-colors hover:border-border hover:bg-accent/50"
      :data-testid="`capsule-${id}`"
    >
      <button
        type="button"
        class="module-capsule-main flex h-8 items-center gap-1.5 px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        :data-testid="`capsule-nav-${id}`"
        :title="label"
        @click="enterModule"
      >
        <component :is="icon" class="h-3.5 w-3.5" aria-hidden="true" />
        <span class="module-capsule-label">{{ label }}</span>
        <span
          v-if="typeof badge === 'number' && badge > 0"
          class="ml-0.5 flex h-4 min-w-4 shrink-0 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold leading-none text-white"
          :data-testid="`capsule-badge-${id}`"
          :aria-label="t('shell.moduleWithCount', { name: label, count: badge })"
        >
          {{ badge > 99 ? '99+' : badge }}
        </span>
      </button>

      <PopoverTrigger as-child>
        <button
          type="button"
          class="flex h-8 w-7 items-center justify-center border-l border-border/60 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          :data-testid="`capsule-preview-${id}`"
          :aria-label="t('shell.previewModule', { name: label })"
          :aria-expanded="open"
          aria-haspopup="dialog"
          @mouseenter="scheduleHoverOpen"
          @mouseleave="scheduleClose"
          @focus="openPreviewImmediately"
          @blur="scheduleClose"
          @click="togglePinned"
        >
          <ChevronDown class="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </PopoverTrigger>
    </div>

    <PopoverContent
      class="z-50 w-72 p-3 shadow-lg"
      align="start"
      :side-offset="8"
      :data-capsule-preview-content="id"
      @mouseenter="openPreviewImmediately"
      @mouseleave="scheduleClose"
      @focusin="openPreviewImmediately"
      @focusout="scheduleClose"
      @open-auto-focus.prevent
      @escape-key-down="dismissPreview"
      @pointer-down-outside="dismissPreview"
    >
      <slot :close-preview="dismissPreview" />
    </PopoverContent>
  </Popover>
</template>

<style scoped>
@media (max-width: 1000px) {
  .module-capsule-main {
    padding-inline: 0.5rem;
  }

  .module-capsule-label {
    display: none;
  }
}
</style>
