/**
 * UserSetting Composable
 * 用户设置可组合函数 - 封装业务逻辑和状态管理
 */

import { ref, computed, onMounted } from 'vue';
import { settingApplicationService as UserSettingWebApplicationService } from '@dailyuse/setting/application-client';
import { useUserSettingStore } from '../stores/userSettingStore';
import { useMessage } from '@dailyuse/ui-vuetify';
import type {
  UserSettingClientDTO,
  UpdateUserSettingRequest,
  UpdateAppearanceRequest,
  UpdateLocaleRequest,
  UpdateWorkflowRequest,
  UpdatePrivacyRequest,
  UpdateExperimentalRequest,
  CreateUserSettingRequest,
} from '@dailyuse/contracts/setting';

/**
 * UserSetting 模块组合式函数
 * 提供统一的用户设置管理接口
 */
export function useUserSetting() {
  const userSettingStore = useUserSettingStore();
  const message = useMessage();

  // ===== 本地状态 =====
  const loading = ref(false);
  const error = ref<string>('');

  // ===== 计算属性 =====

  /**
   * 当前用户设置
   */
  const userSetting = computed(() => userSettingStore.settings);

  /**
   * 当前主题
   */
  const currentTheme = computed(() => userSettingStore.appearance.theme);

  /**
   * 当前语言
   */
  const currentLanguage = computed(() => userSettingStore.locale.language);

  /**
   * 当前主题文本
   */
  const themeText = computed(() => {
    const theme = currentTheme.value;
    return theme === 'AUTO'
      ? '自动'
      : theme === 'LIGHT'
        ? '亮色'
        : theme === 'DARK'
          ? '暗色'
          : '未设置';
  });

  /**
   * 当前语言文本
   */
  const languageText = computed(() => {
    const lang = currentLanguage.value;
    return lang === 'zh-CN' ? '简体中文' : lang === 'en-US' ? 'English' : '未设置';
  });

  /**
   * 自动保存是否启用
   */
  const autoSaveEnabled = computed(() => userSettingStore.workflow.autoSave);

  /**
   * 自动保存间隔
   */
  const autoSaveInterval = computed(() => userSettingStore.workflow.autoSaveInterval);

  /**
   * 快捷键是否启用
   */
  const shortcutsEnabled = computed(() => userSettingStore.shortcuts.enabled);

  /**
   * 自定义快捷键
   */
  const customShortcuts = computed(() => userSettingStore.shortcuts.custom);

  /**
   * 是否正在加载
   */
  const isLoading = computed(() => loading.value || userSettingStore.loading);

  // ===== 业务方法 =====

  /**
   * 加载用户设置（通过 UUID）
   * @deprecated 后端不再支持通过 UUID 获取，请使用 getOrCreateUserSetting
   */
  const loadUserSetting = async (uuid: string): Promise<void> => {
    loading.value = true;
    error.value = '';

    try {
      const service = await UserSettingWebApplicationService.getInstance();
      await service.getCurrentUserSettings();
      message.success('用户设置加载成功');
    } catch (err: any) {
      const errorMsg = err.message || '加载用户设置失败';
      error.value = errorMsg;
      message.error(errorMsg);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 根据账户加载用户设置
   * @deprecated 后端不再支持通过 accountUuid 获取，请使用 getOrCreateUserSetting
   */
  const loadUserSettingByAccount = async (accountUuid: string): Promise<void> => {
    loading.value = true;
    error.value = '';

    try {
      const service = await UserSettingWebApplicationService.getInstance();
      await service.getOrCreateUserSetting(accountUuid);
      message.success('用户设置加载成功');
    } catch (err: any) {
      error.value = err.message || '加载用户设置失败';
      message.error(error.value);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 获取或创建用户设置
   */
  const getOrCreateUserSetting = async (accountUuid: string): Promise<void> => {
    loading.value = true;
    error.value = '';

    try {
      const service = await UserSettingWebApplicationService.getInstance();
      await service.getOrCreateUserSetting(accountUuid);
    } catch (err: any) {
      error.value = err.message || '获取或创建用户设置失败';
      message.error(error.value);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 创建用户设置
   * @deprecated 后端不支持直接创建，请使用 getOrCreateUserSetting
   */
  const createUserSetting = async (request: CreateUserSettingRequest): Promise<void> => {
    loading.value = true;
    error.value = '';

    try {
      const service = await UserSettingWebApplicationService.getInstance();
      await service.getOrCreateUserSetting(request.accountUuid);
      message.success('用户设置创建成功');
    } catch (err: any) {
      error.value = err.message || '创建用户设置失败';
      message.error(error.value);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 更新用户设置（完整更新）
   */
  const updateUserSetting = async (
    uuid: string,
    request: UpdateUserSettingRequest,
  ): Promise<void> => {
    loading.value = true;
    error.value = '';

    try {
      const service = await UserSettingWebApplicationService.getInstance();
      await service.updateUserSettings(request);
      message.success('用户设置更新成功');
    } catch (err: any) {
      error.value = err.message || '更新用户设置失败';
      message.error(error.value);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // ===== 快捷更新方法 =====

  /**
   * 更新外观设置
   */
  const updateAppearance = async (appearance: UpdateAppearanceRequest): Promise<void> => {
    if (!userSetting.value) {
      message.error('未找到用户设置');
      return;
    }

    loading.value = true;
    error.value = '';

    try {
      const service = await UserSettingWebApplicationService.getInstance();
      await service.updateAppearance(appearance);
      message.success('外观设置更新成功');
    } catch (err: any) {
      error.value = err.message || '更新外观设置失败';
      message.error(error.value);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 更新本地化设置
   */
  const updateLocale = async (locale: UpdateLocaleRequest): Promise<void> => {
    if (!userSetting.value) {
      message.error('未找到用户设置');
      return;
    }

    loading.value = true;
    error.value = '';

    try {
      const service = await UserSettingWebApplicationService.getInstance();
      await service.updateLocale(locale);
      message.success('本地化设置更新成功');
    } catch (err: any) {
      error.value = err.message || '更新本地化设置失败';
      message.error(error.value);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 更新工作流设置
   */
  const updateWorkflow = async (workflow: UpdateWorkflowRequest): Promise<void> => {
    if (!userSetting.value) {
      message.error('未找到用户设置');
      return;
    }

    loading.value = true;
    error.value = '';

    try {
      const service = await UserSettingWebApplicationService.getInstance();
      await service.updateWorkflow(workflow);
      message.success('工作流设置更新成功');
    } catch (err: any) {
      error.value = err.message || '更新工作流设置失败';
      message.error(error.value);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 更新隐私设置
   */
  const updatePrivacy = async (privacy: UpdatePrivacyRequest): Promise<void> => {
    if (!userSetting.value) {
      message.error('未找到用户设置');
      return;
    }

    loading.value = true;
    error.value = '';

    try {
      const service = await UserSettingWebApplicationService.getInstance();
      await service.updatePrivacy(privacy);
      message.success('隐私设置更新成功');
    } catch (err: any) {
      error.value = err.message || '更新隐私设置失败';
      message.error(error.value);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 更新实验性功能设置
   */
  const updateExperimental = async (experimental: UpdateExperimentalRequest): Promise<void> => {
    if (!userSetting.value) {
      message.error('未找到用户设置');
      return;
    }

    loading.value = true;
    error.value = '';

    try {
      const service = await UserSettingWebApplicationService.getInstance();
      await service.updateExperimental(experimental);
      message.success('实验性功能设置更新成功');
    } catch (err: any) {
      error.value = err.message || '更新实验性功能设置失败';
      message.error(error.value);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 快速切换主题
   */
  const switchTheme = async (theme: 'LIGHT' | 'DARK' | 'AUTO'): Promise<void> => {
    if (!userSetting.value) {
      message.error('未找到用户设置');
      return;
    }

    loading.value = true;
    error.value = '';

    try {
      const service = await UserSettingWebApplicationService.getInstance();
      await service.updateTheme(theme);
      message.success(`主题已切换为：${theme}`);
    } catch (err: any) {
      error.value = err.message || '切换主题失败';
      message.error(error.value);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 快速切换语言
   */
  const switchLanguage = async (language: string): Promise<void> => {
    if (!userSetting.value) {
      message.error('未找到用户设置');
      return;
    }

    loading.value = true;
    error.value = '';

    try {
      const service = await UserSettingWebApplicationService.getInstance();
      await service.updateLanguage(language);
      message.success(`语言已切换为：${language}`);
    } catch (err: any) {
      error.value = err.message || '切换语言失败';
      message.error(error.value);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 设置快捷键
   */
  const setShortcut = async (action: string, shortcut: string): Promise<void> => {
    if (!userSetting.value) {
      message.error('未找到用户设置');
      return;
    }

    loading.value = true;
    error.value = '';

    try {
      const service = await UserSettingWebApplicationService.getInstance();
      await service.updateShortcut(action, shortcut);
      message.success(`快捷键 ${action} 已设置为：${shortcut}`);
    } catch (err: any) {
      error.value = err.message || '设置快捷键失败';
      message.error(error.value);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 删除快捷键
   */
  const removeShortcut = async (action: string): Promise<void> => {
    if (!userSetting.value) {
      message.error('未找到用户设置');
      return;
    }

    loading.value = true;
    error.value = '';

    try {
      const service = await UserSettingWebApplicationService.getInstance();
      await service.deleteShortcut(action);
      message.success(`快捷键 ${action} 已删除`);
    } catch (err: any) {
      error.value = err.message || '删除快捷键失败';
      message.error(error.value);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 检查快捷键
   */
  const hasShortcut = (action: string): boolean => {
    const custom = userSetting.value?.shortcuts?.custom;
    return custom ? action in custom : false;
  };

  /**
   * 获取快捷键
   */
  const getShortcut = (action: string): string | null => {
    const custom = userSetting.value?.shortcuts?.custom;
    return custom?.[action] || null;
  };

  /**
   * 检查实验性功能
   */
  const hasExperimentalFeature = (feature: string): boolean => {
    const features = userSetting.value?.experimental?.features;
    return features ? features.includes(feature) : false;
  };

  // ===== 生命周期 =====

  /**
   * 初始化时自动加载（如果有 accountUuid）
   */
  const initialize = async (accountUuid?: string): Promise<void> => {
    if (accountUuid) {
      await getOrCreateUserSetting(accountUuid);
    }
  };

  return {
    // 状态
    userSetting,
    loading: isLoading,
    error,

    // 计算属性
    currentTheme,
    currentLanguage,
    themeText,
    languageText,
    autoSaveEnabled,
    autoSaveInterval,
    shortcutsEnabled,
    customShortcuts,

    // 查询方法
    hasShortcut,
    getShortcut,
    hasExperimentalFeature,

    // 命令方法
    initialize,
    loadUserSetting,
    loadUserSettingByAccount,
    getOrCreateUserSetting,
    createUserSetting,
    updateUserSetting,

    // 快捷更新方法
    updateAppearance,
    updateLocale,
    updateWorkflow,
    updatePrivacy,
    updateExperimental,
    switchTheme,
    switchLanguage,
    setShortcut,
    removeShortcut,
  };
}

/**
 * 轻量级 UserSetting 模块访问
 * 只提供数据访问，不执行网络操作
 */
export function useUserSettingData() {
  const userSettingStore = useUserSettingStore();

  return {
    userSetting: computed(() => userSettingStore.settings),
    currentTheme: computed(() => userSettingStore.appearance.theme),
    currentLanguage: computed(() => userSettingStore.locale.language),
    themeText: computed(() => {
      const theme = userSettingStore.appearance.theme;
      return theme === 'AUTO'
        ? '自动'
        : theme === 'LIGHT'
          ? '亮色'
          : theme === 'DARK'
            ? '暗色'
            : '未设置';
    }),
    languageText: computed(() => {
      const lang = userSettingStore.locale.language;
      return lang === 'zh-CN' ? '简体中文' : lang === 'en-US' ? 'English' : '未设置';
    }),
    autoSaveEnabled: computed(() => userSettingStore.workflow.autoSave),
    autoSaveInterval: computed(() => userSettingStore.workflow.autoSaveInterval),
    shortcutsEnabled: computed(() => userSettingStore.shortcuts.enabled),
    customShortcuts: computed(() => userSettingStore.shortcuts.custom),
  };
}
