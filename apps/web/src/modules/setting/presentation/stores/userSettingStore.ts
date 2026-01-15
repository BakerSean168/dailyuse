/**
 * User Setting Store
 * 用户设置状态管理
 * 
 * 设计理念：
 * 1. 使用嵌套结构匹配后端 DTO
 * 2. 提供类型安全的 getter 和 setter
 * 3. 支持局部更新（只更新变化的字段）
 * 4. 自动防抖，减少 API 调用
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { UserSettingClientDTO, UpdateUserSettingRequest } from '@dailyuse/contracts/setting';
import {
  getCurrentUserSettings,
  updateUserSettings,
  resetUserSettings,
  getDefaultSettings,
  exportUserSettings,
  importUserSettings,
  type SettingUpdateResponse,
} from '../../infrastructure/api/userSettingApi';
import { getThemeService } from '../../application/services/ThemeService';

// ==================== 类型定义 ====================

// 类型别名

/** 外观设置 */
type AppearanceSettings = NonNullable<UpdateUserSettingRequest['appearance']>;
/** 区域设置 */
type LocaleSettings = NonNullable<UpdateUserSettingRequest['locale']>;
/** 工作流设置 */
type WorkflowSettings = NonNullable<UpdateUserSettingRequest['workflow']>;
/** 快捷键设置 */
type ShortcutSettings = NonNullable<UpdateUserSettingRequest['shortcuts']>;
/** 隐私设置 */
type PrivacySettings = NonNullable<UpdateUserSettingRequest['privacy']>;

export const useUserSettingStore = defineStore(
  'userSetting',
  () => {
    // ==================== State ====================
    const settings = ref<UserSettingClientDTO | null>(null);
    const defaults = ref<UserSettingClientDTO | null>(null);
    const loading = ref(false);
    const error = ref<string | null>(null);

    // ==================== Computed Getters ====================
    const isLoaded = computed(() => settings.value !== null);
    
    // 外观设置
    const appearance = computed(() => settings.value?.appearance ?? {
      theme: 'AUTO',
      accentColor: '#1976D2',
      fontSize: 'MEDIUM',
      fontFamily: 'Inter',
      compactMode: false,
    });

    // 区域设置
    const locale = computed(() => settings.value?.locale ?? {
      language: 'zh-CN',
      timezone: 'Asia/Shanghai',
      dateFormat: 'YYYY-MM-DD',
      timeFormat: '24H',
      weekStartsOn: 1,
      currency: 'CNY',
    });

    // 工作流设置
    const workflow = computed(() => settings.value?.workflow ?? {
      defaultTaskView: 'LIST',
      defaultGoalView: 'LIST',
      defaultScheduleView: 'WEEK',
      autoSave: true,
      autoSaveInterval: 30000,
      confirmBeforeDelete: true,
    });

    // 快捷键设置
    const shortcuts = computed(() => settings.value?.shortcuts ?? {
      enabled: true,
      custom: {},
    });

    // 隐私设置
    const privacy = computed(() => settings.value?.privacy ?? {
      profileVisibility: 'FRIENDS_ONLY',
      showOnlineStatus: true,
      allowSearchByEmail: true,
      allowSearchByPhone: false,
      shareUsageData: true,
    });

    // 实验性功能
    const experimental = computed(() => settings.value?.experimental ?? {
      enabled: false,
      features: [],
    });

    // ==================== Actions ====================

    /**
     * 加载用户设置
     */
    async function loadSettings(): Promise<void> {
      loading.value = true;
      error.value = null;

      try {
        settings.value = await getCurrentUserSettings();
        
        // 🎨 关键：加载设置后，立即应用主题配置
        if (settings.value?.appearance) {
          const themeService = getThemeService();
          themeService.applySettings({
            mode: settings.value.appearance.theme as 'LIGHT' | 'DARK' | 'AUTO',
            accentColor: settings.value.appearance.accentColor,
            fontSize: settings.value.appearance.fontSize as 'SMALL' | 'MEDIUM' | 'LARGE',
            compactMode: settings.value.appearance.compactMode,
          });
          console.log('✅ [Store] 已应用用户主题设置');
        }
      } catch (err: any) {
        error.value = err.message || '加载设置失败';
        console.error('Failed to load user settings:', err);
        throw err;
      } finally {
        loading.value = false;
      }
    }

    /**
     * 加载默认设置
     */
    async function loadDefaults(): Promise<void> {
      try {
        defaults.value = await getDefaultSettings();
      } catch (err: any) {
        console.error('Failed to load default settings:', err);
      }
    }

    /**
     * 更新设置（通用方法）
     * ⚠️ 不推荐直接使用，请使用具体的 updateAppearance、updateLocale 等方法
     */
    async function updateSettings(
      updates: UpdateUserSettingRequest,
    ): Promise<void> {
      loading.value = true;
      error.value = null;

      try {
        const response = await updateUserSettings(updates);
        
        if (response.ok && settings.value) {
          // 【轻量级更新】只更新 updatedAt，不替换整个对象
          settings.value.updatedAt = response.updatedAt;
          console.log('✅ 设置已保存（轻量级响应）');
        } else {
          throw new Error(response.error || '保存设置失败');
        }
      } catch (err: any) {
        error.value = err.message || '保存设置失败';
        console.error('❌ 保存设置失败:', error.value);
        throw err;
      } finally {
        loading.value = false;
      }
    }

    /**
     * 批量更新设置（防抖）
     */
    let updateTimer: ReturnType<typeof setTimeout> | null = null;
    async function updateSettingsDebounced(
      updates: UpdateUserSettingRequest,
      delay = 500,
    ): Promise<void> {
      if (updateTimer) {
        clearTimeout(updateTimer);
      }

      // 延迟保存到服务器（不做本地乐观更新，避免类型问题）
      updateTimer = setTimeout(async () => {
        try {
          const response = await updateUserSettings(updates);
          if (response.ok && settings.value) {
            settings.value.updatedAt = response.updatedAt;
          }
        } catch (err: any) {
          console.error('Failed to update settings (debounced):', err);
          // 失败时重新加载
          await loadSettings();
        }
      }, delay);
    }

    /**
     * 重置为默认设置
     */
    async function resetToDefaults(): Promise<void> {
      if (!confirm('确定要恢复默认设置吗？')) return;
      
      loading.value = true;
      error.value = null;

      try {
        settings.value = await resetUserSettings();
        console.log('已恢复默认设置');
      } catch (err: any) {
        error.value = err.message || '重置设置失败';
        console.error('重置设置失败:', error.value);
        throw err;
      } finally {
        loading.value = false;
      }
    }

    // ==================== 便捷更新方法 ====================

    /**
     * 更新外观设置
     * 
     * ✨ 乐观更新策略：
     * 1. 立即更新本地状态（用户看到即时响应）
     * 2. 异步调用后端 API
     * 3. 失败时回滚到之前的状态
     * 
     * 📝 只发送变化的字段，例如：
     * - updateAppearance({ theme: 'DARK' })  // 只发送 theme
     * - updateAppearance({ accentColor: '#FF5722' })  // 只发送 accentColor
     */
    async function updateAppearance(updates: Partial<AppearanceSettings>): Promise<void> {
      if (!settings.value) return;

      // 【乐观更新】先更新本地状态
      const previousAppearance = { ...settings.value.appearance };
      settings.value.appearance = {
        ...settings.value.appearance,
        ...updates,
      };

      console.log('🎨 [Store] 乐观更新外观设置:', updates);

      // 【直接调用 ThemeService】立即应用主题变化
      const themeService = getThemeService();
      
      if (updates.theme) {
        themeService.setMode(updates.theme);
      }
      if (updates.accentColor) {
        themeService.setAccentColor(updates.accentColor);
      }
      if (updates.fontSize) {
        themeService.setFontSize(updates.fontSize);
      }
      if (updates.compactMode !== undefined) {
        themeService.setCompactMode(updates.compactMode);
      }

      try {
        // 再调用后端 API（只发送变化的字段）
        const response = await updateUserSettings({
          uuid: settings.value.uuid,
          appearance: updates,  // 👈 只发送变化的字段
        });

        // 【轻量级响应】只更新 updatedAt，不替换整个对象
        if (response.ok && settings.value) {
          settings.value.updatedAt = response.updatedAt;
          console.log('✅ [Store] 外观设置已保存到服务器');
        } else {
          throw new Error(response.error || '保存失败');
        }
      } catch (err: any) {
        // 失败时回滚到之前的状态
        if (settings.value) {
          settings.value.appearance = previousAppearance;
          
          // 回滚主题变化
          if (updates.theme) {
            themeService.setMode(previousAppearance.theme as 'LIGHT' | 'DARK' | 'AUTO');
          }
          if (updates.accentColor) {
            themeService.setAccentColor(previousAppearance.accentColor);
          }
          if (updates.fontSize) {
            themeService.setFontSize(previousAppearance.fontSize as 'SMALL' | 'MEDIUM' | 'LARGE');
          }
          if (updates.compactMode !== undefined) {
            themeService.setCompactMode(previousAppearance.compactMode);
          }
        }
        console.error('❌ [Store] 更新外观设置失败，已回滚:', err);
        throw err;
      }
    }

    /**
     * 更新区域设置（乐观更新）
     */
    async function updateLocale(updates: Partial<LocaleSettings>): Promise<void> {
      if (!settings.value) return;

      const previousLocale = settings.value.locale;
      settings.value = {
        ...settings.value,
        locale: {
          ...settings.value.locale,
          ...updates,
        },
      };

      console.log('🌍 [Store] 乐观更新区域设置:', updates);

      try {
        const response = await updateUserSettings({
          uuid: settings.value.uuid,
          locale: updates,  // 👈 只发送变化的字段
        });

        if (response.ok && settings.value) {
          settings.value.updatedAt = response.updatedAt;
          console.log('✅ [Store] 区域设置已保存');
        } else {
          throw new Error(response.error || '保存失败');
        }
      } catch (err: any) {
        if (settings.value && previousLocale) {
          settings.value = {
            ...settings.value,
            locale: previousLocale,
          };
        }
        console.error('❌ [Store] 更新区域设置失败，已回滚:', err);
        throw err;
      }
    }

    /**
     * 更新工作流设置（乐观更新）
     */
    async function updateWorkflow(updates: Partial<WorkflowSettings>): Promise<void> {
      if (!settings.value) return;

      const previousWorkflow = settings.value.workflow;
      settings.value = {
        ...settings.value,
        workflow: {
          ...settings.value.workflow,
          ...updates,
        },
      };

      console.log('⚙️ [Store] 乐观更新工作流设置:', updates);

      try {
        const response = await updateUserSettings({
          uuid: settings.value.uuid,
          workflow: updates,  // 👈 只发送变化的字段
        });

        if (response.ok && settings.value) {
          settings.value.updatedAt = response.updatedAt;
          console.log('✅ [Store] 工作流设置已保存');
        } else {
          throw new Error(response.error || '保存失败');
        }
      } catch (err: any) {
        if (settings.value && previousWorkflow) {
          settings.value = {
            ...settings.value,
            workflow: previousWorkflow,
          };
        }
        console.error('❌ [Store] 更新工作流设置失败，已回滚:', err);
        throw err;
      }
    }

    /**
     * 更新快捷键设置（乐观更新）
     */
    async function updateShortcuts(updates: Partial<ShortcutSettings>): Promise<void> {
      if (!settings.value) return;

      const previousShortcuts = settings.value.shortcuts;
      settings.value = {
        ...settings.value,
        shortcuts: {
          ...settings.value.shortcuts,
          ...updates,
        },
      };

      console.log('⌨️ [Store] 乐观更新快捷键设置:', updates);

      try {
        const response = await updateUserSettings({
          uuid: settings.value.uuid,
          shortcuts: updates,  // 👈 只发送变化的字段
        });

        if (response.ok && settings.value) {
          settings.value.updatedAt = response.updatedAt;
          console.log('✅ [Store] 快捷键设置已保存');
        } else {
          throw new Error(response.error || '保存失败');
        }
      } catch (err: any) {
        if (settings.value && previousShortcuts) {
          settings.value = {
            ...settings.value,
            shortcuts: previousShortcuts,
          };
        }
        console.error('❌ [Store] 更新快捷键设置失败，已回滚:', err);
        throw err;
      }
    }

    /**
     * 更新隐私设置（乐观更新）
     */
    async function updatePrivacy(updates: Partial<PrivacySettings>): Promise<void> {
      if (!settings.value) return;

      const previousPrivacy = settings.value.privacy;
      settings.value = {
        ...settings.value,
        privacy: {
          ...settings.value.privacy,
          ...updates,
        },
      };

      console.log('🔒 [Store] 乐观更新隐私设置:', updates);

      try {
        const response = await updateUserSettings({
          uuid: settings.value.uuid,
          privacy: updates,  // 👈 只发送变化的字段
        });

        if (response.ok && settings.value) {
          settings.value.updatedAt = response.updatedAt;
          console.log('✅ [Store] 隐私设置已保存');
        } else {
          throw new Error(response.error || '保存失败');
        }
      } catch (err: any) {
        if (settings.value && previousPrivacy) {
          settings.value = {
            ...settings.value,
            privacy: previousPrivacy,
          };
        }
        console.error('❌ [Store] 更新隐私设置失败，已回滚:', err);
        throw err;
      }
    }

    // ==================== 防抖版本 ====================

    /**
     * 更新外观设置（防抖）
     */
    async function updateAppearanceDebounced(
      updates: Partial<AppearanceSettings>,
      delay = 500,
    ): Promise<void> {
      if (!settings.value) return;
      await updateSettingsDebounced({
        uuid: settings.value.uuid,
        appearance: updates,
      }, delay);
    }

    /**
     * 更新区域设置（防抖）
     */
    async function updateLocaleDebounced(
      updates: Partial<LocaleSettings>,
      delay = 500,
    ): Promise<void> {
      if (!settings.value) return;
      await updateSettingsDebounced({
        uuid: settings.value.uuid,
        locale: updates,
      }, delay);
    }

    /**
     * 更新工作流设置（防抖）
     */
    async function updateWorkflowDebounced(
      updates: Partial<WorkflowSettings>,
      delay = 500,
    ): Promise<void> {
      if (!settings.value) return;
      await updateSettingsDebounced({
        uuid: settings.value.uuid,
        workflow: updates,
      }, delay);
    }

    // ==================== 导入/导出功能 ====================

    /**
     * 导出设置为 JSON 文件
     */
    async function exportSettings(): Promise<void> {
      loading.value = true;
      error.value = null;

      try {
        const exportData = await exportUserSettings();
        
        // 创建 Blob 并下载
        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
          type: 'application/json',
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `dailyuse-settings-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        console.log('设置已导出');
      } catch (err: any) {
        error.value = err.message || '导出设置失败';
        console.error('Failed to export settings:', err);
        throw err;
      } finally {
        loading.value = false;
      }
    }

    /**
     * 从文件导入设置
     * @param file JSON 文件
     * @param merge 是否合并现有设置
     */
    async function importSettingsFromFile(
      file: File,
      merge = false,
    ): Promise<void> {
      loading.value = true;
      error.value = null;

      try {
        // 读取文件内容
        const text = await file.text();
        const data = JSON.parse(text);

        // 调用 API 导入
        settings.value = await importUserSettings(data, {
          merge,
          validate: true,
        });

        console.log(`设置已${merge ? '合并' : '导入'}`);
      } catch (err: any) {
        error.value = err.message || '导入设置失败';
        console.error('Failed to import settings:', err);
        throw err;
      } finally {
        loading.value = false;
      }
    }

    /**
     * 直接导入设置数据
     * @param data 导出的设置数据对象
     * @param merge 是否合并现有设置
     */
    async function importSettingsFromData(
      data: Record<string, any>,
      merge = false,
    ): Promise<void> {
      loading.value = true;
      error.value = null;

      try {
        settings.value = await importUserSettings(data, {
          merge,
          validate: true,
        });

        console.log(`设置已${merge ? '合并' : '导入'}`);
      } catch (err: any) {
        error.value = err.message || '导入设置失败';
        console.error('Failed to import settings:', err);
        throw err;
      } finally {
        loading.value = false;
      }
    }

    return {
      // ========== State ==========
      settings,
      defaults,
      loading,
      error,

      // ========== Computed Getters ==========
      isLoaded,
      appearance,
      locale,
      workflow,
      shortcuts,
      privacy,
      experimental,

      // ========== Core Actions ==========
      loadSettings,
      loadDefaults,
      updateSettings,
      updateSettingsDebounced,
      resetToDefaults,

      // ========== Convenient Update Methods ==========
      updateAppearance,
      updateLocale,
      updateWorkflow,
      updateShortcuts,
      updatePrivacy,

      // ========== Debounced Update Methods ==========
      updateAppearanceDebounced,
      updateLocaleDebounced,
      updateWorkflowDebounced,

      // ========== Import/Export ==========
      exportSettings,
      importSettingsFromFile,
      importSettingsFromData,
    };
  },
  {
    // Pinia 持久化配置
    persist: {
      key: 'dailyuse-user-settings',
      storage: localStorage,
    } as any, // 类型断言避免 Pinia persist plugin 的类型问题
  },
);

