import type {
  ReminderEventMap,
  ReminderTemplateServerDTO,
  ReminderGroupServerDTO,
} from '@dailyuse/contracts/reminder';

export interface ReminderBusEvent<TPayload> {
  aggregateId: string;
  identityId?: string;
  payload: TPayload;
}

export type ReminderTemplateCreatedPayload = ReminderEventMap['reminder:create'] & {
  identityId?: string;
  templateId?: string;
  reminder?: ReminderTemplateServerDTO;
  reminderData?: ReminderTemplateServerDTO;
};

export type ReminderTemplateUpdatedPayload = ReminderEventMap['reminder:update'] & {
  identityId?: string;
  templateId?: string;
  reminder?: ReminderTemplateServerDTO;
  reminderData?: ReminderTemplateServerDTO;
};

export type ReminderTemplateDeletedPayload = ReminderEventMap['reminder:delete'] & {
  identityId?: string;
  templateId?: string;
  reminderId?: string;
  reminder?: ReminderTemplateServerDTO;
};

export type ReminderTemplateEnabledPayload = ReminderTemplateUpdatedPayload & {
  activatedAt?: number;
};

export type ReminderTemplatePausedPayload = ReminderTemplateUpdatedPayload;

export type ReminderTemplateMovedPayload = ReminderTemplateUpdatedPayload & {
  oldGroupId?: string | null;
  newGroupId?: string | null;
};

export type ReminderGroupCreatedPayload = ReminderEventMap['reminder:group-create'] & {
  identityId?: string;
  groupId?: string;
  group?: ReminderGroupServerDTO;
};

export type ReminderGroupUpdatedPayload = ReminderEventMap['reminder:group-update'] & {
  identityId?: string;
  groupId?: string;
  group?: ReminderGroupServerDTO;
};

export type ReminderGroupEnabledPayload = ReminderEventMap['reminder:group-update'] & {
  identityId?: string;
  groupId?: string;
  group?: ReminderGroupServerDTO;
};

export type ReminderGroupPausedPayload = ReminderEventMap['reminder:group-update'] & {
  identityId?: string;
  groupId?: string;
  group?: ReminderGroupServerDTO;
};

export type ReminderGroupControlModeSwitchedPayload =
  ReminderEventMap['reminder:group-update'] & {
    identityId?: string;
    groupId?: string;
    group?: ReminderGroupServerDTO;
  };

export type ReminderGroupDeletedPayload = ReminderEventMap['reminder:group-delete'] & {
  identityId?: string;
  groupId?: string;
  group?: ReminderGroupServerDTO;
};

export type ReminderTemplateAction =
  | 'template-created'
  | 'template-updated'
  | 'template-enabled'
  | 'template-paused'
  | 'template-deleted'
  | 'template-moved';

export type ReminderGroupAction =
  | 'group-created'
  | 'group-updated'
  | 'group-enabled'
  | 'group-paused'
  | 'group-control-mode-changed'
  | 'group-deleted';

export interface ReminderTemplateRefreshPayload {
  templateId: string;
  reason: ReminderTemplateAction;
  action: ReminderTemplateAction;
  timestamp: number;
  payload?: Record<string, unknown>;
  template?: ReminderTemplateServerDTO;
}

export interface ReminderGroupRefreshPayload {
  groupId: string;
  reason: ReminderGroupAction;
  action: ReminderGroupAction;
  timestamp: number;
  payload?: Record<string, unknown>;
  group?: ReminderGroupServerDTO;
}
