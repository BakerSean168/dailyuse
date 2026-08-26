import {
  NotificationChannelType,
  NotificationDndBehavior,
  NotificationPreferenceControl,
  type NotificationWorkflowChannelCapabilityDTO,
  type NotificationWorkflowDefinitionDTO,
} from '@memoflow/contracts/notification';

const USER_CONFIGURABLE_DEFER: NotificationWorkflowChannelCapabilityDTO = {
  supported: true,
  enabledByDefault: true,
  preferenceControl: NotificationPreferenceControl.UserConfigurable,
  dndBehavior: NotificationDndBehavior.Defer,
};

const USER_CONFIGURABLE_SUPPRESS: NotificationWorkflowChannelCapabilityDTO = {
  ...USER_CONFIGURABLE_DEFER,
  dndBehavior: NotificationDndBehavior.Suppress,
};

/**
 * Explicit read-only allowlist. There is deliberately no generic `critical=true`
 * bypass: each protected workflow + channel is named here and declares its DND behavior.
 */
const READ_ONLY_WORKFLOWS: Readonly<Record<string, NotificationWorkflowDefinitionDTO>> = {
  'system.account-security': {
    workflowKey: 'system.account-security',
    topic: 'account.security',
    channels: {
      [NotificationChannelType.InApp]: {
        supported: true,
        enabledByDefault: true,
        preferenceControl: NotificationPreferenceControl.ReadOnly,
        dndBehavior: NotificationDndBehavior.Bypass,
      },
      [NotificationChannelType.Desktop]: {
        supported: true,
        enabledByDefault: true,
        preferenceControl: NotificationPreferenceControl.ReadOnly,
        dndBehavior: NotificationDndBehavior.Bypass,
      },
      [NotificationChannelType.Email]: USER_CONFIGURABLE_DEFER,
    },
  },
};

function genericChannels(): NotificationWorkflowDefinitionDTO['channels'] {
  return {
    [NotificationChannelType.InApp]: { ...USER_CONFIGURABLE_DEFER },
    [NotificationChannelType.Desktop]: { ...USER_CONFIGURABLE_SUPPRESS },
    [NotificationChannelType.Email]: { ...USER_CONFIGURABLE_DEFER },
    [NotificationChannelType.Push]: { ...USER_CONFIGURABLE_DEFER },
    [NotificationChannelType.Sms]: { ...USER_CONFIGURABLE_DEFER },
    [NotificationChannelType.Webhook]: { ...USER_CONFIGURABLE_DEFER },
  };
}

export function defaultNotificationWorkflowKey(category: string): string {
  return `${category.toLowerCase()}.general`;
}

export class NotificationWorkflowCatalog {
  private readonly definitions = new Map<string, NotificationWorkflowDefinitionDTO>();

  constructor(definitions: readonly NotificationWorkflowDefinitionDTO[] = []) {
    for (const definition of Object.values(READ_ONLY_WORKFLOWS)) {
      this.definitions.set(definition.workflowKey, definition);
    }
    for (const definition of definitions) this.register(definition);
  }

  register(definition: NotificationWorkflowDefinitionDTO): void {
    if (!definition.workflowKey.trim()) throw new Error('workflowKey is required');
    if (!definition.topic.trim()) throw new Error('workflow topic is required');
    this.definitions.set(definition.workflowKey, definition);
  }

  resolve(workflowKey: string, topic?: string): NotificationWorkflowDefinitionDTO {
    const explicit = this.definitions.get(workflowKey);
    if (explicit) return explicit;
    return {
      workflowKey,
      topic: topic?.trim() || workflowKey,
      channels: genericChannels(),
    };
  }
}
