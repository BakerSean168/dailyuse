<template>
  <StatisticsCard
    :statistics="statistics"
    :module-statistics="moduleStatistics"
    :is-loading="isLoading"
    :error="error"
    @refresh="$emit('refresh')"
  />
</template>

<script setup lang="ts">
import { StatisticsCard } from '@dailyuse/ui-vue-shadcn';
import { SourceModule } from '@dailyuse/contracts/schedule';
import type { ScheduleStatisticsClientDTO, ModuleStatisticsClientDTO } from '@dailyuse/contracts/schedule';

defineProps<{
  statistics: ScheduleStatisticsClientDTO | null;
  moduleStatistics?: Record<SourceModule, ModuleStatisticsClientDTO> | null;
  isLoading?: boolean;
  error?: string | null;
}>();

defineEmits<{
  refresh: [];
}>();
</script>
