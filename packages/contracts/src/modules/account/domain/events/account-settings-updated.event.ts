/**
 * Account Settings Updated Event
 * 
 * Triggered when: User account settings are changed
 * Subscribers: Settings service, Configuration cache
 */
export interface AccountSettingsUpdatedEvent {
  /** Account unique identifier */
  accountId: string;

  /** List of setting keys that were changed */
  settingKeys: string[];

  /** Update timestamp */
  updatedAt: number;
}
