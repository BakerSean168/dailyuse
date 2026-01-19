/**
 * Reminder Group Composable
 * 提醒分组相关的业务逻辑
 */

import { ref, computed } from 'vue';
import type {
  ReminderGroupClientDTO,
  CreateReminderGroupRequest,
  UpdateReminderGroupRequest,
} from '@dailyuse/contracts/reminder';
import {
  CreateReminderGroup,
  ListReminderGroups,
  GetReminderGroup,
  UpdateReminderGroup,
  DeleteReminderGroup,
  ToggleReminderGroupStatus,
} from '@dailyuse/application-client/reminder';
import { getReminderStore } from '../stores/reminderStore';
import { useMessage } from '@dailyuse/ui-vuetify';

export function useReminderGroup() {
  const reminderStore = getReminderStore();
  const message = useMessage();

  // ===== 响应式状态 =====
  const isLoading = computed(() => reminderStore.isLoading);
  const error = computed(() => reminderStore.error);
  const groups = computed(() => reminderStore.reminderGroups);
  const currentGroup = computed(() => reminderStore.selectedGroup);

  // ===== 本地状态 =====
  const showCreateGroupDialog = ref(false);
  const showEditGroupDialog = ref(false);
  const editingGroup = ref<ReminderGroupClientDTO | null>(null);

  // ===== 数据获取方法 =====

  /**
   * 获取分组列表
   */
  const fetchGroups = async (forceRefresh = false) => {
    try {
      if (!forceRefresh && reminderStore.reminderGroups.length > 0) {
        return reminderStore.reminderGroups;
      }

      const result = await new ListReminderGroups().execute();
      return result.items;
    } catch (error) {
      message.error('获取分组列表失败');
      throw error;
    }
  };

  /**
   * 根据 UUID 获取分组
   */
  const fetchGroupByUuid = async (uuid: string, forceRefresh = false) => {
    try {
      if (!forceRefresh) {
        const cached = reminderStore.getReminderGroupByUuid(uuid);
        if (cached) return cached;
      }

      const group = await new GetReminderGroup().execute(uuid);
      return group;
    } catch (error) {
      message.error('获取分组详情失败');
      throw error;
    }
  };

  // ===== CRUD 操作 =====

  /**
   * 创建新分组
   */
  const createGroup = async (data: CreateReminderGroupRequest) => {
    try {
      const response = await new CreateReminderGroup().execute(data);
      showCreateGroupDialog.value = false;
      message.success('分组创建成功');
      return response;
    } catch (error) {
      message.error('创建分组失败');
      throw error;
    }
  };

  /**
   * 更新分组
   */
  const updateGroup = async (uuid: string, data: UpdateReminderGroupRequest) => {
    try {
      const response = await new UpdateReminderGroup().execute(uuid, data);
      showEditGroupDialog.value = false;
      editingGroup.value = null;
      message.success('分组更新成功');
      return response;
    } catch (error) {
      message.error('更新分组失败');
      throw error;
    }
  };

  /**
   * 删除分组
   */
  const deleteGroup = async (uuid: string) => {
    try {
      await new DeleteReminderGroup().execute(uuid);

      if (currentGroup.value?.uuid === uuid) {
        reminderStore.setSelectedGroup(null);
      }

      message.success('分组删除成功');
    } catch (error) {
      message.error('删除分组失败');
      throw error;
    }
  };

  /**
   * 切换分组启用状态
   */
  const toggleGroupStatus = async (uuid: string) => {
    try {
      const response = await new ToggleReminderGroupStatus().execute(uuid);
      message.success(`分组已${response.enabled ? '启用' : '禁用'}`);
      return response;
    } catch (error) {
      message.error('切换分组状态失败');
      throw error;
    }
  };

  return {
    // 状态
    isLoading,
    error,
    groups,
    currentGroup,
    showCreateGroupDialog,
    showEditGroupDialog,
    editingGroup,

    // 方法
    fetchGroups,
    fetchGroupByUuid,
    createGroup,
    updateGroup,
    deleteGroup,
    toggleGroupStatus,
  };
}
