<template>
  <div class="rounded-2xl border border-border/60 bg-muted/20 p-4">
    <div v-if="hasDraft" class="space-y-4">
      <div>
        <p class="text-xs uppercase tracking-[0.18em] text-muted-foreground">Draft Title</p>
        <Input v-model="goal.title" class="mt-2" />
        <Textarea v-model="goal.description" class="mt-3 min-h-28" />
      </div>

      <div class="grid gap-3 sm:grid-cols-2">
        <div class="rounded-xl border border-border/50 bg-background/70 p-3">
          <p class="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Category</p>
          <Select v-model="goal.category">
            <SelectTrigger class="mt-2">
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
        <div class="rounded-xl border border-border/50 bg-background/70 p-3">
          <p class="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Importance</p>
          <Select v-model="goal.importance">
            <SelectTrigger class="mt-2">
              <SelectValue placeholder="Select importance" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Vital">Vital</SelectItem>
              <SelectItem value="Important">Important</SelectItem>
              <SelectItem value="Moderate">Moderate</SelectItem>
              <SelectItem value="Minor">Minor</SelectItem>
              <SelectItem value="Trivial">Trivial</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div v-if="keyResults.length" class="space-y-2">
        <p class="text-xs uppercase tracking-[0.18em] text-muted-foreground">Key Results</p>
        <div
          v-for="(item, index) in keyResults"
          :key="`${item.title}-${index}`"
          class="rounded-xl border border-border/50 bg-background/70 p-3"
        >
          <Input v-model="item.title" class="mb-2" />
          <Textarea v-model="item.description" class="min-h-20" />
          <div class="mt-2 grid gap-2 sm:grid-cols-[1fr_110px_110px]">
            <Input v-model="item.unit" placeholder="Unit" />
            <Input v-model.number="item.targetValue" type="number" placeholder="Target" />
            <Button variant="outline" @click="$emit('remove-key-result', index)">Remove</Button>
          </div>
        </div>
      </div>

      <Button variant="outline" class="w-full" @click="$emit('add-key-result')"
        >Add Key Result</Button
      >

      <Button
        class="w-full"
        :disabled="isSubmitting || !goal.title.trim()"
        @click="$emit('confirm')"
      >
        {{ isSubmitting ? 'Creating goal...' : 'Create Goal' }}
      </Button>
    </div>

    <div
      v-else
      class="flex min-h-52 items-center justify-center rounded-2xl border border-dashed border-border/60 bg-background/50 p-6 text-center text-sm text-muted-foreground"
    >
      Start with a goal idea and AI will return a structured draft here for confirmation and
      editing.
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
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
}>();

const props = defineProps<{
  goal: {
    title: string;
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

const hasDraft = computed(() =>
  Boolean(props.goal.title || props.goal.description || props.keyResults.length),
);
</script>
