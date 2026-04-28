<template>
  <Dialog :open="visible" @update:open="handleVisibleChange">
    <DialogContent
      data-testid="reminder-template-dialog"
      class="flex max-h-[85vh] min-h-0 max-w-3xl flex-col overflow-hidden p-0"
    >
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
                <Label for="reminder-template-title">{{ t('reminder.templateDialog.labelTitle') }}</Label>
                <Input
                  id="reminder-template-title"
                  v-model="formData.title"
                  data-testid="reminder-template-title-input"
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
              <Label for="reminder-template-description">{{ t('reminder.templateDialog.labelDescription') }}</Label>
              <Textarea
                id="reminder-template-description"
                v-model="formData.description"
                data-testid="reminder-template-description-input"
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
                    <SelectItem value="__root__">
                      {{ t('reminder.templateDialog.rootOption') }}
                    </SelectItem>
                    <SelectItem v-for="group in groupOptions" :key="group.id" :value="group.id">
                      {{ group.name }}
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p class="mt-1 text-xs text-muted-foreground">
                  {{ currentGroupHint }}
                </p>
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

            <p class="text-xs text-muted-foreground">
              {{ t('reminder.templateDialog.hintLongLived') }}
            </p>
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
        <Button
          data-testid="reminder-template-save-button"
          variant="default"
          @click="handleSave"
          :disabled="!formValid || saving"
        >
          {{ t('reminder.templateDialog.btnDone') }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue';
import { useI18n } from 'vue-i18n';
import { Info, Clock, Palette, Settings, Bell, ChevronDown, Timer } from 'lucide-vue-next';
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
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@dailyuse/ui-vue-shadcn';
import type {
  CreateReminderTemplateReq,
  ReminderGroupClientDTO,
  UpdateReminderTemplateReq,
} from '@dailyuse/contracts/reminder';
import type { ReminderTemplateClientDTO } from '@dailyuse/contracts/reminder';
import { ColorPickerField } from '../../../shared/components';
import { defaultNamedColor } from '../../../shared/constants/colorPalette';

const { t } = useI18n();

const props = withDefaults(
  defineProps<{
    template?: ReminderTemplateClientDTO | null;
    groupOptions?: ReminderGroupClientDTO[];
    saving?: boolean;
    defaultGroupId?: string | null;
  }>(),
  {
    template: null,
    groupOptions: () => [],
    saving: false,
    defaultGroupId: null,
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
const currentGroupHint = computed(() => {
  if (formData.groupId === '__root__' || !formData.groupId) {
    return t('reminder.templateDialog.currentGroupHintRoot');
  }
  const group = props.groupOptions.find((item) => item.id === formData.groupId);
  return group
    ? t('reminder.templateDialog.currentGroupHintNamed', { name: group.name })
    : t('reminder.templateDialog.currentGroupHintSelected');
});

const formData = reactive({
  title: '',
  description: '',
  importanceLevel: 'Moderate' as NonNullable<CreateReminderTemplateReq['importanceLevel']>,
  triggerType: 'FixedTime' as CreateReminderTemplateReq['trigger']['type'],
  fixedTime: '09:00',
  intervalMinutes: 60,
  activeStartHour: null as number | null,
  activeEndHour: null as number | null,
  notificationTitle: '',
  notificationBody: '',
  color: defaultNamedColor,
  icon: 'mdi-bell',
  tags: [] as NonNullable<CreateReminderTemplateReq['tags']>,
  groupId: undefined as CreateReminderTemplateReq['groupId'] | '__root__' | undefined,
});

const isEditMode = computed(() => !!props.template?.id);
const formValid = computed(() => formData.title.trim().length > 0);

// ── Helpers ────────────────────────────────────────────────────────────

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
    importanceLevel: 'Moderate',
    triggerType: 'FixedTime',
    fixedTime: '09:00',
    intervalMinutes: 60,
    activeStartHour: null,
    activeEndHour: null,
    notificationTitle: '',
    notificationBody: '',
    color: defaultNamedColor,
    icon: 'mdi-bell',
    tags: [],
    groupId: props.defaultGroupId ?? undefined,
  });
  tagsInput.value = '';
  showActiveHours.value = false;
};

const loadTemplateData = (template: ReminderTemplateClientDTO) => {
  Object.assign(formData, {
    title: template.name,
    description: template.description || '',
    importanceLevel: template.importanceLevel || 'Moderate',
    triggerType: template.trigger?.type || 'FixedTime',
    fixedTime: template.trigger?.fixedTime?.time || '09:00',
    intervalMinutes: template.trigger?.interval?.minutes || 60,
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
  const trigger: CreateReminderTemplateReq['trigger'] =
    formData.triggerType === 'FixedTime'
      ? {
          type: 'FixedTime',
          fixedTime: { time: formData.fixedTime, timezone: null },
          interval: null,
        }
      : {
          type: 'Interval',
          interval: { minutes: formData.intervalMinutes, startTime: null },
          fixedTime: null,
        };

  const activeTime: CreateReminderTemplateReq['activeTime'] = {
    startDate: Date.now(),
    endDate: null,
  };

  const notificationConfig: CreateReminderTemplateReq['notificationConfig'] = {
    channels: ['Push', 'InApp'],
    title: formData.notificationTitle || null,
    body: formData.notificationBody || null,
    sound: { enabled: true, soundName: 'default' },
    vibration: { enabled: true, pattern: null },
    actions: null,
  };

  const activeHours: CreateReminderTemplateReq['activeHours'] =
    formData.activeStartHour !== null && formData.activeEndHour !== null
      ? {
          startHour: formData.activeStartHour,
          endHour: formData.activeEndHour,
          timezone: null,
        }
      : undefined;

  return {
    title: formData.title.trim(),
    type: 'Recurring',
    trigger,
    activeTime,
    notificationConfig,
    description: formData.description.trim() || undefined,
    activeHours,
    importanceLevel: formData.importanceLevel,
    tags: formData.tags.length > 0 ? formData.tags : undefined,
    color: formData.color || undefined,
    icon: formData.icon || undefined,
    groupId: formData.groupId === '__root__' ? undefined : formData.groupId,
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
