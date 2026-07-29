<template>
  <Card
    class="group transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-primary/30"
  >
    <CardContent class="p-4">
      <div class="flex flex-col md:flex-row md:items-center gap-4">
        <!-- Record Value -->
        <div class="flex items-center flex-1">
          <div
            class="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary mr-3"
          >
            <Plus class="h-4 w-4" />
          </div>
          <div>
            <div class="text-lg font-bold">{{ record.value }}</div>
            <div class="text-xs text-muted-foreground">
              {{ t('goal.cards.recordCard.recordValue') }}
            </div>
          </div>
        </div>

        <!-- Record Time -->
        <div class="flex items-center flex-1">
          <Clock class="h-4 w-4 text-muted-foreground mr-2" />
          <div class="text-sm">
            {{ formatProductDateTime(record.createdAt) }}
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
import { Card, CardContent } from '@memoflow/ui-vue-shadcn';
import { Plus, Clock, FileText } from '@lucide/vue';
import { useI18n } from 'vue-i18n';
import type { GoalRecordClientDTO } from '@memoflow/contracts/goal';
import { formatProductDateTime } from '../../../shared/utils/product-time';

const { t } = useI18n();

defineProps<{
  record: GoalRecordClientDTO;
}>();

</script>
