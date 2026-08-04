<template>
  <Dialog :open="open" @update:open="handleDialogOpenChange">
    <ProductDialogShell
      :open="open"
      test-id="goal-dialog"
      size="md"
      body-class="flex overflow-hidden p-0"
      initial-focus-selector="[data-testid='goal-name-input']"
    >
      <template #title>
        {{ isEditMode ? t('goal.dialog.titleEdit') : t('goal.dialog.titleCreate') }}
      </template>
      <template #description>
        {{ isEditMode ? t('goal.dialog.descEdit') : t('goal.dialog.descCreate') }}
      </template>

      <Tabs v-model="activeTab" class="flex flex-col flex-1 min-h-0">
        <TabsList class="mx-6 mb-0 w-auto shrink-0 justify-start text-foreground/75">
          <TabsTrigger value="basic" data-testid="goal-dialog-basic-tab">{{
            t('goal.dialog.tabBasicInfo')
          }}</TabsTrigger>
          <TabsTrigger value="keyresults" data-testid="goal-dialog-key-results-tab">{{
            t('goal.dialog.tabKeyResults')
          }}</TabsTrigger>
        </TabsList>

        <!-- ========== Tab 1: Basic Info ========== -->
        <TabsContent value="basic" class="flex-1 overflow-y-auto px-6 pb-2 mt-0">
          <div class="grid gap-5 py-4">
            <!-- Name Input -->
            <div class="grid gap-2">
              <Label htmlFor="goal-name" class="font-medium">{{
                t('goal.dialog.goalTitle')
              }}</Label>
              <Input
                id="goal-name"
                v-model="form.name"
                :placeholder="t('goal.dialog.goalTitlePlaceholder')"
                class="h-10"
                data-testid="goal-name-input"
              />
            </div>

            <!-- Description -->
            <div class="grid gap-2">
              <Label htmlFor="goal-description" class="font-medium">{{
                t('goal.dialog.description')
              }}</Label>
              <Textarea
                id="goal-description"
                v-model="form.description"
                :placeholder="t('goal.dialog.descriptionPlaceholder')"
                class="min-h-[80px] resize-none"
                data-testid="goal-description-input"
              />
            </div>

            <!-- ========== CATEGORY & IMPORTANCE ========== -->

            <div class="grid grid-cols-2 gap-4">
              <div class="grid gap-2">
                <Label for="goal-category" class="font-medium">{{
                  t('goal.dialog.category')
                }}</Label>
                <Select v-model="form.category">
                  <SelectTrigger id="goal-category" :aria-label="t('goal.dialog.category')">
                    <SelectValue :placeholder="t('goal.dialog.categoryPlaceholder')" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="product">{{ t('goal.dialog.categoryProduct') }}</SelectItem>
                    <SelectItem value="engineering">{{
                      t('goal.dialog.categoryEngineering')
                    }}</SelectItem>
                    <SelectItem value="marketing">{{
                      t('goal.dialog.categoryMarketing')
                    }}</SelectItem>
                    <SelectItem value="personal">{{
                      t('goal.dialog.categoryPersonal')
                    }}</SelectItem>
                    <SelectItem value="health">{{ t('goal.dialog.categoryHealth') }}</SelectItem>
                    <SelectItem value="finance">{{ t('goal.dialog.categoryFinance') }}</SelectItem>
                    <SelectItem value="learning">{{
                      t('goal.dialog.categoryLearning')
                    }}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div class="grid gap-2">
                <Label for="goal-importance" class="font-medium">{{
                  t('goal.dialog.importance')
                }}</Label>
                <Select v-model="form.importance">
                  <SelectTrigger id="goal-importance" :aria-label="t('goal.dialog.importance')">
                    <SelectValue :placeholder="t('goal.dialog.importancePlaceholder')" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem
                      v-for="opt in importanceLevelOptions"
                      :key="opt.value"
                      :value="opt.value"
                    >
                      {{ opt.label }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <!-- ========== TIMELINE ========== -->

            <div class="grid gap-2">
              <div class="grid grid-cols-2 gap-4">
                <!-- Start Date -->
                <div class="grid gap-2">
                  <Label for="goal-start-date">{{ t('goal.dialog.startDate') }}</Label>
                  <Popover>
                    <PopoverTrigger as-child>
                      <Button
                        id="goal-start-date"
                        data-testid="goal-start-date"
                        :aria-label="t('goal.dialog.startDate')"
                        variant="outline"
                        class="h-10 w-full justify-start text-left font-normal"
                        :class="{ 'text-muted-foreground': !form.startDate }"
                      >
                        <CalendarIcon class="mr-2 h-4 w-4" />
                        {{
                          form.startDate
                            ? formatProductDateTime(form.startDate)
                            : t('goal.dialog.startDate')
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

                <!-- Target Date -->
                <div class="grid gap-2">
                  <Label for="goal-target-date">{{ t('goal.dialog.targetDate') }}</Label>
                  <Popover>
                    <PopoverTrigger as-child>
                      <Button
                        id="goal-target-date"
                        data-testid="goal-target-date"
                        :aria-label="t('goal.dialog.targetDate')"
                        variant="outline"
                        class="h-10 w-full justify-start text-left font-normal"
                        :class="{ 'text-muted-foreground': !form.targetDate }"
                      >
                        <CalendarIcon class="mr-2 h-4 w-4" />
                        {{
                          form.targetDate
                            ? formatProductDateTime(form.targetDate)
                            : t('goal.dialog.targetDate')
                        }}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent class="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        :selected="targetDateValue"
                        @update:model-value="handleTargetDateSelect"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>

            <Collapsible v-model:open="showReminder">
              <CollapsibleTrigger as-child>
                <Button variant="ghost" size="sm" class="w-full justify-between px-0 font-medium">
                  <span class="flex items-center gap-2">
                    <Bell class="h-4 w-4" />
                    {{ t('goal.dialog.sectionReminder') }}
                  </span>
                  <ChevronDown
                    class="h-4 w-4 transition-transform"
                    :class="{ 'rotate-180': showReminder }"
                  />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent class="mt-3 space-y-4">
                <div class="flex items-center gap-2">
                  <Switch id="goal-reminder-enabled" v-model="reminderEnabled" />
                  <Label for="goal-reminder-enabled" class="text-sm font-medium">{{
                    t('goal.dialog.enableReminder')
                  }}</Label>
                </div>

                <div v-if="reminderEnabled" class="space-y-3">
                  <div
                    v-for="(trigger, index) in reminderTriggers"
                    :key="`${trigger.type}-${index}`"
                    class="grid grid-cols-[1fr_120px_40px] gap-3 items-end rounded-lg border p-3"
                  >
                    <div class="grid gap-2">
                      <Label :for="`goal-reminder-type-${index}`" class="text-sm font-medium">
                        {{ t('goal.dialog.reminderType') }}
                      </Label>
                      <Select v-model="trigger.type">
                        <SelectTrigger
                          :id="`goal-reminder-type-${index}`"
                          :aria-label="t('goal.dialog.reminderType')"
                        >
                          <SelectValue :placeholder="t('goal.dialog.selectReminderType')" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem :value="ReminderTriggerType.RemainingDays">
                            {{ t('goal.dialog.triggerRemainingDays') }}
                          </SelectItem>
                          <SelectItem :value="ReminderTriggerType.TimeProgressPercentage">
                            {{ t('goal.dialog.triggerTimeProgress') }}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div class="grid gap-2">
                      <Label :for="`goal-reminder-value-${index}`" class="text-sm font-medium">
                        {{
                          trigger.type === ReminderTriggerType.RemainingDays
                            ? t('goal.dialog.triggerValueDays')
                            : t('goal.dialog.triggerValuePercent')
                        }}
                      </Label>
                      <Input
                        :id="`goal-reminder-value-${index}`"
                        v-model.number="trigger.value"
                        type="number"
                        min="0"
                      />
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      :aria-label="t('common.delete')"
                      class="text-destructive"
                      @click="removeReminderTrigger(index)"
                    >
                      <Trash2 class="h-4 w-4" />
                    </Button>
                  </div>

                  <Button variant="outline" class="w-full" @click="addReminderTrigger">
                    <Plus class="mr-2 h-4 w-4" />
                    {{ t('goal.dialog.addReminderTrigger') }}
                  </Button>
                </div>
              </CollapsibleContent>
            </Collapsible>

            <!-- ========== MOTIVATION & FEASIBILITY (collapsible) ========== -->

            <Collapsible v-model:open="showMotivation">
              <CollapsibleTrigger as-child>
                <Button variant="ghost" size="sm" class="w-full justify-between px-0 font-medium">
                  <span class="flex items-center gap-2">
                    <Lightbulb class="h-4 w-4" />
                    {{ t('goal.dialog.sectionMotivation') }}
                  </span>
                  <ChevronDown
                    class="h-4 w-4 transition-transform"
                    :class="{ 'rotate-180': showMotivation }"
                  />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent class="mt-3 space-y-4">
                <div class="grid gap-2">
                  <Label htmlFor="goal-motivation" class="text-sm font-medium">{{
                    t('goal.dialog.motivation')
                  }}</Label>
                  <Textarea
                    id="goal-motivation"
                    v-model="form.motivation"
                    :placeholder="t('goal.dialog.motivationPlaceholder')"
                    class="min-h-[60px] resize-none"
                  />
                </div>
                <div class="grid gap-2">
                  <Label htmlFor="goal-feasibility" class="text-sm font-medium">
                    {{ t('goal.dialog.feasibilityAnalysis') }}
                  </Label>
                  <Textarea
                    id="goal-feasibility"
                    v-model="form.feasibilityAnalysis"
                    :placeholder="t('goal.dialog.feasibilityPlaceholder')"
                    class="min-h-[60px] resize-none"
                  />
                </div>
              </CollapsibleContent>
            </Collapsible>

            <!-- ========== ORGANIZATION (collapsible) ========== -->

            <Collapsible v-model:open="showOrganization">
              <CollapsibleTrigger as-child>
                <Button variant="ghost" size="sm" class="w-full justify-between px-0 font-medium">
                  <span class="flex items-center gap-2">
                    <Settings2 class="h-4 w-4" />
                    {{ t('goal.dialog.sectionOrganization') }}
                  </span>
                  <ChevronDown
                    class="h-4 w-4 transition-transform"
                    :class="{ 'rotate-180': showOrganization }"
                  />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent class="mt-3 space-y-4">
                <!-- Color Picker -->
                <div class="grid gap-2">
                  <Label class="text-sm font-medium">{{ t('goal.dialog.color') }}</Label>
                  <ColorPickerField
                    :model-value="form.color || null"
                    button-class="h-10 w-[140px] justify-start gap-2"
                    :empty-label="t('goal.dialog.pickColor')"
                    :clear-label="t('goal.dialog.clearColor')"
                    @update:model-value="form.color = $event ?? ''"
                  />
                </div>

                <!-- Tags -->
                <TagInput
                  :tags="form.tags"
                  :label="t('goal.dialog.tags')"
                  :hint="t('goal.dialog.tagsHint')"
                  :placeholder="t('goal.dialog.tagsPlaceholder')"
                  @update:tags="form.tags = $event"
                />

                <!-- Folder -->
                <div class="grid gap-2">
                  <Label for="goal-folder" class="text-sm font-medium">{{
                    t('goal.dialog.folder')
                  }}</Label>
                  <Select v-model="form.folderId">
                    <SelectTrigger id="goal-folder" :aria-label="t('goal.dialog.folder')">
                      <SelectValue :placeholder="t('goal.dialog.folderPlaceholder')" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">{{ t('goal.dialog.folderNone') }}</SelectItem>
                      <SelectItem v-for="folder in goalFolders" :key="folder.id" :value="folder.id">
                        {{ folder.name }}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <!-- Parent Goal -->
                <div class="grid gap-2">
                  <Label for="goal-parent" class="text-sm font-medium">{{
                    t('goal.dialog.parentGoal')
                  }}</Label>
                  <Select v-model="form.parentGoalId">
                    <SelectTrigger id="goal-parent" :aria-label="t('goal.dialog.parentGoal')">
                      <SelectValue :placeholder="t('goal.dialog.parentGoalPlaceholder')" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">{{ t('goal.dialog.parentGoalNone') }}</SelectItem>
                      <SelectItem v-for="g in availableParentGoals" :key="g.id" :value="g.id">
                        {{ g.name }}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </TabsContent>

        <!-- ========== Tab 2: Key Results ========== -->
        <TabsContent value="keyresults" class="flex-1 overflow-y-auto px-6 pb-2 mt-0">
          <div class="grid gap-4 py-4">
            <!-- Existing KR list -->
            <div v-if="activeKrList.length > 0" class="grid gap-3">
              <div
                v-for="(kr, index) in activeKrList"
                :key="kr._localId"
                class="rounded-lg border bg-card p-4 grid gap-3"
              >
                <div class="flex items-center gap-2">
                  <span class="text-sm font-medium text-muted-foreground w-5 shrink-0">
                    {{ index + 1 }}.
                  </span>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium truncate">
                      {{ kr.title || t('goal.dialog.krTitle') }}
                    </p>
                    <p class="text-xs text-muted-foreground mt-1">
                      {{ keyResultValueTypeLabel(kr.valueType) }} · {{ kr.currentValue }} /
                      {{ kr.targetValue }} · {{ keyResultImpactLabel(kr.weight) }}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    :aria-label="t('common.edit')"
                    class="h-8 w-8 shrink-0"
                    @click="editKr(kr._localId)"
                  >
                    <Pencil class="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    :aria-label="t('common.delete')"
                    class="h-8 w-8 shrink-0 text-destructive hover:text-destructive"
                    @click="removeKr(kr._localId)"
                  >
                    <Trash2 class="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <section
              v-else
              class="grid gap-4 rounded-md border border-dashed p-4"
              data-testid="inline-kr-form"
            >
              <div>
                <h3 class="text-sm font-semibold">{{ t('goal.dialog.inlineKrTitle') }}</h3>
                <p class="mt-1 text-xs text-muted-foreground">
                  {{ t('goal.dialog.inlineKrDescription') }}
                </p>
              </div>
              <div class="grid gap-4 sm:grid-cols-2">
                <div class="grid gap-2 sm:col-span-2">
                  <Label for="inline-kr-title">{{ t('goal.dialog.krTitle') }}</Label>
                  <Input
                    id="inline-kr-title"
                    v-model="inlineKr.title"
                    data-testid="inline-kr-title"
                    :placeholder="t('goal.dialog.inlineKrPlaceholder')"
                    @keydown.enter.prevent="addInlineKr"
                  />
                </div>
                <div class="grid gap-2">
                  <Label for="inline-kr-type">{{ t('goal.dialog.krValueType') }}</Label>
                  <Select v-model="inlineKr.valueType">
                    <SelectTrigger id="inline-kr-type" :aria-label="t('goal.dialog.krValueType')">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem
                        v-for="option in keyResultValueTypeOptions"
                        :key="option.value"
                        :value="option.value"
                      >
                        {{ option.label }}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div class="grid gap-2">
                  <Label for="inline-kr-target">{{ t('goal.dialog.krTargetValue') }}</Label>
                  <Input
                    id="inline-kr-target"
                    v-model.number="inlineKr.targetValue"
                    type="number"
                    min="1"
                  />
                </div>
              </div>
              <fieldset class="grid gap-2">
                <legend class="text-sm font-medium">{{ t('goal.krDialog.impactLabel') }}</legend>
                <div
                  class="grid grid-cols-3 gap-2"
                  role="group"
                  :aria-label="t('goal.krDialog.impactLabel')"
                >
                  <Button
                    v-for="preset in keyResultImpactPresets"
                    :key="preset.value"
                    type="button"
                    :variant="inlineKr.weight === preset.value ? 'default' : 'outline'"
                    :aria-pressed="inlineKr.weight === preset.value"
                    @click="inlineKr.weight = preset.value"
                  >
                    {{ preset.label }}
                  </Button>
                </div>
              </fieldset>
              <Button
                type="button"
                data-testid="inline-kr-add"
                :disabled="!inlineKr.title.trim() || inlineKr.targetValue <= 0"
                @click="addInlineKr"
              >
                <Plus class="mr-2 h-4 w-4" />
                {{ t('goal.dialog.addBasicKeyResult') }}
              </Button>
            </section>

            <!-- Add KR button -->
            <Button
              variant="outline"
              class="w-full"
              data-testid="goal-dialog-add-key-result"
              @click="addKr"
            >
              <Plus class="mr-2 h-4 w-4" />
              {{ t('goal.dialog.addKeyResult') }}
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      <template #footer>
        <Button variant="outline" data-testid="cancel-goal-button" @click="discardAndClose">{{
          t('goal.dialog.cancel')
        }}</Button>
        <Button data-testid="save-goal-button" @click="handleSave" :disabled="isSaving">
          {{ isEditMode ? t('goal.dialog.saveChanges') : t('goal.dialog.createGoal') }}
        </Button>
      </template>
    </ProductDialogShell>
  </Dialog>

  <KeyResultDialog ref="keyResultDialogRef" :on-submit="handleSaveKr" />
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { formatProductDateTime } from '../../../../shared/utils/product-time';
import {
  Dialog,
  Button,
  Switch,
  TagInput,
  Input,
  Label,
  Textarea,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Popover,
  PopoverTrigger,
  PopoverContent,
  Calendar,
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@memoflow/ui-vue-shadcn';
import { ColorPickerField, ProductDialogShell } from '../../../../shared/components';
import { useDialogDraftStore } from '../../../../layouts/shell/dialog-draft-store';
import {
  Calendar as CalendarIcon,
  ChevronDown,
  Bell,
  Lightbulb,
  Settings2,
  Plus,
  Pencil,
  Trash2,
} from '@lucide/vue';
import { toast } from 'vue-sonner';
import { useGoal } from '../../composables/useGoal';
import KeyResultDialog from './KeyResultDialog.vue';
import type {
  CreateGoalReq,
  UpdateGoalReq,
  GoalClientDTO,
  GoalReminderConfigDTO,
  KeyResultClientDTO,
  AddKeyResultReq,
  ReminderTriggerType as GoalReminderTriggerType,
} from '@memoflow/contracts/goal';
import {
  KeyResultCalculationMethod,
  KeyResultValueType,
  ReminderTriggerType,
} from '@memoflow/contracts/goal';
import type { GoalFolderId, GoalId } from '@memoflow/contracts/primitives';

// ── Props & Emits ──────────────────────────────────────────────────────

const props = withDefaults(
  defineProps<{
    mode?: 'create' | 'edit';
    goal?: GoalClientDTO | null;
    defaultFolderId?: string | null;
  }>(),
  {
    mode: 'create',
    goal: null,
    defaultFolderId: null,
  },
);

const open = defineModel<boolean>('open', { default: false });

const emit = defineEmits<{
  created: [];
  updated: [];
  'dirty-change': [dirty: boolean];
}>();

// ── Composable ─────────────────────────────────────────────────────────

const { createGoal, updateGoal, goals, goalFolders, isSaving } = useGoal();

const { t } = useI18n();
const dialogDraftStore = useDialogDraftStore();
const currentDraftKey = ref<string | null>(null);

// ── Constants ──────────────────────────────────────────────────────────

const importanceLevelOptions = computed(() => [
  { value: 'Vital', label: t('goal.dialog.importanceVital') },
  { value: 'Important', label: t('goal.dialog.importanceImportant') },
  { value: 'Moderate', label: t('goal.dialog.importanceModerate') },
  { value: 'Minor', label: t('goal.dialog.importanceMinor') },
  { value: 'Trivial', label: t('goal.dialog.importanceTrivial') },
]);

const keyResultValueTypeOptions = computed(() => [
  { value: KeyResultValueType.Incremental, label: t('goal.krDialog.valueTypeIncremental') },
  { value: KeyResultValueType.Percentage, label: t('goal.krDialog.valueTypePercentage') },
  { value: KeyResultValueType.Binary, label: t('goal.krDialog.valueTypeBinary') },
  { value: KeyResultValueType.Absolute, label: t('goal.krDialog.valueTypeAbsolute') },
]);

const keyResultImpactPresets = computed(() => [
  { value: 1, label: t('goal.krDialog.impactLow') },
  { value: 3, label: t('goal.krDialog.impactMedium') },
  { value: 5, label: t('goal.krDialog.impactHigh') },
]);

function keyResultValueTypeLabel(valueType: string): string {
  return (
    keyResultValueTypeOptions.value.find((option) => option.value === valueType)?.label ?? valueType
  );
}

function keyResultImpactLabel(weight: number): string {
  if (weight <= 2) return t('goal.krDialog.impactLow');
  if (weight >= 4) return t('goal.krDialog.impactHigh');
  return t('goal.krDialog.impactMedium');
}

// ── Tab State ──────────────────────────────────────────────────────────

const activeTab = ref<'basic' | 'keyresults'>('basic');

// ── KR Local State ─────────────────────────────────────────────────────

/** Local representation of a KR for editing in the dialog */
interface LocalKr {
  /** undefined = new (not yet saved) */
  _existingId: string | undefined;
  /** unique key for v-for */
  _localId: number;
  /** set to true for existing KRs that should be deleted on save */
  _markedForDelete: boolean;

  title: string;
  valueType: string;
  calculationMethod: string;
  weight: number;
  initialValue: number;
  targetValue: number;
  currentValue: number;
  unit: string;
}

let _localIdCounter = 0;

const krList = ref<LocalKr[]>([]);

const createInlineKr = () => ({
  title: '',
  valueType: KeyResultValueType.Incremental as string,
  weight: 3,
  targetValue: 100,
});

const inlineKr = reactive(createInlineKr());

function resetInlineKr(): void {
  Object.assign(inlineKr, createInlineKr());
}

function moveInlineKrToList(): void {
  krList.value.push({
    _existingId: undefined,
    _localId: _localIdCounter++,
    _markedForDelete: false,
    title: inlineKr.title.trim(),
    valueType: inlineKr.valueType,
    calculationMethod: KeyResultCalculationMethod.Sum,
    weight: inlineKr.weight,
    initialValue: 0,
    targetValue: inlineKr.valueType === KeyResultValueType.Binary ? 1 : inlineKr.targetValue,
    currentValue: 0,
    unit: '',
  });
  resetInlineKr();
}

function addInlineKr(): void {
  if (!inlineKr.title.trim() || inlineKr.targetValue <= 0) return;

  moveInlineKrToList();
}

function krFromDTO(dto: KeyResultClientDTO): LocalKr {
  return {
    _existingId: dto.id,
    _localId: _localIdCounter++,
    _markedForDelete: false,
    title: dto.title,
    valueType: dto.progress.valueType,
    calculationMethod: dto.progress.aggregationMethod,
    weight: dto.weight,
    initialValue: dto.progress.initialValue,
    targetValue: dto.progress.targetValue,
    currentValue: dto.progress.currentValue,
    unit: dto.progress.unit ?? '',
  };
}

const activeKrList = computed(() => krList.value.filter((kr) => !kr._markedForDelete));

const keyResultDialogRef = ref<InstanceType<typeof KeyResultDialog> | null>(null);

function buildKrDto(kr: LocalKr): KeyResultClientDTO {
  const now = Date.now();
  return {
    id: (kr._existingId ?? `tmp-${kr._localId}`) as KeyResultClientDTO['id'],
    title: kr.title,
    description: null,
    progress: {
      valueType: kr.valueType as KeyResultClientDTO['progress']['valueType'],
      aggregationMethod:
        kr.calculationMethod as KeyResultClientDTO['progress']['aggregationMethod'],
      initialValue: kr.initialValue,
      targetValue: kr.targetValue,
      currentValue: kr.currentValue,
      unit: kr.unit || null,
    },
    weight: kr.weight,
    order: 0,
    createdAt: now,
    updatedAt: now,
  };
}

function addKr() {
  const goalId = props.goal?.id ?? '__draft_goal_id__';
  keyResultDialogRef.value?.openForCreateKeyResult(goalId);
}

function editKr(localId: number) {
  const kr = krList.value.find((item) => item._localId === localId);
  if (!kr) return;
  const goalId = props.goal?.id ?? '__draft_goal_id__';
  keyResultDialogRef.value?.openForUpdateKeyResult(goalId, buildKrDto(kr));
}

function removeKr(localId: number) {
  const kr = krList.value.find((item) => item._localId === localId);
  if (!kr) return;
  if (kr._existingId) {
    // Mark existing KR for deletion instead of removing from list immediately
    kr._markedForDelete = true;
  } else {
    krList.value = krList.value.filter((item) => item._localId !== localId);
  }
}

function handleSaveKr(payload: {
  keyResult: {
    id?: string;
    title: string;
    weight: number;
    progress: {
      valueType: string;
      aggregationMethod: string;
      initialValue: number;
      targetValue: number;
      currentValue: number;
      unit: string | null;
    };
  };
  isEditing: boolean;
}) {
  const data = payload.keyResult;
  const existing = payload.isEditing
    ? krList.value.find(
        (item) => item._existingId === data.id || `tmp-${item._localId}` === data.id,
      )
    : null;

  if (existing) {
    existing.title = data.title;
    existing.valueType = data.progress.valueType;
    existing.calculationMethod = data.progress.aggregationMethod;
    existing.weight = data.weight;
    existing.initialValue = data.progress.initialValue;
    existing.targetValue = data.progress.targetValue;
    existing.currentValue = data.progress.currentValue;
    existing.unit = data.progress.unit ?? '';
    existing._markedForDelete = false;
    return true;
  }

  krList.value.push({
    _existingId: undefined,
    _localId: _localIdCounter++,
    _markedForDelete: false,
    title: data.title,
    valueType: data.progress.valueType,
    calculationMethod: data.progress.aggregationMethod,
    weight: data.weight,
    initialValue: data.progress.initialValue,
    targetValue: data.progress.targetValue,
    currentValue: data.progress.currentValue,
    unit: data.progress.unit ?? '',
  });
  return true;
}

// ── Form State ─────────────────────────────────────────────────────────

const defaultForm = () => ({
  name: '',
  description: '',
  category: '',
  importance: 'Moderate' as string,
  color: '',
  feasibilityAnalysis: '',
  motivation: '',
  tags: [] as string[],
  startDate: Date.now() as number | null,
  targetDate: (Date.now() + 90 * 24 * 60 * 60 * 1000) as number | null,
  folderId: '',
  parentGoalId: '',
});

const form = reactive(defaultForm());

const reminderEnabled = ref(false);
const reminderTriggers = ref<
  Array<{
    type: GoalReminderTriggerType;
    value: number;
    enabled: boolean;
  }>
>([]);

const showMotivation = ref(false);
const showReminder = ref(false);
const showOrganization = ref(false);
const draftBaseline = ref<string | null>(null);

interface GoalDialogDraft {
  form: ReturnType<typeof defaultForm>;
  reminderEnabled: boolean;
  reminderTriggers: typeof reminderTriggers.value;
  keyResults: LocalKr[];
  inlineKeyResult: ReturnType<typeof createInlineKr>;
  activeTab: typeof activeTab.value;
  expanded: {
    motivation: boolean;
    reminder: boolean;
    organization: boolean;
  };
}

function createDraftSnapshot(): GoalDialogDraft {
  return {
    form: { ...form, tags: [...form.tags] },
    reminderEnabled: reminderEnabled.value,
    reminderTriggers: reminderTriggers.value.map((trigger) => ({ ...trigger })),
    keyResults: krList.value.map((keyResult) => ({ ...keyResult })),
    inlineKeyResult: { ...inlineKr },
    activeTab: activeTab.value,
    expanded: {
      motivation: showMotivation.value,
      reminder: showReminder.value,
      organization: showOrganization.value,
    },
  };
}

function restoreDraft(draft: GoalDialogDraft): void {
  Object.assign(form, draft.form);
  reminderEnabled.value = draft.reminderEnabled;
  reminderTriggers.value = draft.reminderTriggers.map((trigger) => ({ ...trigger }));
  krList.value = draft.keyResults.map((keyResult) => ({ ...keyResult }));
  Object.assign(inlineKr, draft.inlineKeyResult);
  activeTab.value = draft.activeTab;
  showMotivation.value = draft.expanded.motivation;
  showReminder.value = draft.expanded.reminder;
  showOrganization.value = draft.expanded.organization;
  _localIdCounter = Math.max(0, ...krList.value.map(({ _localId }) => _localId + 1));
}

function resolveDraftKey(): string {
  const scope = dialogDraftStore.scope?.value ?? 'standalone';
  const subject = props.goal?.id ?? props.defaultFolderId ?? 'new';
  return `${scope}:goal-dialog:${props.mode}:${subject}`;
}

function clearDraft(): void {
  if (currentDraftKey.value) dialogDraftStore.clear(currentDraftKey.value);
}

function discardAndClose(): void {
  clearDraft();
  open.value = false;
}

function handleDialogOpenChange(nextOpen: boolean): void {
  if (!nextOpen) {
    discardAndClose();
    return;
  }
  open.value = true;
}

function serializeDraft(): string {
  return JSON.stringify(createDraftSnapshot());
}

function captureDraftBaseline(): void {
  draftBaseline.value = serializeDraft();
  emit('dirty-change', false);
}

// ── Computed ───────────────────────────────────────────────────────────

const isEditMode = computed(() => props.mode === 'edit');

/** Filter out the goal being edited from the parent goal list to prevent circular references */
const availableParentGoals = computed(() => {
  if (isEditMode.value && props.goal) {
    return goals.value.filter((g) => g.id !== props.goal!.id);
  }
  return goals.value;
});

/** Convert epoch timestamp to a Date for the Calendar component */
const startDateValue = computed(() => (form.startDate ? new Date(form.startDate) : undefined));

const targetDateValue = computed(() => (form.targetDate ? new Date(form.targetDate) : undefined));

// ── Helpers ────────────────────────────────────────────────────────────

function handleStartDateSelect(date: unknown) {
  if (date instanceof Date) {
    form.startDate = date.getTime();
  } else if (date && typeof date === 'object' && 'toDate' in date) {
    form.startDate = (date as { toDate: () => Date }).toDate().getTime();
  } else {
    form.startDate = null;
  }
  return true;
}

function handleTargetDateSelect(date: unknown) {
  if (date instanceof Date) {
    form.targetDate = date.getTime();
  } else if (date && typeof date === 'object' && 'toDate' in date) {
    form.targetDate = (date as { toDate: () => Date }).toDate().getTime();
  } else {
    form.targetDate = null;
  }
}

function addReminderTrigger() {
  reminderTriggers.value.push({
    type: ReminderTriggerType.RemainingDays as GoalReminderTriggerType,
    value: 7,
    enabled: true,
  });
}

function removeReminderTrigger(index: number) {
  reminderTriggers.value.splice(index, 1);
}

function normalizeReminderConfig(): GoalReminderConfigDTO | null {
  if (!reminderEnabled.value) {
    return null;
  }

  const triggers = reminderTriggers.value
    .filter((trigger) => Number.isFinite(trigger.value))
    .map((trigger) => ({
      type: trigger.type,
      value: Number(trigger.value),
      enabled: true,
    }));

  if (triggers.length === 0) {
    return null;
  }

  return {
    enabled: true,
    triggers,
  };
}

function resetForm() {
  Object.assign(form, defaultForm());
  form.folderId = props.defaultFolderId ?? '';
  reminderEnabled.value = false;
  reminderTriggers.value = [];
  showMotivation.value = false;
  showReminder.value = false;
  showOrganization.value = false;
  activeTab.value = 'basic';
  krList.value = [];
  resetInlineKr();
}

function prefillFromGoal(goal: GoalClientDTO) {
  form.name = goal.name;
  form.description = goal.description ?? '';
  form.category = goal.category ?? '';
  form.importance = goal.importance;
  form.color = goal.color ?? '';
  form.feasibilityAnalysis = goal.feasibilityAnalysis ?? '';
  form.motivation = goal.motivation ?? '';
  form.tags = [...(goal.tags ?? [])];
  form.startDate = goal.startDate;
  form.targetDate = goal.targetDate;
  form.folderId = goal.folderId ?? '';
  form.parentGoalId = goal.parentGoalId ?? '';
  reminderEnabled.value = goal.reminderConfig?.enabled ?? false;
  reminderTriggers.value =
    goal.reminderConfig?.triggers.map((trigger) => ({
      type: trigger.type as GoalReminderTriggerType,
      value: trigger.value,
      enabled: trigger.enabled,
    })) ?? [];
  krList.value = (goal.keyResults ?? []).map(krFromDTO);

  // Auto-expand sections that have content
  if (form.motivation || form.feasibilityAnalysis) {
    showMotivation.value = true;
  }
  if (reminderEnabled.value || reminderTriggers.value.length > 0) {
    showReminder.value = true;
  }
  if (form.color || form.tags.length > 0 || form.folderId || form.parentGoalId) {
    showOrganization.value = true;
  }
}

// ── Watchers ───────────────────────────────────────────────────────────

watch(
  () => props.goal,
  (goal) => {
    if (goal && isEditMode.value) {
      prefillFromGoal(goal);
    }
  },
  { immediate: true },
);

watch(reminderEnabled, (enabled) => {
  if (enabled) {
    showReminder.value = true;
    if (reminderTriggers.value.length === 0) {
      addReminderTrigger();
    }
  }
});

watch(
  open,
  (isOpen) => {
    if (isOpen) {
      currentDraftKey.value = resolveDraftKey();
      const savedDraft = dialogDraftStore.load<GoalDialogDraft>(currentDraftKey.value);
      if (savedDraft) {
        restoreDraft(savedDraft);
      } else {
        activeTab.value = 'basic';
        if (isEditMode.value && props.goal) {
          prefillFromGoal(props.goal);
        } else if (!isEditMode.value) {
          resetForm();
        }
      }
      captureDraftBaseline();
    } else {
      draftBaseline.value = null;
      emit('dirty-change', false);
    }
  },
  { immediate: true },
);

watch(
  () => [form, reminderEnabled.value, reminderTriggers.value, krList.value, inlineKr],
  () => {
    if (!open.value || draftBaseline.value === null) return;
    const serialized = serializeDraft();
    if (currentDraftKey.value && serialized !== draftBaseline.value) {
      dialogDraftStore.save(currentDraftKey.value, createDraftSnapshot());
    } else if (currentDraftKey.value) {
      dialogDraftStore.clear(currentDraftKey.value);
    }
    emit('dirty-change', serialized !== draftBaseline.value);
  },
  { deep: true },
);

// ── KR Save Logic ──────────────────────────────────────────────────────

/**
 * Validate all local KRs before saving.
 * Returns an error message string if validation fails, null otherwise.
 */
function validateKrs(): string | null {
  for (const kr of krList.value) {
    if (kr._markedForDelete) continue;
    if (!kr.title.trim()) {
      return t('goal.dialog.krTitleRequired');
    }
    if (kr.weight < 1 || kr.weight > 5 || !Number.isInteger(kr.weight)) {
      return t('goal.dialog.krWeightInvalid');
    }
    if (kr.valueType !== 'Binary' && kr.targetValue <= 0) {
      return t('goal.dialog.krTargetInvalid');
    }
  }
  return null;
}

function validateReminder(): string | null {
  if (!reminderEnabled.value) {
    return null;
  }

  if (reminderTriggers.value.length === 0) {
    return t('goal.dialog.reminderAtLeastOneTrigger');
  }

  for (const trigger of reminderTriggers.value) {
    if (trigger.type === ReminderTriggerType.RemainingDays) {
      if (!Number.isFinite(trigger.value) || trigger.value < 0) {
        return t('goal.dialog.reminderRemainingDaysInvalid');
      }
      if (!form.targetDate) {
        return t('goal.dialog.reminderRemainingDaysRequiresTargetDate');
      }
    }

    if (trigger.type === ReminderTriggerType.TimeProgressPercentage) {
      if (!Number.isFinite(trigger.value) || trigger.value <= 0 || trigger.value > 100) {
        return t('goal.dialog.reminderTimeProgressInvalid');
      }
      if (!form.startDate || !form.targetDate || form.targetDate <= form.startDate) {
        return t('goal.dialog.reminderTimeProgressRequiresRange');
      }
    }
  }

  return null;
}

// ── Save Handler ───────────────────────────────────────────────────────

async function handleSave() {
  if (isSaving.value) return;
  if (!form.name.trim()) {
    toast.error(t('goal.dialog.titleRequired'));
    return;
  }

  if (inlineKr.title.trim()) {
    moveInlineKrToList();
  }

  const krError = validateKrs();
  if (krError) {
    toast.error(krError);
    return;
  }

  const reminderError = validateReminder();
  if (reminderError) {
    toast.error(reminderError);
    return;
  }

  const reminderConfig = normalizeReminderConfig();

  if (isEditMode.value && props.goal) {
    // Build partial update request — only include changed fields
    const req: UpdateGoalReq = { expectedVersion: props.goal.version };

    if (form.name.trim() !== props.goal.name) {
      req.name = form.name.trim();
    }

    const desc = form.description?.trim() || null;
    if (desc !== (props.goal.description ?? null)) {
      req.description = desc;
    }

    const cat = form.category || null;
    if (cat !== (props.goal.category ?? null)) {
      req.category = cat;
    }

    if (form.importance !== props.goal.importance) {
      req.importance = form.importance as CreateGoalReq['importance'];
    }

    const color = form.color || null;
    if (color !== (props.goal.color ?? null)) {
      req.color = color;
    }

    const feasibility = form.feasibilityAnalysis?.trim() || null;
    if (feasibility !== (props.goal.feasibilityAnalysis ?? null)) {
      req.feasibilityAnalysis = feasibility;
    }

    const motivation = form.motivation?.trim() || null;
    if (motivation !== (props.goal.motivation ?? null)) {
      req.motivation = motivation;
    }

    if (JSON.stringify(form.tags) !== JSON.stringify(props.goal.tags ?? [])) {
      req.tags = form.tags.length > 0 ? form.tags : null;
    }

    if (form.startDate !== (props.goal.startDate ?? null)) {
      req.startDate = form.startDate;
    }

    if (form.targetDate !== (props.goal.targetDate ?? null)) {
      req.targetDate = form.targetDate;
    }

    const folderId = form.folderId === 'none' ? null : form.folderId || null;
    if (folderId !== (props.goal.folderId ?? null)) {
      req.folderId = (folderId as GoalFolderId) ?? null;
    }

    const parentGoalId = form.parentGoalId === 'none' ? null : form.parentGoalId || null;
    if (parentGoalId !== (props.goal.parentGoalId ?? null)) {
      req.parentGoalId = (parentGoalId as GoalId) ?? null;
    }

    if (JSON.stringify(reminderConfig) !== JSON.stringify(props.goal.reminderConfig ?? null)) {
      req.reminderConfig = reminderConfig;
    }

    // Root and children are one desired aggregate state and one CAS write.
    req.keyResults = activeKrList.value.map((kr) => ({
      id: kr._existingId as NonNullable<UpdateGoalReq['keyResults']>[number]['id'],
      title: kr.title.trim(),
      valueType: kr.valueType as AddKeyResultReq['valueType'],
      calculationMethod: kr.calculationMethod as AddKeyResultReq['calculationMethod'],
      startValue: kr.initialValue,
      targetValue: kr.valueType === 'Binary' ? 1 : kr.targetValue,
      currentValue: kr.currentValue,
      unit: kr.unit.trim() || undefined,
      weight: kr.weight,
    }));

    const result = await updateGoal(props.goal.id, req);
    if (!result) return;

    clearDraft();
    open.value = false;
    emit('updated');
  } else {
    // Create mode
    const req: CreateGoalReq = {
      name: form.name.trim(),
      description: form.description?.trim() || undefined,
      category: form.category || undefined,
      importance: form.importance as CreateGoalReq['importance'],
      color: form.color || undefined,
      feasibilityAnalysis: form.feasibilityAnalysis?.trim() || undefined,
      motivation: form.motivation?.trim() || undefined,
      tags: form.tags.length > 0 ? form.tags : undefined,
      startDate: form.startDate ?? undefined,
      targetDate: form.targetDate ?? undefined,
      reminderConfig: reminderConfig ?? undefined,
      folderId: form.folderId === 'none' ? undefined : (form.folderId as GoalFolderId) || undefined,
      parentGoalId:
        form.parentGoalId === 'none' ? undefined : (form.parentGoalId as GoalId) || undefined,
      initialKeyResults: krList.value.map((kr) => ({
        title: kr.title.trim(),
        valueType: kr.valueType as AddKeyResultReq['valueType'],
        calculationMethod: kr.calculationMethod as AddKeyResultReq['calculationMethod'],
        startValue: kr.initialValue,
        targetValue: kr.valueType === 'Binary' ? 1 : kr.targetValue,
        currentValue: kr.currentValue,
        unit: kr.unit.trim() || undefined,
        weight: kr.weight,
      })),
    };

    const result = await createGoal(req);
    if (result) {
      clearDraft();
      resetForm();
      open.value = false;
      emit('created');
    }
  }
}
</script>
