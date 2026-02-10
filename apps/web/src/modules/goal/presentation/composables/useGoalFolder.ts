/**
 * Goal Folder Composable
 * 目标文件夹相关的业务逻辑
 *
 * 🔄 重构说明（方案 A - 简化版）：
 * - Composable 负责协调 ApplicationService 和 Store
 * - Service 直接返回实体对象或抛出错误
 * - Composable 使用 try/catch 处理错误
 * - 数据流：API → Service(转换) → Composable(存储+通知) → Store → Component
 */

import { ref, computed, readonly } from 'vue';
import type { CreateGoalFolderRequest, UpdateGoalFolderRequest } from '@dailyuse/contracts/goal';
import type { GoalFolder } from '@dailyuse/goal/domain-client';
import {
  CreateGoalFolder,
  ListGoalFolders,
  UpdateGoalFolder,
  DeleteGoalFolder,
} from '@dailyuse/goal/application-client';
import { getGoalStore } from '../stores/goalStore';
import { getGlobalMessage } from '@dailyuse/ui-vuetify';

export function useGoalFolder() {
  const goalStore = getGoalStore();
  const { success: showSuccess, error: showError } = getGlobalMessage();

  // ===== 本地状态 =====
  const isOperating = ref(false);
  const operationError = ref<string | null>(null);
  const showCreateFolderDialog = ref(false);
  const showEditFolderDialog = ref(false);
  const editingFolder = ref<GoalFolder | null>(null);

  // ===== 计算属性 - 状态 =====
  const isLoading = computed(() => goalStore.isLoading || isOperating.value);
  const error = computed(() => goalStore.error || operationError.value);
  const folders = computed(() => goalStore.getAllGoalFolders);
  const currentFolder = computed(() => goalStore.getSelectedGoalFolder);

  // ===== 数据获取方法 =====

  /**
   * 获取文件夹列表
   */
  const fetchFolders = async (forceRefresh = false) => {
    try {
      if (!forceRefresh && goalStore.getAllGoalFolders.length > 0) {
        return goalStore.getAllGoalFolders;
      }

      isOperating.value = true;
      operationError.value = null;
      goalStore.setLoading(true);

      // ✅ Service 直接返回实体对象数组
      const folders = await new ListGoalFolders().execute();

      // ✅ Composable 负责存储到 Store
      goalStore.setGoalFolders(folders);

      return folders;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取文件夹列表失败';
      operationError.value = errorMessage;
      goalStore.setError(errorMessage);
      showError(errorMessage);
      throw err;
    } finally {
      isOperating.value = false;
      goalStore.setLoading(false);
    }
  };

  /**
   * 根据 UUID 获取文件夹
   */
  const fetchFolderByUuid = async (uuid: string, forceRefresh = false) => {
    try {
      if (!forceRefresh) {
        const cached = goalStore.getGoalFolderByUuid(uuid);
        if (cached) return cached;
      }

      // 没有单独获取文件夹的 API，从列表中获取
      await fetchFolders(true);
      return goalStore.getGoalFolderByUuid(uuid);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取文件夹详情失败';
      operationError.value = errorMessage;
      showError(errorMessage);
      throw err;
    }
  };

  // ===== CRUD 操作 =====

  /**
   * 创建新文件夹
   */
  const createFolder = async (data: CreateGoalFolderRequest) => {
    try {
      isOperating.value = true;
      operationError.value = null;
      goalStore.setLoading(true);

      // ✅ Service 直接返回实体对象
      const folder = await new CreateGoalFolder().execute(data);

      // ✅ Composable 负责存储到 Store
      goalStore.addOrUpdateGoalFolder(folder);

      showCreateFolderDialog.value = false;
      showSuccess('文件夹创建成功');

      return folder;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '创建文件夹失败';
      operationError.value = errorMessage;
      goalStore.setError(errorMessage);
      showError(errorMessage);
      throw err;
    } finally {
      isOperating.value = false;
      goalStore.setLoading(false);
    }
  };

  /**
   * 更新文件夹
   */
  const updateFolder = async (uuid: string, data: UpdateGoalFolderRequest) => {
    try {
      isOperating.value = true;
      operationError.value = null;
      goalStore.setLoading(true);

      // ✅ Service 直接返回实体对象
      const folder = await new UpdateGoalFolder().execute(uuid, data);

      // ✅ Composable 负责更新 Store
      goalStore.addOrUpdateGoalFolder(folder);

      showEditFolderDialog.value = false;
      editingFolder.value = null;
      showSuccess('文件夹更新成功');

      return folder;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '更新文件夹失败';
      operationError.value = errorMessage;
      goalStore.setError(errorMessage);
      showError(errorMessage);
      throw err;
    } finally {
      isOperating.value = false;
      goalStore.setLoading(false);
    }
  };

  /**
   * 删除文件夹
   */
  const deleteFolder = async (uuid: string) => {
    try {
      isOperating.value = true;
      operationError.value = null;
      goalStore.setLoading(true);

      // ✅ Service 返回 void 或抛出错误
      await new DeleteGoalFolder().execute(uuid);

      // ✅ Composable 负责从 Store 移除
      goalStore.removeGoalFolder(uuid);

      if (currentFolder.value?.uuid === uuid) {
        goalStore.setSelectedGoalFolder(null);
      }

      showSuccess('文件夹删除成功');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '删除文件夹失败';
      operationError.value = errorMessage;
      goalStore.setError(errorMessage);
      showError(errorMessage);
      throw err;
    } finally {
      isOperating.value = false;
      goalStore.setLoading(false);
    }
  };

  // ===== 工具方法 =====

  const clearError = () => {
    operationError.value = null;
    goalStore.setError(null);
  };

  return {
    // 状态
    isLoading: readonly(isLoading),
    error: readonly(error),
    folders: readonly(folders),
    currentFolder: readonly(currentFolder),
    showCreateFolderDialog,
    showEditFolderDialog,
    editingFolder,

    // 方法
    fetchFolders,
    fetchFolderByUuid,
    createFolder,
    updateFolder,
    deleteFolder,

    // 工具方法
    clearError,
  };
}
