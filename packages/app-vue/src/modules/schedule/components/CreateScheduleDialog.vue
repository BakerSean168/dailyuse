<template>
  <Dialog :open="modelValue" @update:open="$emit('update:modelValue', $event)">
    <DialogContent class="max-w-2xl">
      <DialogHeader>
        <DialogTitle>{{
          isEditing ? t('schedule.createDialog.titleEdit') : t('schedule.createDialog.titleCreate')
        }}</DialogTitle>
      </DialogHeader>

      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div class="space-y-4">
          <!-- 标题 -->
          <div>
            <Label for="title">{{ t('schedule.createDialog.fieldTitle') }}</Label>
            <Input
              id="title"
              v-model="formData.title"
              :placeholder="t('schedule.createDialog.fieldTitlePlaceholder')"
              maxlength="200"
              required
            />
            <p class="text-sm text-muted-foreground mt-1">{{ formData.title.length }}/200</p>
          </div>

          <!-- 描述 -->
          <div>
            <Label for="description">{{ t('schedule.createDialog.fieldDescription') }}</Label>
            <Textarea
              id="description"
              v-model="formData.description"
              :placeholder="t('schedule.createDialog.fieldDescriptionPlaceholder')"
              rows="3"
              maxlength="1000"
            />
            <p class="text-sm text-muted-foreground mt-1">{{ formData.description.length }}/1000</p>
          </div>

          <!-- 开始时间 -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <Label for="startDate">{{ t('schedule.createDialog.fieldStartDate') }}</Label>
              <Popover>
                <PopoverTrigger as-child>
                  <Button
                    variant="outline"
                    class="w-full justify-start text-left font-normal"
                    :class="{ 'text-muted-foreground': !formData.startDate }"
                  >
                    <CalendarIcon class="mr-2 h-4 w-4" />
                    {{
                      formData.startDate
                        ? formatDisplayDate(formData.startDate)
                        : t('schedule.createDialog.fieldStartDate')
                    }}
                  </Button>
                </PopoverTrigger>
                <PopoverContent class="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    :selected="parseToDate(formData.startDate)"
                    @update:model-value="
                      (d: Date | undefined) =>
                        handleCalendarSelect(d, (v) => {
                          formData.startDate = v;
                        })
                    "
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label for="startTime">{{ t('schedule.createDialog.fieldStartTime') }}</Label>
              <div class="flex gap-2 items-center">
                <Select
                  :model-value="startHour"
                  @update:model-value="
                    (v) => {
                      startHour = String(v);
                      syncStartTime();
                    }
                  "
                >
                  <SelectTrigger class="w-[80px]"><SelectValue placeholder="HH" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem v-for="h in hourOptions" :key="h" :value="h">{{ h }}</SelectItem>
                  </SelectContent>
                </Select>
                <span class="font-medium">:</span>
                <Select
                  :model-value="startMinute"
                  @update:model-value="
                    (v) => {
                      startMinute = String(v);
                      syncStartTime();
                    }
                  "
                >
                  <SelectTrigger class="w-[80px]"><SelectValue placeholder="MM" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem v-for="m in minuteOptions" :key="m" :value="m">{{ m }}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <!-- 结束时间 -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <Label for="endDate">{{ t('schedule.createDialog.fieldEndDate') }}</Label>
              <Popover>
                <PopoverTrigger as-child>
                  <Button
                    variant="outline"
                    class="w-full justify-start text-left font-normal"
                    :class="{ 'text-muted-foreground': !formData.endDate }"
                  >
                    <CalendarIcon class="mr-2 h-4 w-4" />
                    {{
                      formData.endDate
                        ? formatDisplayDate(formData.endDate)
                        : t('schedule.createDialog.fieldEndDate')
                    }}
                  </Button>
                </PopoverTrigger>
                <PopoverContent class="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    :selected="parseToDate(formData.endDate)"
                    @update:model-value="
                      (d: Date | undefined) =>
                        handleCalendarSelect(d, (v) => {
                          formData.endDate = v;
                        })
                    "
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label for="endTime">{{ t('schedule.createDialog.fieldEndTime') }}</Label>
              <div class="flex gap-2 items-center">
                <Select
                  :model-value="endHour"
                  @update:model-value="
                    (v) => {
                      endHour = String(v);
                      syncEndTime();
                    }
                  "
                >
                  <SelectTrigger class="w-[80px]"><SelectValue placeholder="HH" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem v-for="h in hourOptions" :key="h" :value="h">{{ h }}</SelectItem>
                  </SelectContent>
                </Select>
                <span class="font-medium">:</span>
                <Select
                  :model-value="endMinute"
                  @update:model-value="
                    (v) => {
                      endMinute = String(v);
                      syncEndTime();
                    }
                  "
                >
                  <SelectTrigger class="w-[80px]"><SelectValue placeholder="MM" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem v-for="m in minuteOptions" :key="m" :value="m">{{ m }}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <!-- 优先级 -->
          <div>
            <Label for="priority">{{ t('schedule.createDialog.fieldPriority') }}</Label>
            <Select v-model="formData.priority">
              <SelectTrigger>
                <SelectValue :placeholder="t('schedule.createDialog.fieldPriorityPlaceholder')" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">{{ t('schedule.createDialog.priorityNone') }}</SelectItem>
                <SelectItem value="1">{{ t('schedule.createDialog.priorityLowest') }}</SelectItem>
                <SelectItem value="2">{{ t('schedule.createDialog.priorityVeryLow') }}</SelectItem>
                <SelectItem value="3">{{ t('schedule.createDialog.priorityLow') }}</SelectItem>
                <SelectItem value="4">{{
                  t('schedule.createDialog.priorityBelowMedium')
                }}</SelectItem>
                <SelectItem value="5">{{ t('schedule.createDialog.priorityMedium') }}</SelectItem>
                <SelectItem value="6">{{
                  t('schedule.createDialog.priorityAboveMedium')
                }}</SelectItem>
                <SelectItem value="7">{{ t('schedule.createDialog.priorityHigh') }}</SelectItem>
                <SelectItem value="8">{{ t('schedule.createDialog.priorityVeryHigh') }}</SelectItem>
                <SelectItem value="9">{{ t('schedule.createDialog.priorityExtreme') }}</SelectItem>
                <SelectItem value="10">{{ t('schedule.createDialog.priorityHighest') }}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <!-- 自动检测冲突 -->
          <div class="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label for="auto-detect-conflicts" class="text-sm font-medium">{{
                t('schedule.createDialog.autoDetectConflicts')
              }}</Label>
              <p class="text-xs text-muted-foreground">
                {{ t('schedule.createDialog.autoDetectConflictsDescription') }}
              </p>
            </div>
            <Switch
              id="auto-detect-conflicts"
              :checked="formData.autoDetectConflicts"
              @update:checked="formData.autoDetectConflicts = $event"
            />
          </div>

          <!-- 地点 -->
          <div>
            <Label for="location">{{ t('schedule.createDialog.fieldLocation') }}</Label>
            <div class="relative">
              <MapPin class="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="location"
                v-model="formData.location"
                :placeholder="t('schedule.createDialog.fieldLocationPlaceholder')"
                class="pl-10"
                maxlength="200"
              />
            </div>
            <p class="text-sm text-muted-foreground mt-1">{{ formData.location.length }}/200</p>
          </div>

          <!-- 参与者 -->
          <div>
            <Label>{{ t('schedule.createDialog.fieldAttendees') }}</Label>
            <div class="flex flex-wrap gap-2 mb-2">
              <Badge
                v-for="(attendee, index) in formData.attendees"
                :key="index"
                variant="secondary"
                class="gap-1"
              >
                {{ attendee }}
                <button
                  type="button"
                  @click="removeAttendee(index)"
                  class="hover:bg-destructive/20 rounded-full"
                >
                  <X class="h-3 w-3" />
                </button>
              </Badge>
            </div>
            <div class="flex gap-2">
              <Input
                v-model="newAttendee"
                :placeholder="t('schedule.createDialog.fieldAttendeePlaceholder')"
                @keydown.enter.prevent="addAttendee"
              />
              <Button type="button" variant="outline" size="sm" @click="addAttendee">
                {{ t('schedule.createDialog.addAttendee') }}
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" @click="handleClose">
            {{ t('common.cancel') }}
          </Button>
          <Button type="submit" :disabled="loading">
            <Loader2 v-if="loading" class="mr-2 h-4 w-4 animate-spin" />
            {{ isEditing ? t('common.save') : t('common.create') }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Input,
  Textarea,
  Button,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Badge,
  Switch,
  Popover,
  PopoverTrigger,
  PopoverContent,
  Calendar,
} from '@dailyuse/ui-vue-shadcn';
import { MapPin, X, Loader2, Calendar as CalendarIcon } from '@lucide/vue';
import { useI18n } from 'vue-i18n';
import type { CalendarEntryClientDTO, CreateScheduleRequest } from '@dailyuse/contracts/schedule';

interface Props {
  modelValue: boolean;
  schedule?: CalendarEntryClientDTO | null;
  loading?: boolean;
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void;
  (e: 'submit', data: CreateScheduleRequest): void;
}

const props = withDefaults(defineProps<Props>(), {
  schedule: null,
  loading: false,
});

const emit = defineEmits<Emits>();

const { t } = useI18n();

// ── Time picker options ────────────────────────────────────────────────
const hourOptions = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const minuteOptions = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

// ── Calendar/DateTime helpers ──────────────────────────────────────────

function formatDateToYMD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function parseToDate(dateStr: string): Date | undefined {
  if (!dateStr) return undefined;
  return new Date(dateStr + 'T00:00:00');
}

function handleCalendarSelect(date: unknown, setter: (v: string) => void) {
  if (date instanceof Date) {
    setter(formatDateToYMD(date));
  } else if (date && typeof date === 'object' && 'toDate' in date) {
    setter(formatDateToYMD((date as { toDate: () => Date }).toDate()));
  } else {
    setter('');
  }
}

/** Split HH:MM string into hour/minute parts */
function splitTime(timeStr: string): { hour: string; minute: string } {
  if (!timeStr) return { hour: '00', minute: '00' };
  const [h, m] = timeStr.split(':');
  return { hour: h || '00', minute: m || '00' };
}

// ── Time select state ──────────────────────────────────────────────────
const startHour = ref('00');
const startMinute = ref('00');
const endHour = ref('00');
const endMinute = ref('00');

function syncStartTime() {
  formData.startTime = `${startHour.value}:${startMinute.value}`;
}

function syncEndTime() {
  formData.endTime = `${endHour.value}:${endMinute.value}`;
}

/** Sync the hour/minute refs from formData.startTime / endTime */
function syncTimeRefs() {
  const st = splitTime(formData.startTime);
  startHour.value = st.hour;
  startMinute.value = st.minute;
  const et = splitTime(formData.endTime);
  endHour.value = et.hour;
  endMinute.value = et.minute;
}

const isEditing = ref(false);
const newAttendee = ref('');

function nowDateStr(): string {
  return new Date().toISOString().split('T')[0];
}
function nowTimeStr(): string {
  return new Date().toTimeString().slice(0, 5);
}
function oneHourLaterTimeStr(): string {
  const later = new Date(Date.now() + 60 * 60 * 1000);
  return later.toTimeString().slice(0, 5);
}

const formData = reactive({
  title: '',
  description: '',
  startDate: nowDateStr(),
  startTime: nowTimeStr(),
  endDate: nowDateStr(),
  endTime: oneHourLaterTimeStr(),
  priority: '' as string,
  location: '',
  attendees: [] as string[],
  autoDetectConflicts: true,
});

// Initialize hour/minute refs from initial formData values
syncTimeRefs();

function resetForm() {
  formData.title = '';
  formData.description = '';
  formData.startDate = nowDateStr();
  formData.startTime = nowTimeStr();
  formData.endDate = nowDateStr();
  formData.endTime = oneHourLaterTimeStr();
  formData.priority = '';
  formData.location = '';
  formData.attendees = [];
  formData.autoDetectConflicts = true;
  newAttendee.value = '';
  syncTimeRefs();
}

function handleClose() {
  emit('update:modelValue', false);
  resetForm();
}

function addAttendee() {
  if (newAttendee.value.trim() && !formData.attendees.includes(newAttendee.value.trim())) {
    formData.attendees.push(newAttendee.value.trim());
    newAttendee.value = '';
  }
}

function removeAttendee(index: number) {
  formData.attendees.splice(index, 1);
}

function handleSubmit() {
  const startTimestamp = new Date(`${formData.startDate}T${formData.startTime}`).getTime();
  const endTimestamp = new Date(`${formData.endDate}T${formData.endTime}`).getTime();

  if (startTimestamp >= endTimestamp) {
    alert(t('schedule.confirm.endBeforeStart'));
    return;
  }

  emit('submit', {
    name: formData.title,
    description: formData.description || undefined,
    startTime: startTimestamp,
    endTime: endTimestamp,
    duration: endTimestamp - startTimestamp,
    priority: formData.priority ? Number(formData.priority) : undefined,
    location: formData.location || undefined,
    attendees: formData.attendees.length > 0 ? formData.attendees : undefined,
    autoDetectConflicts: formData.autoDetectConflicts,
  });
}

watch(
  () => props.schedule,
  (schedule) => {
    if (schedule) {
      isEditing.value = true;
      formData.title = schedule.title;
      formData.description = schedule.description || '';
      formData.priority = String(schedule.priority || '');
      formData.location = schedule.location || '';
      formData.attendees = schedule.attendees ? [...schedule.attendees] : [];

      const startDate = new Date(schedule.startTime);
      const endDate = new Date(schedule.endTime);

      formData.startDate = startDate.toISOString().split('T')[0];
      formData.startTime = startDate.toTimeString().slice(0, 5);
      formData.endDate = endDate.toISOString().split('T')[0];
      formData.endTime = endDate.toTimeString().slice(0, 5);
      syncTimeRefs();
    } else {
      isEditing.value = false;
      resetForm();
    }
  },
  { immediate: true },
);

watch(
  () => props.modelValue,
  (value) => {
    if (!value) {
      resetForm();
    } else if (!props.schedule) {
      const now = new Date();
      const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

      formData.startDate = now.toISOString().split('T')[0];
      formData.startTime = now.toTimeString().slice(0, 5);
      formData.endDate = oneHourLater.toISOString().split('T')[0];
      formData.endTime = oneHourLater.toTimeString().slice(0, 5);
      syncTimeRefs();
    }
  },
);
</script>
