<script setup lang="ts">
import { computed, useId } from 'vue'
import { Input } from '../../../ui/input'
import { Label } from '../../../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../ui/select'
import { Switch } from '../../../ui/switch'
import DateField from '../date-time/DateField.vue'
import type {
  RecurrenceEditorEndMode,
  RecurrenceEditorFrequency,
  RecurrenceEditorLabels,
  RecurrenceEditorValue,
} from './types'

const defaultLabels: RecurrenceEditorLabels = {
  enabled: 'Repeat',
  frequency: 'Frequency',
  interval: 'Interval',
  every: 'Every',
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
  yearly: 'Yearly',
  weekdays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  ends: 'Ends',
  never: 'Never',
  onDate: 'On date',
  afterCount: 'After count',
  endDate: 'End date',
  occurrences: 'Occurrences',
}

const props = withDefaults(defineProps<{
  modelValue?: RecurrenceEditorValue | null
  id?: string
  disabled?: boolean
  locale?: string
  labels?: Partial<RecurrenceEditorLabels>
}>(), {
  modelValue: null,
  disabled: false,
  locale: 'en-US',
  labels: () => ({}),
})

const emit = defineEmits<{
  (event: 'update:modelValue', value: RecurrenceEditorValue | null): void
}>()

const generatedId = useId()
const baseId = computed(() => props.id ?? `recurrence-editor-${generatedId}`)
const copy = computed<RecurrenceEditorLabels>(() => ({
  ...defaultLabels,
  ...props.labels,
  weekdays: props.labels.weekdays ?? defaultLabels.weekdays,
}))

const frequencyOptions = computed(() => [
  { value: 'Daily' as const, label: copy.value.daily },
  { value: 'Weekly' as const, label: copy.value.weekly },
  { value: 'Monthly' as const, label: copy.value.monthly },
  { value: 'Yearly' as const, label: copy.value.yearly },
])
const endOptions = computed(() => [
  { value: 'never' as const, label: copy.value.never },
  { value: 'date' as const, label: copy.value.onDate },
  { value: 'count' as const, label: copy.value.afterCount },
])

function defaultValue(): RecurrenceEditorValue {
  return {
    frequency: 'Daily',
    interval: 1,
    daysOfWeek: [],
    endMode: 'never',
    endDate: null,
    occurrences: null,
  }
}

function patch(next: Partial<RecurrenceEditorValue>) {
  if (!props.modelValue) return
  emit('update:modelValue', { ...props.modelValue, ...next })
}

function setEnabled(value: boolean | null) {
  emit('update:modelValue', value ? defaultValue() : null)
}

function setFrequency(raw: unknown) {
  const frequency = String(raw) as RecurrenceEditorFrequency
  patch({
    frequency,
    ...(frequency === 'Weekly' ? {} : { daysOfWeek: [] }),
  })
}

function setInterval(raw: string | number) {
  const value = Math.max(1, Math.round(Number(raw) || 1))
  patch({ interval: value })
}

function toggleWeekday(day: number) {
  if (!props.modelValue) return
  const days = props.modelValue.daysOfWeek.includes(day)
    ? props.modelValue.daysOfWeek.filter((value) => value !== day)
    : [...props.modelValue.daysOfWeek, day].sort((a, b) => a - b)
  patch({ daysOfWeek: days })
}

function setEndMode(raw: unknown) {
  const endMode = String(raw) as RecurrenceEditorEndMode
  patch({
    endMode,
    endDate: endMode === 'date' ? props.modelValue?.endDate ?? null : null,
    occurrences: endMode === 'count' ? props.modelValue?.occurrences ?? 1 : null,
  })
}

function setOccurrences(raw: string | number) {
  patch({ occurrences: Math.max(1, Math.round(Number(raw) || 1)) })
}
</script>

<template>
  <div class="grid gap-3" :data-testid="`${baseId}-root`">
    <div class="flex items-center gap-2">
      <Switch
        :id="`${baseId}-enabled`"
        :model-value="Boolean(modelValue)"
        :disabled="disabled"
        @update:model-value="setEnabled"
      />
      <Label :for="`${baseId}-enabled`">{{ copy.enabled }}</Label>
    </div>

    <div v-if="modelValue" class="grid gap-3 rounded-md border bg-muted/20 p-3">
      <div class="grid gap-3 sm:grid-cols-2">
        <div class="grid gap-1.5">
          <Label :for="`${baseId}-frequency`">{{ copy.frequency }}</Label>
          <Select :model-value="modelValue.frequency" :disabled="disabled" @update:model-value="setFrequency">
            <SelectTrigger :id="`${baseId}-frequency`">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="option in frequencyOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="grid gap-1.5">
          <Label :for="`${baseId}-interval`">{{ copy.interval }}</Label>
          <div class="relative">
            <Input
              :id="`${baseId}-interval`"
              type="number"
              min="1"
              step="1"
              class="pr-16"
              :model-value="modelValue.interval"
              :disabled="disabled"
              @update:model-value="setInterval"
            />
            <span class="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-muted-foreground">
              {{ copy.every }}
            </span>
          </div>
        </div>
      </div>

      <div v-if="modelValue.frequency === 'Weekly'" class="grid gap-1.5">
        <span class="text-sm font-medium">{{ copy.weekly }}</span>
        <div class="flex flex-wrap gap-1.5">
          <button
            v-for="(weekday, day) in copy.weekdays"
            :key="day"
            type="button"
            role="checkbox"
            :aria-checked="modelValue.daysOfWeek.includes(day)"
            :disabled="disabled"
            class="h-8 min-w-9 rounded-md border px-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
            :class="modelValue.daysOfWeek.includes(day) ? 'border-primary bg-primary text-primary-foreground' : 'bg-background hover:bg-accent'"
            @click="toggleWeekday(day)"
          >
            {{ weekday }}
          </button>
        </div>
      </div>

      <div class="grid gap-1.5">
        <Label :for="`${baseId}-ends`">{{ copy.ends }}</Label>
        <Select :model-value="modelValue.endMode" :disabled="disabled" @update:model-value="setEndMode">
          <SelectTrigger :id="`${baseId}-ends`">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="option in endOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DateField
        v-if="modelValue.endMode === 'date'"
        :id="`${baseId}-end-date`"
        :model-value="modelValue.endDate"
        :label="copy.endDate"
        :locale="locale"
        :disabled="disabled"
        @update:model-value="patch({ endDate: $event })"
      />

      <div v-else-if="modelValue.endMode === 'count'" class="grid gap-1.5">
        <Label :for="`${baseId}-occurrences`">{{ copy.occurrences }}</Label>
        <Input
          :id="`${baseId}-occurrences`"
          type="number"
          min="1"
          step="1"
          :model-value="modelValue.occurrences ?? 1"
          :disabled="disabled"
          @update:model-value="setOccurrences"
        />
      </div>
    </div>
  </div>
</template>
