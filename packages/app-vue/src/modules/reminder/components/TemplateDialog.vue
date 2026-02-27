<template>
  <Dialog :open="visible" @update:open="handleVisibleChange">
    <DialogContent class="max-w-3xl max-h-[700px] flex flex-col p-0">
      <!-- Header -->
      <div class="flex items-center justify-between px-6 py-4 border-b">
        <Button variant="destructive" @click="close" :disabled="saving">Cancel</Button>
        <DialogTitle class="text-xl">{{
          isEditMode ? 'Edit Reminder Template' : 'Create Reminder Template'
        }}</DialogTitle>
        <Button variant="default" @click="handleSave" :disabled="!formValid || saving">Done</Button>
      </div>

      <!-- Content -->
      <ScrollArea class="flex-1 px-6">
        <div class="space-y-6 py-6">
          <!-- Basic Info -->
          <div class="space-y-3">
            <div class="flex items-center gap-2 mb-3">
              <Info class="h-5 w-5 text-primary" />
              <h3 class="text-sm font-semibold">Basic Information</h3>
            </div>
            <Separator />

            <div class="flex gap-3">
              <div class="flex-1">
                <Label>Title *</Label>
                <Input
                  v-model="formData.title"
                  placeholder="e.g., Daily Water Reminder"
                  class="mt-1.5"
                />
              </div>
              <div class="flex flex-col items-center justify-start pt-6">
                <div
                  class="w-10 h-10 rounded-full cursor-pointer border-2"
                  :style="{ backgroundColor: formData.color }"
                  @click="showColorPicker = !showColorPicker"
                />
                <Popover v-model:open="showColorPicker">
                  <PopoverTrigger as-child>
                    <Button variant="ghost" size="sm" class="mt-1 h-6 text-xs">Pick</Button>
                  </PopoverTrigger>
                  <PopoverContent class="w-auto p-3">
                    <div class="grid grid-cols-4 gap-2">
                      <div
                        v-for="color in colorOptions"
                        :key="color"
                        class="w-8 h-8 rounded-full cursor-pointer"
                        :style="{ backgroundColor: color }"
                        @click="
                          formData.color = color;
                          showColorPicker = false;
                        "
                      />
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                v-model="formData.description"
                placeholder="Describe this reminder..."
                rows="2"
                class="mt-1.5"
              />
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <Label>Group</Label>
                <Select v-model="formData.groupId">
                  <SelectTrigger class="mt-1.5">
                    <SelectValue placeholder="Select group (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem v-for="group in groupOptions" :key="group.id" :value="group.id">
                      {{ group.name }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Importance</Label>
                <Select v-model="formData.importanceLevel">
                  <SelectTrigger class="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Vital">Extremely Important</SelectItem>
                    <SelectItem value="Important">Very Important</SelectItem>
                    <SelectItem value="Moderate">Normal</SelectItem>
                    <SelectItem value="Minor">Less Important</SelectItem>
                    <SelectItem value="Trivial">Trivial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Reminder Type *</Label>
              <Select v-model="formData.type">
                <SelectTrigger class="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OneTime">One-Time</SelectItem>
                  <SelectItem value="Recurring">Recurring</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <!-- Time Configuration -->
          <div class="space-y-3">
            <div class="flex items-center gap-2 mb-3">
              <Clock class="h-5 w-5 text-primary" />
              <h3 class="text-sm font-semibold">Time Configuration</h3>
            </div>
            <Separator />

            <div>
              <Label>Trigger Type *</Label>
              <Select v-model="formData.triggerType">
                <SelectTrigger class="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FixedTime">Fixed Time</SelectItem>
                  <SelectItem value="Interval">Interval</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div v-if="formData.triggerType === 'FixedTime'">
              <Label>Fixed Time (HH:MM)</Label>
              <Input v-model="formData.fixedTime" placeholder="09:00" class="mt-1.5" />
              <p class="text-xs text-muted-foreground mt-1">
                Format: hour:minute (e.g., 09:00, 14:30)
              </p>
            </div>

            <div v-if="formData.triggerType === 'Interval'">
              <Label>Interval (minutes)</Label>
              <Input
                v-model.number="formData.intervalMinutes"
                type="number"
                placeholder="60"
                class="mt-1.5"
              />
              <p class="text-xs text-muted-foreground mt-1">How often to trigger (in minutes)</p>
            </div>

            <!-- Active Time (start / end date) -->
            <div class="grid grid-cols-2 gap-3">
              <div>
                <Label>Start Date *</Label>
                <Popover>
                  <PopoverTrigger as-child>
                    <Button
                      variant="outline"
                      class="mt-1.5 h-10 w-full justify-start text-left font-normal"
                      :class="{ 'text-muted-foreground': !formData.startDate }"
                    >
                      <CalendarIcon class="mr-2 h-4 w-4" />
                      {{ formData.startDate ? formatDate(formData.startDate) : 'Pick start date' }}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent class="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      :selected="startDateValue"
                      @update:model-value="handleStartDateSelect"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label>End Date</Label>
                <Popover>
                  <PopoverTrigger as-child>
                    <Button
                      variant="outline"
                      class="mt-1.5 h-10 w-full justify-start text-left font-normal"
                      :class="{ 'text-muted-foreground': !formData.endDate }"
                    >
                      <CalendarIcon class="mr-2 h-4 w-4" />
                      {{ formData.endDate ? formatDate(formData.endDate) : 'No end date' }}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent class="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      :selected="endDateValue"
                      @update:model-value="handleEndDateSelect"
                    />
                  </PopoverContent>
                </Popover>
                <Button
                  v-if="formData.endDate"
                  variant="ghost"
                  size="sm"
                  class="mt-1 h-6 text-xs text-muted-foreground"
                  @click="formData.endDate = null"
                >
                  Clear end date
                </Button>
              </div>
            </div>
          </div>

          <!-- Recurrence (only for Recurring type) -->
          <Collapsible v-if="formData.type === 'Recurring'" v-model:open="showRecurrence">
            <CollapsibleTrigger as-child>
              <Button variant="ghost" size="sm" class="w-full justify-between px-0 font-medium">
                <span class="flex items-center gap-2">
                  <Repeat class="h-4 w-4" />
                  Recurrence
                  <Badge variant="secondary" class="ml-1">Optional</Badge>
                </span>
                <ChevronDown
                  class="h-4 w-4 transition-transform"
                  :class="{ 'rotate-180': showRecurrence }"
                />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent class="mt-3 space-y-3">
              <div>
                <Label>Recurrence Type</Label>
                <Select v-model="formData.recurrenceType">
                  <SelectTrigger class="mt-1.5">
                    <SelectValue placeholder="Select recurrence type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Daily">Daily</SelectItem>
                    <SelectItem value="Weekly">Weekly</SelectItem>
                    <SelectItem value="CustomDays">Custom Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <!-- Daily interval -->
              <div v-if="formData.recurrenceType === 'Daily'">
                <Label>Every N Days</Label>
                <Input
                  v-model.number="formData.dailyInterval"
                  type="number"
                  min="1"
                  placeholder="1"
                  class="mt-1.5"
                />
              </div>

              <!-- Weekly -->
              <div v-if="formData.recurrenceType === 'Weekly'" class="space-y-3">
                <div>
                  <Label>Every N Weeks</Label>
                  <Input
                    v-model.number="formData.weeklyInterval"
                    type="number"
                    min="1"
                    placeholder="1"
                    class="mt-1.5"
                  />
                </div>
                <div>
                  <Label>Days of Week</Label>
                  <div class="flex flex-wrap gap-2 mt-1.5">
                    <Button
                      v-for="day in weekDayOptions"
                      :key="day.value"
                      size="sm"
                      :variant="formData.weekDays.includes(day.value) ? 'default' : 'outline'"
                      class="h-8 px-3"
                      @click="toggleWeekDay(day.value)"
                    >
                      {{ day.label }}
                    </Button>
                  </div>
                </div>
              </div>

              <!-- CustomDays info -->
              <div v-if="formData.recurrenceType === 'CustomDays'">
                <p class="text-xs text-muted-foreground">
                  Custom day selection coming soon. Leave empty to skip recurrence.
                </p>
              </div>
            </CollapsibleContent>
          </Collapsible>

          <!-- Active Hours -->
          <Collapsible v-model:open="showActiveHours">
            <CollapsibleTrigger as-child>
              <Button variant="ghost" size="sm" class="w-full justify-between px-0 font-medium">
                <span class="flex items-center gap-2">
                  <Timer class="h-4 w-4" />
                  Active Hours
                  <Badge variant="secondary" class="ml-1">Optional</Badge>
                </span>
                <ChevronDown
                  class="h-4 w-4 transition-transform"
                  :class="{ 'rotate-180': showActiveHours }"
                />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent class="mt-3 space-y-3">
              <p class="text-xs text-muted-foreground">
                Restrict reminders to specific hours of the day.
              </p>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <Label>Start Hour (0–23)</Label>
                  <Input
                    :model-value="formData.activeStartHour ?? undefined"
                    type="number"
                    min="0"
                    max="23"
                    placeholder="8"
                    class="mt-1.5"
                    @update:model-value="
                      formData.activeStartHour = $event === '' ? null : Number($event)
                    "
                  />
                </div>
                <div>
                  <Label>End Hour (0–23)</Label>
                  <Input
                    :model-value="formData.activeEndHour ?? undefined"
                    type="number"
                    min="0"
                    max="23"
                    placeholder="22"
                    class="mt-1.5"
                    @update:model-value="
                      formData.activeEndHour = $event === '' ? null : Number($event)
                    "
                  />
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          <!-- Appearance -->
          <div class="space-y-3">
            <div class="flex items-center gap-2 mb-3">
              <Palette class="h-5 w-5 text-primary" />
              <h3 class="text-sm font-semibold">Appearance</h3>
            </div>
            <Separator />

            <div class="flex items-center gap-4">
              <Popover>
                <PopoverTrigger as-child>
                  <Button variant="outline" size="lg" class="h-16 w-16">
                    <Bell class="h-8 w-8" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent class="w-80">
                  <p class="text-sm">Icon picker coming soon</p>
                </PopoverContent>
              </Popover>
              <div class="flex-1">
                <p class="text-sm font-medium">Icon</p>
                <p class="text-xs text-muted-foreground">Current: {{ formData.icon }}</p>
              </div>
            </div>

            <div>
              <Label>Tags</Label>
              <Input
                v-model="tagsInput"
                placeholder="work, important (comma separated)"
                class="mt-1.5"
                @blur="updateTags"
              />
            </div>
          </div>

          <!-- Advanced Settings -->
          <Accordion type="single" collapsible>
            <AccordionItem value="advanced">
              <AccordionTrigger>
                <div class="flex items-center gap-2">
                  <Settings class="h-4 w-4" />
                  <span>Advanced Notification Settings</span>
                  <Badge variant="secondary" class="ml-2">Optional</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent class="space-y-3 pt-3">
                <p class="text-xs text-muted-foreground">
                  Customize notification text. Leave empty to use template title and description.
                </p>
                <div>
                  <Label>Notification Title</Label>
                  <Input
                    v-model="formData.notificationTitle"
                    placeholder="Leave empty to use template title"
                    class="mt-1.5"
                  />
                </div>
                <div>
                  <Label>Notification Body</Label>
                  <Textarea
                    v-model="formData.notificationBody"
                    placeholder="Leave empty to use template description"
                    rows="2"
                    class="mt-1.5"
                  />
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </ScrollArea>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, reactive, watch } from 'vue';
import {
  Info,
  Clock,
  Palette,
  Settings,
  Bell,
  Calendar as CalendarIcon,
  ChevronDown,
  Repeat,
  Timer,
} from 'lucide-vue-next';
import { Dialog, DialogContent, DialogTitle } from '@dailyuse/ui-vue-shadcn';
import { Button } from '@dailyuse/ui-vue-shadcn';
import { Input } from '@dailyuse/ui-vue-shadcn';
import { Label } from '@dailyuse/ui-vue-shadcn';
import { Textarea } from '@dailyuse/ui-vue-shadcn';
import { Badge } from '@dailyuse/ui-vue-shadcn';
import { ScrollArea } from '@dailyuse/ui-vue-shadcn';
import { Separator } from '@dailyuse/ui-vue-shadcn';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@dailyuse/ui-vue-shadcn';
import { Popover, PopoverContent, PopoverTrigger } from '@dailyuse/ui-vue-shadcn';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@dailyuse/ui-vue-shadcn';
import { Calendar } from '@dailyuse/ui-vue-shadcn';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@dailyuse/ui-vue-shadcn';
import type {
  CreateReminderTemplateReq,
  UpdateReminderTemplateReq,
} from '@dailyuse/contracts/reminder';
import type { ReminderTemplateClientDTO } from '@dailyuse/contracts/reminder';

interface ReminderGroup {
  id: string;
  name: string;
}

interface Props {
  template?: ReminderTemplateClientDTO | null;
  groupOptions?: ReminderGroup[];
}

const props = withDefaults(defineProps<Props>(), {
  template: null,
  groupOptions: () => [],
});

const emit = defineEmits<{
  save: [data: CreateReminderTemplateReq];
  update: [id: string, data: UpdateReminderTemplateReq];
}>();

const visible = ref(false);
const saving = ref(false);
const showColorPicker = ref(false);
const showRecurrence = ref(false);
const showActiveHours = ref(false);
const tagsInput = ref('');

const formData = reactive({
  title: '',
  description: '',
  type: 'Recurring' as string,
  importanceLevel: 'Moderate' as string,
  triggerType: 'FixedTime' as string,
  fixedTime: '09:00',
  intervalMinutes: 60,
  startDate: Date.now() as number | null,
  endDate: null as number | null,
  // Recurrence
  recurrenceType: '' as string,
  dailyInterval: 1,
  weeklyInterval: 1,
  weekDays: [] as string[],
  // Active hours
  activeStartHour: null as number | null,
  activeEndHour: null as number | null,
  // Notification
  notificationTitle: '',
  notificationBody: '',
  // Appearance
  color: '#2196F3',
  icon: 'mdi-bell',
  tags: [] as string[],
  groupId: undefined as string | undefined,
});

const colorOptions = [
  '#2196F3',
  '#4CAF50',
  '#FF9800',
  '#F44336',
  '#9C27B0',
  '#E91E63',
  '#00BCD4',
  '#9E9E9E',
];

const weekDayOptions = [
  { label: 'Mon', value: 'Monday' },
  { label: 'Tue', value: 'Tuesday' },
  { label: 'Wed', value: 'Wednesday' },
  { label: 'Thu', value: 'Thursday' },
  { label: 'Fri', value: 'Friday' },
  { label: 'Sat', value: 'Saturday' },
  { label: 'Sun', value: 'Sunday' },
];

const isEditMode = computed(() => !!props.template?.id);
const formValid = computed(() => formData.title.trim().length > 0 && formData.startDate !== null);

/** Convert epoch timestamp to a Date for the Calendar component */
const startDateValue = computed(() =>
  formData.startDate ? new Date(formData.startDate) : undefined,
);
const endDateValue = computed(() => (formData.endDate ? new Date(formData.endDate) : undefined));

// ── Helpers ────────────────────────────────────────────────────────────

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function handleStartDateSelect(date: unknown) {
  if (date instanceof Date) {
    formData.startDate = date.getTime();
  } else if (date && typeof date === 'object' && 'toDate' in date) {
    formData.startDate = (date as { toDate: () => Date }).toDate().getTime();
  } else {
    formData.startDate = null;
  }
}

function handleEndDateSelect(date: unknown) {
  if (date instanceof Date) {
    formData.endDate = date.getTime();
  } else if (date && typeof date === 'object' && 'toDate' in date) {
    formData.endDate = (date as { toDate: () => Date }).toDate().getTime();
  } else {
    formData.endDate = null;
  }
}

function toggleWeekDay(day: string) {
  const idx = formData.weekDays.indexOf(day);
  if (idx >= 0) {
    formData.weekDays.splice(idx, 1);
  } else {
    formData.weekDays.push(day);
  }
}

const updateTags = () => {
  formData.tags = tagsInput.value
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
};

const resetForm = () => {
  Object.assign(formData, {
    title: '',
    description: '',
    type: 'Recurring',
    importanceLevel: 'Moderate',
    triggerType: 'FixedTime',
    fixedTime: '09:00',
    intervalMinutes: 60,
    startDate: Date.now(),
    endDate: null,
    recurrenceType: '',
    dailyInterval: 1,
    weeklyInterval: 1,
    weekDays: [],
    activeStartHour: null,
    activeEndHour: null,
    notificationTitle: '',
    notificationBody: '',
    color: '#2196F3',
    icon: 'mdi-bell',
    tags: [],
    groupId: undefined,
  });
  tagsInput.value = '';
  showRecurrence.value = false;
  showActiveHours.value = false;
};

const loadTemplateData = (template: ReminderTemplateClientDTO) => {
  Object.assign(formData, {
    title: template.name,
    description: template.description || '',
    type: template.type || 'Recurring',
    importanceLevel: template.importanceLevel || 'Moderate',
    triggerType: template.trigger?.type || 'FixedTime',
    fixedTime: template.trigger?.fixedTime?.time || '09:00',
    intervalMinutes: template.trigger?.interval?.minutes || 60,
    startDate: template.activeTime?.activatedAt ?? Date.now(),
    endDate: null,
    // Recurrence
    recurrenceType: template.recurrence?.type || '',
    dailyInterval: template.recurrence?.daily?.interval || 1,
    weeklyInterval: template.recurrence?.weekly?.interval || 1,
    weekDays: template.recurrence?.weekly?.weekDays ? [...template.recurrence.weekly.weekDays] : [],
    // Active hours
    activeStartHour: template.activeHours?.startHour ?? null,
    activeEndHour: template.activeHours?.endHour ?? null,
    // Notification
    notificationTitle: template.notificationConfig?.title || '',
    notificationBody: template.notificationConfig?.body || '',
    // Appearance
    color: template.color || '#2196F3',
    icon: template.icon || 'mdi-bell',
    tags: template.tags ? [...template.tags] : [],
    groupId: template.groupId ?? undefined,
  });
  tagsInput.value = (template.tags || []).join(', ');

  // Expand collapsible sections if data exists
  showRecurrence.value = !!template.recurrence;
  showActiveHours.value = !!template.activeHours;
};

const open = () => {
  resetForm();
  visible.value = true;
};

const openForCreate = () => {
  resetForm();
  visible.value = true;
};

const openForEdit = (template: ReminderTemplateClientDTO) => {
  loadTemplateData(template);
  visible.value = true;
};

const close = () => {
  visible.value = false;
  setTimeout(resetForm, 300);
};

const handleVisibleChange = (value: boolean) => {
  visible.value = value;
  if (!value) setTimeout(resetForm, 300);
};

// ── Build payload ──────────────────────────────────────────────────────

function buildPayload(): CreateReminderTemplateReq {
  // Build trigger
  const trigger =
    formData.triggerType === 'FixedTime'
      ? {
          type: 'FixedTime' as const,
          fixedTime: { time: formData.fixedTime, timezone: null },
          interval: null,
        }
      : {
          type: 'Interval' as const,
          interval: { minutes: formData.intervalMinutes, startTime: null },
          fixedTime: null,
        };

  // Build activeTime
  const activeTime = {
    startDate: formData.startDate ?? Date.now(),
    endDate: formData.endDate,
  };

  // Build notificationConfig
  const notificationConfig = {
    channels: ['Push' as const, 'InApp' as const],
    title: formData.notificationTitle || null,
    body: formData.notificationBody || null,
    sound: { enabled: true, soundName: 'default' },
    vibration: { enabled: true, pattern: null },
    actions: null,
  };

  // Build recurrence (optional)
  let recurrence: CreateReminderTemplateReq['recurrence'] | undefined;
  if (formData.type === 'Recurring' && formData.recurrenceType) {
    if (formData.recurrenceType === 'Daily') {
      recurrence = {
        type: 'Daily' as const,
        daily: { interval: formData.dailyInterval || 1 },
        weekly: null,
        customDays: null,
      };
    } else if (formData.recurrenceType === 'Weekly') {
      recurrence = {
        type: 'Weekly' as const,
        daily: null,
        weekly: { interval: formData.weeklyInterval || 1, weekDays: formData.weekDays as any },
        customDays: null,
      };
    } else if (formData.recurrenceType === 'CustomDays') {
      recurrence = {
        type: 'CustomDays' as const,
        daily: null,
        weekly: null,
        customDays: { dates: [] },
      };
    }
  }

  // Build activeHours (optional)
  let activeHours: CreateReminderTemplateReq['activeHours'] | undefined;
  if (formData.activeStartHour !== null && formData.activeEndHour !== null) {
    activeHours = {
      startHour: formData.activeStartHour,
      endHour: formData.activeEndHour,
      timezone: null,
    };
  }

  return {
    title: formData.title,
    type: formData.type as any,
    trigger,
    activeTime,
    notificationConfig,
    description: formData.description || undefined,
    recurrence,
    activeHours,
    importanceLevel: formData.importanceLevel as any,
    tags: formData.tags.length > 0 ? formData.tags : undefined,
    color: formData.color || undefined,
    icon: formData.icon || undefined,
    groupId: formData.groupId as any,
  };
}

const handleSave = async () => {
  if (!formValid.value) return;

  saving.value = true;
  try {
    const data = buildPayload();

    if (isEditMode.value && props.template?.id) {
      emit('update', props.template.id, data);
    } else {
      emit('save', data);
    }

    close();
  } finally {
    saving.value = false;
  }
};

defineExpose({ open, openForCreate, openForEdit, close });
</script>
