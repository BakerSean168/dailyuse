<template>
  <Dialog
    :open="visible"
    @update:open="
      (val: boolean) => {
        if (!val) close();
      }
    "
  >
    <DialogContent class="max-w-[1200px] max-h-[90vh] flex flex-col">
      <!-- 标题栏 -->
      <DialogHeader class="flex flex-row items-center justify-between">
        <DialogTitle class="flex items-center text-xl">
          <Lightbulb class="h-5 w-5 mr-2" />
          {{ t('goal.templateBrowser.title') }}
        </DialogTitle>
      </DialogHeader>

      <Separator />

      <!-- 搜索和筛选栏 -->
      <div class="pb-0">
        <div class="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div class="col-span-1 md:col-span-3">
            <div class="relative">
              <Search
                class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
              />
              <Input
                v-model="searchQuery"
                :placeholder="t('goal.templateBrowser.search')"
                class="pl-9"
              />
            </div>
          </div>
          <div class="col-span-1 md:col-span-1.5">
            <Select v-model="selectedCategorySelect">
              <SelectTrigger>
                <SelectValue :placeholder="t('goal.templateBrowser.category')" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{{ t('goal.templateBrowser.all') }}</SelectItem>
                <SelectItem v-for="opt in categoryOptions" :key="opt.value" :value="opt.value">
                  {{ opt.title }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="col-span-1 md:col-span-1.5">
            <Select v-model="selectedRoleSelect">
              <SelectTrigger>
                <SelectValue :placeholder="t('goal.templateBrowser.role')" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{{ t('goal.templateBrowser.all') }}</SelectItem>
                <SelectItem v-for="opt in roleOptions" :key="opt.value" :value="opt.value">
                  {{ opt.title }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <!-- 结果统计 -->
        <Alert v-if="filteredTemplates.length > 0" class="mb-4 mt-4">
          <AlertDescription>
            {{ t('goal.templateBrowser.matchedCount', { n: filteredTemplates.length }) }}
            <span v-if="filters.role || filters.category">
              ({{ t('goal.templateBrowser.filtered') }})</span
            >
          </AlertDescription>
        </Alert>
        <Alert v-else variant="destructive" class="mb-4 mt-4">
          <AlertDescription> {{ t('goal.templateBrowser.noMatch') }} </AlertDescription>
        </Alert>
      </div>

      <!-- 模板卡片列表 -->
      <ScrollArea class="flex-1" style="max-height: 600px">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-1">
          <Card
            v-for="result in filteredTemplates"
            :key="result.template.id"
            :class="[
              'cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all h-full flex flex-col',
              selectedTemplate?.id === result.template.id ? 'ring-2 ring-primary shadow-lg' : '',
            ]"
            @click="selectTemplate(result.template as GoalTemplate)"
          >
            <!-- 卡片头部 -->
            <CardHeader class="pb-2">
              <CardTitle class="text-base flex items-center">
                <component
                  :is="
                    getCategoryIconComponent(result.template.category as GoalTemplate['category'])
                  "
                  :class="[
                    'h-5 w-5 mr-2',
                    getCategoryColorClass(result.template.category as GoalTemplate['category']),
                  ]"
                />
                {{ result.template.title }}
              </CardTitle>
            </CardHeader>

            <!-- 匹配分数徽章 -->
            <div v-if="result.score > 50" class="px-6 pb-2">
              <Badge :class="getScoreBadgeClass(result.score)">
                {{ t('goal.templateBrowser.matchPercent', { n: result.score }) }}
              </Badge>
            </div>

            <CardContent class="flex-1">
              <!-- 描述 -->
              <p class="text-sm mb-3">{{ result.template.description }}</p>

              <!-- 标签 -->
              <div class="mb-3">
                <Badge
                  v-for="tag in result.template.tags.slice(0, 3)"
                  :key="tag"
                  variant="outline"
                  class="mr-1 mb-1 text-xs"
                >
                  {{ tag }}
                </Badge>
              </div>

              <!-- 匹配原因 -->
              <div v-if="result.reasons.length > 0" class="mt-2 flex items-center">
                <CheckCircle class="h-4 w-4 text-green-500 mr-1 flex-shrink-0" />
                <span class="text-xs text-green-500">{{ result.reasons[0] }}</span>
              </div>

              <!-- 关键结果预览 -->
              <Separator class="my-3" />
              <div class="text-xs text-muted-foreground">
                <strong
                  >{{ result.template.keyResults.length }}
                  {{ t('goal.templateBrowser.krCount') }}</strong
                >
                <ul class="ml-4 mt-1">
                  <li v-for="(kr, idx) in result.template.keyResults.slice(0, 2)" :key="idx">
                    {{ kr.title }} ({{ kr.suggestedWeight }}%)
                  </li>
                  <li v-if="result.template.keyResults.length > 2" class="text-muted-foreground">
                    {{
                      t('goal.templateBrowser.moreKR', { n: result.template.keyResults.length - 2 })
                    }}
                  </li>
                </ul>
              </div>
            </CardContent>

            <!-- 操作按钮 -->
            <CardFooter class="flex justify-between">
              <Button
                variant="ghost"
                size="sm"
                @click.stop="previewTemplate(result.template as GoalTemplate)"
              >
                <Eye class="h-4 w-4 mr-1" />
                {{ t('goal.templateBrowser.preview') }}
              </Button>
              <Button
                v-if="selectedTemplate?.id === result.template.id"
                variant="default"
                size="sm"
              >
                <Check class="h-4 w-4 mr-1" />
                {{ t('goal.templateBrowser.selected') }}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </ScrollArea>

      <Separator />

      <!-- 底部操作栏 -->
      <DialogFooter class="flex flex-row items-center justify-between sm:justify-between">
        <Button variant="ghost" @click="close">{{ t('goal.templateBrowser.cancel') }}</Button>
        <Button :disabled="!selectedTemplate" @click="applyTemplate">
          <CheckCircle class="h-4 w-4 mr-1" />
          {{ t('goal.templateBrowser.useTemplate') }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>

  <!-- 预览对话框 -->
  <Dialog
    :open="previewVisible"
    @update:open="
      (val: boolean) => {
        previewVisible = val;
      }
    "
  >
    <DialogContent class="max-w-[700px]">
      <template v-if="previewingTemplate">
        <DialogHeader>
          <DialogTitle class="flex items-center">
            <component
              :is="getCategoryIconComponent(previewingTemplate.category)"
              :class="['h-5 w-5 mr-2', getCategoryColorClass(previewingTemplate.category)]"
            />
            {{ previewingTemplate.title }}
          </DialogTitle>
        </DialogHeader>
        <Separator />
        <div>
          <p class="text-base mb-4">{{ previewingTemplate.description }}</p>

          <Alert class="mb-4">
            <AlertDescription>
              <strong>{{ t('goal.templateBrowser.previewRole') }}</strong>
              {{ previewingTemplate.roles.join(', ') }}<br />
              <strong>{{ t('goal.templateBrowser.previewIndustry') }}</strong>
              {{ previewingTemplate.industries.join(', ') }}<br />
              <strong>{{
                t('goal.templateBrowser.previewCycleDays', {
                  n: previewingTemplate.suggestedDuration,
                })
              }}</strong>
            </AlertDescription>
          </Alert>

          <h4 class="text-lg font-semibold mb-3">
            {{ t('goal.templateBrowser.previewKR', { n: previewingTemplate.keyResults.length }) }}
          </h4>
          <div class="space-y-2">
            <div
              v-for="(kr, idx) in previewingTemplate.keyResults"
              :key="idx"
              class="flex items-start gap-3 p-2 rounded-md"
            >
              <div
                :class="[
                  'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium',
                  getWeightBgClass(kr.suggestedWeight),
                ]"
              >
                {{ kr.suggestedWeight }}%
              </div>
              <div class="flex-1 min-w-0">
                <div class="text-sm font-medium">{{ kr.title }}</div>
                <div class="text-xs text-muted-foreground">
                  {{ t('goal.templateBrowser.previewMeasure') }} {{ kr.metrics.join(', ') }}
                  <span v-if="kr.suggestedStartValue !== undefined">
                    |
                    {{
                      t('goal.templateBrowser.previewTarget', {
                        start: kr.suggestedStartValue,
                        end: kr.suggestedTargetValue,
                      })
                    }}
                    {{ kr.unit }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <Separator />
        <DialogFooter class="flex flex-row items-center justify-between sm:justify-between">
          <Button variant="ghost" @click="previewVisible = false">{{
            t('goal.templateBrowser.close')
          }}</Button>
          <Button @click="applyFromPreview">{{ t('goal.templateBrowser.useTemplate') }}</Button>
        </DialogFooter>
      </template>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import type { Component } from 'vue';

const { t } = useI18n();
import type { GoalTemplate } from '../../application/templates/GoalTemplates';
import templateRecommendationService from '../../application/services/TemplateRecommendationService';
import type { RecommendationFilters } from '../../application/services/TemplateRecommendationService';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  Button,
  Input,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Badge,
  Alert,
  AlertDescription,
  Separator,
  ScrollArea,
} from '@dailyuse/ui-vue-shadcn';

import {
  Lightbulb,
  Search,
  CheckCircle,
  Eye,
  Check,
  Rocket,
  Code,
  TrendingUp,
  Megaphone,
  Briefcase,
  Folder,
} from 'lucide-vue-next';

// Emits
const emit = defineEmits<{
  apply: [template: GoalTemplate];
  close: [];
}>();

// State
const visible = ref(false);
const searchQuery = ref('');
const selectedCategorySelect = ref<string>('all');
const selectedRoleSelect = ref<string>('all');
const selectedTemplate = ref<GoalTemplate | null>(null);
const previewVisible = ref(false);
const previewingTemplate = ref<GoalTemplate | null>(null);

// Derived state: map 'all' to null for filter logic
const selectedCategory = computed<GoalTemplate['category'] | null>(() =>
  selectedCategorySelect.value === 'all'
    ? null
    : (selectedCategorySelect.value as GoalTemplate['category']),
);
const selectedRole = computed<string | null>(() =>
  selectedRoleSelect.value === 'all' ? null : selectedRoleSelect.value,
);

// Options
const categoryOptions = computed(() => [
  { title: t('goal.templateBrowser.catProduct'), value: 'product' },
  { title: t('goal.templateBrowser.catEngineering'), value: 'engineering' },
  { title: t('goal.templateBrowser.catSales'), value: 'sales' },
  { title: t('goal.templateBrowser.catMarketing'), value: 'marketing' },
  { title: t('goal.templateBrowser.catGeneral'), value: 'general' },
]);

const roleOptions = computed(() => [
  { title: t('goal.templateBrowser.roleProductManager'), value: '产品经理' },
  { title: t('goal.templateBrowser.roleTechLead'), value: '技术负责人' },
  { title: t('goal.templateBrowser.roleSalesDirector'), value: '销售总监' },
  { title: t('goal.templateBrowser.roleMarketingDirector'), value: '市场总监' },
  { title: t('goal.templateBrowser.roleTeamLead'), value: '团队负责人' },
]);

// Computed
const filters = computed<RecommendationFilters>(() => ({
  searchQuery: searchQuery.value || undefined,
  category: selectedCategory.value || undefined,
  role: selectedRole.value || undefined,
}));

const filteredTemplates = computed(() => {
  return templateRecommendationService.recommendTemplates(filters.value);
});

// Watch: 重置选择当筛选条件改变
watch(filters, () => {
  if (selectedTemplate.value) {
    const stillExists = filteredTemplates.value.some(
      (r) => r.template.id === selectedTemplate.value!.id,
    );
    if (!stillExists) {
      selectedTemplate.value = null;
    }
  }
});

// Methods
const open = () => {
  visible.value = true;
  // 重置状态
  searchQuery.value = '';
  selectedCategorySelect.value = 'all';
  selectedRoleSelect.value = 'all';
  selectedTemplate.value = null;
};

const close = () => {
  visible.value = false;
  emit('close');
};

const selectTemplate = (template: GoalTemplate) => {
  selectedTemplate.value = template;
};

const previewTemplate = (template: GoalTemplate) => {
  previewingTemplate.value = template;
  previewVisible.value = true;
};

const applyTemplate = () => {
  if (selectedTemplate.value) {
    emit('apply', selectedTemplate.value);
    close();
  }
};

const applyFromPreview = () => {
  if (previewingTemplate.value) {
    selectedTemplate.value = previewingTemplate.value;
    previewVisible.value = false;
    applyTemplate();
  }
};

// Helper functions
const categoryIcons: Record<string, Component> = {
  product: Rocket,
  engineering: Code,
  sales: TrendingUp,
  marketing: Megaphone,
  general: Briefcase,
};

const getCategoryIconComponent = (category: string): Component => {
  return categoryIcons[category] || Folder;
};

const getCategoryColorClass = (category: string): string => {
  const colors: Record<string, string> = {
    product: 'text-purple-500',
    engineering: 'text-blue-500',
    sales: 'text-green-500',
    marketing: 'text-orange-500',
    general: 'text-gray-500',
  };
  return colors[category] || 'text-gray-500';
};

const getScoreBadgeClass = (score: number): string => {
  if (score >= 80) return 'bg-green-100 text-green-700 hover:bg-green-100';
  if (score >= 60) return 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100';
  return 'bg-blue-100 text-blue-700 hover:bg-blue-100';
};

const getWeightBgClass = (weight: number): string => {
  if (weight >= 40) return 'bg-green-100 text-green-700';
  if (weight >= 25) return 'bg-yellow-100 text-yellow-700';
  return 'bg-blue-100 text-blue-700';
};

// Expose
defineExpose({
  open,
  close,
});
</script>
