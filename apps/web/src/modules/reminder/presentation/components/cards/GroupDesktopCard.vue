<template>
  <!-- 透明背景遮罩 -->
  <v-overlay
    v-model="visible"
    class="align-center justify-center"
    :scrim="true"
    opacity="0.3"
    @click:outside="close"
  >
    <!-- 文件夹展开容器 -->
    <div
      v-if="group"
      class="folder-popup"
      @click.stop
    >
      <!-- 顶部标题栏 -->
      <div class="folder-header">
        <div class="folder-title">
          <v-icon class="mr-2" color="primary">{{ group.icon || 'mdi-folder' }}</v-icon>
          <span>{{ group.name }}</span>
        </div>
        <div class="folder-actions">
          <v-btn
            icon
            size="small"
            variant="text"
            @click="handleEditGroup"
          >
            <v-icon size="20">mdi-pencil</v-icon>
          </v-btn>
        </div>
      </div>

      <!-- 控制选项栏 -->
      <div class="folder-controls">
        <!-- 控制模式 -->
        <div class="control-item">
          <div class="control-label">
            <v-icon size="16" class="mr-1">mdi-tune</v-icon>
            <span>控制模式</span>
          </div>
          <v-switch
            v-model="isGroupControl"
            :loading="isTogglingMode"
            color="primary"
            hide-details
            density="compact"
            inset
            @update:model-value="handleToggleControlMode"
          >
            <template #label>
              <span class="control-value">{{ isGroupControl ? '组控制' : '个体控制' }}</span>
            </template>
          </v-switch>
        </div>

        <!-- 当前状态 -->
        <div class="control-item">
          <div class="control-label">
            <v-icon size="16" class="mr-1">mdi-power</v-icon>
            <span>当前状态</span>
          </div>
          <v-switch
            v-model="localEnabled"
            :loading="isTogglingStatus"
            color="primary"
            hide-details
            density="compact"
            inset
            @update:model-value="handleToggleStatus"
          >
            <template #label>
              <span class="control-value">{{ localEnabled ? '已启用' : '已禁用' }}</span>
            </template>
          </v-switch>
        </div>
      </div>

      <!-- 九宫格容器 -->
      <div class="folder-grid">
        <!-- 空状态 -->
        <!-- 空状态 -->
        <div v-if="templates.length === 0" class="empty-state">
          <v-icon size="48" color="primary" class="mb-2">mdi-folder-open-outline</v-icon>
          <div class="text-body-2 mb-3">该分组暂无提醒</div>
          <v-btn
            size="small"
            variant="tonal"
            color="primary"
            prepend-icon="mdi-plus"
            @click="handleCreateTemplate"
          >
            添加提醒
          </v-btn>
        </div>
        <!-- 模板图标（九宫格） -->
        <div
          v-for="template in displayTemplates"
          :key="template.uuid"
          class="app-icon"
          :class="{ disabled: !template.effectiveEnabled }"
          @click="handleTemplateClick(template)"
          @contextmenu.prevent="handleTemplateContextMenu(template, $event)"
        >
          <div 
            class="icon-circle"
            :style="{ backgroundColor: template.effectiveEnabled ? (template.color || '#E3F2FD') : '#F5F5F5' }"
          >
            <v-icon 
              :color="template.effectiveEnabled ? 'primary' : '#999'" 
              size="28"
            >
              {{ template.icon || 'mdi-bell' }}
            </v-icon>
          </div>
          <div class="app-name">{{ template.title }}</div>
        </div>

        <!-- 更多按钮（如果超过9个） -->
        <!-- 更多按钮（如果超过9个） -->
        <div
          v-if="templates.length > maxDisplayCount"
          class="app-icon more-icon"
          @click="handleShowAll"
        >
          <div class="icon-circle">
            <v-icon color="secondary" size="28">mdi-dots-horizontal</v-icon>
          </div>
          <div class="app-name">更多 ({{ templates.length - maxDisplayCount }})</div>
        </div>
      </div>
      <!-- 关闭按钮 -->
      <div class="folder-close">
        <v-btn
          icon
          size="small"
          variant="text"
          @click="close"
        >
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </div>
    </div>
  </v-overlay>

  <!-- 右键菜单 -->
  <div
    v-if="contextMenu.show"
    class="context-menu-overlay"
    @click="contextMenu.show = false"
    @contextmenu.prevent="contextMenu.show = false"
  >
    <div
      class="context-menu"
      :style="{ left: contextMenu.x + 'px', top: contextMenu.y + 'px' }"
    >
      <div
        v-for="(item, index) in contextMenu.items"
        :key="index"
        class="context-menu-item"
        @click="item.action"
      >
        <v-icon class="mr-2" size="18">{{ item.icon }}</v-icon>
        {{ item.text }}
      </div>
    </div>
  </div>

  <!-- 模板详情卡片 -->
  <TemplateDesktopCard
    ref="templateCardRef"
    @edit-template="handleEditTemplate"
  />
</template>

<script setup lang="ts">
import { ref, computed, inject } from 'vue';
import type { ReminderTemplateClientDTO, ReminderGroupClientDTO, RecurrenceConfigClient  } from '@dailyuse/contracts/reminder';
import { ReminderGroup } from '@dailyuse/reminder/domain-client';
import { useReminder } from '../../composables/useReminder';
import { useMessage } from '@dailyuse/ui-vuetify';
import { REMINDER_SERVICE_KEY } from '@/shared/di';
import TemplateDesktopCard from './TemplateDesktopCard.vue';

type ReminderGroupDTO = ReminderGroupClientDTO;
type ReminderTemplate = ReminderTemplateClientDTO;

// Composables
const { reminderTemplates, toggleTemplateStatus, getReminderGroupByUuid } = useReminder();
const message = useMessage();
const reminderService = inject(REMINDER_SERVICE_KEY)!;

// Emits
const emit = defineEmits<{
  'edit-group': [group: ReminderGroup];
  'edit-template': [template: ReminderTemplate];
  'create-template': [groupUuid: string];
}>();

// 响应式状态
const visible = ref(false);
const groupUuid = ref<string | null>(null);
const isTogglingStatus = ref(false);
const isTogglingMode = ref(false);
const templateCardRef = ref<InstanceType<typeof TemplateDesktopCard>>();
const maxDisplayCount = 9; // 最多显示9个，超过显示"更多"

// 右键菜单状态
const contextMenu = ref<{
  show: boolean;
  x: number;
  y: number;
  items: Array<{ text: string; icon: string; action: () => void }>;
}>({
  show: false,
  x: 0,
  y: 0,
  items: [],
});

/**
 * 直接从 useReminder composable 获取最新的分组对象
 * 这确保了组件始终持有对 Store 中对象的引用
 */
const group = computed(() => {
  if (!groupUuid.value) return null;
  return getReminderGroupByUuid(groupUuid.value).value;
});

/**
 * 从分组的 enabled 属性计算本地启用状态
 */
const localEnabled = computed({
  get() {
    return group.value?.enabled ?? false;
  },
  set(value: boolean) {
    // setter 仅为支持 v-model，实际更新由 handleToggleStatus 执行
  },
});

/**
 * 从分组的 controlMode 属性计算本地控制模式
 */
const isGroupControl = computed({
  get() {
    return group.value?.controlMode === 'GROUP';
  },
  set(value: boolean) {
    // setter 仅为支持 v-model，实际更新由 handleToggleControlMode 执行
  },
});

/**
 * 该分组下的所有模板
 */
const templates = computed(() => {
  if (!group.value) return [];
  return reminderTemplates.value.filter(t => t.groupUuid === group.value!.uuid);
});

/**
 * 显示的模板（最多9个）
 */
const displayTemplates = computed(() => {
  return templates.value.slice(0, maxDisplayCount);
});

// ===== 方法 =====

/**
 * 打开对话框
 * 关键改变：只保存 groupUuid，而不是保存整个对象
 * 这样组件会通过 computed 属性从 Store 中实时获取最新数据
 */
const open = async (groupData: ReminderGroup | ReminderGroupDTO) => {
  const uuid = (groupData as any).uuid;
  if (!uuid) {
    console.error('Group data missing uuid');
    return;
  }
  groupUuid.value = uuid;
  visible.value = true;
};

/**
 * 关闭对话框
 */
const close = () => {
  visible.value = false;
  setTimeout(() => {
    groupUuid.value = null;
  }, 300);
};

/**
 * 处理分组状态切换
 * 关键改变：不再手动更新 group，而是依赖 Store 的更新和 computed 属性的自动响应
 */
const handleToggleStatus = async (enabled: boolean | null) => {
  if (!group.value || enabled === null) return;

  isTogglingStatus.value = true;
  try {
    const result = await reminderService.toggleReminderGroupStatus(group.value.uuid);
    if (result.ok) {
      message.success(enabled ? '已启用分组' : '已禁用分组');
    } else {
      message.error(result.error.message || '切换状态失败');
    }
  } finally {
    isTogglingStatus.value = false;
  }
};

/**
 * 处理控制模式切换
 * 关键改变：不再手动更新 group，而是依赖 Store 的更新和 computed 属性的自动响应
 */
const handleToggleControlMode = async (isGroup: boolean | null) => {
  if (!group.value || isGroup === null) return;

  isTogglingMode.value = true;
  try {
    const result = await reminderService.toggleReminderGroupControlMode(group.value.uuid);
    if (result.ok) {
      message.success(isGroup ? '已切换到组控制' : '已切换到个体控制');
    } else {
      message.error(result.error.message || '切换控制模式失败');
    }
  } finally {
    isTogglingMode.value = false;
  }
};

/**
 * 处理编辑分组
 */
const handleEditGroup = () => {
  if (!group.value) return;
  emit('edit-group', group.value);
  close();
};

/**
 * 处理创建模板
 */
const handleCreateTemplate = () => {
  if (!group.value) return;
  emit('create-template', group.value.uuid);
  close();
};

/**
 * 处理模板点击
 */
const handleTemplateClick = (template: ReminderTemplate) => {
  templateCardRef.value?.open(template);
};

/**
 * 处理编辑模板
 */
const handleEditTemplate = (template: ReminderTemplate) => {
  emit('edit-template', template);
  close();
};

/**
 * 处理显示所有模板
 */
const handleShowAll = () => {
  // TODO: 打开完整列表视图或滚动查看
  console.log('显示所有模板');
  message.info('该功能正在开发中');
};

/**
 * 处理模板右键菜单
 */
const handleTemplateContextMenu = (template: ReminderTemplate, event: MouseEvent) => {
  contextMenu.value = {
    show: true,
    x: event.clientX,
    y: event.clientY,
    items: [
      {
        text: '查看详情',
        icon: 'mdi-eye',
        action: () => {
          handleTemplateClick(template);
          contextMenu.value.show = false;
        },
      },
      {
        text: '编辑',
        icon: 'mdi-pencil',
        action: () => {
          handleEditTemplate(template);
          contextMenu.value.show = false;
        },
      },
      {
        text: template.effectiveEnabled ? '禁用' : '启用',
        icon: template.effectiveEnabled ? 'mdi-pause' : 'mdi-play',
        action: async () => {
          try {
            await toggleTemplateStatus(template.uuid, !template.effectiveEnabled);
            message.success(template.effectiveEnabled ? '已禁用模板' : '已启用模板');
          } catch (error) {
            console.error('切换模板状态失败:', error);
            message.error('操作失败');
          }
          contextMenu.value.show = false;
        },
      },
      {
        text: '移出分组',
        icon: 'mdi-folder-remove',
        action: () => {
          // TODO: 实现移出分组功能
          console.log('移出分组:', template.uuid);
          contextMenu.value.show = false;
          message.info('该功能正在开发中');
        },
      },
    ],
  };
};

defineExpose({
  open,
  close,
});
</script>

<style scoped>
/* 文件夹弹窗容器 */
.folder-popup {
  background: rgba(var(--v-theme-surface), 0.95);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  padding: 24px;
  min-width: 400px;
  max-width: 500px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  animation: folder-open 0.3s ease-out;
}

@keyframes folder-open {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* 顶部标题栏 */
.folder-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.12);
}

.folder-title {
  display: flex;
  align-items: center;
  color: rgb(var(--v-theme-on-surface));
  font-size: 18px;
  font-weight: 500;
}

.folder-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 控制选项栏 */
.folder-controls {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
  padding: 12px;
  background: rgba(var(--v-theme-primary), 0.05);
  border-radius: 12px;
}

.control-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.control-label {
  display: flex;
  align-items: center;
  color: rgb(var(--v-theme-on-surface));
  font-size: 14px;
  font-weight: 500;
}

.control-value {
  font-size: 12px;
  color: rgb(var(--v-theme-on-surface-variant));
  margin-left: 8px;
}

/* 九宫格布局 */
.folder-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  min-height: 300px;
}

/* 空状态 */
.empty-state {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: rgb(var(--v-theme-on-surface-variant));
}

/* 应用图标样式 */
.app-icon {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  transition: transform 0.2s ease;
  user-select: none;
}

.app-icon:hover {
  transform: scale(1.05);
}

.app-icon.disabled {
  opacity: 0.5;
}

.icon-circle {
  width: 64px;
  height: 64px;
  background: rgba(var(--v-theme-primary), 0.12);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(var(--v-theme-primary), 0.2);
  transition: all 0.2s ease;
}

.app-icon:hover .icon-circle {
  background: rgba(var(--v-theme-primary), 0.18);
  border-color: rgba(var(--v-theme-primary), 0.4);
}

.app-name {
  color: rgb(var(--v-theme-on-surface));
  font-size: 12px;
  text-align: center;
  max-width: 80px;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
}

/* 更多图标 */
.more-icon .icon-circle {
  background: rgba(var(--v-theme-secondary), 0.12);
  border-color: rgba(var(--v-theme-secondary), 0.2);
}

/* 关闭按钮 */
.folder-close {
  display: flex;
  justify-content: center;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.12);
}

/* 右键菜单 */
.context-menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 9999;
  background: transparent;
}

.context-menu {
  position: fixed;
  z-index: 10000;
  background: rgb(var(--v-theme-surface));
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05);
  min-width: 180px;
  overflow: hidden;
  backdrop-filter: blur(10px);
  animation: menuFadeIn 0.15s ease-out;
}

@keyframes menuFadeIn {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(-5px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.context-menu-item {
  padding: 10px 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  font-size: 14px;
  transition: all 0.15s ease;
  color: rgb(var(--v-theme-on-surface));
  user-select: none;
}

.context-menu-item:hover {
  background-color: rgba(var(--v-theme-primary), 0.08);
}

.context-menu-item:active {
  background-color: rgba(var(--v-theme-primary), 0.12);
}

/* 响应式 */
@media (max-width: 600px) {
  .folder-popup {
    min-width: 90vw;
    max-width: 90vw;
  }

  .folder-grid {
    gap: 12px;
  }

  .icon-circle {
    width: 56px;
    height: 56px;
  }
}
</style>

