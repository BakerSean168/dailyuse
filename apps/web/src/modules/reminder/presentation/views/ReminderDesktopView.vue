<template>
  <div class="reminder-desktop-container">
    <!-- 左侧主要内容区域 -->
    <div class="reminder-content-area">
      <!-- 手机桌面风格的网格布局 -->
      <div class="phone-desktop">
        <!-- 网格容器 -->
        <div class="desktop-grid" @contextmenu.prevent="handleDesktopContextMenu">
          <!-- 模板项（应用图标风格） -->
          <div
            v-for="template in ungroupedTemplates"
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
                size="32"
              >
                {{ template.icon || 'mdi-bell' }}
              </v-icon>
            </div>
            <div class="app-name">{{ template.title }}</div>
          </div>

          <!-- 分组项（文件夹风格） -->
          <div
            v-for="group in templateGroups"
            :key="group.uuid"
            class="folder-icon"
            :class="{ disabled: !group.enabled }"
            @click="handleGroupClick(group)"
            @contextmenu.prevent="handleGroupContextMenu(group, $event)"
          >
            <div 
              class="folder-circle"
              :style="{ backgroundColor: group.enabled ? (group.color || '#E8F5E9') : '#F5F5F5' }"
            >
              <v-icon 
                :color="group.enabled ? 'success' : '#999'" 
                size="32"
              >
                {{ group.icon || 'mdi-folder' }}
              </v-icon>
              <div class="folder-badge" v-if="getGroupTemplateCount(group) > 0">
                {{ getGroupTemplateCount(group) }}
              </div>
            </div>
            <div class="folder-name">{{ group.name }}</div>
          </div>
        </div>

        <!-- 底部工具栏 -->
        <div class="bottom-dock">
          <v-btn icon size="large" @click="templateDialogRef?.openForCreate()" class="dock-btn" data-testid="create-reminder-template-button">
            <v-icon>mdi-plus</v-icon>
          </v-btn>
          <v-btn icon size="large" @click="groupDialogRef?.open()" class="dock-btn" data-testid="create-reminder-group-button">
            <v-icon>mdi-folder-plus</v-icon>
          </v-btn>
          <v-btn icon size="large" @click="refresh" :loading="isLoading" class="dock-btn" data-testid="refresh-reminders-button">
            <v-icon>mdi-refresh</v-icon>
          </v-btn>
        </div>
      </div>

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
          <template v-for="(item, index) in contextMenu.items" :key="index">
            <div v-if="item.divider" class="context-menu-divider" />
            <div
              v-else
              class="context-menu-item"
              :class="{
                'context-menu-item-danger': item.danger,
                'context-menu-item-disabled': item.disabled,
              }"
              @click="!item.disabled && item.action && item.action()"
            >
              <v-icon 
                class="mr-2" 
                size="18" 
                :color="item.iconColor"
              >
                {{ item.icon }}
              </v-icon>
              {{ item.title }}
            </div>
          </template>
        </div>
      </div>

      <!-- 确认删除对话框 -->
      <v-dialog v-model="deleteDialog.show" max-width="400">
        <v-card>
          <v-card-title>确认删除</v-card-title>
          <v-card-text>
            确定要删除{{ deleteDialog.type === 'template' ? '模板' : '分组' }} "{{
              deleteDialog.name
            }}" 吗？
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn @click="deleteDialog.show = false">取消</v-btn>
            <v-btn color="error" @click="confirmDelete">删除</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- 加载状态 -->
      <v-overlay v-model="isLoading" class="align-center justify-center">
        <v-progress-circular size="64" indeterminate color="primary" />
      </v-overlay>

      <!-- 错误提示 -->
      <v-snackbar v-model="showError" color="error" timeout="5000" location="top">
        {{ error }}
      </v-snackbar>

      <!-- 对话框组件 -->
      <TemplateDialog
        ref="templateDialogRef"
      />
      <GroupDialog
        ref="groupDialogRef"
      />
      <TemplateMoveDialog
        v-model="moveDialog.show"
        :template="moveDialog.template"
      />

      <!-- 模板用于展示item的信息和状态切换的卡片组件 -->
      <!-- TemplateCard 组件 -->
      <TemplateDesktopCard ref="templateDesktopCardRef" @edit-template="handleEditTemplate" />

      <!-- GroupDesktopCard 组件 -->
      <GroupDesktopCard ref="groupDesktopCardRef" />
    </div>

    <!-- 右侧固定的提醒实例显示区域 -->
    <div class="reminder-instance-area">
      <ReminderInstanceSidebar />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue';

// 组件导入
import TemplateDialog from '../components/dialogs/TemplateDialog.vue';
import GroupDialog from '../components/dialogs/GroupDialog.vue';
import TemplateMoveDialog from '../components/dialogs/TemplateMoveDialog.vue';
import TemplateDesktopCard from '../components/cards/TemplateDesktopCard.vue';
import GroupDesktopCard from '../components/cards/GroupDesktopCard.vue';
import ReminderInstanceSidebar from '../components/ReminderInstanceSidebar.vue';

// Composables
import { useReminder } from '../composables/useReminder';
import { useMessage } from '@dailyuse/ui-vuetify';
import { reminderGroupApplicationService } from '@dailyuse/application-client/reminder';

// 类型导入 - 使用 Contracts DTO
import type { ReminderTemplateClientDTO, ReminderGroupClientDTO } from '@dailyuse/contracts/reminder';
import { ReminderTemplate as ReminderTemplateEntity } from '@dailyuse/domain-client/reminder';

// 类型别名
type ReminderTemplate = ReminderTemplateClientDTO;
type ReminderTemplateGroup = ReminderGroupClientDTO;

// 使用 composables
const { isLoading, error, reminderTemplates, reminderGroups, initialize, refreshAll, deleteTemplate, updateTemplate, toggleTemplateStatus } =
  useReminder();

const message = useMessage();

// 别名以保持兼容性
const templates = computed(() => reminderTemplates.value);
const groups = computed(() => reminderGroups.value);
const templateGroups = computed(() => reminderGroups.value);

// 计算属性：只显示未分组的模板（groupUuid 为 null）
const ungroupedTemplates = computed(() => {
  return reminderTemplates.value.filter((t) => t.groupUuid === null || t.groupUuid === undefined);
});

const refresh = refreshAll;

// 加载分组数据（数据已通过 reminderSyncApplicationService 自动加载）
const loadGroups = async () => {
  try {
    // 分组数据已经通过 sync service 在 initialize() 时加载
    // 这里可以手动触发刷新
    console.log('分组数据已加载:', reminderGroups.value.length, '个分组');
  } catch (error: any) {
    console.error('加载分组失败:', error);
  }
};

const deleteGroup = async (uuid: string) => {
  try {
    await reminderGroupApplicationService.deleteReminderGroup(uuid);
    message.success('分组删除成功');
  } catch (error: any) {
    console.error('删除分组失败:', error);
    message.error('删除分组失败');
  }
};

// Dialog refs
const templateDialogRef = ref<InstanceType<typeof TemplateDialog> | null>(null); // 用于编辑和创建模板
const groupDialogRef = ref<InstanceType<typeof GroupDialog> | null>(null); // 用于编辑和创建分组
const templateDesktopCardRef = ref<InstanceType<typeof TemplateDesktopCard> | null>(null); // 用于展示和切换模板 enabled 状态
const groupDesktopCardRef = ref<InstanceType<typeof GroupDesktopCard> | null>(null); // 用于展示和切换分组 enabled 状态

// 响应式数据
const showError = ref(false);

// 右键菜单状态
interface ContextMenuItem {
  title?: string;
  icon?: string;
  iconColor?: string;
  action?: () => void;
  danger?: boolean;
  disabled?: boolean;
  divider?: boolean;
}

const contextMenu = reactive({
  show: false,
  x: 0,
  y: 0,
  items: [] as ContextMenuItem[],
});

// 删除对话框状态
const deleteDialog = reactive({
  show: false,
  type: 'template' as 'template' | 'group',
  uuid: '',
  name: '',
});

// 移动对话框状态
const moveDialog = reactive({
  show: false,
  template: null as ReminderTemplate | null,
});

// ===== 事件处理 =====

/**
 * 处理模板点击
 */
const handleTemplateClick = (template: ReminderTemplate) => {
  // 显示模板卡片而非编辑对话框
  console.log('点击模板:', template);
  templateDesktopCardRef.value?.open(template);
};

/**
 * 处理分组点击
 */
const handleGroupClick = (group: ReminderTemplateGroup) => {
  // 打开分组详情或编辑
  groupDesktopCardRef.value?.open(group);
};

/**
 * 处理模板右键菜单
 */
const handleTemplateContextMenu = (template: ReminderTemplate, event: MouseEvent) => {
  event.stopPropagation(); // 阻止事件冒泡到桌面
  contextMenu.x = event.clientX;
  contextMenu.y = event.clientY;
  contextMenu.items = [
    {
      title: '查看详情',
      icon: 'mdi-eye',
      action: () => {
        handleTemplateClick(template);
        contextMenu.show = false;
      },
    },
    {
      title: '编辑模板',
      icon: 'mdi-pencil',
      action: () => {
        const entity = ReminderTemplateEntity.fromClientDTO(template);
        templateDialogRef.value?.openForEdit(entity);
        contextMenu.show = false;
      },
    },
    { divider: true }, // 分隔符
    {
      title: '移动到分组',
      icon: 'mdi-folder-move',
      action: () => {
        openMoveDialog(template);
        contextMenu.show = false;
      },
    },
    {
      title: '复制模板',
      icon: 'mdi-content-copy',
      action: () => {
        duplicateTemplate(template);
        contextMenu.show = false;
      },
    },
    { divider: true }, // 分隔符
    {
      title: template.effectiveEnabled ? '禁用' : '启用',
      icon: template.effectiveEnabled ? 'mdi-pause' : 'mdi-play',
      iconColor: template.effectiveEnabled ? 'orange' : 'success',
      action: () => {
        toggleTemplateEnabled(template);
        contextMenu.show = false;
      },
    },
    {
      title: '测试触发',
      icon: 'mdi-play-circle-outline',
      iconColor: 'info',
      action: () => {
        testTemplate(template);
        contextMenu.show = false;
      },
    },
    { divider: true }, // 分隔符
    {
      title: '删除模板',
      icon: 'mdi-delete',
      danger: true, // 标记为危险操作
      action: () => {
        openDeleteDialog('template', template.uuid, template.title);
        contextMenu.show = false;
      },
    },
  ];
  contextMenu.show = true;
};

/**
 * 处理分组右键菜单
 */
const handleGroupContextMenu = (group: ReminderTemplateGroup, event: MouseEvent) => {
  event.stopPropagation(); // 阻止事件冒泡到桌面
  contextMenu.x = event.clientX;
  contextMenu.y = event.clientY;
  contextMenu.items = [
    {
      title: '查看分组',
      icon: 'mdi-folder-open',
      iconColor: 'primary',
      action: () => {
        showGroupTemplates(group);
        contextMenu.show = false;
      },
    },
    {
      title: '编辑分组',
      icon: 'mdi-pencil',
      action: () => {
        // 正确调用 openForEdit 并传入分组对象
        groupDialogRef.value?.openForEdit(group);
        contextMenu.show = false;
      },
    },
    { divider: true },
    {
      title: '添加模板到分组',
      icon: 'mdi-plus',
      iconColor: 'success',
      action: () => {
        // 创建模板时预设分组
        templateDialogRef.value?.openForCreate();
        // TODO: 可以在打开对话框后自动选中该分组
        contextMenu.show = false;
      },
    },
    {
      title: '复制分组',
      icon: 'mdi-content-copy',
      disabled: true, // 功能待实现
      action: () => {
        duplicateGroup(group);
        contextMenu.show = false;
      },
    },
    { divider: true },
    {
      title: group.enabled ? '禁用分组' : '启用分组',
      icon: group.enabled ? 'mdi-pause' : 'mdi-play',
      iconColor: group.enabled ? 'orange' : 'success',
      action: () => {
        toggleGroupEnabled(group);
        contextMenu.show = false;
      },
    },
    {
      title: `${getGroupTemplateCount(group)} 个模板`,
      icon: 'mdi-bell-outline',
      iconColor: 'info',
      disabled: true, // 仅显示信息
    },
    { divider: true },
    {
      title: '删除分组',
      icon: 'mdi-delete',
      danger: true,
      action: () => {
        openDeleteDialog('group', group.uuid, group.name);
        contextMenu.show = false;
      },
    },
  ];
  contextMenu.show = true;
};

/**
 * 处理桌面右键菜单
 */
const handleDesktopContextMenu = (event: MouseEvent) => {
  contextMenu.x = event.clientX;
  contextMenu.y = event.clientY;
  contextMenu.items = [
    {
      title: '新建模板',
      icon: 'mdi-plus',
      iconColor: 'primary',
      action: () => {
        templateDialogRef.value?.openForCreate();
        contextMenu.show = false;
      },
    },
    {
      title: '新建分组',
      icon: 'mdi-folder-plus',
      iconColor: 'success',
      action: () => {
        // GroupDialog 目前是占位组件
        groupDialogRef.value?.open();
        contextMenu.show = false;
      },
    },
    { divider: true },
    {
      title: '刷新',
      icon: 'mdi-refresh',
      action: () => {
        initialize();
        contextMenu.show = false;
      },
    },
    {
      title: '整理桌面',
      icon: 'mdi-view-grid',
      disabled: true, // 功能暂未实现
      action: () => {
        // TODO: 实现桌面整理功能
        console.log('整理桌面');
        contextMenu.show = false;
      },
    },
  ];
  contextMenu.show = true;
};

// ===== 业务逻辑 =====

/**
 * 切换模板启用状态
 */
const toggleTemplateEnabled = async (template: ReminderTemplate) => {
  try {
    // 调用 API 切换启用状态
    await toggleTemplateStatus(template.uuid, !template.effectiveEnabled);
    // 刷新列表
    await refreshAll();
    message.success(template.effectiveEnabled ? '已禁用提醒' : '已启用提醒');
  } catch (error) {
    console.error('切换模板状态失败:', error);
    message.error('切换状态失败');
  }
};

/**
 * 切换分组启用状态
 */
const toggleGroupEnabled = async (group: ReminderTemplateGroup) => {
  try {
    // 调用 API 切换分组启用状态（该方法内部已包含 snackbar 提示）
    await reminderGroupApplicationService.toggleReminderGroupStatus(group.uuid);
    // 刷新列表
    await refreshAll();
  } catch (error) {
    console.error('切换分组状态失败:', error);
    // 错误提示已在 service 中处理
  }
};

/**
 * 复制模板
 */
const duplicateTemplate = async (template: ReminderTemplate) => {
  try {
    // TODO: 实现模板复制功能
    // 需要根据新的 DTO 结构创建请求
    console.log('复制模板:', template.title);
    message.info('复制功能待实现');
  } catch (error) {
    console.error('复制模板失败:', error);
    message.error('复制失败');
  }
};

/**
 * 测试模板
 */
const testTemplate = async (template: ReminderTemplate) => {
  try {
    // 显示模板信息
    console.log('测试模板:', template.title);
    alert(`测试模板: ${template.title}\n描述: ${template.description || '无'}\n触发器: ${template.triggerText}`);
  } catch (error) {
    console.error('模板测试失败:', error);
  }
};

/**
 * 显示分组内的模板（以桌面形式）
 */
const showGroupTemplates = (group: ReminderTemplateGroup) => {
  // 打开 GroupDesktopCard 显示分组详情和模板
  groupDesktopCardRef.value?.open(group);
};

/**
 * 复制分组
 */
const duplicateGroup = async (group: ReminderTemplateGroup) => {
  try {
    // 创建分组副本
    // TODO: 实现分组复制功能
    console.log('复制分组:', group.name);
    message.info('分组复制功能待实现');
  } catch (error) {
    console.error('复制分组失败:', error);
    message.error('复制失败');
  }
};

/**
 * 获取分组中的模板数量
 */
const getGroupTemplateCount = (group: ReminderTemplateGroup): number => {
  return templates.value.filter((t) => t.groupUuid === group.uuid).length;
};

/**
 * 打开移动对话框
 */
const openMoveDialog = (template: ReminderTemplate) => {
  moveDialog.template = template;
  moveDialog.show = true;
};

/**
 * 打开删除确认对话框
 */
const openDeleteDialog = (type: 'template' | 'group', uuid: string, name: string) => {
  deleteDialog.type = type;
  deleteDialog.uuid = uuid;
  deleteDialog.name = name;
  deleteDialog.show = true;
};

/**
 * 确认删除
 */
const confirmDelete = async () => {
  try {
    if (deleteDialog.type === 'template') {
      await deleteTemplate(deleteDialog.uuid);
    } else {
      await deleteGroup(deleteDialog.uuid);
    }
    deleteDialog.show = false;
  } catch (error) {
    console.error('删除失败:', error);
  }
};

// ===== 对话框事件处理 =====

/**
 * 处理模板编辑事件（从 TemplateDesktopCard 触发）
 */
const handleEditTemplate = (template: ReminderTemplate) => {
  console.log('打开编辑模板对话框:', template);
  const entity = ReminderTemplateEntity.fromClientDTO(template);
  templateDialogRef.value?.openForEdit(entity);
};

// ===== 生命周期 =====

onMounted(async () => {
  try {
    await initialize();
    await loadGroups(); // 加载分组数据
  } catch (error) {
    console.error('初始化失败:', error);
    showError.value = true;
  }
});
</script>

<style scoped>
/* 主容器 - 两栏布局 */
.reminder-desktop-container {
  width: 100vw;
  height: 100vh;
  display: flex;
  overflow: hidden;
  background: #f5f5f5;
}

/* 左侧内容区域 - 桌面网格 */
.reminder-content-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}

/* 右侧提醒实例区域 - 固定宽度 */
.reminder-instance-area {
  width: 400px;
  height: 100vh;
  background: white;
  border-left: 1px solid #e0e0e0;
  overflow-y: auto;
  flex-shrink: 0;
}

.phone-desktop {
  flex: 1;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
  padding: 20px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.desktop-grid {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 16px;
  padding: 20px;
  align-content: start;
  overflow-y: auto;
}

.app-icon,
.folder-icon {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  transition: transform 0.2s ease;
  user-select: none;
}

.app-icon:hover,
.folder-icon:hover {
  transform: scale(1.05);
}

.app-icon.disabled,
.folder-icon.disabled {
  opacity: 0.5;
}

.icon-circle,
.folder-circle {
  width: 60px;
  height: 60px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  position: relative;
}

.folder-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  background: #ff4444;
  color: white;
  border-radius: 10px;
  min-width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
}

.app-name,
.folder-name {
  color: white;
  font-size: 12px;
  text-align: center;
  max-width: 80px;
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bottom-dock {
  height: 80px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  backdrop-filter: blur(15px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  flex-shrink: 0;
}

.dock-btn {
  background: rgba(255, 255, 255, 0.2) !important;
  color: white !important;
  backdrop-filter: blur(10px);
}

.dock-btn:hover {
  background: rgba(255, 255, 255, 0.3) !important;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .reminder-instance-area {
    width: 350px;
  }
}

@media (max-width: 768px) {
  .reminder-desktop-container {
    flex-direction: column;
  }

  .reminder-content-area {
    flex: 1;
  }

  .reminder-instance-area {
    width: 100%;
    height: 300px;
    border-left: none;
    border-top: 1px solid #e0e0e0;
  }

  .desktop-grid {
    grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
    gap: 12px;
    padding: 15px;
  }

  .phone-desktop {
    padding: 15px;
  }
}

@media (max-width: 480px) {
  .desktop-grid {
    grid-template-columns: repeat(auto-fill, minmax(70px, 1fr));
    gap: 10px;
  }
}

/* 上下文菜单样式 */
.context-menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 999;
  background: transparent;
}

.context-menu {
  position: fixed;
  z-index: 1000;
  background: rgb(var(--v-theme-surface));
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05);
  min-width: 200px;
  max-width: 280px;
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

.context-menu-item:hover:not(.context-menu-item-disabled) {
  background-color: rgba(var(--v-theme-primary), 0.08);
}

.context-menu-item:active:not(.context-menu-item-disabled) {
  background-color: rgba(var(--v-theme-primary), 0.12);
}

.context-menu-item-danger {
  color: rgb(var(--v-theme-error));
}

.context-menu-item-danger:hover:not(.context-menu-item-disabled) {
  background-color: rgba(var(--v-theme-error), 0.08);
}

.context-menu-item-disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.context-menu-divider {
  height: 1px;
  margin: 4px 0;
  background: rgba(var(--v-theme-on-surface), 0.12);
}

.context-menu-item:first-child {
  border-radius: 8px 8px 0 0;
}

.context-menu-item:last-child {
  border-radius: 0 0 8px 8px;
}
</style>

