<template>
  <Card
    class="group cursor-pointer border rounded-xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:border-primary/30 h-full"
    @click="$emit('click', repository)"
  >
    <CardContent class="p-4 flex flex-col h-full gap-3">
      <!-- Header -->
      <div class="flex items-center">
        <Folder class="h-7 w-7 text-primary mr-2" />
        <div class="text-lg font-semibold text-foreground truncate">
          {{ repository.name }}
        </div>
      </div>

      <!-- Description -->
      <div v-if="repository.description" class="text-sm text-muted-foreground line-clamp-2 flex-1">
        {{ repository.description }}
      </div>

      <!-- Footer -->
      <div class="flex justify-between items-center mt-auto pt-2">
        <div v-if="repository.updatedAt" class="flex items-center text-xs text-muted-foreground">
          <Clock class="h-3 w-3 mr-1" />
          <span>{{ updateLabel }}: {{ formattedDate }}</span>
        </div>

        <Button
          variant="ghost"
          size="icon"
          class="h-8 w-8 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all"
        >
          <ArrowRight class="h-4 w-4" />
        </Button>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Card, CardContent } from '@dailyuse/ui-vue-shadcn';
import { Button } from '@dailyuse/ui-vue-shadcn';
import { Folder, Clock, ArrowRight } from 'lucide-vue-next';
import { format } from 'date-fns';

interface Repository {
  name: string;
  description?: string;
  updatedAt?: string | number | Date;
}

const props = withDefaults(
  defineProps<{
    repository: Repository;
    updateLabel?: string;
  }>(),
  {
    updateLabel: '更新',
  },
);

defineEmits<{
  click: [repository: Repository];
}>();

const formattedDate = computed(() => {
  if (!props.repository.updatedAt) return '';
  return format(new Date(props.repository.updatedAt), 'yyyy-MM-dd');
});
</script>
