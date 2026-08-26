<template>
  <section class="flex h-full min-h-0 flex-col overflow-hidden bg-background" data-testid="task-management-view">
    <header class="flex min-h-14 items-center gap-3 border-b px-4 py-2" data-testid="task-page-toolbar">
      <div>
        <h1 class="text-lg font-semibold">{{ t('task.route.management') }}</h1>
        <p class="text-xs text-muted-foreground">{{ total }} plans</p>
      </div>
      <div class="relative ml-auto w-56">
        <Search class="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input v-model="searchQuery" class="h-8 pl-8" data-testid="task-search-input" :placeholder="t('common.search')" />
      </div>
      <Button variant="ghost" size="icon" class="h-8 w-8" :aria-label="t('common.refresh')" @click="refetch()"><RefreshCw class="h-4 w-4" /></Button>
      <Button size="sm" class="h-8" data-testid="create-task-entry" data-primary-action="create-task" @click="openCreate"><Plus class="mr-1 h-4 w-4" />{{ t('task.templateDialog.create') }}</Button>
    </header>

    <div v-if="isLoading" class="flex flex-1 items-center justify-center text-sm text-muted-foreground">{{ t('common.loading') }}</div>
    <div v-else-if="error" class="m-4 rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{{ error }}</div>
    <div v-else class="min-h-0 flex-1 overflow-auto p-4" data-testid="task-management-scroll">
      <div v-if="filteredTemplates.length === 0" class="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">{{ t('common.empty') }}</div>
      <div v-else class="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <article v-for="template in filteredTemplates" :key="template.id" class="rounded-lg border bg-card p-4 shadow-sm" data-testid="task-plan-card" :data-task-id="template.id">
          <button class="w-full text-left" type="button" @click="openDetail(template.id)">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0"><h2 class="truncate font-medium">{{ template.title }}</h2><p v-if="template.description" class="mt-1 line-clamp-2 text-sm text-muted-foreground">{{ template.description }}</p></div>
              <Badge variant="secondary">{{ template.statusText }}</Badge>
            </div>
            <div class="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
              <span>{{ template.importanceText }}</span>
              <span>·</span><span>{{ template.recurrenceText }}</span>
              <template v-if="template.goalBinding"><span>·</span><span>Goal linked</span></template>
            </div>
          </button>
          <div class="mt-4 flex justify-end gap-1 border-t pt-3">
            <Button variant="ghost" size="sm" @click="openEdit(template)">{{ t('common.edit') }}</Button>
            <Button variant="ghost" size="sm" @click="archive(template.id)">Archive</Button>
            <Button variant="ghost" size="sm" class="text-destructive" @click="remove(template)">{{ t('common.delete') }}</Button>
          </div>
        </article>
      </div>
    </div>

    <TaskTemplateDialog v-model="dialogOpen" :mode="dialogMode" :template="editingTemplate" :saving="isSaving" @save="saveTemplate" @cancel="closeDialog" />
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { Plus, RefreshCw, Search } from '@lucide/vue';
import { Badge, Button, Input, useConfirm } from '@memoflow/ui-vue-shadcn';
import type { GoalId, KeyResultId } from '@memoflow/contracts/primitives';
import { ImportanceLevel } from '@memoflow/contracts/shared';
import { TaskType, type RecurrenceRuleDTO } from '@memoflow/contracts/task';
import TaskTemplateDialog from '../components/dialogs/TaskTemplateDialog.vue';
import type { TaskTemplateViewModel } from '../components/types';
import { useTaskTemplateListQuery } from '../composables/useTaskTemplateListQuery';
import { useTaskTemplateMutations } from '../composables/useTaskTemplateMutations';
import { mapTaskTemplateDtoToViewModel, toTaskTimeConfigPayload } from '../utils/task-template-presentation';

const router = useRouter(); const { t } = useI18n();
const searchQuery = ref('');
const { templates, total, isLoading, error, refetch } = useTaskTemplateListQuery({ page: 1, limit: 200 });
const { createTemplateSafe, updateTemplateSafe, archiveTemplateSafe, deleteTemplateSafe, isSaving } = useTaskTemplateMutations();
const viewModels = computed(() => templates.value.map((dto) => mapTaskTemplateDtoToViewModel(dto, t)));
const filteredTemplates = computed(() => { const q=searchQuery.value.trim().toLowerCase(); return q ? viewModels.value.filter((item)=>`${item.title} ${item.description ?? ''}`.toLowerCase().includes(q)) : viewModels.value; });
const dialogOpen=ref(false); const dialogMode=ref<'create'|'edit'>('create'); const editingTemplate=ref<TaskTemplateViewModel|null>(null);
function openCreate(){dialogMode.value='create';editingTemplate.value=null;dialogOpen.value=true;} function openEdit(vm:TaskTemplateViewModel){dialogMode.value='edit';editingTemplate.value={...vm};dialogOpen.value=true;} function closeDialog(){dialogOpen.value=false;editingTemplate.value=null;}
function openDetail(id:string){void router.push({name:'task-detail',params:{id}});}
function goalBinding(vm:TaskTemplateViewModel){if(!vm.goalBinding?.goalId||!vm.goalBinding.keyResultId)return null;return {goalId:vm.goalBinding.goalId as GoalId,keyResultId:vm.goalBinding.keyResultId as KeyResultId,contribution:vm.goalBinding.contribution??null};}
async function saveTemplate(vm:TaskTemplateViewModel){const common={name:vm.title,description:vm.description??null,timeConfig:toTaskTimeConfigPayload(vm.timeConfig),recurrenceRule:(vm.recurrenceRule as unknown as RecurrenceRuleDTO)??null,importance:(vm.importance as ImportanceLevel)??ImportanceLevel.Moderate,tags:vm.tags??[],color:vm.color??null,goalBinding:goalBinding(vm)}; const result=dialogMode.value==='edit'&&vm.id?await updateTemplateSafe(vm.id,common):await createTemplateSafe({...common,taskType:vm.recurrenceRule?TaskType.Recurring:TaskType.OneTime,reminderConfig:(vm.reminderConfig as never)??null}); if(result){closeDialog();await refetch();}}
async function archive(id:string){if(await archiveTemplateSafe(id))await refetch();}
async function remove(vm: TaskTemplateViewModel){
  const confirmed=await useConfirm({
    title:t('task.management.deleteTemplate'),
    description:t('task.management.confirmDelete',{name:vm.title}),
    confirmText:t('common.delete'),
    cancelText:t('common.cancel'),
    variant:'destructive',
  });
  if(!confirmed)return;
  if(await deleteTemplateSafe(vm.id))await refetch();
}
</script>
