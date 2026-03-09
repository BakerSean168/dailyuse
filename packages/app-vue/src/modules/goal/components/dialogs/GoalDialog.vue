<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-[680px] max-h-[90vh] flex flex-col gap-0 p-0">
      <DialogHeader class="px-6 pt-6 pb-4">
        <DialogTitle class="text-xl font-semibold tracking-tight">
          {{ isEditMode ? t('goal.dialog.titleEdit') : t('goal.dialog.titleCreate') }}
        </DialogTitle>
        <DialogDescription class="text-sm text-muted-foreground">
          {{ isEditMode ? t('goal.dialog.descEdit') : t('goal.dialog.descCreate') }}
        </DialogDescription>
      </DialogHeader>

      <Tabs v-model="activeTab" class="flex flex-col flex-1 min-h-0">
        <TabsList class="mx-6 mb-0 w-auto justify-start shrink-0">
          <TabsTrigger value="basic">{{ t('goal.dialog.tabBasicInfo') }}</TabsTrigger>
          <TabsTrigger value="keyresults">{{ t('goal.dialog.tabKeyResults') }}</TabsTrigger>
        </TabsList>

        <!-- ========== Tab 1: Basic Info ========== -->
        <TabsContent value="basic" class="flex-1 overflow-y-auto px-6 pb-2 mt-0">
          <div class="grid gap-5 py-4">
            <!-- Title Input -->
            <div class="grid gap-2">
              <Label htmlFor="goal-title" class="font-medium">{{
                t('goal.dialog.goalTitle')
              }}</Label>
              <Input
                id="goal-title"
                v-model="form.title"
                :placeholder="t('goal.dialog.goalTitlePlaceholder')"
                class="h-10"
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
              />
            </div>

            <!-- ========== CATEGORY & IMPORTANCE ========== -->

            <div class="grid grid-cols-2 gap-4">
              <div class="grid gap-2">
                <Label class="font-medium">{{ t('goal.dialog.category') }}</Label>
                <Select v-model="form.category">
                  <SelectTrigger>
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
                <Label class="font-medium">{{ t('goal.dialog.importance') }}</Label>
                <Select v-model="form.importance">
                  <SelectTrigger>
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
              <Label class="font-medium">{{ t('goal.dialog.timeline') }}</Label>
              <div class="grid grid-cols-2 gap-4">
                <!-- Start Date -->
                <Popover>
                  <PopoverTrigger as-child>
                    <Button
                      variant="outline"
                      class="h-10 w-full justify-start text-left font-normal"
                      :class="{ 'text-muted-foreground': !form.startDate }"
                    >
                      <CalendarIcon class="mr-2 h-4 w-4" />
                      {{ form.startDate ? formatDate(form.startDate) : t('goal.dialog.startDate') }}
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

                <!-- Target Date -->
                <Popover>
                  <PopoverTrigger as-child>
                    <Button
                      variant="outline"
                      class="h-10 w-full justify-start text-left font-normal"
                      :class="{ 'text-muted-foreground': !form.targetDate }"
                    >
                      <CalendarIcon class="mr-2 h-4 w-4" />
                      {{
                        form.targetDate ? formatDate(form.targetDate) : t('goal.dialog.targetDate')
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
                  <Popover>
                    <PopoverTrigger as-child>
                      <Button variant="outline" class="h-10 w-[140px] justify-start gap-2">
                        <div
                          class="h-4 w-4 rounded-full border"
                          :style="{ backgroundColor: form.color || '#94a3b8' }"
                        />
                        <span class="text-sm">{{ form.color || t('goal.dialog.pickColor') }}</span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent class="w-auto p-3" align="start">
                      <div class="grid grid-cols-4 gap-2">
                        <button
                          v-for="c in colorOptions"
                          :key="c"
                          class="h-7 w-7 rounded-full border-2 transition-transform hover:scale-110"
                          :class="
                            form.color === c ? 'border-foreground scale-110' : 'border-transparent'
                          "
                          :style="{ backgroundColor: c }"
                          @click="form.color = c"
                        />
                      </div>
                      <Button
                        v-if="form.color"
                        variant="ghost"
                        size="sm"
                        class="mt-2 w-full text-xs"
                        @click="form.color = ''"
                      >
                        {{ t('goal.dialog.clearColor') }}
                      </Button>
                    </PopoverContent>
                  </Popover>
                </div>

                <!-- Tags -->
                <TagInput
                  :tags="form.tags"
                  :label="t('goal.dialog.tags')"
                  :hint="t('goal.dialog.tagsHint')"
                  @update:tags="form.tags = $event"
                />

                <!-- Folder -->
                <div class="grid gap-2">
                  <Label class="text-sm font-medium">{{ t('goal.dialog.folder') }}</Label>
                  <Select v-model="form.folderId">
                    <SelectTrigger>
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
                  <Label class="text-sm font-medium">{{ t('goal.dialog.parentGoal') }}</Label>
                  <Select v-model="form.parentGoalId">
                    <SelectTrigger>
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
                      {{ kr.valueType }} · {{ kr.currentValue }} / {{ kr.targetValue }} ·
                      {{ t('goal.dialog.krWeight') }} {{ kr.weight }}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    class="h-8 w-8 shrink-0"
                    @click="editKr(kr._localId)"
                  >
                    <Pencil class="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    class="h-8 w-8 shrink-0 text-destructive hover:text-destructive"
                    @click="removeKr(kr._localId)"
                  >
                    <Trash2 class="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <!-- Empty state -->
            <div
              v-else
              class="flex flex-col items-center justify-center rounded-lg border border-dashed py-10 text-center text-muted-foreground"
            >
              <Target class="mb-2 h-8 w-8 opacity-40" />
              <p class="text-sm font-medium">{{ t('goal.dialog.krEmptyTitle') }}</p>
              <p class="text-xs mt-1">{{ t('goal.dialog.krEmptyDesc') }}</p>
            </div>

            <!-- Add KR button -->
            <Button variant="outline" class="w-full" @click="addKr">
              <Plus class="mr-2 h-4 w-4" />
              {{ t('goal.dialog.addKeyResult') }}
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      <DialogFooter class="px-6 py-4 border-t gap-2 sm:gap-0">
        <Button variant="outline" @click="open = false">{{ t('goal.dialog.cancel') }}</Button>
        <Button @click="handleSave" :disabled="isSaving">
          {{ isEditMode ? t('goal.dialog.saveChanges') : t('goal.dialog.createGoal') }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>

  <KeyResultDialog ref="keyResultDialogRef" @save="handleSaveKr" />
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
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
} from '@dailyuse/ui-vue-shadcn';
import {
  Calendar as CalendarIcon,
  ChevronDown,
  Lightbulb,
  Settings2,
  Plus,
  Pencil,
  Trash2,
  Target,
} from 'lucide-vue-next';
import { toast } from 'vue-sonner';
import { useGoal } from '../../composables/useGoal';
import KeyResultDialog from './KeyResultDialog.vue';
import type {
  CreateGoalReq,
  UpdateGoalReq,
  GoalClientDTO,
  KeyResultClientDTO,
  AddKeyResultReq,
  UpdateKeyResultReq,
} from '@dailyuse/contracts/goal';
import type { GoalFolderId, GoalId } from '@dailyuse/contracts/primitives';

// ── Props & Emits ──────────────────────────────────────────────────────

const props = withDefaults(
  defineProps<{
    mode?: 'create' | 'edit';
    goal?: GoalClientDTO | null;
  }>(),
  {
    mode: 'create',
    goal: null,
  },
);

const open = defineModel<boolean>('open', { default: false });

const emit = defineEmits<{
  created: [];
  updated: [];
}>();

// ── Composable ─────────────────────────────────────────────────────────

const {
  createGoal,
  updateGoal,
  goals,
  goalFolders,
  isSaving,
  fetchKeyResults,
  addKeyResult,
  updateKeyResult,
  deleteKeyResult,
  keyResults,
} = useGoal();

const { t, locale } = useI18n();

// ── Constants ──────────────────────────────────────────────────────────

const importanceLevels = ['Vital', 'Important', 'Moderate', 'Minor', 'Trivial'] as const;

const importanceLevelOptions = computed(() => [
  { value: 'Vital', label: t('goal.dialog.importanceVital') },
  { value: 'Important', label: t('goal.dialog.importanceImportant') },
  { value: 'Moderate', label: t('goal.dialog.importanceModerate') },
  { value: 'Minor', label: t('goal.dialog.importanceMinor') },
  { value: 'Trivial', label: t('goal.dialog.importanceTrivial') },
]);

const colorOptions = [
  '#ef4444',
  '#f97316',
  '#f59e0b',
  '#84cc16',
  '#22c55e',
  '#06b6d4',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#f43f5e',
  '#14b8a6',
  '#6366f1',
];

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

function makeEmptyKr(): LocalKr {
  return {
    _existingId: undefined,
    _localId: _localIdCounter++,
    _markedForDelete: false,
    title: '',
    valueType: 'Incremental',
    calculationMethod: 'Sum',
    weight: 1,
    initialValue: 0,
    targetValue: 100,
    currentValue: 0,
    unit: '',
  };
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
    version: 1,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
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
    return;
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
}

// ── Form State ─────────────────────────────────────────────────────────

const defaultForm = () => ({
  title: '',
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

const showMotivation = ref(false);
const showOrganization = ref(false);

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

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString(locale.value, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function handleStartDateSelect(date: unknown) {
  if (date instanceof Date) {
    form.startDate = date.getTime();
  } else if (date && typeof date === 'object' && 'toDate' in date) {
    form.startDate = (date as { toDate: () => Date }).toDate().getTime();
  } else {
    form.startDate = null;
  }
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

function resetForm() {
  Object.assign(form, defaultForm());
  showMotivation.value = false;
  showOrganization.value = false;
  activeTab.value = 'basic';
  krList.value = [];
}

function prefillFromGoal(goal: GoalClientDTO) {
  form.title = goal.name;
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

  // Auto-expand sections that have content
  if (form.motivation || form.feasibilityAnalysis) {
    showMotivation.value = true;
  }
  if (form.color || form.tags.length > 0 || form.folderId || form.parentGoalId) {
    showOrganization.value = true;
  }
}

// Populate KR list from store keyResults
function populateKrList() {
  krList.value = (keyResults.value ?? []).map(krFromDTO);
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

// Sync KR list from store when keyResults change (after fetch)
watch(keyResults, () => {
  if (isEditMode.value) {
    populateKrList();
  }
});

watch(open, async (isOpen) => {
  if (isOpen) {
    activeTab.value = 'basic';
    if (isEditMode.value && props.goal) {
      prefillFromGoal(props.goal);
      // Fetch KRs for this goal
      await fetchKeyResults(props.goal.id);
      populateKrList();
    } else if (!isEditMode.value) {
      resetForm();
    }
  }
});

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

/**
 * Persist KR changes: create new, update existing, delete removed.
 * Called after the goal itself has been saved/created.
 */
async function saveKrs(goalId: string): Promise<boolean> {
  for (const kr of krList.value) {
    if (kr._markedForDelete && kr._existingId) {
      const ok = await deleteKeyResult(goalId, kr._existingId);
      if (!ok) return false;
      continue;
    }

    if (kr._existingId) {
      // Update existing KR — only send changed fields
      const req: UpdateKeyResultReq = {};
      const original = keyResults.value.find((k) => k.id === kr._existingId);

      if (!original) continue;

      if (kr.title.trim() !== original.title) req.title = kr.title.trim();

      const unit = kr.unit?.trim() || null;
      if (unit !== original.progress.unit) req.unit = unit;

      if (kr.weight !== original.weight) req.weight = kr.weight;

      if (kr.valueType !== 'Binary' && kr.targetValue !== original.progress.targetValue) {
        req.targetValue = kr.targetValue;
      }
      if (kr.valueType !== 'Binary' && kr.initialValue !== original.progress.initialValue) {
        req.startValue = kr.initialValue;
      }

      if (Object.keys(req).length > 0) {
        const result = await updateKeyResult(goalId, kr._existingId, req);
        if (!result) return false;
      }
    } else {
      // Create new KR
      const req: AddKeyResultReq = {
        goalId: goalId as GoalId,
        title: kr.title.trim(),
        valueType: kr.valueType as AddKeyResultReq['valueType'],
        calculationMethod: kr.calculationMethod as AddKeyResultReq['calculationMethod'],
        targetValue: kr.valueType === 'Binary' ? 1 : kr.targetValue,
        currentValue: kr.currentValue,
        weight: kr.weight,
      };

      if (kr.unit?.trim()) req.unit = kr.unit.trim();

      const result = await addKeyResult(goalId, req);
      if (!result) return false;
    }
  }

  return true;
}

// ── Save Handler ───────────────────────────────────────────────────────

async function handleSave() {
  if (!form.title.trim()) {
    toast.error(t('goal.dialog.titleRequired'));
    return;
  }

  const krError = validateKrs();
  if (krError) {
    toast.error(krError);
    return;
  }

  if (isEditMode.value && props.goal) {
    // Build partial update request — only include changed fields
    const req: UpdateGoalReq = {};

    if (form.title.trim() !== props.goal.name) {
      req.title = form.title.trim();
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

    // Save goal update if there are changes
    if (Object.keys(req).length > 0) {
      const result = await updateGoal(props.goal.id, req);
      if (!result) return;
    }

    // Save KR changes
    const krOk = await saveKrs(props.goal.id);
    if (!krOk) return;

    open.value = false;
    emit('updated');
  } else {
    // Create mode
    const req: CreateGoalReq = {
      title: form.title.trim(),
      description: form.description?.trim() || undefined,
      category: form.category || undefined,
      importance: form.importance as CreateGoalReq['importance'],
      color: form.color || undefined,
      feasibilityAnalysis: form.feasibilityAnalysis?.trim() || undefined,
      motivation: form.motivation?.trim() || undefined,
      tags: form.tags.length > 0 ? form.tags : undefined,
      startDate: form.startDate ?? undefined,
      targetDate: form.targetDate ?? undefined,
      folderId: form.folderId === 'none' ? undefined : (form.folderId as GoalFolderId) || undefined,
      parentGoalId:
        form.parentGoalId === 'none' ? undefined : (form.parentGoalId as GoalId) || undefined,
    };

    const result = await createGoal(req);
    if (result) {
      // Save any KRs that were added before the goal existed
      if (krList.value.length > 0) {
        await saveKrs(result.id);
      }
      resetForm();
      open.value = false;
      emit('created');
    }
  }
}
</script>
