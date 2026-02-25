/**
 * useAutoSave Composable
 * 
 * Presentation Layer - Composable
 * 自动保存、冲突检测、保存状态管理
 */

import { ref, watch, onUnmounted } from 'vue';

export interface AutoSaveConfig {
  /** 自动保存间隔（毫秒） */
  interval?: number;
  /** 保存函数 */
  saveFn: (content: string) => Promise<{ success: boolean; conflict?: boolean }>;
  /** 内容引用 */
  content: () => string;
  /** 是否有未保存更改 */
  hasChanges: () => boolean;
}

export function useAutoSave(config: AutoSaveConfig) {
  // ==================== State ====================
  const isSaving = ref(false);
  const lastSaved = ref<Date | null>(null);
  const saveStatus = ref<'idle' | 'saving' | 'saved' | 'error' | 'conflict'>('idle');
  const autoSaveEnabled = ref(false);
  const saveError = ref<string | null>(null);

  let autoSaveTimer: number | null = null;
  const defaultInterval = config.interval || 30000; // 默认 30 秒

  // ==================== Methods ====================
  async function save(): Promise<boolean> {
    if (isSaving.value) return false;

    try {
      isSaving.value = true;
      saveStatus.value = 'saving';
      saveError.value = null;

      const result = await config.saveFn(config.content());

      if (result.conflict) {
        saveStatus.value = 'conflict';
        saveError.value = '检测到编辑冲突，请刷新页面查看最新版本';
        return false;
      }

      if (result.success) {
        lastSaved.value = new Date();
        saveStatus.value = 'saved';

        // 2 秒后恢复 idle 状态
        setTimeout(() => {
          if (saveStatus.value === 'saved') {
            saveStatus.value = 'idle';
          }
        }, 2000);

        return true;
      }

      saveStatus.value = 'error';
      saveError.value = '保存失败，请重试';
      return false;
    } catch (error) {
      console.error('Save error:', error);
      saveStatus.value = 'error';
      saveError.value = error instanceof Error ? error.message : '保存失败';
      return false;
    } finally {
      isSaving.value = false;
    }
  }

  function startAutoSave() {
    if (autoSaveTimer) return;

    autoSaveEnabled.value = true;

    autoSaveTimer = window.setInterval(() => {
      if (config.hasChanges() && !isSaving.value) {
        save();
      }
    }, defaultInterval);
  }

  function stopAutoSave() {
    if (autoSaveTimer) {
      clearInterval(autoSaveTimer);
      autoSaveTimer = null;
    }
    autoSaveEnabled.value = false;
  }

  function resetSaveStatus() {
    saveStatus.value = 'idle';
    saveError.value = null;
  }

  // ==================== Lifecycle ====================
  onUnmounted(() => {
    stopAutoSave();
  });

  // ==================== Return ====================
  return {
    // State
    isSaving,
    lastSaved,
    saveStatus,
    autoSaveEnabled,
    saveError,

    // Methods
    save,
    startAutoSave,
    stopAutoSave,
    resetSaveStatus,
  };
}
