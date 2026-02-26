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
          查看依赖关系图
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
          删除所有模板
        </Button>

        <Button
          data-testid="create-task-template-button"
          size="lg"
          @click="emit('create-template')"
        >
          <Plus class="h-4 w-4 mr-2" />
          创建新模板
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
            创建第一个模板
          </Button>
        </CardContent>
      </Card>

      <DraggableTaskCard
        v-for="template in filteredTemplates"
        :key="template.id"
        :template="template"
        :enable-drag="true"
        :on-create-dependency="handleCreateDependency"
        @edit="(id) => emit('edit-template', id)"
        @delete="(tpl) => emit('delete-template', tpl)"
        @resume="(tpl) => emit('resume-template', tpl)"
      />
    </div>

    <Dialog :open="showDependencyDialog" @update:open="showDependencyDialog = $event">
      <DialogContent class="max-w-[1400px]">
        <DialogHeader>
          <DialogTitle class="flex items-center justify-between">
            <span class="flex items-center text-lg font-semibold">
              <Share2 class="h-5 w-5 mr-2" />
              任务依赖关系图
            </span>
            <Button variant="ghost" size="icon" @click="showDependencyDialog = false">
              <X class="h-4 w-4" />
            </Button>
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
            确认删除所有模板
          </DialogTitle>
        </DialogHeader>
        <div class="pt-4 space-y-4">
          <Alert class="bg-yellow-50 border-yellow-200">
            <AlertDescription>
              <strong>此操作不可撤销！</strong>
            </AlertDescription>
          </Alert>
          <p class="text-base">
            您确定要删除所有 <strong>{{ templates.length }}</strong> 个任务模板吗？
          </p>
          <div class="space-y-2">
            <Label for="delete-confirm">请输入 'DELETE' 确认删除</Label>
            <Input id="delete-confirm" v-model="deleteConfirmText" placeholder="DELETE" />
          </div>
        </div>
        <DialogFooter class="pt-4">
          <Button variant="ghost" @click="cancelDeleteAll">取消</Button>
          <Button
            variant="destructive"
            :disabled="deleteConfirmText !== 'DELETE'"
            @click="confirmDeleteAll"
          >
            <Trash2 class="h-4 w-4 mr-1" />
            确认删除全部
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
  X,
  AlertCircle,
  PlayCircle,
  PauseCircle,
  Archive,
  Circle,
} from 'lucide-vue-next';

interface StatusFilter {
  label: string;
  value: string;
  icon: string;
}

interface Props {
  templates: TaskTemplateViewModel[];
  dependencies: TaskDependencyClientDTO[];
  statusFilters?: StatusFilter[];
  onCreateDependency?: (sourceId: string, targetId: string) => Promise<boolean> | boolean;
}

const props = withDefaults(defineProps<Props>(), {
  statusFilters: () => [
    { label: '进行中', value: 'ACTIVE', icon: 'mdi-play-circle' },
    { label: '已暂停', value: 'PAUSED', icon: 'mdi-pause-circle' },
    { label: '已归档', value: 'ARCHIVED', icon: 'mdi-archive' },
  ],
});

const emit = defineEmits<{
  (e: 'create-template'): void;
  (e: 'edit-template', templateId: string): void;
  (e: 'delete-template', template: TaskTemplateViewModel): void;
  (e: 'resume-template', template: TaskTemplateViewModel): void;
  (e: 'delete-all-templates'): void;
  (e: 'dependency-created', sourceId: string, targetId: string): void;
}>();

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
  if (status === 'ACTIVE') return 'bg-green-100 text-green-800';
  if (status === 'PAUSED') return 'bg-yellow-100 text-yellow-800';
  if (status === 'ARCHIVED') return 'bg-blue-100 text-blue-800';
  if (status === 'DELETED') return 'bg-red-100 text-red-800';
  return 'bg-gray-100 text-gray-800';
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
  if (currentStatus.value === 'ACTIVE') return '暂无进行中的模板';
  if (currentStatus.value === 'PAUSED') return '暂无暂停的模板';
  if (currentStatus.value === 'ARCHIVED') return '暂无归档的模板';
  return '暂无模板';
};

const getEmptyStateIconComponent = () => {
  return getStatusIconComponent(
    props.statusFilters.find((s) => s.value === currentStatus.value)?.icon || 'mdi-circle',
  );
};

const getEmptyStateIconColor = () => {
  const status = currentStatus.value;
  if (status === 'ACTIVE') return 'text-green-400';
  if (status === 'PAUSED') return 'text-yellow-400';
  if (status === 'ARCHIVED') return 'text-blue-400';
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
