/**
 * 设置值类型
 */
export const SettingValueType = {
  String: 'String',
  Number: 'Number',
  Boolean: 'Boolean',
  Password: 'Password',
  Json: 'Json',
  Array: 'Array',
  Object: 'Object',
} as const;

export type SettingValueType = (typeof SettingValueType)[keyof typeof SettingValueType];
