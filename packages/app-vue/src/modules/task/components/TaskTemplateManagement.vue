<template>
  <div id="task-template-management" class="p-6">
    <div class="flex justify-between items-center mb-8 flex-wrap gap-4">
      <div class="flex gap-1 border rounded-md">
        <Button
          v-for="status in statusFilters"
          :key="status.value"
          :variant="currentStatus === status.value ? 'default' : 'ghost'"
          size="lg"
          @click="currentStatus = status.value"
        >
          <component :is="getStatusIconComponent(status.icon)" class="h-4 w-4 mr-1" />
          {{ status.label }}
          <Badge :class="getStatusBadgeClass(status.value)" class="ml-2 text-xs">
            {{ getTemplateCountByStatus(status.value) }}
          </Badge>
        </Button>
      </div>

      <div class="flex gap-4 items-center">
        <Button
          v-if="templates.length > 0"
          data-testid="view-dependency-graph-button"
          variant="outline"
          size="lg"
          @click="showDependencyDialog = true"
        >
          <Share2 class="h-4 w-4 mr-2" />
          {{ t('task.templateMgmt.viewDependencyGraph') }}
        </Button>

        <Button
          v-if="templates.length > 0"
          data-testid="delete-all-templates-button"
          variant="outline"
          size="lg"
          class="border-destructive text-destructive hover:bg-destructive/10"
          @click="showDeleteAllDialog = true"
        >
          <Trash2 class="h-4 w-4 mr-2" />
          {{ t('task.templateMgmt.deleteAll') }}
        </Button>

        <Button
          data-testid="create-task-template-button"
          size="lg"
          @click="emit('create-template')"
        >
          <Plus class="h-4 w-4 mr-2" />
          {{ t('task.templateMgmt.createNew') }}
        </Button>
      </div>
    </div>

    <div class="grid grid-cols-[repeat(auto-fill,minmax(380px,1fr))] gap-6">
      <Card v-if="filteredTemplates.length === 0" class="col-span-full">
        <CardContent class="text-center p-8">
          <component
            :is="getEmptyStateIconComponent()"
            class="h-16 w-16 mx-auto mb-4"
            :class="getEmptyStateIconColor()"
          />
          <h3 class="text-xl font-semibold mb-2">{{ getEmptyStateText() }}</h3>
          <Button
            v-if="currentStatus === 'ACTIVE'"
            variant="secondary"
            class="mt-4"
            @click="emit('create-template')"
          >
            <Plus class="h-4 w-4 mr-2" />
            {{ t('task.templateMgmt.createFirst') }}
          </Button>
        </CardContent>
      </Card>

      <DraggableTaskCard
        v-for="template in filteredTemplates"
        :key="template.id"
        :template="template"
        :enable-drag="true"
        :on-create-dependency="handleCreateDependency"
        @click="(id) => emit('click-template', id)"
        @edit="(id) => emit('edit-template', id)"
        @delete="(tpl) => emit('delete-template', tpl)"
        @pause="(tpl) => emit('pause-template', tpl)"
        @resume="(tpl) => emit('resume-template', tpl)"
      />
    </div>

    <Dialog :open="showDependencyDialog" @update:open="showDependencyDialog = $event">
      <DialogContent class="max-w-[1400px]">
        <DialogHeader>
          <DialogTitle class="flex items-center text-lg font-semibold">
            <Share2 class="h-5 w-5 mr-2" />
            {{ t('task.templateMgmt.dependencyGraphTitle') }}
          </DialogTitle>
        </DialogHeader>
        <div style="height: 600px">
          <TaskDAGVisualization
            v-if="showDependencyDialog"
            :tasks="templates as any"
            :dependencies="dependencies"
            :compact="false"
          />
        </div>
        <DialogFooter>
          <Button variant="ghost" @click="showDependencyDialog = false">{{
            t('task.templateMgmt.cancel')
          }}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

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
        <div class="pt-4 space-y-4">
          <Alert class="bg-warning/10 border-warning/40">
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
          <Button variant="ghost" @click="cancelDeleteAll">{{
            t('task.templateMgmt.cancel')
          }}</Button>
          <Button
            variant="destructive"
            :disabled="deleteConfirmText !== 'DELETE'"
            @click="confirmDeleteAll"
          >
            <Trash2 class="h-4 w-4 mr-1" />
            {{ t('task.templateMgmt.confirmDeleteAllBtn') }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, markRaw } from 'vue';
import type { TaskDependencyClientDTO } from '@dailyuse/contracts/task';
import DraggableTaskCard from './cards/DraggableTaskCard.vue';
import TaskDAGVisualization from './dag/TaskDAGVisualization.vue';
import type { TaskTemplateViewModel } from './types';
import {
  Card,
  CardContent,
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Alert,
  AlertDescription,
  Input,
  Label,
} from '@dailyuse/ui-vue-shadcn';
import {
  Plus,
  Trash2,
  Share2,
  AlertCircle,
  PlayCircle,
  PauseCircle,
  Archive,
  Circle,
} from 'lucide-vue-next';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

interface StatusFilter {
  label: string;
  value: string;
  icon: string;
}

const props = withDefaults(
  defineProps<{
    templates: TaskTemplateViewModel[];
    dependencies: TaskDependencyClientDTO[];
    statusFilters?: StatusFilter[];
    onCreateDependency?: (sourceId: string, targetId: string) => Promise<boolean> | boolean;
  }>(),
  {
    statusFilters: () => [
      { label: 'ACTIVE', value: 'ACTIVE', icon: 'mdi-play-circle' },
      { label: 'PAUSED', value: 'PAUSED', icon: 'mdi-pause-circle' },
      { label: 'ARCHIVED', value: 'ARCHIVED', icon: 'mdi-archive' },
    ],
  },
);

const emit = defineEmits<{
  (e: 'create-template'): void;
  (e: 'click-template', templateId: string): void;
  (e: 'edit-template', templateId: string): void;
  (e: 'delete-template', template: TaskTemplateViewModel): void;
  (e: 'pause-template', template: TaskTemplateViewModel): void;
  (e: 'resume-template', template: TaskTemplateViewModel): void;
  (e: 'delete-all-templates'): void;
  (e: 'dependency-created', sourceId: string, targetId: string): void;
}>();

const statusLabelMap = computed<Record<string, string>>(() => ({
  ACTIVE: t('task.templateMgmt.statusActive'),
  PAUSED: t('task.templateMgmt.statusPaused'),
  ARCHIVED: t('task.templateMgmt.statusArchived'),
}));

const statusFilters = computed(() =>
  props.statusFilters.map((s) => ({
    ...s,
    label: statusLabelMap.value[s.value] || s.label,
  })),
);

const currentStatus = ref('ACTIVE');
const showDeleteAllDialog = ref(false);
const deleteConfirmText = ref('');
const showDependencyDialog = ref(false);

const templates = computed(() => props.templates || []);

const filteredTemplates = computed(() => {
  return [...templates.value]
    .filter((template) => template.status === currentStatus.value)
    .sort((a, b) => (b.priority || 0) - (a.priority || 0));
});

const getTemplateCountByStatus = (status: string) => {
  return templates.value.filter((template) => template.status === status).length;
};

const getStatusBadgeClass = (status: string) => {
  if (status === 'ACTIVE') return 'bg-success/15 text-success';
  if (status === 'PAUSED') return 'bg-warning/15 text-warning';
  if (status === 'ARCHIVED') return 'bg-info/15 text-info';
  if (status === 'DELETED') return 'bg-destructive/15 text-destructive';
  return 'bg-muted text-foreground';
};

const getStatusIconComponent = (icon: string) => {
  const iconMap: Record<string, any> = {
    'mdi-play-circle': PlayCircle,
    'mdi-pause-circle': PauseCircle,
    'mdi-archive': Archive,
  };
  return iconMap[icon] || Circle;
};

const getEmptyStateText = () => {
  if (currentStatus.value === 'ACTIVE') return t('task.templateMgmt.noActive');
  if (currentStatus.value === 'PAUSED') return t('task.templateMgmt.noPaused');
  if (currentStatus.value === 'ARCHIVED') return t('task.templateMgmt.noArchived');
  return t('task.templateMgmt.noTemplates');
};

const getEmptyStateIconComponent = () => {
  return getStatusIconComponent(
    props.statusFilters.find((s) => s.value === currentStatus.value)?.icon || 'mdi-circle',
  );
};

const getEmptyStateIconColor = () => {
  const status = currentStatus.value;
  if (status === 'ACTIVE') return 'text-success';
  if (status === 'PAUSED') return 'text-warning';
  if (status === 'ARCHIVED') return 'text-info';
  return 'text-muted-foreground';
};

const handleCreateDependency = async (
  source: TaskTemplateViewModel,
  target: TaskTemplateViewModel,
) => {
  const created = await props.onCreateDependency?.(source.id, target.id);
  if (created !== false) {
    emit('dependency-created', source.id, target.id);
    return true;
  }
  return false;
};

const cancelDeleteAll = () => {
  showDeleteAllDialog.value = false;
  deleteConfirmText.value = '';
};

const confirmDeleteAll = () => {
  if (deleteConfirmText.value !== 'DELETE') return;
  emit('delete-all-templates');
  cancelDeleteAll();
};
</script>
