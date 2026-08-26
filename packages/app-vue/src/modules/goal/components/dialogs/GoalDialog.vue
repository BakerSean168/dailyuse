<template>
  <Dialog :open="open" @update:open="setOpen">
    <ProductDialogShell :open="open" test-id="goal-dialog" size="lg" initial-focus-selector="[data-testid='goal-name-input']">
      <template #title>{{ mode === 'edit' ? t('goal.dialog.editGoal') : t('goal.dialog.createGoal') }}</template>
      <template #description>Direction first. Measurement can be added from the Goal detail page.</template>
      <form id="goal-form" class="space-y-4" @submit.prevent="save">
        <div class="space-y-2"><Label for="goal-name">{{ t('goal.dialog.goalTitle') }}</Label><Input id="goal-name" v-model="draft.name" data-testid="goal-name-input" maxlength="256" /></div>
        <div class="space-y-2"><Label for="goal-description">{{ t('goal.dialog.description') }}</Label><Textarea id="goal-description" v-model="draft.description" class="min-h-24" maxlength="2000" /></div>
        <div class="grid gap-4 sm:grid-cols-2">
          <div class="space-y-2"><Label>{{ t('goal.dialog.startDate') }}</Label><Input v-model="draft.startDate" type="date" /></div>
          <div class="space-y-2"><Label>Due date</Label><Input v-model="draft.dueDate" type="date" /></div>
        </div>
        <div class="grid gap-4 sm:grid-cols-2">
          <div class="space-y-2"><Label>{{ t('goal.dialog.motivation') }}</Label><Textarea v-model="draft.motivation" class="min-h-20" maxlength="2000" /></div>
          <div class="space-y-2"><Label>{{ t('goal.dialog.feasibility') }}</Label><Textarea v-model="draft.feasibilityAnalysis" class="min-h-20" maxlength="2000" /></div>
        </div>
      </form>
      <template #footer><Button variant="ghost" :disabled="isSaving" @click="setOpen(false)">{{ t('common.cancel') }}</Button><Button type="submit" form="goal-form" data-testid="save-goal-button" :disabled="!draft.name.trim() || isSaving">{{ mode === 'edit' ? t('goal.dialog.saveChanges') : t('goal.dialog.createGoal') }}</Button></template>
    </ProductDialogShell>
  </Dialog>
</template>
<script setup lang="ts">
import { reactive, watch } from 'vue'; import { useI18n } from 'vue-i18n';
import type { GoalClientDTO, CreateGoalReq, UpdateGoalReq } from '@memoflow/contracts/goal';
import { Button, Dialog, Input, Label, Textarea } from '@memoflow/ui-vue-shadcn'; import { ProductDialogShell } from '../../../../shared/components'; import { fromProductDateInputValue, toProductDateInputValue } from '../../../../shared/utils/product-time'; import { useGoal } from '../../composables/useGoal';
const props=withDefaults(defineProps<{open:boolean;mode?:'create'|'edit';goal?:GoalClientDTO|null}>(),{mode:'create',goal:null}); const emit=defineEmits<{ 'update:open':[boolean];created:[GoalClientDTO];updated:[GoalClientDTO];'dirty-change':[boolean]}>(); const {t}=useI18n(); const {createGoal,updateGoal,isSaving}=useGoal();
const draft=reactive({name:'',description:'',motivation:'',feasibilityAnalysis:'',startDate:'',dueDate:''});
function fromMs(v:number|null|undefined){return toProductDateInputValue(v);} function toMs(v:string){return fromProductDateInputValue(v)??undefined;}
function reset(){draft.name=props.goal?.name??'';draft.description=props.goal?.description??'';draft.motivation=props.goal?.motivation??'';draft.feasibilityAnalysis=props.goal?.feasibilityAnalysis??'';draft.startDate=fromMs(props.goal?.startDate);draft.dueDate=fromMs(props.goal?.dueDate);emit('dirty-change',false);}
watch(()=>[props.open,props.goal?.id] as const,([open])=>{if(open)reset();},{immediate:true,deep:false}); watch(draft,()=>emit('dirty-change',props.open),{deep:true});
function setOpen(v:boolean){emit('update:open',v);if(!v)emit('dirty-change',false);}
async function save(){const common={name:draft.name.trim(),description:draft.description.trim()||undefined,motivation:draft.motivation.trim()||undefined,feasibilityAnalysis:draft.feasibilityAnalysis.trim()||undefined,startDate:toMs(draft.startDate),dueDate:toMs(draft.dueDate)}; if(props.mode==='edit'&&props.goal){const req:UpdateGoalReq={expectedVersion:props.goal.version,...common,description:common.description??null,motivation:common.motivation??null,feasibilityAnalysis:common.feasibilityAnalysis??null,startDate:common.startDate??null,dueDate:common.dueDate??null};const saved=await updateGoal(String(props.goal.id),req);if(saved){emit('updated',saved);setOpen(false);}}else{const saved=await createGoal(common as CreateGoalReq);if(saved){emit('created',saved);setOpen(false);}}}
</script>
