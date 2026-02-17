<template>
  <v-dialog v-model="visible" max-width="1200" scrollable>
    <v-card>
      <!-- 标题栏 -->
      <v-card-title class="d-flex justify-space-between align-center">
        <span class="text-h5">
          <v-icon class="mr-2">mdi-lightbulb-outline</v-icon>
          选择目标模板
        </span>
        <v-btn icon="mdi-close" variant="text" @click="close"></v-btn>
      </v-card-title>

      <v-divider></v-divider>

      <!-- 搜索和筛选栏 -->
      <v-card-text class="pb-0">
        <v-row>
          <v-col cols="12" md="6">
            <v-text-field
              v-model="searchQuery"
              label="搜索模板"
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              density="comfortable"
              clearable
              hint="搜索标题、描述或标签"
            ></v-text-field>
          </v-col>
          <v-col cols="12" md="3">
            <v-select
              v-model="selectedCategory"
              :items="categoryOptions"
              label="类别"
              variant="outlined"
              density="comfortable"
              clearable
            ></v-select>
          </v-col>
          <v-col cols="12" md="3">
            <v-select
              v-model="selectedRole"
              :items="roleOptions"
              label="角色"
              variant="outlined"
              density="comfortable"
              clearable
            ></v-select>
          </v-col>
        </v-row>

        <!-- 结果统计 -->
        <v-alert
          v-if="filteredTemplates.length > 0"
          type="info"
          variant="tonal"
          density="compact"
          class="mb-4"
        >
          找到 {{ filteredTemplates.length }} 个匹配的模板
          <span v-if="filters.role || filters.category"> (已应用筛选)</span>
        </v-alert>
        <v-alert v-else type="warning" variant="tonal" density="compact" class="mb-4">
          未找到匹配的模板，请调整筛选条件
        </v-alert>
      </v-card-text>

      <!-- 模板卡片列表 -->
      <v-card-text style="max-height: 600px">
        <v-row>
          <v-col
            v-for="result in filteredTemplates"
            :key="result.template.id"
            cols="12"
            md="6"
            lg="4"
          >
            <v-card
              :class="{ 'border-primary': selectedTemplate?.id === result.template.id }"
              :elevation="selectedTemplate?.id === result.template.id ? 8 : 2"
              @click="selectTemplate(result.template)"
              style="cursor: pointer; height: 100%"
              hover
            >
              <!-- 卡片头部 -->
              <v-card-title class="text-subtitle-1">
                <v-icon :color="getCategoryColor(result.template.category)" class="mr-2">
                  {{ getCategoryIcon(result.template.category) }}
                </v-icon>
                {{ result.template.title }}
              </v-card-title>

              <!-- 匹配分数徽章 -->
              <v-chip
                v-if="result.score > 50"
                :color="getScoreColor(result.score)"
                size="small"
                class="ml-4 mb-2"
              >
                {{ result.score }}% 匹配
              </v-chip>

              <v-card-text>
                <!-- 描述 -->
                <p class="text-body-2 mb-3">{{ result.template.description }}</p>

                <!-- 标签 -->
                <div class="mb-3">
                  <v-chip
                    v-for="tag in result.template.tags.slice(0, 3)"
                    :key="tag"
                    size="x-small"
                    class="mr-1 mb-1"
                    variant="outlined"
                  >
                    {{ tag }}
                  </v-chip>
                </div>

                <!-- 匹配原因 -->
                <div v-if="result.reasons.length > 0" class="mt-2">
                  <v-icon size="small" color="success" class="mr-1">mdi-check-circle</v-icon>
                  <span class="text-caption text-success">{{ result.reasons[0] }}</span>
                </div>

                <!-- 关键结果预览 -->
                <v-divider class="my-3"></v-divider>
                <div class="text-caption text-medium-emphasis">
                  <strong>{{ result.template.keyResults.length }} 个关键结果:</strong>
                  <ul class="ml-4 mt-1">
                    <li v-for="(kr, idx) in result.template.keyResults.slice(0, 2)" :key="idx">
                      {{ kr.title }} ({{ kr.suggestedWeight }}%)
                    </li>
                    <li v-if="result.template.keyResults.length > 2" class="text-medium-emphasis">
                      还有 {{ result.template.keyResults.length - 2 }} 个...
                    </li>
                  </ul>
                </div>
              </v-card-text>

              <!-- 操作按钮 -->
              <v-card-actions>
                <v-btn
                  variant="text"
                  prepend-icon="mdi-eye"
                  @click.stop="previewTemplate(result.template)"
                >
                  预览
                </v-btn>
                <v-spacer></v-spacer>
                <v-btn
                  v-if="selectedTemplate?.id === result.template.id"
                  color="primary"
                  variant="elevated"
                  prepend-icon="mdi-check"
                >
                  已选择
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-col>
        </v-row>
      </v-card-text>

      <v-divider></v-divider>

      <!-- 底部操作栏 -->
      <v-card-actions>
        <v-btn variant="text" @click="close">取消</v-btn>
        <v-spacer></v-spacer>
        <v-btn
          color="primary"
          variant="elevated"
          :disabled="!selectedTemplate"
          @click="applyTemplate"
        >
          <v-icon class="mr-1">mdi-check-circle</v-icon>
          使用此模板
        </v-btn>
      </v-card-actions>
    </v-card>

    <!-- 预览对话框 -->
    <v-dialog v-model="previewVisible" max-width="700">
      <v-card v-if="previewingTemplate">
        <v-card-title>
          <v-icon :color="getCategoryColor(previewingTemplate.category)" class="mr-2">
            {{ getCategoryIcon(previewingTemplate.category) }}
          </v-icon>
          {{ previewingTemplate.title }}
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text>
          <p class="text-body-1 mb-4">{{ previewingTemplate.description }}</p>

          <v-alert type="info" variant="tonal" density="compact" class="mb-4">
            <strong>适用角色:</strong> {{ previewingTemplate.roles.join(', ') }}<br />
            <strong>适用行业:</strong> {{ previewingTemplate.industries.join(', ') }}<br />
            <strong>建议周期:</strong> {{ previewingTemplate.suggestedDuration }} 天
          </v-alert>

          <h4 class="text-h6 mb-3">关键结果 ({{ previewingTemplate.keyResults.length }})</h4>
          <v-list density="compact">
            <v-list-item v-for="(kr, idx) in previewingTemplate.keyResults" :key="idx" class="mb-2">
              <template #prepend>
                <v-avatar size="32" :color="getWeightColor(kr.suggestedWeight)">
                  <span class="text-caption">{{ kr.suggestedWeight }}%</span>
                </v-avatar>
              </template>
              <v-list-item-title>{{ kr.title }}</v-list-item-title>
              <v-list-item-subtitle>
                度量: {{ kr.metrics.join(', ') }}
                <span v-if="kr.suggestedStartValue !== undefined">
                  | 目标: {{ kr.suggestedStartValue }} → {{ kr.suggestedTargetValue }}
                  {{ kr.unit }}
                </span>
              </v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions>
          <v-btn variant="text" @click="previewVisible = false">关闭</v-btn>
          <v-spacer></v-spacer>
          <v-btn color="primary" variant="elevated" @click="applyFromPreview"> 使用此模板 </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { GoalTemplate } from '../../../application/templates/GoalTemplates';
import templateRecommendationService from '../../../application/services/TemplateRecommendationService';
import type { RecommendationFilters } from '../../../application/services/TemplateRecommendationService';

// Emits
const emit = defineEmits<{
  apply: [template: GoalTemplate];
  close: [];
}>();

// State
const visible = ref(false);
const searchQuery = ref('');
const selectedCategory = ref<GoalTemplate['category'] | null>(null);
const selectedRole = ref<string | null>(null);
const selectedTemplate = ref<GoalTemplate | null>(null);
const previewVisible = ref(false);
const previewingTemplate = ref<GoalTemplate | null>(null);

// Options
const categoryOptions = [
  { title: '产品管理', value: 'product' },
  { title: '工程研发', value: 'engineering' },
  { title: '销售', value: 'sales' },
  { title: '市场营销', value: 'marketing' },
  { title: '通用', value: 'general' },
];

const roleOptions = [
  { title: '产品经理', value: '产品经理' },
  { title: '技术负责人', value: '技术负责人' },
  { title: '销售总监', value: '销售总监' },
  { title: '市场总监', value: '市场总监' },
  { title: '团队负责人', value: '团队负责人' },
];

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
  selectedCategory.value = null;
  selectedRole.value = null;
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
const getCategoryColor = (category: GoalTemplate['category']): string => {
  const colors = {
    product: 'purple',
    engineering: 'blue',
    sales: 'green',
    marketing: 'orange',
    general: 'grey',
  };
  return colors[category] || 'grey';
};

const getCategoryIcon = (category: GoalTemplate['category']): string => {
  const icons = {
    product: 'mdi-rocket-launch',
    engineering: 'mdi-code-braces',
    sales: 'mdi-chart-line',
    marketing: 'mdi-bullhorn',
    general: 'mdi-briefcase',
  };
  return icons[category] || 'mdi-folder';
};

const getScoreColor = (score: number): string => {
  if (score >= 80) return 'success';
  if (score >= 60) return 'warning';
  return 'info';
};

const getWeightColor = (weight: number): string => {
  if (weight >= 40) return 'success';
  if (weight >= 25) return 'warning';
  return 'info';
};

// Expose
defineExpose({
  open,
  close,
});
</script>

<style scoped>
.border-primary {
  border: 2px solid rgb(var(--v-theme-primary));
}

.v-card {
  transition: all 0.3s ease;
}

.v-card:hover {
  transform: translateY(-4px);
}
</style>
