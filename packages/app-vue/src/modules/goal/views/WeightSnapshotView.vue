<template>
  <div class="flex h-full flex-col p-6">
    <div class="mb-6">
      <h2 class="text-lg font-semibold">{{ t('goal.weightSnapshot.title') }}</h2>
      <p class="text-sm text-muted-foreground">{{ t('goal.weightSnapshot.subtitle') }}</p>
    </div>

    <Tabs v-model="activeTab" class="flex-1">
      <TabsList>
        <TabsTrigger value="comparison">{{ t('goal.weightSnapshot.tabComparison') }}</TabsTrigger>
        <TabsTrigger value="snapshots">{{ t('goal.weightSnapshot.tabSnapshots') }}</TabsTrigger>
        <TabsTrigger value="trend">{{ t('goal.weightSnapshot.tabTrends') }}</TabsTrigger>
        <TabsTrigger value="suggestion">{{ t('goal.weightSnapshot.tabSuggestions') }}</TabsTrigger>
      </TabsList>

      <TabsContent value="comparison" class="mt-4">
        <Card>
          <CardHeader>
            <CardTitle>{{ t('goal.weightSnapshot.comparisonTitle') }}</CardTitle>
            <CardDescription>{{ t('goal.weightSnapshot.comparisonDesc') }}</CardDescription>
          </CardHeader>
          <CardContent>
            <WeightComparison v-if="keyResults.length > 0" :goal-id="goalId" />
            <p v-else class="py-8 text-center text-sm text-muted-foreground">
              {{ t('goal.weightSnapshot.noKRData') }}
            </p>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="snapshots" class="mt-4">
        <Card>
          <CardHeader>
            <CardTitle>{{ t('goal.weightSnapshot.snapshotTitle') }}</CardTitle>
            <CardDescription>{{ t('goal.weightSnapshot.snapshotDesc') }}</CardDescription>
          </CardHeader>
          <CardContent>
            <WeightSnapshotList v-if="keyResults.length > 0" :goal-id="goalId" />
            <p v-else class="py-8 text-center text-sm text-muted-foreground">
              {{ t('goal.weightSnapshot.noSnapshotData') }}
            </p>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="trend" class="mt-4">
        <Card>
          <CardHeader>
            <CardTitle>{{ t('goal.weightSnapshot.trendsTitle') }}</CardTitle>
            <CardDescription>{{ t('goal.weightSnapshot.trendsDesc') }}</CardDescription>
          </CardHeader>
          <CardContent>
            <WeightTrendChart v-if="keyResults.length > 0" :goal-id="goalId" />
            <p v-else class="py-8 text-center text-sm text-muted-foreground">
              {{ t('goal.weightSnapshot.noTrendsData') }}
            </p>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="suggestion" class="mt-4">
        <Card>
          <CardHeader>
            <CardTitle>{{ t('goal.weightSnapshot.suggestionsTitle') }}</CardTitle>
            <CardDescription>{{ t('goal.weightSnapshot.suggestionsDesc') }}</CardDescription>
          </CardHeader>
          <CardContent>
            <WeightSuggestionPanel v-if="keyResults.length > 0" :key-results="keyResults" />
            <p v-else class="py-8 text-center text-sm text-muted-foreground">
              {{ t('goal.weightSnapshot.noAnalysisData') }}
            </p>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  WeightComparison,
  WeightSnapshotList,
  WeightTrendChart,
  WeightSuggestionPanel,
} from '@dailyuse/ui-vue-shadcn';
import { useGoal } from '../composables/useGoal';

const route = useRoute();
const { t } = useI18n();
const goalId = (route.params.goalId as string) || (route.params.id as string);

const { keyResults, fetchKeyResults } = useGoal();
const activeTab = ref('comparison');

onMounted(async () => {
  if (goalId) await fetchKeyResults(goalId);
});
</script>
