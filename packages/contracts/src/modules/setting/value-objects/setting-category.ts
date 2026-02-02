export const SettingCategory = {
    Appearance: 'Appearance',
    Editor: 'Editor',
    Task: 'Task',
    Goal: 'Goal',
    Repository: 'Repository',
    Notification: 'Notification',
    System: 'System',
    Privacy: 'Privacy',
} as const;
export type SettingCategory = (typeof SettingCategory)[keyof typeof SettingCategory];