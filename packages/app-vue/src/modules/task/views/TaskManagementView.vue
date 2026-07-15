<template>
  <div class="flex h-full min-h-0 flex-col overflow-hidden" data-testid="task-management-view">
    <header
      class="z-10 flex min-h-14 shrink-0 flex-col border-b border-border bg-background/80 backdrop-blur-sm"
      data-testid="task-page-toolbar"
    >
      <div class="flex items-center justify-between gap-2 px-3 pt-2">
        <p class="truncate text-xs text-muted-foreground" data-testid="task-count-label">
          {{ countLabel }}
        </p>
        <div class="flex shrink-0 items-center gap-1">
          <Button
            data-testid="create-task-template-button"
            data-primary-action="create-task-template"
            :aria-label="t('task.templateMgmt.createNew')"
            size="sm"
            class="h-8 px-2 @xl/panel:px-3"
            @click="handleCreate"
          >
            <Plus class="h-4 w-4 @xl/panel:mr-1.5" />
            <span class="hidden @xl/panel:inline">{{ t('task.templateMgmt.createNew') }}</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <Button variant="ghost" size="icon" class="h-8 w-8" data-testid="task-more-actions">
                <MoreHorizontal class="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" class="w-44">
              <DropdownMenuItem
                data-testid="delete-all-templates-button"
                class="text-destructive focus:text-destructive"
                :disabled="templates.length === 0"
                @click="showDeleteAllDialog = true"
              >
                <Trash2 class="mr-2 h-4 w-4" />
                {{ t('task.templateMgmt.deleteAll') }}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <TaskFilterBar
        v-model:status="currentStatus"
        v-model:relation="currentRelation"
        v-model:search="searchQuery"
        v-model:view-mode="viewMode"
        :status-options="statusOptions"
        :relation-options="relationOptions"
      />
    </header>

    <div id="task-template-management" class="min-h-0 flex-1 overflow-y-auto p-3">
      <template v-if="viewMode === 'card'">
        <TaskTemplateGrid
          :templates="filteredViewModels"
          :total-count="viewModels.length"
          :loading="isLoading"
          :has-active-filters="hasActiveFilters"
          :status-empty-text="statusEmptyText"
          :highlighted-template-id="highlightedTemplateId"
          :enable-drag="true"
          :on-create-dependency="handleCardCreateDependency"
          @ai-generate="router.push('/')"
          @clear-filters="clearFilters"
          @click-template="handleClickTemplate"
          @edit-template="handleEdit"
          @delete-template="handleDelete"
          @pause-template="handlePause"
          @resume-template="handleResume"
          @relation-filter-click="(filter) => (currentRelation = filter)"
          @locate-graph="handleLocateGraph"
        />
      </template>

      <template v-else>
        <div
          class="h-[600px] min-w-0 rounded-lg border border-border/50"
          data-testid="task-graph-view"
        >
          <TaskDAGVisualization
            :graph-data="graphData"
            :active-node-id="graphFocusTaskId"
            :compact="false"
            @node-click="handleGraphNodeClick"
          />
        </div>
      </template>
    </div>

    <!-- 创建模板对话框 -->
    <TaskTemplateDialog
      v-model="showCreateDialog"
      mode="create"
      :saving="isSaving"
      :available-templates="viewModels"
      :graph-tasks="graphData.nodes"
      @save="handleSaveCreate"
      @cancel="showCreateDialog = false"
    />

    <!-- 编辑模板对话框 -->
    <TaskTemplateDialog
      v-if="editViewModel"
      v-model="showEditDialog"
      mode="edit"
      :template="editViewModel"
      :saving="isSaving"
      :available-templates="viewModels"
      :graph-tasks="graphData.nodes"
      :dependencies="dependencies"
      :on-create-dependency="handleCreateDependencyFromDialog"
      :on-delete-dependency="handleDeleteDependency"
      @save="handleSaveEdit"
      @cancel="showEditDialog = false"
    />

    <!-- 全部删除：输入 DELETE 的强确认（危险区动作，§0.1） -->
    <Dialog
      :open="showDeleteAllDialog"
      @update:open="
        (val: boolean) => {
          if (!val) cancelDeleteAll();
        }
      "
    >
      <DialogContent class="max-w-[500px]">
        <DialogHeader class="bg-destructive -m-6 mb-0 p-4 rounded-t-lg">
          <DialogTitle class="flex items-center text-white">
            <AlertCircle class="h-5 w-5 mr-2 text-white" />
            {{ t('task.templateMgmt.confirmDeleteAll') }}
          </DialogTitle>
        </DialogHeader>
        <div class="space-y-4 pt-4">
          <Alert class="border-warning/40 bg-warning/10">
            <AlertDescription>
              <strong>{{ t('task.templateMgmt.cannotUndo') }}</strong>
            </AlertDescription>
          </Alert>
          <p class="text-base">
            {{ t('task.templateMgmt.confirmText', { count: templates.length }) }}
          </p>
          <div class="space-y-2">
            <Label for="delete-confirm">{{ t('task.templateMgmt.inputDeletePlaceholder') }}</Label>
            <Input id="delete-confirm" v-model="deleteConfirmText" placeholder="DELETE" />
          </div>
        </div>
        <DialogFooter class="pt-4">
          <Button variant="ghost" @click="cancelDeleteAll">
            {{ t('task.templateMgmt.cancel') }}
          </Button>
          <Button
            variant="destructive"
            :disabled="deleteConfirmText !== 'DELETE'"
            @click="confirmDeleteAll"
          >
            <Trash2 class="mr-1 h-4 w-4" />
            {{ t('task.templateMgmt.confirmDeleteAllBtn') }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { toast } from 'vue-sonner';
import { useI18n } from 'vue-i18n';
import { AlertCircle, MoreHorizontal, Plus, Trash2 } from '@lucide/vue';
import {
  Alert,
  AlertDescription,
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Input,
  Label,
  useConfirm,
} from '@dailyuse/ui-vue-shadcn';
import TaskFilterBar from '../components/TaskFilterBar.vue';
import TaskTemplateGrid from '../components/TaskTemplateGrid.vue';
import TaskDAGVisualization from '../components/dag/TaskDAGVisualization.vue';
import TaskTemplateDialog from '../components/dialogs/TaskTemplateDialog.vue';
import { useTask } from '../composables/useTask';
import type {
  TaskForDAGViewModel,
  TaskRelationFilter,
  TaskStatusFilter,
  TaskTemplateViewModel,
  TaskViewMode,
} from '../components/types';
import { DependencyType, TaskGoalBindingTrigger, TaskType } from '@dailyuse/contracts/task';
import type { DependencyType as DependencyTypeValue } from '@dailyuse/contracts/task';
import {
  mapTaskTemplateDtoToViewModel,
  toTaskTimeConfigPayload,
} from '../utils/task-template-presentation';
import type { GoalId, KeyResultId, TaskTemplateId } from '@dailyuse/contracts/primitives';
import type { RecurrenceRuleDTO } from '@dailyuse/contracts/task';
import { ImportanceLevel } from '@dailyuse/contracts/shared';
import { buildTaskGraphData } from '../types/task-dag.types';

const router = useRouter();
const { t } = useI18n();
const {
  templates,
  dependencies,
  isLoading,
  isSaving,
  fetchTaskGraph,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  activateTemplate,
  pauseTemplate,
  createDependency,
  deleteDependency,
} = useTask();

// ── 过滤 / 视图状态（从 TaskTemplateManagement 上移） ──
const currentStatus = ref<TaskStatusFilter>('ACTIVE');
const currentRelation = ref<TaskRelationFilter>('all');
const searchQuery = ref('');
const viewMode = ref<TaskViewMode>('card');
const highlightedTemplateId = ref<string | null>(null);
const graphFocusTaskId = ref<string | null>(null);

const showCreateDialog = ref(false);
const showEditDialog = ref(false);
const editViewModel = ref<TaskTemplateViewModel | null>(null);
const showDeleteAllDialog = ref(false);
const deleteConfirmText = ref('');

const viewModels = computed(() => {
  const baseViewModels = templates.value.map((dto) => mapTaskTemplateDtoToViewModel(dto, t));
  const templateById = new Map(baseViewModels.map((template) => [template.id, template]));
  const predecessorCounts = new Map<string, number>();
  const successorCounts = new Map<string, number>();
  const childCounts = new Map<string, number>();

  baseViewModels.forEach((template) => {
    predecessorCounts.set(template.id, 0);
    successorCounts.set(template.id, 0);
    childCounts.set(template.id, 0);
  });

  dependencies.value.forEach((dependency) => {
    predecessorCounts.set(
      dependency.successorTaskId,
      (predecessorCounts.get(dependency.successorTaskId) ?? 0) + 1,
    );
    successorCounts.set(
      dependency.predecessorTaskId,
      (successorCounts.get(dependency.predecessorTaskId) ?? 0) + 1,
    );
  });

  baseViewModels.forEach((template) => {
    if (!template.parentTaskId) {
      return;
    }

    childCounts.set(template.parentTaskId, (childCounts.get(template.parentTaskId) ?? 0) + 1);
  });

  return baseViewModels.map((template) => ({
    ...template,
    parentTaskTitle: template.parentTaskId
      ? (templateById.get(template.parentTaskId)?.title ?? null)
      : null,
    predecessorCount: predecessorCounts.get(template.id) ?? 0,
    successorCount: successorCounts.get(template.id) ?? 0,
    childCount: childCounts.get(template.id) ?? 0,
  }));
});

const graphData = computed(() => buildTaskGraphData(templates.value, dependencies.value));

const countLabel = computed(() =>
  t('task.templateMgmt.countLabel', { count: viewModels.value.length }),
);

// ── 过滤链：状态 → 关系 → 搜索 ──
const statusTemplates = computed(() =>
  [...viewModels.value]
    .filter((template) => currentStatus.value === 'ALL' || template.status === currentStatus.value)
    .sort((a, b) => (b.priority || 0) - (a.priority || 0)),
);

function matchesRelationFilter(
  template: TaskTemplateViewModel,
  filter: TaskRelationFilter,
): boolean {
  if (filter === 'blocked') return !!template.isBlocked;
  if (filter === 'parented') return !!template.parentTaskId;
  if (filter === 'dependencies') {
    return (template.predecessorCount ?? 0) > 0 || (template.successorCount ?? 0) > 0;
  }
  if (filter === 'children') return (template.childCount ?? 0) > 0;
  return true;
}

const relationTemplates = computed(() =>
  statusTemplates.value.filter((template) =>
    matchesRelationFilter(template, currentRelation.value),
  ),
);

const filteredViewModels = computed(() => {
  if (!searchQuery.value.trim()) return relationTemplates.value;
  const q = searchQuery.value.toLowerCase();
  return relationTemplates.value.filter(
    (template) =>
      template.title.toLowerCase().includes(q) ||
      template.description?.toLowerCase().includes(q) ||
      template.tags?.some((tag) => tag.toLowerCase().includes(q)),
  );
});

const statusOptions = computed(() => {
  const countByStatus = (status: TaskStatusFilter) =>
    status === 'ALL'
      ? viewModels.value.length
      : viewModels.value.filter((template) => template.status === status).length;

  return (
    [
      { value: 'ALL', label: t('common.all') },
      { value: 'ACTIVE', label: t('task.templateMgmt.statusActive') },
      { value: 'PAUSED', label: t('task.templateMgmt.statusPaused') },
      { value: 'ARCHIVED', label: t('task.templateMgmt.statusArchived') },
    ] as const
  ).map((option) => ({ ...option, count: countByStatus(option.value) }));
});

const relationOptions = computed(() =>
  (
    [
      { value: 'all', label: t('task.templateMgmt.relationAll') },
      { value: 'blocked', label: t('task.templateMgmt.relationBlocked') },
      { value: 'parented', label: t('task.templateMgmt.relationParented') },
      { value: 'dependencies', label: t('task.templateMgmt.relationDependencies') },
      { value: 'children', label: t('task.templateMgmt.relationChildren') },
    ] as const
  ).map((option) => ({
    ...option,
    count: statusTemplates.value.filter((template) => matchesRelationFilter(template, option.value))
      .length,
  })),
);

const hasActiveFilters = computed(
  () => currentRelation.value !== 'all' || searchQuery.value.trim().length > 0,
);

const statusEmptyText = computed(() => {
  if (hasActiveFilters.value) return t('task.templateMgmt.noMatch');
  if (currentStatus.value === 'ACTIVE') return t('task.templateMgmt.noActive');
  if (currentStatus.value === 'PAUSED') return t('task.templateMgmt.noPaused');
  if (currentStatus.value === 'ARCHIVED') return t('task.templateMgmt.noArchived');
  return t('task.templateMgmt.noTemplates');
});

function clearFilters() {
  currentRelation.value = 'all';
  searchQuery.value = '';
}

async function refreshTaskManagement() {
  await fetchTaskGraph({ page: 1, limit: 1000 });
}

function toGoalBindingPayload(template: TaskTemplateViewModel) {
  if (!template.goalBinding?.goalId || !template.goalBinding?.keyResultId) {
    return null;
  }

  return {
    goalId: template.goalBinding.goalId as GoalId,
    keyResultId: template.goalBinding.keyResultId as KeyResultId,
    goalRecordValue: template.goalBinding.incrementValue ?? 1,
    progressTrigger: template.goalBinding.progressTrigger ?? TaskGoalBindingTrigger.PerInstance,
  };
}

function handleCreate() {
  showCreateDialog.value = true;
}

async function handleSaveCreate(template: TaskTemplateViewModel) {
  const result = await createTemplate({
    name: template.title,
    description: template.description ?? null,
    taskType: template.recurrenceRule ? TaskType.Recurring : TaskType.OneTime,
    timeConfig: toTaskTimeConfigPayload(template.timeConfig),
    recurrenceRule: (template.recurrenceRule as unknown as RecurrenceRuleDTO) ?? null,
    importance: (template.importance as ImportanceLevel) ?? 'Moderate',
    parentTaskId: (template.parentTaskId as TaskTemplateId) ?? null,
    tags: template.tags ?? [],
    color: template.color ?? null,
    goalBinding: toGoalBindingPayload(template),
  });
  if (result) {
    showCreateDialog.value = false;
    toast.success(t('task.management.createSuccess'));
    await refreshTaskManagement();
  }
}

function handleClickTemplate(templateId: string) {
  router.push({ name: 'task-detail', params: { id: templateId } });
}

function handleEdit(templateId: string) {
  const vm = viewModels.value.find((v) => v.id === templateId);
  if (vm) {
    editViewModel.value = { ...vm };
    showEditDialog.value = true;
  }
}

async function handleSaveEdit(vm: TaskTemplateViewModel) {
  const result = await updateTemplate(vm.id, {
    name: vm.title,
    description: vm.description ?? null,
    timeConfig: toTaskTimeConfigPayload(vm.timeConfig),
    recurrenceRule: (vm.recurrenceRule as unknown as RecurrenceRuleDTO) ?? null,
    importance: (vm.importance as ImportanceLevel) ?? 'Moderate',
    parentTaskId: (vm.parentTaskId as TaskTemplateId) ?? null,
    tags: vm.tags ?? [],
    color: vm.color ?? null,
    goalBinding: toGoalBindingPayload(vm),
  });
  if (result) {
    showEditDialog.value = false;
    editViewModel.value = null;
    toast.success(t('task.management.editSuccess'));
    await refreshTaskManagement();
  }
}

/** 卡片拖拽建依赖（DraggableTaskCard 契约：入参为两个 VM） */
async function handleCardCreateDependency(
  source: TaskTemplateViewModel,
  target: TaskTemplateViewModel,
): Promise<boolean> {
  const result = await createDependency({
    predecessorTaskId: source.id,
    successorTaskId: target.id,
    dependencyType: DependencyType.FinishToStart,
  });

  if (!result) {
    return false;
  }

  await refreshTaskManagement();
  return true;
}

async function handleCreateDependencyFromDialog(dependency: {
  predecessorTaskId: string;
  successorTaskId: string;
  dependencyType: DependencyTypeValue;
}): Promise<boolean> {
  const result = await createDependency(dependency);
  if (!result) {
    return false;
  }

  await refreshTaskManagement();
  return true;
}

async function handleDeleteDependency(dependencyId: string): Promise<boolean> {
  const deleted = await deleteDependency(dependencyId);
  if (!deleted) {
    return false;
  }

  await refreshTaskManagement();
  return true;
}

async function handleDelete(template: TaskTemplateViewModel) {
  const confirmed = await useConfirm({
    title: t('task.management.deleteTemplate'),
    description: t('task.management.confirmDelete', { name: template.title }),
    confirmText: t('common.confirm'),
    cancelText: t('common.cancel'),
    variant: 'destructive',
  });

  if (!confirmed) return;
  const deleted = await deleteTemplate(template.id);
  if (deleted) {
    await refreshTaskManagement();
  }
}

async function handleResume(template: TaskTemplateViewModel) {
  const result = await activateTemplate(template.id);
  if (result) {
    await refreshTaskManagement();
  }
}

async function handlePause(template: TaskTemplateViewModel) {
  const confirmed = await useConfirm({
    title: t('task.management.pauseTitle'),
    description: t('task.management.pauseDescription', { name: template.title }),
    confirmText: t('task.templateCard.pause'),
    cancelText: t('common.cancel'),
    variant: 'destructive',
  });

  if (!confirmed) return;

  const result = await pauseTemplate(template.id);
  if (result) {
    await refreshTaskManagement();
  }
}

// ── 全部删除（输入 DELETE 强确认；批量化属后端专项，本轮只降级入口） ──
function cancelDeleteAll() {
  showDeleteAllDialog.value = false;
  deleteConfirmText.value = '';
}

async function confirmDeleteAll() {
  if (deleteConfirmText.value !== 'DELETE') return;
  cancelDeleteAll();

  for (const template of templates.value) {
    await deleteTemplate(template.id);
  }
  await refreshTaskManagement();
  toast.success(t('task.management.allDeleted'));
}

// ── 图谱视图联动 ──
function handleLocateGraph(templateId: string) {
  highlightedTemplateId.value = templateId;
  graphFocusTaskId.value = templateId;
  viewMode.value = 'graph';
}

async function handleGraphNodeClick(task: TaskForDAGViewModel) {
  currentStatus.value = (task.status as TaskStatusFilter) || 'ACTIVE';
  currentRelation.value = 'all';
  highlightedTemplateId.value = task.id;
  graphFocusTaskId.value = task.id;
  viewMode.value = 'card';

  await nextTick();
  const target = document.querySelector(`[data-task-id="${task.id}"]`) as HTMLElement | null;
  target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

onMounted(async () => {
  await refreshTaskManagement();
});
</script>
