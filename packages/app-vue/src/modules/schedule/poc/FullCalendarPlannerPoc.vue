<template>
  <section
    class="planner-fullcalendar-poc"
    :class="[`planner-fullcalendar-poc--${theme}`, { 'is-narrow': narrow }]"
    aria-label="FullCalendar Standard Planner proof of concept"
    data-testid="planner-fullcalendar-poc"
  >
    <FullCalendar :options="calendarOptions">
      <template #eventContent="{ event, timeText }">
        <div
          class="planner-poc-event"
          :class="`tone-${event.extendedProps.projection.displayMetadata.tone ?? 'default'}`"
          :aria-label="`${event.title}. ${event.extendedProps.projection.displayMetadata.subtitle ?? ''}`"
        >
          <strong v-if="timeText" class="planner-poc-event__time">{{ timeText }}</strong>
          <span class="planner-poc-event__title">{{ event.title }}</span>
          <small class="planner-poc-event__subtitle">
            {{ event.extendedProps.projection.displayMetadata.subtitle }}
          </small>
        </div>
      </template>
    </FullCalendar>
    <output class="sr-only" aria-live="polite" data-testid="planner-poc-selection">
      {{ lastSelectionLabel }}
    </output>
  </section>
</template>

<script setup lang="ts">
import 'temporal-polyfill/global';
import '@fullcalendar/vue3/skeleton.css';
import FullCalendar from '@fullcalendar/vue3';
import { computed, ref } from 'vue';
import { createFullCalendarPlannerPocOptions } from './fullcalendar-planner-poc.adapter';
import {
  plannerPocFixture,
  type CalendarEventProjectionFixture,
  type PlannerOwnerCommandPort,
} from './fullcalendar-planner-poc.model';

const props = withDefaults(
  defineProps<{
    ownerCommands: PlannerOwnerCommandPort;
    projections?: readonly CalendarEventProjectionFixture[];
    narrow?: boolean;
    theme?: 'light' | 'dark';
  }>(),
  {
    projections: () => plannerPocFixture,
    narrow: false,
    theme: 'light',
  },
);

const lastSelectionLabel = ref('No selection');
const calendarOptions = computed(() =>
  createFullCalendarPlannerPocOptions({
    projections: props.projections,
    ownerCommands: props.ownerCommands,
    onSelect(selection) {
      lastSelectionLabel.value = `${selection.start} – ${selection.end}`;
    },
  }),
);
</script>

<style scoped>
.planner-fullcalendar-poc {
  --planner-fc-bg: hsl(0 0% 100%);
  --planner-fc-fg: hsl(222 47% 11%);
  --planner-fc-border: hsl(214 32% 91%);
  --planner-fc-muted: hsl(215 16% 47%);
  min-height: 520px;
  height: 100%;
  padding: 12px;
  overflow: hidden;
  color: var(--planner-fc-fg);
  background: var(--planner-fc-bg);
}

.planner-fullcalendar-poc--dark {
  --planner-fc-bg: hsl(222 47% 8%);
  --planner-fc-fg: hsl(210 40% 98%);
  --planner-fc-border: hsl(217 33% 22%);
  --planner-fc-muted: hsl(215 20% 65%);
  color-scheme: dark;
}

.planner-fullcalendar-poc :deep(.fc) {
  height: 100%;
  color: var(--planner-fc-fg);
  background: var(--planner-fc-bg);
}

.planner-fullcalendar-poc :deep(.fc-theme-standard td),
.planner-fullcalendar-poc :deep(.fc-theme-standard th),
.planner-fullcalendar-poc :deep(.fc-theme-standard .fc-scrollgrid) {
  border-color: var(--planner-fc-border);
}

.planner-fullcalendar-poc.is-narrow :deep(.fc-header-toolbar) {
  align-items: stretch;
  flex-direction: column;
  gap: 8px;
}

.planner-fullcalendar-poc.is-narrow :deep(.fc-toolbar-chunk) {
  display: flex;
  justify-content: center;
}

.planner-poc-event {
  display: grid;
  min-width: 0;
  gap: 1px;
  padding: 1px 2px;
}

.planner-poc-event__time,
.planner-poc-event__title,
.planner-poc-event__subtitle {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.planner-poc-event__subtitle {
  color: var(--planner-fc-muted);
}

.tone-muted {
  opacity: 0.72;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>
