<template>
  <Dialog :open="visible" @update:open="handleVisibleChange">
    <DialogContent class="flex max-h-[85vh] min-h-0 max-w-3xl flex-col overflow-hidden p-0">
      <DialogHeader class="shrink-0 px-6 pt-6 pb-4">
        <DialogTitle class="text-xl">{{
          isEditMode
            ? t('reminder.templateDialog.titleEdit')
            : t('reminder.templateDialog.titleCreate')
        }}</DialogTitle>
        <DialogDescription class="text-sm text-muted-foreground">
          {{
            isEditMode
              ? t('reminder.templateDialog.descEdit')
              : t('reminder.templateDialog.descCreate')
          }}
        </DialogDescription>
      </DialogHeader>

      <div class="min-h-0 flex-1 overflow-y-auto px-6 pb-4">
        <div class="space-y-6 py-2">
          <!-- Basic Info -->
          <div class="space-y-3">
            <div class="flex items-center gap-2 mb-3">
              <Info class="h-5 w-5 text-primary" />
              <h3 class="text-sm font-semibold">
                {{ t('reminder.templateDialog.sectionBasicInfo') }}
              </h3>
            </div>
            <Separator />

            <div class="flex gap-3">
              <div class="flex-1">
                <Label>{{ t('reminder.templateDialog.labelTitle') }}</Label>
                <Input
                  v-model="formData.title"
                  :placeholder="t('reminder.templateDialog.placeholderTitle')"
                  class="mt-1.5"
                />
              </div>
              <div class="flex flex-col items-center justify-start pt-6">
                <ColorPickerField
                  :model-value="formData.color"
                  button-class="h-10 w-[132px] justify-start gap-2"
                  :empty-label="t('reminder.templateDialog.btnPick')"
                  :clear-label="t('reminder.templateDialog.clearColor')"
                  @update:model-value="formData.color = $event ?? formData.color"
                />
              </div>
            </div>

            <div>
              <Label>{{ t('reminder.templateDialog.labelDescription') }}</Label>
              <Textarea
                v-model="formData.description"
                :placeholder="t('reminder.templateDialog.placeholderDescription')"
                rows="2"
                class="mt-1.5"
              />
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <Label>{{ t('reminder.templateDialog.labelGroup') }}</Label>
                <Select v-model="formData.groupId">
                  <SelectTrigger class="mt-1.5">
                    <SelectValue :placeholder="t('reminder.templateDialog.placeholderGroup')" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem v-for="group in groupOptions" :key="group.id" :value="group.id">
                      {{ group.name }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{{ t('reminder.templateDialog.labelImportance') }}</Label>
                <Select v-model="formData.importanceLevel">
                  <SelectTrigger class="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Vital">{{
                      t('reminder.templateDialog.importanceVital')
                    }}</SelectItem>
                    <SelectItem value="Important">{{
                      t('reminder.templateDialog.importanceImportant')
                    }}</SelectItem>
                    <SelectItem value="Moderate">{{
                      t('reminder.templateDialog.importanceModerate')
                    }}</SelectItem>
                    <SelectItem value="Minor">{{
                      t('reminder.templateDialog.importanceMinor')
                    }}</SelectItem>
                    <SelectItem value="Trivial">{{
                      t('reminder.templateDialog.importanceTrivial')
                    }}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <!-- Time Configuration -->
          <div class="space-y-3">
            <div class="flex items-center gap-2 mb-3">
              <Clock class="h-5 w-5 text-primary" />
              <h3 class="text-sm font-semibold">
                {{ t('reminder.templateDialog.sectionTimeConfig') }}
              </h3>
            </div>
            <Separator />

            <div>
              <Label>{{ t('reminder.templateDialog.labelTriggerType') }}</Label>
              <Select v-model="formData.triggerType">
                <SelectTrigger class="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FixedTime">{{
                    t('reminder.templateDialog.triggerFixedTime')
                  }}</SelectItem>
                  <SelectItem value="Interval">{{
                    t('reminder.templateDialog.triggerInterval')
                  }}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div v-if="formData.triggerType === 'FixedTime'">
              <Label>{{ t('reminder.templateDialog.labelFixedTime') }}</Label>
              <Input v-model="formData.fixedTime" placeholder="09:00" class="mt-1.5" />
              <p class="text-xs text-muted-foreground mt-1">
                {{ t('reminder.templateDialog.hintFixedTime') }}
              </p>
            </div>

            <div v-if="formData.triggerType === 'Interval'">
              <Label>{{ t('reminder.templateDialog.labelInterval') }}</Label>
              <Input
                v-model.number="formData.intervalMinutes"
                type="number"
                placeholder="60"
                class="mt-1.5"
              />
              <p class="text-xs text-muted-foreground mt-1">
                {{ t('reminder.templateDialog.hintInterval') }}
              </p>
            </div>

            <!-- Active Time (start / end date) -->
            <div class="grid grid-cols-2 gap-3">
              <div>
                <Label>{{ t('reminder.templateDialog.labelStartDate') }}</Label>
                <Popover>
                  <PopoverTrigger as-child>
                    <Button
                      variant="outline"
                      class="mt-1.5 h-10 w-full justify-start text-left font-normal"
                      :class="{ 'text-muted-foreground': !formData.startDate }"
                    >
                      <CalendarIcon class="mr-2 h-4 w-4" />
                      {{
                        formData.startDate
                          ? formatDate(formData.startDate)
                          : t('reminder.templateDialog.pickStartDate')
                      }}
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
                <Label>{{ t('reminder.templateDialog.labelEndDate') }}</Label>
                <Popover>
                  <PopoverTrigger as-child>
                    <Button
                      variant="outline"
                      class="mt-1.5 h-10 w-full justify-start text-left font-normal"
                      :class="{ 'text-muted-foreground': !formData.endDate }"
                    >
                      <CalendarIcon class="mr-2 h-4 w-4" />
                      {{
                        formData.endDate
                          ? formatDate(formData.endDate)
                          : t('reminder.templateDialog.noEndDate')
                      }}
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
                  {{ t('reminder.templateDialog.clearEndDate') }}
                </Button>
              </div>
            </div>
          </div>

          <!-- Active Hours -->
          <Collapsible v-model:open="showActiveHours">
            <CollapsibleTrigger as-child>
              <Button variant="ghost" size="sm" class="w-full justify-between px-0 font-medium">
                <span class="flex items-center gap-2">
                  <Timer class="h-4 w-4" />
                  {{ t('reminder.templateDialog.sectionActiveHours') }}
                  <Badge variant="secondary" class="ml-1">{{
                    t('reminder.templateDialog.badgeOptional')
                  }}</Badge>
                </span>
                <ChevronDown
                  class="h-4 w-4 transition-transform"
                  :class="{ 'rotate-180': showActiveHours }"
                />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent class="mt-3 space-y-3">
              <p class="text-xs text-muted-foreground">
                {{ t('reminder.templateDialog.hintActiveHours') }}
              </p>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <Label>{{ t('reminder.templateDialog.labelStartHour') }}</Label>
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
                  <Label>{{ t('reminder.templateDialog.labelEndHour') }}</Label>
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
              <h3 class="text-sm font-semibold">
                {{ t('reminder.templateDialog.sectionAppearance') }}
              </h3>
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
                  <p class="text-sm">{{ t('reminder.templateDialog.iconPickerComingSoon') }}</p>
                </PopoverContent>
              </Popover>
              <div class="flex-1">
                <p class="text-sm font-medium">{{ t('reminder.templateDialog.labelIcon') }}</p>
                <p class="text-xs text-muted-foreground">
                  {{ t('reminder.templateDialog.currentIcon', { icon: formData.icon }) }}
                </p>
              </div>
            </div>

            <div>
              <Label>{{ t('reminder.templateDialog.labelTags') }}</Label>
              <Input
                v-model="tagsInput"
                :placeholder="t('reminder.templateDialog.placeholderTags')"
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
                  <span>{{ t('reminder.templateDialog.sectionAdvanced') }}</span>
                  <Badge variant="secondary" class="ml-2">{{
                    t('reminder.templateDialog.badgeOptional')
                  }}</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent class="space-y-3 pt-3">
                <p class="text-xs text-muted-foreground">
                  {{ t('reminder.templateDialog.hintAdvanced') }}
                </p>
                <div>
                  <Label>{{ t('reminder.templateDialog.labelNotificationTitle') }}</Label>
                  <Input
                    v-model="formData.notificationTitle"
                    :placeholder="t('reminder.templateDialog.placeholderNotificationTitle')"
                    class="mt-1.5"
                  />
                </div>
                <div>
                  <Label>{{ t('reminder.templateDialog.labelNotificationBody') }}</Label>
                  <Textarea
                    v-model="formData.notificationBody"
                    :placeholder="t('reminder.templateDialog.placeholderNotificationBody')"
                    rows="2"
                    class="mt-1.5"
                  />
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>

      <DialogFooter class="shrink-0 border-t p-6 pt-4">
        <Button variant="ghost" @click="close" :disabled="saving">
          {{ t('reminder.templateDialog.btnCancel') }}
        </Button>
        <Button variant="default" @click="handleSave" :disabled="!formValid || saving">
          {{ t('reminder.templateDialog.btnDone') }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  Info,
  Clock,
  Palette,
  Settings,
  Bell,
  Calendar as CalendarIcon,
  ChevronDown,
  Timer,
} from 'lucide-vue-next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@dailyuse/ui-vue-shadcn';
import { Button } from '@dailyuse/ui-vue-shadcn';
import { Input } from '@dailyuse/ui-vue-shadcn';
import { Label } from '@dailyuse/ui-vue-shadcn';
import { Textarea } from '@dailyuse/ui-vue-shadcn';
import { Badge } from '@dailyuse/ui-vue-shadcn';
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
import type { ReminderGroupOption } from '../types';
import { ColorPickerField } from '../../../shared/components';
import { defaultNamedColor } from '../../../shared/constants/colorPalette';

const { t, locale } = useI18n();

const props = withDefaults(
  defineProps<{
    template?: ReminderTemplateClientDTO | null;
    groupOptions?: ReminderGroupOption[];
    saving?: boolean;
  }>(),
  {
    template: null,
    groupOptions: () => [],
    saving: false,
  },
);

const emit = defineEmits<{
  save: [data: CreateReminderTemplateReq];
  update: [id: string, data: UpdateReminderTemplateReq];
}>();

const visible = ref(false);
const showActiveHours = ref(false);
const tagsInput = ref('');
const saving = computed(() => props.saving);

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
  // Active hours
  activeStartHour: null as number | null,
  activeEndHour: null as number | null,
  // Notification
  notificationTitle: '',
  notificationBody: '',
  // Appearance
  color: defaultNamedColor,
  icon: 'mdi-bell',
  tags: [] as string[],
  groupId: undefined as string | undefined,
});

const isEditMode = computed(() => !!props.template?.id);
const formValid = computed(() => formData.title.trim().length > 0 && formData.startDate !== null);

/** Convert epoch timestamp to a Date for the Calendar component */
const startDateValue = computed(() =>
  formData.startDate ? new Date(formData.startDate) : undefined,
);
const endDateValue = computed(() => (formData.endDate ? new Date(formData.endDate) : undefined));

// ── Helpers ────────────────────────────────────────────────────────────

function formatDate(ts: number): string {
  const dateLocale = locale.value === 'zh-CN' ? 'zh-CN' : 'en-US';
  return new Date(ts).toLocaleDateString(dateLocale, {
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

const updateTags = () => {
  formData.tags = tagsInput.value
    .split(',')
    .map((s) => s.trim())
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
    activeStartHour: null,
    activeEndHour: null,
    notificationTitle: '',
    notificationBody: '',
    color: defaultNamedColor,
    icon: 'mdi-bell',
    tags: [],
    groupId: undefined,
  });
  tagsInput.value = '';
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
    // Active hours
    activeStartHour: template.activeHours?.startHour ?? null,
    activeEndHour: template.activeHours?.endHour ?? null,
    // Notification
    notificationTitle: template.notificationConfig?.title || '',
    notificationBody: template.notificationConfig?.body || '',
    // Appearance
    color: template.color || defaultNamedColor,
    icon: template.icon || 'mdi-bell',
    tags: template.tags ? [...template.tags] : [],
    groupId: template.groupId ?? undefined,
  });
  tagsInput.value = (template.tags || []).join(', ');

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
    type: 'Recurring',
    trigger,
    activeTime,
    notificationConfig,
    description: formData.description || undefined,
    activeHours,
    importanceLevel: formData.importanceLevel as any,
    tags: formData.tags.length > 0 ? formData.tags : undefined,
    color: formData.color || undefined,
    icon: formData.icon || undefined,
    groupId: formData.groupId as any,
  };
}

const handleSave = async () => {
  if (!formValid.value || saving.value) return;

  const data = buildPayload();

  if (isEditMode.value && props.template?.id) {
    emit('update', props.template.id, data);
  } else {
    emit('save', data);
  }
};

defineExpose({ open, openForCreate, openForEdit, close });
</script>
