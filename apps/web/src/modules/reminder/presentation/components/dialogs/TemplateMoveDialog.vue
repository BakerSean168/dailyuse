<template>
  <v-dialog v-model="visible" max-width="500px" persistent>
    <v-card>
      <v-card-title class="d-flex align-center bg-primary text-white">
        <v-icon class="mr-2">mdi-folder-move</v-icon>
        <span class="text-h5">移动模板</span>
      </v-card-title>

      <v-card-text class="pt-4">
        <!-- 当前模板信息 -->
        <v-alert
          v-if="template"
          type="info"
          variant="tonal"
          density="compact"
          class="mb-4"
        >
          <div class="text-subtitle-2">当前模板</div>
          <div class="text-body-2 mt-1">
            <v-icon size="small" class="mr-1">{{ template.icon || 'mdi-bell' }}</v-icon>
            {{ template.title }}
          </div>
          <div v-if="template.groupUuid" class="text-caption mt-1 text-grey-darken-1">
            <v-icon size="small" class="mr-1">mdi-folder</v-icon>
            当前分组: {{ getCurrentGroupName() }}
          </div>
        </v-alert>

        <!-- 目标分组选择 -->
        <v-select
          v-model="selectedGroupUuid"
          label="目标分组 *"
          :items="groupOptions"
          variant="outlined"
          prepend-inner-icon="mdi-folder"
          placeholder="选择要移动到的分组"
          :rules="groupRules"
          clearable
          required
        >
          <template #selection="{ item }">
            <v-icon :icon="item?.raw?.icon || 'mdi-folder'" class="mr-2" :color="item?.raw?.color" />
            {{ item?.title || '' }}
          </template>
          <template #item="{ props, item }">
            <v-list-item v-bind="props">
              <template #prepend>
                <v-icon :icon="item?.raw?.icon || 'mdi-folder'" :color="item?.raw?.color" />
              </template>
              <template #append v-if="item.value === template?.groupUuid">
                <v-chip size="small" color="primary" variant="tonal">
                  当前分组
                </v-chip>
              </template>
            </v-list-item>
          </template>
          <template #no-data>
            <v-list-item>
              <v-list-item-title class="text-grey">
                暂无可用分组
              </v-list-item-title>
            </v-list-item>
          </template>
        </v-select>

        <!-- 移出分组选项 -->
        <v-checkbox
          v-model="moveToRoot"
          label="移出所有分组（移动到根目录）"
          color="warning"
          hide-details
          class="mt-2"
          @update:model-value="handleMoveToRootChange"
        />

        <!-- 提示信息 -->
        <v-alert
          v-if="moveToRoot"
          type="warning"
          variant="tonal"
          density="compact"
          class="mt-4"
        >
          模板将从当前分组移出，成为独立模板
        </v-alert>

        <!-- 分组信息预览 -->
        <v-card
          v-if="selectedGroupUuid && !moveToRoot"
          variant="outlined"
          class="mt-4"
        >
          <v-card-text>
            <div class="text-subtitle-2 mb-2">目标分组信息</div>
            <v-list density="compact">
              <v-list-item>
                <template #prepend>
                  <v-icon size="small">mdi-information</v-icon>
                </template>
                <v-list-item-title class="text-body-2">
                  名称: {{ getGroupName(selectedGroupUuid) }}
                </v-list-item-title>
              </v-list-item>
              <v-list-item>
                <template #prepend>
                  <v-icon size="small">mdi-counter</v-icon>
                </template>
                <v-list-item-title class="text-body-2">
                  包含模板: {{ getGroupTemplateCount(selectedGroupUuid) }} 个
                </v-list-item-title>
              </v-list-item>
              <v-list-item>
                <template #prepend>
                  <v-icon size="small">mdi-check-circle</v-icon>
                </template>
                <v-list-item-title class="text-body-2">
                  状态: {{ getGroupStatus(selectedGroupUuid) }}
                </v-list-item-title>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-card-text>

      <v-divider />

      <v-card-actions class="pa-4">
        <v-spacer />
        <v-btn
          color="grey-darken-1"
          variant="text"
          @click="close"
          :disabled="isMoving"
        >
          取消
        </v-btn>
        <v-btn
          color="primary"
          variant="elevated"
          @click="handleMove"
          :loading="isMoving"
          :disabled="!canMove"
        >
          移动
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, inject } from 'vue';
import type { ReminderTemplateClientDTO, ReminderGroupClientDTO } from '@dailyuse/contracts/reminder';
// 导入根分组常量和工具函数（从主包导出，不是从命名空间）
import { ROOT_GROUP_CONFIG, isRootGroup, getRootGroupUuid, isOnDesktop } from '@dailyuse/contracts/reminder';
import { useReminder } from '../../composables/useReminder';
import { useMessage } from '@dailyuse/ui-vuetify';
import { REMINDER_SERVICE_KEY } from '@/shared/di';

type ReminderTemplate = ReminderTemplateClientDTO;
type ReminderTemplateGroup = ReminderGroupClientDTO;



// Props
interface Props {
  modelValue?: boolean;
  template?: ReminderTemplate | null;
}

const props = defineProps<Props>();

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  moved: [templateUuid: string, targetGroupUuid: string]; // 移除 null，始终使用根分组 UUID
  closed: [];
}>();

// Composables
const { reminderTemplates, reminderGroups, refreshAll } = useReminder();
const message = useMessage();
const reminderService = inject(REMINDER_SERVICE_KEY)!;

// 响应式状态
const visible = ref(false);
const selectedGroupUuid = ref<string | null>(null);
const moveToRoot = ref(false);
const isMoving = ref(false);

// 分组选项 - 使用真实数据
const groupOptions = computed(() => {
  return reminderGroups.value.map(group => ({
    title: group.name,
    value: group.uuid,
    icon: group.icon || 'mdi-folder',
    color: group.enabled ? (group.color || 'primary') : 'grey',
    subtitle: group.description,
  }));
});

// 验证规则
const groupRules = [
  (v: string) => {
    if (moveToRoot.value) return true;
    return !!v || '请选择目标分组';
  },
];

// 是否可以移动
const canMove = computed(() => {
  if (!props.template) return false;
  if (moveToRoot.value) return true;
  if (!selectedGroupUuid.value) return false;
  // 不能移动到当前分组
  return selectedGroupUuid.value !== props.template.groupUuid;
});

// 获取当前分组名称
const getCurrentGroupName = (): string => {
  if (!props.template?.groupUuid) return '无';
  const group = reminderGroups.value.find(g => g.uuid === props.template!.groupUuid);
  return group?.name || '未知分组';
};

// 获取分组名称
const getGroupName = (groupUuid: string): string => {
  const group = reminderGroups.value.find(g => g.uuid === groupUuid);
  return group?.name || '未知';
};

// 获取分组状态
const getGroupStatus = (groupUuid: string): string => {
  const group = reminderGroups.value.find(g => g.uuid === groupUuid);
  return group?.enabled ? '已启用' : '已禁用';
};

// 获取分组模板数量
const getGroupTemplateCount = (groupUuid: string): number => {
  return reminderTemplates.value.filter(t => t.groupUuid === groupUuid).length;
};

// 处理移出分组选项变化
const handleMoveToRootChange = (value: boolean | null) => {
  if (value) {
    selectedGroupUuid.value = null;
  }
};

// 打开对话框
const open = () => {
  resetForm();
  visible.value = true;
};

// 关闭对话框
const close = () => {
  visible.value = false;
  emit('update:modelValue', false);
  emit('closed');
  setTimeout(resetForm, 300);
};

// 重置表单
const resetForm = () => {
  selectedGroupUuid.value = null;
  moveToRoot.value = false;
};

// 执行移动
const handleMove = async () => {
  if (!props.template || !canMove.value) return;

  isMoving.value = true;

  try {
    // 使用根分组 UUID 代替 null
    const targetGroupUuid = moveToRoot.value ? null : selectedGroupUuid.value;

    console.log('移动模板:', {
      templateUuid: props.template.uuid,
      fromGroup: props.template.groupUuid,
      toGroup: targetGroupUuid,
      isMovingToDesktop: moveToRoot.value,
    });

    // 调用应用服务移动模板
    const result = await reminderService.moveTemplateToGroup(
      props.template.uuid,
      targetGroupUuid
    );

    if (result.ok) {
      // 触发刷新
      emit('moved', props.template.uuid, targetGroupUuid || getRootGroupUuid());
      close();
    } else {
      console.error('移动模板失败:', result.error.message);
    }
  } catch (error) {
    console.error('移动模板失败:', error);
    // 错误提示已在应用服务中处理
  } finally {
    isMoving.value = false;
  }
};

// 监听 modelValue 变化
watch(() => props.modelValue, (newVal) => {
  visible.value = !!newVal;
});

// 监听 visible 变化
watch(visible, (newVal) => {
  emit('update:modelValue', newVal);
});

// 监听 selectedGroupUuid 变化
watch(selectedGroupUuid, (newVal) => {
  if (newVal) {
    moveToRoot.value = false;
  }
});

// 当父组件传入模板时，默认选择当前分组（便于快速移动）
watch(
  () => props.template,
  (newTemplate) => {
    if (!newTemplate) return;
    // 允许用户先选择当前分组作为默认目标
    selectedGroupUuid.value = newTemplate.groupUuid || null;
  },
  { immediate: true },
);

defineExpose({
  open,
  close,
});
</script>

<style scoped>
:deep(.v-select .v-input__details) {
  padding-inline-start: 12px;
}
</style>

