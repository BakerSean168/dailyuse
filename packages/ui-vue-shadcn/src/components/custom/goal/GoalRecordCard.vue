<template>
  <Card class="group transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-primary/30">
    <CardContent class="p-4">
      <div class="flex flex-col md:flex-row md:items-center gap-4">
        <!-- Record Value -->
        <div class="flex items-center flex-1">
          <div class="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary mr-3">
            <Plus class="h-4 w-4" />
          </div>
          <div>
            <div class="text-lg font-bold">{{ record.value }}</div>
            <div class="text-xs text-muted-foreground">本次记录值</div>
          </div>
        </div>

        <!-- Record Time -->
        <div class="flex items-center flex-1">
          <Clock class="h-4 w-4 text-muted-foreground mr-2" />
          <div class="text-sm">
            {{ formatDate(record.createdAt) }}
          </div>
        </div>
      </div>

      <!-- Note -->
      <div v-if="record.comment" class="mt-3 pt-3 border-t">
        <div class="flex items-start gap-2">
          <FileText class="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
          <div class="text-sm text-muted-foreground">
            {{ record.comment }}
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { Card, CardContent } from '../../ui/card';
import { Plus, Clock, FileText } from 'lucide-vue-next';
import { format } from 'date-fns';
import type { GoalRecordClientDTO } from '@dailyuse/contracts/goal';

defineProps<{
  record: GoalRecordClientDTO;
}>();

function formatDate(date: string | number | Date): string {
  return format(new Date(date), 'yyyy/MM/dd HH:mm');
}
</script>
