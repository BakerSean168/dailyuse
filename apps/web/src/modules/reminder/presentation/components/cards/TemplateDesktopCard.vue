<template>
  <v-dialog v-model="visible" max-width="700px" scrollable>
    <v-card v-if="template">
      <!-- 顶部标题栏 -->
      <v-card-title class="d-flex align-center justify-space-between bg-primary">
        <div class="d-flex align-center">
          <v-icon class="mr-2" color="white">mdi-bell</v-icon>
          <span class="text-h6 text-white">{{ template.title }}</span>
        </div>
        <div class="d-flex align-center gap-2">
          <!-- 启用/禁用开关 -->
          <v-switch
            v-model="localEnabled"
            :loading="isTogglingStatus"
            color="white"
            hide-details
            density="compact"
            @update:model-value="handleToggleStatus"
          >
            <template #label>
              <span class="text-white text-caption">{{ localEnabled ? '已启用' : '已禁用' }}</span>
            </template>
          </v-switch>
          <v-btn icon size="small" variant="text" @click="close">
            <v-icon color="white">mdi-close</v-icon>
          </v-btn>
        </div>
      </v-card-title>

      <!-- 状态指示 -->
      <v-card-subtitle class="d-flex align-center py-2 bg-grey-lighten-4">
        <v-chip
          :color="getStatusColor()"
          size="small"
          variant="flat"
          class="mr-2"
        >
          <v-icon start size="small">{{ getStatusIcon() }}</v-icon>
          {{ getStatusText() }}
        </v-chip>
        <v-chip
          v-if="template.groupUuid"
          size="small"
          variant="outlined"
          prepend-icon="mdi-folder"
        >
          分组内
        </v-chip>
      </v-card-subtitle>

      <v-divider />

      <!-- 主要内容 -->
      <v-card-text class="pt-4">
        <!-- 基本信息 -->
        <v-list density="comfortable">
          <v-list-subheader>基本信息</v-list-subheader>
          
          <v-list-item>
            <template #prepend>
              <v-icon color="primary">mdi-text</v-icon>
            </template>
            <v-list-item-title class="text-body-2 text-grey-darken-1">标题</v-list-item-title>
            <v-list-item-subtitle class="text-body-1 mt-1">{{ template.title }}</v-list-item-subtitle>
          </v-list-item>

          <v-list-item v-if="template.description">
            <template #prepend>
              <v-icon color="info">mdi-text-box</v-icon>
            </template>
            <v-list-item-title class="text-body-2 text-grey-darken-1">描述</v-list-item-title>
            <v-list-item-subtitle class="text-body-1 mt-1 text-wrap">
              {{ template.description }}
            </v-list-item-subtitle>
          </v-list-item>

          <v-list-item>
            <template #prepend>
              <v-icon color="success">mdi-clock-outline</v-icon>
            </template>
            <v-list-item-title class="text-body-2 text-grey-darken-1">触发器</v-list-item-title>
            <v-list-item-subtitle class="text-body-1 mt-1">
              <v-chip size="small" color="success" variant="outlined">
                {{ template.triggerText || '未设置' }}
              </v-chip>
            </v-list-item-subtitle>
          </v-list-item>

          <!-- 触发器类型详情 -->
          <v-list-item v-if="template.trigger">
            <template #prepend>
              <v-icon color="orange">mdi-cog</v-icon>
            </template>
            <v-list-item-title class="text-body-2 text-grey-darken-1">触发配置</v-list-item-title>
            <v-list-item-subtitle class="mt-1">
              <div class="d-flex flex-wrap gap-1">
                <v-chip size="small" variant="tonal">
                  类型: {{ template.trigger.type || 'unknown' }}
                </v-chip>
                <v-chip v-if="template.trigger.interval" size="small" variant="tonal">
                  间隔: {{ template.trigger.interval.minutes }} 分钟
                </v-chip>
                <v-chip v-if="template.trigger.fixedTime" size="small" variant="tonal">
                  时间: {{ template.trigger.fixedTime.time }}
                </v-chip>
              </div>
            </v-list-item-subtitle>
          </v-list-item>
        </v-list>

        <v-divider class="my-4" />

        <!-- 统计信息 -->
        <v-list density="comfortable">
          <v-list-subheader>统计数据</v-list-subheader>
          
          <v-row class="px-4">
            <v-col cols="4">
              <v-card variant="tonal" color="primary">
                <v-card-text class="text-center">
                  <div class="text-h6">{{ stats.total }}</div>
                  <div class="text-caption">总实例</div>
                </v-card-text>
              </v-card>
            </v-col>
            <v-col cols="4">
              <v-card variant="tonal" color="success">
                <v-card-text class="text-center">
                  <div class="text-h6">{{ stats.completed }}</div>
                  <div class="text-caption">已完成</div>
                </v-card-text>
              </v-card>
            </v-col>
            <v-col cols="4">
              <v-card variant="tonal" color="warning">
                <v-card-text class="text-center">
                  <div class="text-h6">{{ stats.pending }}</div>
                  <div class="text-caption">待处理</div>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </v-list>

        <v-divider class="my-4" />

        <!-- 时间信息 -->
        <v-list density="comfortable">
          <v-list-subheader>时间信息</v-list-subheader>
          
          <v-list-item>
            <template #prepend>
              <v-icon color="blue-grey">mdi-calendar-plus</v-icon>
            </template>
            <v-list-item-title class="text-body-2 text-grey-darken-1">创建时间</v-list-item-title>
            <v-list-item-subtitle class="text-body-2 mt-1">
              {{ formatDate(template.createdAt) }}
            </v-list-item-subtitle>
          </v-list-item>

          <v-list-item>
            <template #prepend>
              <v-icon color="blue-grey">mdi-calendar-edit</v-icon>
            </template>
            <v-list-item-title class="text-body-2 text-grey-darken-1">更新时间</v-list-item-title>
            <v-list-item-subtitle class="text-body-2 mt-1">
              {{ formatDate(template.updatedAt) }}
            </v-list-item-subtitle>
          </v-list-item>
        </v-list>
      </v-card-text>

      <v-divider />

      <!-- 底部操作按钮 -->
      <v-card-actions class="pa-4">
        <v-btn
          color="primary"
          variant="elevated"
          prepend-icon="mdi-pencil"
          @click="handleEdit"
        >
          编辑模板
        </v-btn>
        <v-btn
          color="info"
          variant="outlined"
          prepend-icon="mdi-eye"
          @click="handleViewInstances"
        >
          查看实例
        </v-btn>
        <v-spacer />
        <v-btn
          variant="text"
          @click="close"
        >
          关闭
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { ReminderTemplateClientDTO } from '@dailyuse/contracts/reminder';
import { ImportanceLevel } from '@dailyuse/contracts/shared';
import { ReminderTemplate } from '@dailyuse/reminder/domain-client';
import { useReminder } from '../../composables/useReminder';
import { useMessage } from '@dailyuse/ui-vuetify';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

type ReminderTemplateDTO = ReminderTemplateClientDTO;

// Composables
const { toggleTemplateStatus, getReminderTemplateByUuid } = useReminder();
const message = useMessage();

// Emits
const emit = defineEmits<{
  'edit-template': [template: ReminderTemplate];
  'view-instances': [templateUuid: string];
  'status-changed': [template: ReminderTemplate, enabled: boolean];
}>();

// 响应式状态
const visible = ref(false);
const templateUuid = ref<string | null>(null);
const isTogglingStatus = ref(false);

/**
 * 直接从 useReminder composable 获取最新的模板对象
 * 这确保了组件始终持有对 Store 中对象的引用
 */
const template = computed(() => {
  if (!templateUuid.value) return null;
  return getReminderTemplateByUuid(templateUuid.value).value;
});

/**
 * 从模板的 effectiveEnabled 属性计算本地启用状态
 */
const localEnabled = computed({
  get() {
    return template.value?.effectiveEnabled ?? false;
  },
  set(value: boolean) {
    // 这个 setter 是为了支持 v-model，但实际更新由 handleToggleStatus 来执行
  },
});

// 统计数据（模拟，实际应该从API获取）
const stats = computed(() => ({
  total: 0,
  completed: 0,
  pending: 0,
}));

// ===== 方法 =====

/**
 * 打开对话框
 * 关键改变：只保存 templateUuid，而不是保存整个对象
 * 这样组件会通过 computed 属性从 Store 中实时获取最新数据
 */
const open = (templateData: ReminderTemplate | ReminderTemplateDTO) => {
  const uuid = (templateData as any).uuid;
  if (!uuid) {
    console.error('Template data missing uuid');
    return;
  }
  templateUuid.value = uuid;
  visible.value = true;
};

/**
 * 关闭对话框
 */
const close = () => {
  visible.value = false;
  setTimeout(() => {
    templateUuid.value = null;
  }, 300);
};

/**
 * 处理状态切换
 * 关键改变：不再手动更新 template，而是依赖 Store 的更新和 computed 属性的自动响应
 */
const handleToggleStatus = async (enabled: boolean | null) => {
  if (!template.value || enabled === null) return;

  isTogglingStatus.value = true;
  try {
    await toggleTemplateStatus(template.value.uuid, enabled);
    emit('status-changed', template.value, enabled);
    message.success(enabled ? '已启用模板' : '已禁用模板');
  } catch (error) {
    console.error('切换状态失败:', error);
    message.error('切换状态失败');
  } finally {
    isTogglingStatus.value = false;
  }
};

/**
 * 处理编辑
 */
const handleEdit = () => {
  if (!template.value) return;
  emit('edit-template', template.value);
  close();
};

/**
 * 查看实例列表
 */
const handleViewInstances = () => {
  if (!template.value) return;
  emit('view-instances', template.value.uuid);
  close();
};

/**
 * 获取状态颜色
 */
const getStatusColor = () => {
  if (!template.value) return 'grey';
  return template.value.effectiveEnabled ? 'success' : 'grey';
};

/**
 * 获取状态图标
 */
const getStatusIcon = () => {
  if (!template.value) return 'mdi-help';
  return template.value.effectiveEnabled ? 'mdi-check-circle' : 'mdi-pause-circle';
};

/**
 * 获取状态文本
 */
const getStatusText = () => {
  if (!template.value) return '未知';
  return template.value.effectiveEnabled ? '运行中' : '已暂停';
};

/**
 * 获取重要性颜色
 */
const getImportanceColor = (importance: ImportanceLevel | undefined): string => {
  if (!importance) return 'grey';
  
  const colors: Record<string, string> = {
    urgent: 'red',
    high: 'orange',
    normal: 'blue',
    low: 'grey',
  };
  return colors[importance] || 'grey';
};

/**
 * 获取重要性文本
 */
const getImportanceText = (importance: ImportanceLevel | undefined): string => {
  if (!importance) return '未知';
  
  const texts: Record<string, string> = {
    urgent: '紧急',
    high: '高',
    normal: '普通',
    low: '低',
  };
  return texts[importance] || '未知';
};

/**
 * 格式化日期
 */
const formatDate = (timestamp: number | undefined): string => {
  if (!timestamp) return '未知';
  try {
    return format(new Date(timestamp), 'yyyy-MM-dd HH:mm:ss', { locale: zhCN });
  } catch {
    return '无效日期';
  }
};

defineExpose({
  open,
  close,
});
</script>

<style scoped>
.gap-2 {
  gap: 8px;
}

.gap-1 {
  gap: 4px;
}

.text-wrap {
  white-space: normal;
  word-break: break-word;
}
</style>

