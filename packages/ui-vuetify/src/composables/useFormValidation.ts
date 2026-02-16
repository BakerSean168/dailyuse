/**
 * Form Validation Composables
 *
 * Re-exports from @dailyuse/ui-vue-shadcn with Vuetify-compatible format.
 * Maintained for backward compatibility.
 */

import type { FormRule } from '../types';

// Re-export from ui-vue
export { useFormValidation } from '@dailyuse/ui-vue-shadcn';

/**
 * Get pre-configured form validation rules (Vuetify-compatible)
 *
 * These rules return string | boolean which is compatible with
 * Vuetify's v-text-field rules prop.
 */
export function useFormRules() {
  const usernameRules: FormRule[] = [
    (v: string) => !!v || '请输入用户名',
    (v: string) => v?.length >= 3 || '用户名至少3个字符',
    (v: string) => v?.length <= 20 || '用户名不能超过20个字符',
    (v: string) =>
      /^[a-zA-Z0-9_\u4e00-\u9fa5]+$/.test(v) || '用户名只能包含字母、数字、下划线和中文',
  ];

  const passwordRules: FormRule[] = [
    (v: string) => !!v || '请输入密码',
    (v: string) => v?.length >= 8 || '密码至少8个字符',
    (v: string) => v?.length <= 32 || '密码不能超过32个字符',
    (v: string) => /(?=.*[a-z])/.test(v) || '密码必须包含小写字母',
    (v: string) => /(?=.*[A-Z])/.test(v) || '密码必须包含大写字母',
    (v: string) => /(?=.*\d)/.test(v) || '密码必须包含数字',
  ];

  const emailRules: FormRule[] = [
    (v: string) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || '请输入有效的邮箱地址',
  ];

  const phoneRules: FormRule[] = [
    (v: string) => !v || /^(\+86\s?)?1[3-9]\d{9}$/.test(v) || '请输入有效的手机号码',
  ];

  const requiredRule: FormRule = (v: unknown) => !!v || '此字段为必填项';

  return {
    usernameRules,
    passwordRules,
    emailRules,
    phoneRules,
    requiredRule,
  };
}
