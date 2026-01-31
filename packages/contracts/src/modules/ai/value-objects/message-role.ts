/**
 * 消息角色
 */
export const MessageRole = {
  User: 'User',
  Assistant: 'Assistant',
  System: 'System',
} as const;

export type MessageRole = (typeof MessageRole)[keyof typeof MessageRole];
