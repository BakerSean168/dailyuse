<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-[680px] max-h-[90vh] flex flex-col gap-0 p-0">
      <DialogHeader class="px-6 pt-6 pb-4">
        <DialogTitle class="text-xl font-semibold tracking-tight">
          {{ isEditMode ? 'Edit Goal' : 'Create New Goal' }}
        </DialogTitle>
        <DialogDescription class="text-sm text-muted-foreground">
          {{
            isEditMode
              ? 'Update goal details, timeline, and organization.'
              : 'Set a clear objective and define key results to measure success.'
          }}
        </DialogDescription>
      </DialogHeader>

      <div class="flex-1 overflow-y-auto px-6 pb-2">
        <div class="grid gap-5 py-2">
          <!-- ========== BASIC INFO ========== -->

          <!-- Title Input -->
          <div class="grid gap-2">
            <Label htmlFor="goal-title" class="font-medium">Goal Title</Label>
            <Input
              id="goal-title"
              v-model="form.title"
              placeholder="e.g. Increase Monthly Recurring Revenue"
              class="h-10"
            />
          </div>

          <!-- Description -->
          <div class="grid gap-2">
            <Label htmlFor="goal-description" class="font-medium">Description</Label>
            <Textarea
              id="goal-description"
              v-model="form.description"
              placeholder="Add details about why this goal matters..."
              class="min-h-[80px] resize-none"
            />
          </div>

          <!-- ========== CATEGORY & IMPORTANCE ========== -->

          <div class="grid grid-cols-2 gap-4">
            <div class="grid gap-2">
              <Label class="font-medium">Category</Label>
              <Select v-model="form.category">
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="product">Product</SelectItem>
                  <SelectItem value="engineering">Engineering</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="personal">Personal</SelectItem>
                  <SelectItem value="health">Health</SelectItem>
                  <SelectItem value="finance">Finance</SelectItem>
                  <SelectItem value="learning">Learning</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div class="grid gap-2">
              <Label class="font-medium">Importance</Label>
              <Select v-model="form.importance">
                <SelectTrigger>
                  <SelectValue placeholder="Select importance" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="level in importanceLevels" :key="level" :value="level">
                    {{ level }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <!-- ========== TIMELINE ========== -->

          <div class="grid gap-2">
            <Label class="font-medium">Timeline</Label>
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
                    {{ form.startDate ? formatDate(form.startDate) : 'Start date' }}
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
                    {{ form.targetDate ? formatDate(form.targetDate) : 'Target date' }}
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
                  Motivation & Feasibility
                </span>
                <ChevronDown
                  class="h-4 w-4 transition-transform"
                  :class="{ 'rotate-180': showMotivation }"
                />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent class="mt-3 space-y-4">
              <div class="grid gap-2">
                <Label htmlFor="goal-motivation" class="text-sm font-medium">Motivation</Label>
                <Textarea
                  id="goal-motivation"
                  v-model="form.motivation"
                  placeholder="Why is this goal important to you?"
                  class="min-h-[60px] resize-none"
                />
              </div>
              <div class="grid gap-2">
                <Label htmlFor="goal-feasibility" class="text-sm font-medium">
                  Feasibility Analysis
                </Label>
                <Textarea
                  id="goal-feasibility"
                  v-model="form.feasibilityAnalysis"
                  placeholder="What resources, skills, and conditions are needed?"
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
                  Organization
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
                <Label class="text-sm font-medium">Color</Label>
                <Popover>
                  <PopoverTrigger as-child>
                    <Button variant="outline" class="h-10 w-[140px] justify-start gap-2">
                      <div
                        class="h-4 w-4 rounded-full border"
                        :style="{ backgroundColor: form.color || '#94a3b8' }"
                      />
                      <span class="text-sm">{{ form.color || 'Pick a color' }}</span>
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
                      Clear color
                    </Button>
                  </PopoverContent>
                </Popover>
              </div>

              <!-- Tags -->
              <TagInput
                :tags="form.tags"
                label="Tags"
                hint="Press enter to add a tag (auto kebab-case)"
                @update:tags="form.tags = $event"
              />

              <!-- Folder -->
              <div class="grid gap-2">
                <Label class="text-sm font-medium">Folder</Label>
                <Select v-model="form.folderId">
                  <SelectTrigger>
                    <SelectValue placeholder="No folder" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem v-for="folder in goalFolders" :key="folder.id" :value="folder.id">
                      {{ folder.name }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <!-- Parent Goal -->
              <div class="grid gap-2">
                <Label class="text-sm font-medium">Parent Goal</Label>
                <Select v-model="form.parentGoalId">
                  <SelectTrigger>
                    <SelectValue placeholder="No parent goal" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem v-for="g in availableParentGoals" :key="g.id" :value="g.id">
                      {{ g.name }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </div>

      <DialogFooter class="px-6 py-4 border-t gap-2 sm:gap-0">
        <Button variant="outline" @click="open = false">Cancel</Button>
        <Button @click="handleSave" :disabled="isSaving">
          {{ isEditMode ? 'Save Changes' : 'Create Goal' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
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
} from '@dailyuse/ui-vue-shadcn';
import { Calendar as CalendarIcon, ChevronDown, Lightbulb, Settings2 } from 'lucide-vue-next';
import { toast } from 'vue-sonner';
import { useGoal } from '../../composables/useGoal';
import { TagInput } from '../../../governance/components';
import type { CreateGoalReq, UpdateGoalReq, GoalClientDTO } from '@dailyuse/contracts/goal';
import type { GoalFolderId, GoalId } from '@dailyuse/contracts/primitives';

// ── Props & Emits ──────────────────────────────────────────────────────

interface Props {
  mode?: 'create' | 'edit';
  goal?: GoalClientDTO | null;
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'create',
  goal: null,
});

const open = defineModel<boolean>('open', { default: false });

const emit = defineEmits<{
  (e: 'created'): void;
  (e: 'updated'): void;
}>();

// ── Composable ─────────────────────────────────────────────────────────

const { createGoal, updateGoal, goals, goalFolders, isSaving } = useGoal();

// ── Constants ──────────────────────────────────────────────────────────

const importanceLevels = ['Vital', 'Important', 'Moderate', 'Minor', 'Trivial'] as const;

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
  startDate: null as number | null,
  targetDate: null as number | null,
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
  return new Date(ts).toLocaleDateString('en-US', {
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

watch(open, (isOpen) => {
  if (isOpen) {
    if (isEditMode.value && props.goal) {
      prefillFromGoal(props.goal);
    } else if (!isEditMode.value) {
      resetForm();
    }
  }
});

// ── Save Handler ───────────────────────────────────────────────────────

async function handleSave() {
  if (!form.title.trim()) {
    toast.error('Goal title is required');
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

    // Only fire update if something actually changed
    if (Object.keys(req).length === 0) {
      open.value = false;
      return;
    }

    const result = await updateGoal(props.goal.id, req);
    if (result) {
      open.value = false;
      emit('updated');
    }
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
      resetForm();
      open.value = false;
      emit('created');
    }
  }
}
</script>
