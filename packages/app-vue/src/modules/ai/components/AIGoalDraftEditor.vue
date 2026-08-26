<template>
  <div class="rounded-2xl border border-border/60 bg-muted/20 p-4">
    <div v-if="hasDraft" class="space-y-5">
      <div class="grid gap-2">
        <Input :model-value="goal.name" :placeholder="t('goal.dialog.goalTitlePlaceholder')" @update:model-value="updateGoalField('name', String($event ?? ''))" />
        <Textarea :model-value="goal.description" :placeholder="t('goal.dialog.descriptionPlaceholder')" class="min-h-24" @update:model-value="updateGoalField('description', String($event ?? ''))" />
      </div>
      <div class="grid gap-3 @sm/ai:grid-cols-2">
        <label class="grid gap-2 text-xs text-muted-foreground">{{ t('goal.dialog.startDate') }}<Input type="date" :model-value="toProductDateInputValue(goal.startDate)" @update:model-value="updateGoalField('startDate', fromProductDateInputValue(String($event ?? '')))" /></label>
        <label class="grid gap-2 text-xs text-muted-foreground">Due date<Input type="date" :model-value="toProductDateInputValue(goal.dueDate)" @update:model-value="updateGoalField('dueDate', fromProductDateInputValue(String($event ?? '')))" /></label>
      </div>
      <div class="grid gap-3 @sm/ai:grid-cols-2">
        <Textarea :model-value="goal.motivation" :placeholder="t('goal.dialog.motivationPlaceholder')" class="min-h-20" @update:model-value="updateGoalField('motivation', String($event ?? ''))" />
        <Textarea :model-value="goal.feasibilityAnalysis" :placeholder="t('goal.dialog.feasibilityPlaceholder')" class="min-h-20" @update:model-value="updateGoalField('feasibilityAnalysis', String($event ?? ''))" />
      </div>
      <div v-for="(item,index) in keyResults" :key="`${item.title}-${index}`" class="space-y-3 rounded-xl border bg-background/70 p-3">
        <div class="grid gap-2 @sm/ai:grid-cols-2"><Input :model-value="item.title" :placeholder="t('goal.krDialog.namePlaceholder')" @update:model-value="updateKeyResult(index,{title:String($event??'')})"/><Input :model-value="item.unit" :placeholder="t('aiAssistant.goalDraft.unit')" @update:model-value="updateKeyResult(index,{unit:String($event??'')})"/></div>
        <Textarea :model-value="item.description" :placeholder="t('goal.krDialog.descPlaceholder')" class="min-h-16" @update:model-value="updateKeyResult(index,{description:String($event??'')})"/>
        <div class="grid gap-2 @sm/ai:grid-cols-3">
          <Select :model-value="item.calculationMethod" @update:model-value="updateKeyResult(index,{calculationMethod:$event as KeyResultDraftState['calculationMethod']})"><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem v-for="o in methods" :key="o" :value="o">{{ o }}</SelectItem></SelectContent></Select>
          <Input type="number" :model-value="String(item.startingValue)" @update:model-value="updateKeyResult(index,{startingValue:num($event,item.startingValue)})"/>
          <Input type="number" :model-value="String(item.currentValue)" @update:model-value="updateKeyResult(index,{currentValue:num($event,item.currentValue)})"/>
          <Input type="number" :model-value="String(item.targetValue)" @update:model-value="updateKeyResult(index,{targetValue:num($event,item.targetValue)})"/>
          <Input type="number" :model-value="item.progressBaselineValue == null ? '' : String(item.progressBaselineValue)" placeholder="Progress baseline" @update:model-value="updateKeyResult(index,{progressBaselineValue:String($event??'').trim()===''?null:num($event,0)})"/>
          <Input type="number" min="1" max="5" :model-value="String(item.weight)" @update:model-value="updateKeyResult(index,{weight:Math.max(1,Math.min(5,Math.round(num($event,item.weight))))})"/>
        </div>
        <Button variant="outline" @click="emit('remove-key-result',index)">{{ t('aiAssistant.goalDraft.removeKeyResult') }}</Button>
      </div>
      <Button variant="outline" class="w-full" @click="emit('add-key-result')">{{ t('aiAssistant.goalDraft.addKeyResult') }}</Button>
      <Button v-if="showConfirmAction" class="w-full" :disabled="isSubmitting || !goal.name.trim()" @click="emit('confirm')">{{ isSubmitting ? t('aiAssistant.goalDraft.creatingGoal') : t('aiAssistant.goalDraft.createGoal') }}</Button>
    </div>
    <div v-else class="flex min-h-40 items-center justify-center rounded-xl border border-dashed text-sm text-muted-foreground">{{ t('aiAssistant.goalDraft.emptyState') }}</div>
  </div>
</template>
<script setup lang="ts">
import { fromProductDateInputValue, toProductDateInputValue } from '../../../shared/utils/product-time';
import { computed } from 'vue'; import { useI18n } from 'vue-i18n';
import { KeyResultCalculationMethod, type AddKeyResultReq } from '@memoflow/contracts/goal';
import { Button, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Textarea } from '@memoflow/ui-vue-shadcn';
type GoalDraftState={name:string;description:string;motivation:string;feasibilityAnalysis:string;startDate:number|null;dueDate:number|null};
type KeyResultDraftState={title:string;description:string;calculationMethod:AddKeyResultReq['calculationMethod'];startingValue:number;progressBaselineValue:number|null;currentValue:number;targetValue:number;unit:string;weight:number};
const props=defineProps<{goal:GoalDraftState;keyResults:KeyResultDraftState[];isSubmitting:boolean;showConfirmAction?:boolean}>(); const emit=defineEmits<{confirm:[];'add-key-result':[];'remove-key-result':[number];'update-goal':[GoalDraftState];'update-key-result':[{index:number;value:KeyResultDraftState}]}>(); const {t}=useI18n();
const hasDraft=computed(()=>Boolean(props.goal.name||props.goal.description||props.keyResults.length)); const showConfirmAction=computed(()=>props.showConfirmAction!==false); const methods=Object.values(KeyResultCalculationMethod);
function updateGoalField<K extends keyof GoalDraftState>(k:K,v:GoalDraftState[K]){emit('update-goal',{...props.goal,[k]:v});} function updateKeyResult(index:number,patch:Partial<KeyResultDraftState>){emit('update-key-result',{index,value:{...props.keyResults[index],...patch} as KeyResultDraftState});}
function num(v:unknown,f:number){const n=Number(v);return Number.isFinite(n)?n:f;}
</script>
