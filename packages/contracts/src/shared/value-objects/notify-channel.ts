/**
 * 通用的通知配置接口
 * 暴露给 Task、Goal 等需要通知功能的模块使用
 * 也作为 NotificationConfig 类型的基础接口
 */

export const NotifyChannel = {
    Email: 'Email',
    Push: 'Push',
    Desktop: 'Desktop',
    InApp: 'InApp',
}

export type NotifyChannel = keyof typeof NotifyChannel;