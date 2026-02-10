import type { MessageRole as IMessageRole } from '@dailyuse/contracts/ai';

/**
 * MessageRole 枚举类型
 * 
 * 【规范说明：枚举与常量对象规范】
 * 参考 docs/standards/枚举与常量对象规范(Enum&Constant-Objects).md
 */

export type MessageRole = IMessageRole & { readonly __brand: unique symbol };

const VALUES: IMessageRole[] = ['User', 'Assistant', 'System'];

export const MessageRole = {
  User: 'User' as MessageRole,
  Assistant: 'Assistant' as MessageRole,
  System: 'System' as MessageRole,

  of(value: string): MessageRole {
    if (!this.isValid(value)) {
      throw new Error(`Invalid MessageRole: ${value}`);
    }
    return value as MessageRole;
  },

  isValid(value: string): value is MessageRole {
    return VALUES.includes(value as IMessageRole);
  },

  getAll(): MessageRole[] {
    return VALUES as MessageRole[];
  },

  isUser(role: MessageRole): boolean {
    return role === this.User;
  },

  isAssistant(role: MessageRole): boolean {
    return role === this.Assistant;
  },

  isSystem(role: MessageRole): boolean {
    return role === this.System;
  },
};
