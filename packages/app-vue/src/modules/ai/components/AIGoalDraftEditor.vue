<template>
  <div class="rounded-2xl border border-border/60 bg-muted/20 p-4">
    <div v-if="hasDraft" class="space-y-4">
      <div>
        <p class="text-xs uppercase tracking-[0.18em] text-muted-foreground">
          {{ t('aiAssistant.goalDraft.draftName') }}
        </p>
        <Input :model-value="goal.name" @update:model-value="(val: any) => $emit('update-goal', { ...goal, name: val })" class="mt-2" />
        <Textarea :model-value="goal.description" @update:model-value="(val: any) => $emit('update-goal', { ...goal, description: val })" class="mt-3 min-h-28" />
      </div>

      <div class="grid gap-3 sm:grid-cols-2">
        <div class="rounded-xl border border-border/50 bg-background/70 p-3">
          <p class="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            {{ t('aiAssistant.goalDraft.category') }}
          </p>
          <Select :model-value="goal.category" @update:model-value="(val: any) => $emit('update-goal', { ...goal, category: val })">
            <SelectTrigger class="mt-2">
              <SelectValue :placeholder="t('aiAssistant.goalDraft.selectCategory')" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="product">{{ t('aiAssistant.goalDraft.categories.product') }}</SelectItem>
              <SelectItem value="engineering">{{ t('aiAssistant.goalDraft.categories.engineering') }}</SelectItem>
              <SelectItem value="marketing">{{ t('aiAssistant.goalDraft.categories.marketing') }}</SelectItem>
              <SelectItem value="personal">{{ t('aiAssistant.goalDraft.categories.personal') }}</SelectItem>
              <SelectItem value="health">{{ t('aiAssistant.goalDraft.categories.health') }}</SelectItem>
              <SelectItem value="finance">{{ t('aiAssistant.goalDraft.categories.finance') }}</SelectItem>
              <SelectItem value="learning">{{ t('aiAssistant.goalDraft.categories.learning') }}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div class="rounded-xl border border-border/50 bg-background/70 p-3">
          <p class="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            {{ t('aiAssistant.goalDraft.importance') }}
          </p>
          <Select :model-value="goal.importance" @update:model-value="(val: any) => $emit('update-goal', { ...goal, importance: val })">
            <SelectTrigger class="mt-2">
              <SelectValue :placeholder="t('aiAssistant.goalDraft.selectImportance')" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Vital">{{ t('aiAssistant.goalDraft.importanceLevels.vital') }}</SelectItem>
              <SelectItem value="Important">{{ t('aiAssistant.goalDraft.importanceLevels.important') }}</SelectItem>
              <SelectItem value="Moderate">{{ t('aiAssistant.goalDraft.importanceLevels.moderate') }}</SelectItem>
              <SelectItem value="Minor">{{ t('aiAssistant.goalDraft.importanceLevels.minor') }}</SelectItem>
              <SelectItem value="Trivial">{{ t('aiAssistant.goalDraft.importanceLevels.trivial') }}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div v-if="keyResults.length" class="space-y-2">
        <p class="text-xs uppercase tracking-[0.18em] text-muted-foreground">
          {{ t('aiAssistant.goalDraft.keyResults') }}
        </p>
        <div
          v-for="(item, index) in keyResults"
          :key="`${item.title}-${index}`"
          class="rounded-xl border border-border/50 bg-background/70 p-3"
        >
          <Input v-model="item.title" class="mb-2" />
          <Textarea v-model="item.description" class="min-h-20" />
          <div class="mt-2 grid gap-2 sm:grid-cols-[1fr_110px_110px]">
            <Input v-model="item.unit" :placeholder="t('aiAssistant.goalDraft.unit')" />
            <Input
              v-model.number="item.targetValue"
              type="number"
              :placeholder="t('aiAssistant.goalDraft.target')"
            />
            <Button variant="outline" @click="$emit('remove-key-result', index)">
              {{ t('aiAssistant.goalDraft.removeKeyResult') }}
            </Button>
          </div>
        </div>
      </div>

      <Button variant="outline" class="w-full" @click="$emit('add-key-result')"
        >{{ t('aiAssistant.goalDraft.addKeyResult') }}</Button
      >

      <Button
        class="w-full"
        :disabled="isSubmitting || !goal.name.trim()"
        @click="$emit('confirm')"
      >
        {{
          isSubmitting
            ? t('aiAssistant.goalDraft.creatingGoal')
            : t('aiAssistant.goalDraft.createGoal')
        }}
      </Button>
    </div>

    <div
      v-else
      class="flex min-h-52 items-center justify-center rounded-2xl border border-dashed border-border/60 bg-background/50 p-6 text-center text-sm text-muted-foreground"
    >
      {{ t('aiAssistant.goalDraft.emptyState') }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from '@dailyuse/ui-vue-shadcn';

defineEmits<{
  confirm: [];
  'add-key-result': [];
  'remove-key-result': [index: number];
  'update-goal': [payload: any];
}>();

const props = defineProps<{
  goal: {
    name: string;
    description: string;
    category: string;
    importance: string;
  };
  keyResults: Array<{
    title: string;
    description: string;
    targetValue: number;
    unit: string;
  }>;
  isSubmitting: boolean;
}>();

const { t } = useI18n();

const hasDraft = computed(() =>
  Boolean(props.goal.name || props.goal.description || props.keyResults.length),
);
</script>
