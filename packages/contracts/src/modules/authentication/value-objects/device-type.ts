// 1. 定义常量对象 (替代 Enum)
export const DeviceType = {
  Desktop: 'Desktop',
  Mobile: 'Mobile',
  Tablet: 'Tablet',
  Browser: 'Browser',
  Api: 'Api',
  Unknown: 'Unknown',
} as const; // <--- 关键魔法：锁定为字面量类型

// 2. 提取类型 (自动生成联合类型)
// 结果等同于: 'Desktop' | 'Mobile' | 'Tablet' ...
export type DeviceType = (typeof DeviceType)[keyof typeof DeviceType];
